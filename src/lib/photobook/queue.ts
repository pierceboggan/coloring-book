import * as Sentry from '@sentry/nextjs'
import sharp from 'sharp'
import { PassThrough, Readable } from 'stream'
import { supabaseAdmin } from '@/lib/supabase-admin'
import type { Database } from '@/lib/supabase'
import {
  parsePayload,
  serializePayload,
  type PhotobookImage,
  type PhotobookJobPayload,
  type PhotobookJobRow,
} from '@/lib/photobook/types'

const PDF_PAGE_WIDTH = 595.28 // A4 width in points (8.27in * 72)
const PDF_PAGE_HEIGHT = 841.89 // A4 height in points (11.69in * 72)
const PAGE_MARGIN = 40
const CAPTION_HEIGHT = 40
const IMAGE_FETCH_TIMEOUT_MS = 15000
const STORAGE_BUCKET = 'images'

interface PagePlan {
  pageId: number
  contentId: number
  imageId: number | null
  image?: PhotobookImage
}

class PdfStreamWriter {
  private readonly stream = new PassThrough()
  private readonly xrefEntries: string[] = ['0000000000 65535 f \n']
  private objectCount = 0
  private offset = 0

  constructor() {
    this.write('%PDF-1.4\n%\xB5\xED\xAE\xFB\n')
  }

  addObject(id: number, lines: string[]) {
    this.recordOffset(id)
    this.write(`${id} 0 obj\n`)
    this.write(lines.join('\n'))
    this.write('\nendobj\n')
  }

  addStream(id: number, dictionaryLines: string[], content: Buffer) {
    this.recordOffset(id)
    const dict = ['<<', ...dictionaryLines, `/Length ${content.length}`, '>>'].join('\n')
    this.write(`${id} 0 obj\n${dict}\nstream\n`)
    this.write(content)
    this.write('\nendstream\nendobj\n')
  }

  finalize(rootObjectId: number) {
    const xrefOffset = this.offset
    this.write(`xref\n0 ${this.objectCount + 1}\n`)
    this.write(this.xrefEntries.join(''))
    this.write(
      `trailer\n<<\n/Size ${this.objectCount + 1}\n/Root ${rootObjectId} 0 R\n>>\nstartxref\n${xrefOffset}\n%%EOF\n`
    )
    this.stream.end()
  }

  getNodeStream() {
    return this.stream
  }

  private recordOffset(id: number) {
    if (id !== this.objectCount + 1) {
      throw new Error(`PDF objects must be written in ascending order. Expected ${this.objectCount + 1}, received ${id}`)
    }
    this.objectCount += 1
    this.xrefEntries.push(`${this.formatOffset(this.offset)} 00000 n \n`)
  }

  private write(chunk: string | Buffer) {
    const buffer = typeof chunk === 'string' ? Buffer.from(chunk, 'utf8') : chunk
    this.stream.write(buffer)
    this.offset += buffer.length
  }

  private formatOffset(value: number) {
    return value.toString().padStart(10, '0')
  }
}

function escapePdfText(value: string) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/\r/g, '\\r')
}

function approximateTextWidth(text: string, fontSize: number) {
  return text.length * fontSize * 0.6
}

function buildTitlePageContent(title: string) {
  const streamParts: string[] = []

  const safeTitle = escapePdfText(title)
  const subtitle = 'Generated with ColoringBook.ai'
  const dateLine = new Date().toLocaleDateString()

  const titleFontSize = 28
  const subtitleFontSize = 14
  const dateFontSize = 12

  const titleWidth = approximateTextWidth(title, titleFontSize)
  const subtitleWidth = approximateTextWidth(subtitle, subtitleFontSize)
  const dateWidth = approximateTextWidth(dateLine, dateFontSize)

  const titleX = Math.max((PDF_PAGE_WIDTH - titleWidth) / 2, PAGE_MARGIN)
  const subtitleX = Math.max((PDF_PAGE_WIDTH - subtitleWidth) / 2, PAGE_MARGIN)
  const dateX = Math.max((PDF_PAGE_WIDTH - dateWidth) / 2, PAGE_MARGIN)

  streamParts.push('BT')
  streamParts.push(`/F1 ${titleFontSize} Tf`)
  streamParts.push(`1 0 0 1 ${titleX.toFixed(2)} ${(PDF_PAGE_HEIGHT - 200).toFixed(2)} Tm`)
  streamParts.push(`(${safeTitle}) Tj`)
  streamParts.push('ET')

  streamParts.push('BT')
  streamParts.push(`/F1 ${subtitleFontSize} Tf`)
  streamParts.push(`1 0 0 1 ${subtitleX.toFixed(2)} ${(PDF_PAGE_HEIGHT - 240).toFixed(2)} Tm`)
  streamParts.push(`(${escapePdfText(subtitle)}) Tj`)
  streamParts.push('ET')

  streamParts.push('BT')
  streamParts.push(`/F1 ${dateFontSize} Tf`)
  streamParts.push(`1 0 0 1 ${dateX.toFixed(2)} ${(PDF_PAGE_HEIGHT - 270).toFixed(2)} Tm`)
  streamParts.push(`(${escapePdfText(dateLine)}) Tj`)
  streamParts.push('ET')

  return Buffer.from(streamParts.join('\n') + '\n', 'utf8')
}

