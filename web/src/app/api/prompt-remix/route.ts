import { NextRequest, NextResponse } from 'next/server'
import { ImageGenerationProvider, isImageGenerationProvider } from '@/lib/openai'
import { createPromptRemixJob, processPromptRemixJob } from '@/lib/prompt-remix-jobs'
import * as Sentry from '@sentry/nextjs'

export async function POST(request: NextRequest) {
  return Sentry.startSpan(
    {
      op: 'http.server',
      name: 'POST /api/prompt-remix',
    },
    async (span) => {
      try {
        const body = await request.json()
        const { imageUrl, remixPrompt, prompts, imageId } = body as {
          imageUrl?: string
          remixPrompt?: string
          prompts?: string[]
          imageId?: string
          provider?: ImageGenerationProvider | string
        }

        const provider = isImageGenerationProvider(body.provider)
          ? body.provider
          : undefined

        span.setAttribute('hasImageUrl', Boolean(imageUrl))
        span.setAttribute('hasRemixPrompt', Boolean(remixPrompt))
        span.setAttribute('hasPrompts', Boolean(prompts))
        span.setAttribute('imageProvider', provider ?? 'default')

        if (!imageUrl) {
          return NextResponse.json(
            { error: 'Missing required field: imageUrl is required.' },
            { status: 400 }
          )
        }

        // Support both single remixPrompt and batch prompts[]
        const promptsToProcess = prompts || (remixPrompt ? [remixPrompt] : [])

        if (promptsToProcess.length === 0) {
          return NextResponse.json(
            { error: 'Missing required field: either remixPrompt or prompts array is required.' },
            { status: 400 }
          )
        }

        // Enforce max 10 prompts
        if (promptsToProcess.length > 10) {
          return NextResponse.json(
            { error: 'Too many prompts: maximum 10 prompts allowed per request.' },
            { status: 400 }
          )
        }

        span.setAttribute('promptCount', promptsToProcess.length)

        const job = await createPromptRemixJob({
          imageId,
          imageUrl,
          prompts: promptsToProcess,
          provider,
        })

        span.setAttribute('jobId', job.id)

        void processPromptRemixJob(job.id).catch((error) => {
          console.error('Prompt remix job processing failed', error)
          Sentry.captureException(error)
        })

        return NextResponse.json({
          success: true,
          job,
        })
      } catch (error) {
        Sentry.captureException(error)
        console.error('Prompt remix error:', error)
        return NextResponse.json(
          {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to generate prompt remix',
          },
          { status: 500 }
        )
      }
    }
  )
}
