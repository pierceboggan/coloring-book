import { NextRequest, NextResponse } from 'next/server'
import { generateColoringPageWithCustomPrompt } from '@/lib/openai'
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
        const { imageUrl, remixPrompt } = body as { imageUrl?: string; remixPrompt?: string }

        span.setAttribute('hasImageUrl', Boolean(imageUrl))
        span.setAttribute('hasRemixPrompt', Boolean(remixPrompt))

        if (!imageUrl || !remixPrompt) {
          return NextResponse.json(
            { error: 'Missing required fields: imageUrl and remixPrompt are both required.' },
            { status: 400 }
          )
        }

        const combinedPrompt = `Transform this reference photo into a fresh black and white coloring book page. Keep the same people, pets, and unique accessories recognizable while placing them in the following new scene: ${remixPrompt}. Maintain playful, family-friendly line art with bold outlines, no shading or color fills, and a clean white background. Ensure proportions remain consistent with the original photo.`

        span.setAttribute('promptLength', combinedPrompt.length)

        const coloringPageUrl = await generateColoringPageWithCustomPrompt(imageUrl, combinedPrompt)

        return NextResponse.json({ success: true, coloringPageUrl })
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
