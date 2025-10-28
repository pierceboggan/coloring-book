import { NextRequest, NextResponse } from 'next/server'
import { generateColoringPageWithCustomPrompt } from '@/lib/openai'
import * as Sentry from '@sentry/nextjs'

// Helper to limit concurrent promises
async function promisePool<T>(
  tasks: (() => Promise<T>)[],
  maxConcurrent: number
): Promise<PromiseSettledResult<T>[]> {
  const results: PromiseSettledResult<T>[] = []
  const executing: Promise<void>[] = []

  for (const task of tasks) {
    const promise = task()
      .then((value) => ({ status: 'fulfilled' as const, value }))
      .catch((reason) => ({ status: 'rejected' as const, reason }))
      .then((result) => {
        results.push(result)
      })

    executing.push(promise)

    if (executing.length >= maxConcurrent) {
      await Promise.race(executing)
      executing.splice(
        executing.findIndex((p) => p === promise),
        1
      )
    }
  }

  await Promise.all(executing)
  return results
}

export async function POST(request: NextRequest) {
  return Sentry.startSpan(
    {
      op: 'http.server',
      name: 'POST /api/prompt-remix',
    },
    async (span) => {
      try {
        const body = await request.json()
        const { imageUrl, remixPrompt, prompts } = body as {
          imageUrl?: string
          remixPrompt?: string
          prompts?: string[]
        }

        span.setAttribute('hasImageUrl', Boolean(imageUrl))
        span.setAttribute('hasRemixPrompt', Boolean(remixPrompt))
        span.setAttribute('hasPrompts', Boolean(prompts))

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

        // Process prompts with max 5 concurrent
        const tasks = promptsToProcess.map((prompt) => async () => {
          const combinedPrompt = `Transform this reference photo into a fresh black and white coloring book page. Keep the same people, pets, and unique accessories recognizable while placing them in the following new scene: ${prompt}. Maintain playful, family-friendly line art with bold outlines, no shading or color fills, and a clean white background. Ensure proportions remain consistent with the original photo.`

          const coloringPageUrl = await generateColoringPageWithCustomPrompt(imageUrl, combinedPrompt)
          return { prompt, url: coloringPageUrl }
        })

        const results = await promisePool(tasks, 5)

        // Format response for batch vs single
        if (prompts) {
          // Batch mode: return results array
          const successfulResults = results
            .map((result, index) => {
              if (result.status === 'fulfilled') {
                return result.value
              } else {
                console.error(`Failed to generate variant for prompt "${promptsToProcess[index]}":`, result.reason)
                return { prompt: promptsToProcess[index], url: null, error: result.reason?.message || 'Failed to generate' }
              }
            })

          return NextResponse.json({
            success: true,
            results: successfulResults,
          })
        } else {
          // Single mode: return single result for backward compatibility
          const result = results[0]
          if (result.status === 'fulfilled') {
            return NextResponse.json({ success: true, coloringPageUrl: result.value.url })
          } else {
            throw result.reason
          }
        }
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
