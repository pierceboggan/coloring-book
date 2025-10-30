import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import {
  ImageDetailLevel,
  ImageGenerationProvider,
  createDefaultColoringPrompt,
  evaluateImageProviders,
  isImageGenerationProvider,
} from '@/lib/openai'

interface EvaluationRequestBody {
  imageUrl?: string
  prompt?: string
  age?: number
  detail?: ImageDetailLevel | string
  providers?: (ImageGenerationProvider | string)[]
}

function parseDetailLevel(value: unknown): ImageDetailLevel | undefined {
  if (value === 'low' || value === 'auto' || value === 'high') {
    return value
  }
  return undefined
}

function parseProviders(value: unknown): ImageGenerationProvider[] {
  if (!value) {
    return []
  }

  if (typeof value === 'string' && isImageGenerationProvider(value)) {
    return [value]
  }

  if (Array.isArray(value)) {
    return value.filter(isImageGenerationProvider)
  }

  return []
}

export async function POST(request: NextRequest) {
  return Sentry.startSpan(
    {
      op: 'http.server',
      name: 'POST /api/evaluate-image-providers',
    },
    async (span) => {
      try {
        const body = await request.json() as EvaluationRequestBody
        const { imageUrl, providers: providerInput } = body

        if (!imageUrl) {
          return NextResponse.json(
            { error: 'Missing required field: imageUrl is required.' },
            { status: 400 },
          )
        }

        const requestedAge = typeof body.age === 'number' && Number.isFinite(body.age)
          ? Math.round(body.age)
          : undefined

        const clampedAge = requestedAge
          ? Math.min(12, Math.max(2, requestedAge))
          : undefined

        const providers = parseProviders(providerInput)
        const providersToEvaluate = providers.length > 0
          ? providers
          : (['openai', 'gemini'] as ImageGenerationProvider[])

        span.setAttribute('imageProviderCount', providersToEvaluate.length)
        span.setAttribute('agePreference', clampedAge ?? 'unspecified')

        const promptFromBody = typeof body.prompt === 'string' && body.prompt.trim().length > 0
          ? body.prompt.trim()
          : undefined

        const detailFromBody = parseDetailLevel(body.detail)

        const { prompt: defaultPrompt, detailLevel: defaultDetail } = createDefaultColoringPrompt(clampedAge)

        const promptToUse = promptFromBody ?? defaultPrompt
        const detailToUse: ImageDetailLevel = detailFromBody ?? (promptFromBody ? 'high' : defaultDetail)

        const evaluationResults = await evaluateImageProviders(imageUrl, promptToUse, providersToEvaluate, {
          detail: detailToUse,
        })

        return NextResponse.json({
          success: true,
          prompt: promptToUse,
          detail: detailToUse,
          results: evaluationResults.map((entry) => {
            if (!entry.success) {
              return {
                provider: entry.provider,
                success: false as const,
                error: entry.error,
              }
            }

            return {
              provider: entry.provider,
              success: true as const,
              publicUrl: entry.result?.publicUrl,
              storagePath: entry.result?.storagePath,
              metadata: entry.result?.metadata,
            }
          }),
        })
      } catch (error) {
        Sentry.captureException(error)
        console.error('Evaluation error:', error)
        return NextResponse.json(
          {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to evaluate image providers',
          },
          { status: 500 },
        )
      }
    },
  )
}
