import { NextRequest, NextResponse } from 'next/server'
import { after } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import {
  enqueuePhotobookJob,
  processPhotobookQueue,
} from '@/lib/photobook/queue'
import type { PhotobookImage, PhotobookJobPayload } from '@/lib/photobook/types'
import { logger } from '@/lib/logger'

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
      logger.info('API route /api/generate-photobook called')

      try {
        const body: PhotobookRequest = await request.json()
        logger.debug('Generate photobook request body parsed', {
          imageCount: body.images.length,
          title: body.title,
          userId: body.userId,
        })

        const { images, title, userId } = body

        span.setAttribute('photobook.imageCount', images?.length ?? 0)
        span.setAttribute('photobook.hasTitle', Boolean(title))
        span.setAttribute('photobook.userId', userId)

        if (!images || images.length === 0) {
          span.setStatus({ code: 2, message: 'invalid_argument' })
          return NextResponse.json(
            { error: 'No images provided' },
            { status: 400 }
          )
        }

        if (!userId) {
          span.setStatus({ code: 2, message: 'invalid_argument' })
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
        span.setAttribute('photobook.jobId', job.id)
        span.setAttribute('photobook.queuedAt', job.created_at)

        after(async () => {
          try {
            await processPhotobookQueue()
          } catch (workerError) {
            logger.error('Photobook worker failed', { error: workerError, jobId: job.id })
            Sentry.captureException(workerError)
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
        span.setStatus({ code: 2, message: 'internal_error' })
        logger.error('Error generating photobook', { error })
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