function buildImagePageContent(
  imageName: string,
  imageId: string,
  intrinsicWidth: number,
  intrinsicHeight: number
) {
  const availableWidth = PDF_PAGE_WIDTH - PAGE_MARGIN * 2
  const availableHeight = PDF_PAGE_HEIGHT - PAGE_MARGIN * 2 - CAPTION_HEIGHT
  const scale = Math.min(availableWidth / intrinsicWidth, availableHeight / intrinsicHeight)
  const drawWidth = intrinsicWidth * scale
  const drawHeight = intrinsicHeight * scale
  const offsetX = (PDF_PAGE_WIDTH - drawWidth) / 2
  const offsetY = PAGE_MARGIN + CAPTION_HEIGHT + (availableHeight - drawHeight) / 2

  const captionFontSize = 12
  const captionWidth = approximateTextWidth(imageName, captionFontSize)
  const captionX = Math.max((PDF_PAGE_WIDTH - captionWidth) / 2, PAGE_MARGIN)
  const captionY = PAGE_MARGIN

  const lines: string[] = []
  lines.push('q')
  lines.push(`${drawWidth.toFixed(2)} 0 0 ${drawHeight.toFixed(2)} ${offsetX.toFixed(2)} ${offsetY.toFixed(2)} cm`)
  lines.push(`/${imageId} Do`)
  lines.push('Q')

  lines.push('BT')
  lines.push(`/F1 ${captionFontSize} Tf`)
  lines.push(`1 0 0 1 ${captionX.toFixed(2)} ${captionY.toFixed(2)} Tm`)
  lines.push(`(${escapePdfText(imageName)}) Tj`)
  lines.push('ET')

  return Buffer.from(lines.join('\n') + '\n', 'utf8')
}

async function fetchImageBuffer(url: string) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), IMAGE_FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) {
      throw new Error(`Failed to fetch image ${url}: ${response.status} ${response.statusText}`)
    }
    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } finally {
    clearTimeout(timeout)
  }
}

