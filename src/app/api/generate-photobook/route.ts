import { NextRequest, NextResponse, unstable_after as after } from 'next/server'
import {
  enqueuePhotobookJob,
  processPhotobookQueue,
} from '@/lib/photobook/queue'
import type { PhotobookImage, PhotobookJobPayload } from '@/lib/photobook/types'

interface PhotobookRequest {
  images: PhotobookImage[]
  title: string
  userId: string
}

export async function POST(request: NextRequest) {
  console.log('📖 API route /api/generate-photobook called')

  try {
    const body: PhotobookRequest = await request.json()
    console.log('📥 Request body parsed:', {
      imageCount: body.images.length,
      title: body.title,
      userId: body.userId,
    })

    const { images, title, userId } = body

    if (!images || images.length === 0) {
      return NextResponse.json(
        { error: 'No images provided' },
        { status: 400 }
      )
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      )
    }

    const payload: PhotobookJobPayload = {
      images,
      title,
      userId,
    }

    const job = await enqueuePhotobookJob(payload)

    after(async () => {
      try {
        await processPhotobookQueue()
      } catch (workerError) {
        console.error('💥 Photobook worker failed:', workerError)
      }
    })

    return NextResponse.json({
      success: true,
      jobId: job.id,
      status: job.status,
      pollUrl: `/api/photobook-jobs/${job.id}`,
      totalCount: images.length,
    })
  } catch (error) {
    console.error('💥 Error generating photobook:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to generate photobook',
        success: false,
      },
      { status: 500 }
    )
  }
}
