import { NextRequest, NextResponse } from 'next/server'
import { generateColoringPageWithCustomPrompt, ImageGenerationProvider, isImageGenerationProvider } from '@/lib/openai'
import { supabaseAdmin } from '@/lib/supabase-admin'
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

        const persistVariants = async (successfulResults: { prompt: string; url: string | null }[]) => {
          if (!imageId) {
            return null
          }

          try {
            const { data: existingRecord, error: fetchError } = await supabaseAdmin
              .from('images')
              .select('variant_urls, variant_prompts')
              .eq('id', imageId)
              .single()

            if (fetchError) {
              throw fetchError
            }

            const existingUrls = existingRecord?.variant_urls || []
            const existingPrompts = existingRecord?.variant_prompts || []

            const updatedUrls = [...existingUrls]
            const updatedPrompts = [...existingPrompts]

            const newEntries = successfulResults
              .filter(result => result.url)
              .map(result => ({ url: result.url as string, prompt: result.prompt }))

            newEntries.forEach(({ url, prompt }) => {
              if (!updatedUrls.includes(url)) {
                updatedUrls.push(url)
                updatedPrompts.push(prompt)
              }
            })

            const hasChanges = updatedUrls.length !== existingUrls.length

            if (hasChanges) {
              const { error: updateError } = await supabaseAdmin
                .from('images')
                .update({ variant_urls: updatedUrls, variant_prompts: updatedPrompts })
                .eq('id', imageId)

              if (updateError) {
                throw updateError
              }
            }

            return {
              urls: updatedUrls,
              prompts: updatedPrompts,
            }
          } catch (persistError) {
            console.error('Failed to persist variants:', persistError)
            Sentry.captureException(persistError)
            return null
          }
        }

        // Process prompts with max 5 concurrent
        const tasks = promptsToProcess.map((prompt) => async () => {
          const combinedPrompt = `Transform this reference photo into a fresh black and white coloring book page. Keep the same people, pets, and unique accessories recognizable while placing them in the following new scene: ${prompt}. Maintain playful, family-friendly line art with bold outlines, no shading or color fills, and a clean white background. Ensure proportions remain consistent with the original photo.`

          const coloringPageUrl = await generateColoringPageWithCustomPrompt(imageUrl, combinedPrompt, { provider })
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

          const persistedVariants = await persistVariants(successfulResults)

          return NextResponse.json({
            success: true,
            results: successfulResults,
            persistedVariants,
          })
        } else {
          // Single mode: return single result for backward compatibility
          const result = results[0]
          if (result.status === 'fulfilled') {
            const persistedVariants = await persistVariants([
              { prompt: promptsToProcess[0], url: result.value.url },
            ])

            return NextResponse.json({ success: true, coloringPageUrl: result.value.url, persistedVariants })
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