async function prepareImage(buffer: Buffer) {
  const { data, info } = await sharp(buffer)
    .jpeg({ quality: 90 })
    .resize({
      width: 2048,
      height: 2048,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .toBuffer({ resolveWithObject: true })

  return { data, width: info.width ?? 0, height: info.height ?? 0 }
}

function buildPagePlan(images: PhotobookImage[]) {
  const plans: PagePlan[] = []
  let nextId = 1
  const catalogId = nextId++
  const pagesId = nextId++
  const fontId = nextId++

  plans.push({
    pageId: nextId + 1,
    contentId: nextId,
    imageId: null,
  })
  nextId += 2

  for (const image of images) {
    const imageId = nextId++
    const contentId = nextId++
    const pageId = nextId++
    plans.push({ pageId, contentId, imageId, image })
  }

  return { plans, catalogId, pagesId, fontId, nextId }
}

async function writePhotobookPdf(job: PhotobookJobRow, payload: PhotobookJobPayload, writer: PdfStreamWriter) {
  const { plans, catalogId, pagesId, fontId } = buildPagePlan(payload.images)

  const pageRefs = plans.map((plan) => `${plan.pageId} 0 R`).join(' ')

  writer.addObject(catalogId, ['<<', '/Type /Catalog', `/Pages ${pagesId} 0 R`, '>>'])
  writer.addObject(pagesId, ['<<', '/Type /Pages', `/Kids [${pageRefs}]`, `/Count ${plans.length}`, '>>'])
  writer.addObject(fontId, ['<<', '/Type /Font', '/Subtype /Type1', '/BaseFont /Helvetica', '>>'])

  const totalPages = plans.length - 1

  const now = new Date().toISOString()
  await supabaseAdmin
    .from('photobook_jobs')
    .update({ processed_count: 0, total_count: totalPages, updated_at: now })
    .eq('id', job.id)

  for (let index = 0; index < plans.length; index += 1) {
    const plan = plans[index]

    if (index === 0) {
      const content = buildTitlePageContent(payload.title)
      writer.addStream(plan.contentId, [], content)
      writer.addObject(plan.pageId, [
        '<<',
        '/Type /Page',
        `/Parent ${pagesId} 0 R`,
        `/MediaBox [0 0 ${PDF_PAGE_WIDTH.toFixed(2)} ${PDF_PAGE_HEIGHT.toFixed(2)}]`,
        `/Resources << /Font << /F1 ${fontId} 0 R >> >>`,
        `/Contents ${plan.contentId} 0 R`,
        '>>',
      ])
      continue
    }

    if (!plan.image || plan.imageId === null) {
      throw new Error('Missing image metadata for photobook page')
    }

    const prepared = await Sentry.startSpan(
      {
        op: 'photobook.fetch_image',
        name: 'Fetch photobook image',
        attributes: {
          'photobook.image_id': plan.image.id,
        },
      },
      async (span) => {
        const buffer = await fetchImageBuffer(plan.image!.coloring_page_url)
        const processed = await prepareImage(buffer)
        span.setAttribute('photobook.image.width', processed.width)
        span.setAttribute('photobook.image.height', processed.height)
        return processed
      }
    )

    writer.addStream(plan.imageId, [
      '/Type /XObject',
      '/Subtype /Image',
      `/Width ${prepared.width}`,
      `/Height ${prepared.height}`,
      '/ColorSpace /DeviceRGB',
      '/BitsPerComponent 8',
      '/Filter /DCTDecode',
    ], prepared.data)

    const content = buildImagePageContent(plan.image.name, `Im${index}`, prepared.width, prepared.height)
    writer.addStream(plan.contentId, [], content)
    writer.addObject(plan.pageId, [
      '<<',
      '/Type /Page',
      `/Parent ${pagesId} 0 R`,
      `/MediaBox [0 0 ${PDF_PAGE_WIDTH.toFixed(2)} ${PDF_PAGE_HEIGHT.toFixed(2)}]`,
      `/Resources << /Font << /F1 ${fontId} 0 R >> /XObject << /Im${index} ${plan.imageId} 0 R >> >>`,
      `/Contents ${plan.contentId} 0 R`,
      '>>',
    ])

    const progressUpdate = await supabaseAdmin
      .from('photobook_jobs')
      .update({ processed_count: index, updated_at: new Date().toISOString() })
      .eq('id', job.id)

    if (progressUpdate.error) {
      console.error('❌ Failed to update photobook job progress:', progressUpdate.error)
    }
  }

  return { catalogId }
}

let processingQueue = false

async function claimNextJob() {
  const { data: job, error } = await supabaseAdmin
    .from('photobook_jobs')
    .select('*')
    .eq('status', 'queued')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle<PhotobookJobRow>()

  if (error) {
    console.error('❌ Failed to find queued photobook job:', error)
    return null
  }

  if (!job) {
    return null
  }

  const now = new Date().toISOString()

  const { data: claimedJob, error: claimError } = await supabaseAdmin
    .from('photobook_jobs')
    .update({ status: 'processing', started_at: now, updated_at: now, error_message: null })
    .eq('id', job.id)
    .eq('status', 'queued')
    .select('*')
    .single<PhotobookJobRow>()

  if (claimError) {
    if (claimError.code !== 'PGRST116') {
      console.warn('⚠️ Unable to claim photobook job:', claimError)
    }
    return null
  }

  return claimedJob ?? null
}

async function markJobFailed(jobId: string, message: string) {
  const now = new Date().toISOString()
  const { error } = await supabaseAdmin
    .from('photobook_jobs')
    .update({
      status: 'failed',
      error_message: message,
      updated_at: now,
      completed_at: now,
    })
    .eq('id', jobId)

  if (error) {
    console.error('❌ Failed to mark photobook job as failed:', error)
  }
}

async function markJobCompleted(jobId: string, pdfPath: string, pdfUrl: string, pageCount: number) {
  const now = new Date().toISOString()
  const { error } = await supabaseAdmin
    .from('photobook_jobs')
    .update({
      status: 'completed',
      processed_count: pageCount,
      total_count: pageCount,
      pdf_path: pdfPath,
      pdf_url: pdfUrl,
      completed_at: now,
      updated_at: now,
    })
    .eq('id', jobId)

  if (error) {
    console.error('❌ Failed to mark photobook job as completed:', error)
  }
}

async function insertPhotobookRecord(payload: PhotobookJobPayload, pdfUrl: string) {
  const now = new Date().toISOString()
  const { error } = await supabaseAdmin
    .from('photobooks')
    .insert({
      user_id: payload.userId,
      title: payload.title,
      pdf_url: pdfUrl,
      image_count: payload.images.length,
      created_at: now,
    })

  if (error) {
    console.error('❌ Failed to insert photobook record:', error)
  }
}

async function generatePhotobookPdf(job: PhotobookJobRow, payload: PhotobookJobPayload) {
  const writer = new PdfStreamWriter()
  const nodeStream = writer.getNodeStream()
  const readableStream = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>

  const fileName = `photobook-${payload.userId}-${Date.now()}.pdf`
  const filePath = `photobooks/${fileName}`

  const uploadPromise = supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, readableStream, {
      contentType: 'application/pdf',
      upsert: false,
    })

  const span = Sentry.startSpan({
    op: 'photobook.build_pdf',
    name: 'Build photobook PDF',
    attributes: {
      'photobook.job_id': job.id,
      'photobook.page_count': payload.images.length + 1,
    },
  })

  try {
    const { catalogId } = await writePhotobookPdf(job, payload, writer)
    writer.finalize(catalogId)

    const { data, error } = await uploadPromise
    if (error) {
      throw error
    }

    const publicUrlResult = supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath)

    const publicUrl = publicUrlResult.data.publicUrl

    await insertPhotobookRecord(payload, publicUrl)
    await markJobCompleted(job.id, data?.path ?? filePath, publicUrl, payload.images.length)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown photobook failure'
    await markJobFailed(job.id, message)
    throw error
  } finally {
    span.end()
  }
}

