import { NextRequest, NextResponse } from 'next/server'
import { jsPDF } from 'jspdf'
import { supabase } from '@/lib/supabase'
import * as Sentry from '@sentry/nextjs'

interface PhotobookImage {
  id: string
  name: string
  coloring_page_url: string
}

interface PhotobookRequest {
  images: PhotobookImage[]
  title: string
  userId: string
}

export async function POST(request: NextRequest) {
  return Sentry.startSpan(
    {
      op: 'http.server',
      name: 'POST /api/generate-photobook',
    },
    async (span) => {
      console.log('📖 API route /api/generate-photobook called')

      try {
        const body: PhotobookRequest = await request.json()
        console.log('📥 Request body parsed:', {
          imageCount: body.images.length,
          title: body.title,
          userId: body.userId,
        })

        const { images, title, userId } = body

        span.setAttribute('photobook.imageCount', images?.length ?? 0)
        span.setAttribute('photobook.hasTitle', Boolean(title))
        span.setAttribute('photobook.userId', userId)

        if (!images || images.length === 0) {
          span.setStatus('invalid_argument')
          return NextResponse.json(
            { error: 'No images provided' },
            { status: 400 }
          )
        }

        if (!userId) {
          span.setStatus('invalid_argument')
          return NextResponse.json(
            { error: 'User ID required' },
            { status: 400 }
          )
        }

        console.log('📄 Creating PDF with jsPDF...')

        // Create PDF
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        })

        // PDF dimensions (A4: 210mm x 297mm)
        const pageWidth = 210
        const pageHeight = 297
        const margin = 20
        const imageWidth = pageWidth - margin * 2
        const imageHeight = imageWidth // Square aspect ratio

        // Add title page
        pdf.setFontSize(24)
        pdf.text(title, pageWidth / 2, 50, { align: 'center' })

        pdf.setFontSize(12)
        pdf.text('Generated with ColoringBook.ai', pageWidth / 2, 70, { align: 'center' })

        pdf.setFontSize(10)
        pdf.text(new Date().toLocaleDateString(), pageWidth / 2, 80, { align: 'center' })

        // Process each image
        for (let i = 0; i < images.length; i++) {
          const image = images[i]
          console.log(`🖼️ Processing image ${i + 1}/${images.length}: ${image.name}`)

          await Sentry.startSpan(
            {
              op: 'photobook.process_image',
              name: 'Process photobook image',
            },
            async (imageSpan) => {
              imageSpan.setAttribute('photobook.imageId', image.id)
              imageSpan.setAttribute('photobook.imageName', image.name)
              imageSpan.setAttribute('photobook.imageIndex', i)
              try {
                // Add new page for each image
                pdf.addPage()

                // Fetch image data
                await Sentry.startSpan(
                  {
                    op: 'http.client',
                    name: 'Fetch coloring page image',
                  },
                  async (fetchSpan) => {
                    fetchSpan.setAttribute('photobook.imageId', image.id)
                    fetchSpan.setAttribute('url', image.coloring_page_url)
                    const imageResponse = await fetch(image.coloring_page_url)
                    if (!imageResponse.ok) {
                      const error = new Error(`Failed to fetch image: ${image.coloring_page_url}`)
                      fetchSpan.setStatus('internal_error')
                      console.error('❌ Failed to fetch image:', {
                        url: image.coloring_page_url,
                        status: imageResponse.status,
                        statusText: imageResponse.statusText,
                      })
                      throw error
                    }

                    const imageBuffer = await imageResponse.arrayBuffer()
                    const base64Image = Buffer.from(imageBuffer).toString('base64')

                    // Add image to PDF
                    const yPosition = (pageHeight - imageHeight) / 2
                    pdf.addImage(
                      `data:image/png;base64,${base64Image}`,
                      'PNG',
                      margin,
                      yPosition,
                      imageWidth,
                      imageHeight,
                      undefined,
                      'FAST'
                    )

                    // Add image name at bottom
                    pdf.setFontSize(10)
                    pdf.text(image.name, pageWidth / 2, pageHeight - 15, { align: 'center' })

                    console.log(`✅ Added image ${i + 1} to PDF`)
                  }
                )
              } catch (imageError) {
                imageSpan.setStatus('internal_error')
                console.error(`❌ Error processing image ${image.name}:`, imageError)
                Sentry.captureException(imageError)
                // Continue with other images
              }
            }
          )
        }

        console.log('💾 Generating PDF buffer...')
        const pdfBuffer = Buffer.from(pdf.output('arraybuffer'))

        const fileName = `photobook-${userId}-${Date.now()}.pdf`
        const filePath = `photobooks/${fileName}`
        span.setAttribute('photobook.filePath', filePath)

        await Sentry.startSpan(
          {
            op: 'storage.upload',
            name: 'Upload photobook PDF',
          },
          async (uploadSpan) => {
            uploadSpan.setAttribute('storage.bucket', 'images')
            uploadSpan.setAttribute('storage.path', filePath)
            uploadSpan.setAttribute('storage.byteLength', pdfBuffer.byteLength)
            console.log('📤 Uploading PDF to Supabase storage...')
            const { data, error } = await supabase.storage
              .from('images')
              .upload(filePath, pdfBuffer, {
                contentType: 'application/pdf',
              })

            if (error) {
              uploadSpan.setStatus('internal_error')
              console.error('❌ Failed to upload PDF:', error)
              throw new Error(`Storage upload failed: ${error.message}`)
            }

            uploadSpan.setAttribute('storage.responsePath', data?.path ?? '')
          }
        )

        const publicUrlResult = supabase.storage
          .from('images')
          .getPublicUrl(filePath)

        const publicUrl = publicUrlResult.data.publicUrl
        console.log('✅ Photobook generated and uploaded successfully:', publicUrl)

        await Sentry.startSpan(
          {
            op: 'db',
            name: 'Insert photobook record',
          },
          async (dbSpan) => {
            dbSpan.setAttribute('db.table', 'photobooks')
            dbSpan.setAttribute('photobook.imageCount', images.length)
            const { error: dbError } = await supabase
              .from('photobooks')
              .insert({
                user_id: userId,
                title: title,
                pdf_url: publicUrl,
                image_count: images.length,
                created_at: new Date().toISOString(),
              })

            if (dbError) {
              dbSpan.setStatus('internal_error')
              console.error('❌ Failed to save photobook record:', dbError)
              Sentry.captureException(dbError)
            }
          }
        )

        return NextResponse.json({
          success: true,
          downloadUrl: publicUrl,
          title: title,
          pageCount: images.length + 1, // +1 for title page
        })
      } catch (error) {
        span.setStatus('internal_error')
        console.error('💥 Error generating photobook:', error)
        Sentry.captureException(error)
        return NextResponse.json(
          {
            error: error instanceof Error ? error.message : 'Failed to generate photobook',
            success: false,
          },
          { status: 500 }
        )
      }
    }
  )
}
