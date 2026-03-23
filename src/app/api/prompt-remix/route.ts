import { NextRequest, NextResponse } from 'next/server'
import { ImageGenerationProvider, isImageGenerationProvider } from '@/lib/openai'
import { createPromptRemixJob, processPromptRemixJob } from '@/lib/prompt-remix-jobs'

export async function POST(request: NextRequest) {
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

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Missing required field: imageUrl is required.' },
        { status: 400 }
      )
    }

    const promptsToProcess = prompts || (remixPrompt ? [remixPrompt] : [])

    if (promptsToProcess.length === 0) {
      return NextResponse.json(
        { error: 'Missing required field: either remixPrompt or prompts array is required.' },
        { status: 400 }
      )
    }

    if (promptsToProcess.length > 10) {
      return NextResponse.json(
        { error: 'Too many prompts: maximum 10 prompts allowed per request.' },
        { status: 400 }
      )
    }

    const job = await createPromptRemixJob({
      imageId,
      imageUrl,
      prompts: promptsToProcess,
      provider,
    })

    void processPromptRemixJob(job.id).catch((error) => {
      console.error('Prompt remix job processing failed', error)
    })

    return NextResponse.json({
      success: true,
      job,
    })
  } catch (error) {
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