export async function enqueuePhotobookJob(payload: PhotobookJobPayload) {
  const now = new Date().toISOString()
  const insertPayload: Database['public']['Tables']['photobook_jobs']['Insert'] = {
    status: 'queued',
    title: payload.title,
    user_id: payload.userId,
    created_at: now,
    updated_at: now,
    payload: serializePayload(payload),
    processed_count: 0,
    total_count: payload.images.length,
  }

  const { data, error } = await supabaseAdmin
    .from('photobook_jobs')
    .insert(insertPayload)
    .select('*')
    .single<PhotobookJobRow>()

  if (error) {
    throw new Error(`Failed to enqueue photobook job: ${error.message}`)
  }

  return data
}

async function processSingleJob(job: PhotobookJobRow) {
  return Sentry.startSpan(
    {
      op: 'photobook.process_job',
      name: 'Process photobook job',
      attributes: {
        'photobook.job_id': job.id,
        'photobook.user_id': job.user_id,
      },
    },
    async (span) => {
      try {
        const payload = parsePayload(job.payload)
        if (!payload) {
          throw new Error('Photobook job payload is invalid or missing')
        }

        await generatePhotobookPdf(job, payload)
      } catch (error) {
        span.setStatus('internal_error')
        const message = error instanceof Error ? error.message : 'Unknown photobook job error'
        console.error('💥 Photobook job failed:', message)
        Sentry.captureException(error)
        await markJobFailed(job.id, message)
      }
    }
  )
}

export async function processPhotobookQueue() {
  if (processingQueue) {
    return
  }

  processingQueue = true

  try {
    for (;;) {
      const job = await claimNextJob()
      if (!job) {
        break
      }

      try {
        await processSingleJob(job)
      } catch (error) {
        console.error('💥 Error while processing photobook job:', error)
      }
    }
  } finally {
    processingQueue = false
  }
}
