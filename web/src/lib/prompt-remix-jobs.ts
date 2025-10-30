import * as Sentry from '@sentry/nextjs'

import { generateColoringPageWithCustomPrompt, ImageGenerationProvider } from '@/lib/openai'
import { supabaseAdmin } from '@/lib/supabase-admin'
import {
  type PromptRemixJob,
  type PromptRemixJobResult,
  type PromptRemixJobResultStatus,
} from '@/types/prompt-remix'

const JOB_TABLE = 'prompt_remix_jobs'

interface CreatePromptRemixJobInput {
  imageId?: string
  imageUrl: string
  prompts: string[]
  provider?: ImageGenerationProvider
}

function buildResultSkeleton(prompts: string[]): PromptRemixJobResult[] {
  return prompts.map(prompt => ({
    prompt,
    status: 'queued',
    url: null,
    error: null,
    started_at: null,
    completed_at: null,
  }))
}

function buildCombinedPrompt(prompt: string) {
  return `Transform this reference photo into a fresh black and white coloring book page. Keep the same people, pets, and unique accessories recognizable while placing them in the following new scene: ${prompt}. Maintain playful, family-friendly line art with bold outlines, no shading or color fills, and a clean white background. Ensure proportions remain consistent with the original photo.`
}

async function updateJobFields(jobId: string, fields: Record<string, unknown>) {
  const { error } = await supabaseAdmin
    .from(JOB_TABLE)
    .update(fields)
    .eq('id', jobId)

  if (error) {
    throw error
  }
}

export async function createPromptRemixJob({
  imageId,
  imageUrl,
  prompts,
  provider,
}: CreatePromptRemixJobInput): Promise<PromptRemixJob> {
  const initialResults = buildResultSkeleton(prompts)

  const { data, error } = await supabaseAdmin
    .from(JOB_TABLE)
    .insert({
      image_id: imageId ?? null,
      image_url: imageUrl,
      status: 'queued',
      prompts,
      results: initialResults,
      provider: provider ?? null,
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data as PromptRemixJob
}

export async function getPromptRemixJob(jobId: string): Promise<PromptRemixJob | null> {
  const { data, error } = await supabaseAdmin
    .from(JOB_TABLE)
    .select('*')
    .eq('id', jobId)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!data) {
    return null
  }

  return data as PromptRemixJob
}

async function persistVariantToImage(
  imageId: string,
  prompt: string,
  url: string,
  accumulator: { urls: string[]; prompts: string[] }
) {
  if (accumulator.urls.includes(url)) {
    return
  }

  accumulator.urls.push(url)
  accumulator.prompts.push(prompt)

  const { error } = await supabaseAdmin
    .from('images')
    .update({
      variant_urls: accumulator.urls,
      variant_prompts: accumulator.prompts,
    })
    .eq('id', imageId)

  if (error) {
    console.error('Failed to persist variant for image', imageId, error)
    Sentry.captureException(error)
  }
}

function shouldSkipStatus(status: PromptRemixJobResultStatus) {
  return status === 'succeeded'
}

export async function processPromptRemixJob(jobId: string): Promise<PromptRemixJob | null> {
  const job = await getPromptRemixJob(jobId)

  if (!job) {
    return null
  }

  if (job.status === 'processing') {
    return job
  }

  if (job.status === 'completed') {
    return job
  }

  const results = job.results?.length ? [...job.results] : buildResultSkeleton(job.prompts)

  if (!job.results?.length) {
    try {
      await updateJobFields(job.id, { results })
    } catch (error) {
      console.error('Failed to initialize job results', error)
      Sentry.captureException(error)
    }
  }

  try {
    await updateJobFields(job.id, {
      status: 'processing',
      started_at: job.started_at ?? new Date().toISOString(),
      error_message: null,
    })
  } catch (error) {
    console.error('Failed to mark job as processing', error)
    Sentry.captureException(error)
    return job
  }

  let variantAccumulator: { urls: string[]; prompts: string[] } | null = null

  if (job.image_id) {
    const { data: imageRecord, error: fetchError } = await supabaseAdmin
      .from('images')
      .select('variant_urls, variant_prompts')
      .eq('id', job.image_id)
      .maybeSingle()

    if (fetchError) {
      console.error('Failed to load existing variants for job', job.id, fetchError)
      Sentry.captureException(fetchError)
    } else if (imageRecord) {
      variantAccumulator = {
        urls: Array.isArray(imageRecord.variant_urls) ? [...imageRecord.variant_urls] : [],
        prompts: Array.isArray(imageRecord.variant_prompts) ? [...imageRecord.variant_prompts] : [],
      }
    }
  }

  const errors: string[] = []

  for (let index = 0; index < results.length; index += 1) {
    const current = results[index]

    if (shouldSkipStatus(current.status)) {
      continue
    }

    const startedAt = new Date().toISOString()
    results[index] = {
      ...current,
      status: 'processing',
      error: null,
      started_at: startedAt,
      completed_at: null,
    }

    try {
      await updateJobFields(job.id, { results })
    } catch (error) {
      console.error('Failed to update job progress', error)
      Sentry.captureException(error)
    }

    try {
      const combinedPrompt = buildCombinedPrompt(current.prompt)
      const provider = job.provider && typeof job.provider === 'string' ? (job.provider as ImageGenerationProvider) : undefined
      const coloringPageUrl = await generateColoringPageWithCustomPrompt(job.image_url, combinedPrompt, {
        provider,
      })

      results[index] = {
        ...results[index],
        status: 'succeeded',
        url: coloringPageUrl,
        completed_at: new Date().toISOString(),
      }

      await updateJobFields(job.id, { results })

      if (job.image_id && coloringPageUrl && variantAccumulator) {
        await persistVariantToImage(job.image_id, current.prompt, coloringPageUrl, variantAccumulator)
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to generate prompt remix variant.'

      results[index] = {
        ...results[index],
        status: 'failed',
        error: message,
        completed_at: new Date().toISOString(),
      }

      errors.push(`${current.prompt}: ${message}`)

      try {
        await updateJobFields(job.id, { results })
      } catch (updateError) {
        console.error('Failed to store error result for prompt remix job', updateError)
        Sentry.captureException(updateError)
      }

      console.error('Prompt remix generation failed', error)
      Sentry.captureException(error)
    }
  }

  const finalStatus = results.every(result => result.status === 'succeeded') ? 'completed' : 'failed'

  const { data: finalJob, error: finalizeError } = await supabaseAdmin
    .from(JOB_TABLE)
    .update({
      status: finalStatus,
      results,
      completed_at: new Date().toISOString(),
      error_message: errors.length ? errors.join('\n') : null,
    })
    .eq('id', job.id)
    .select()
    .single()

  if (finalizeError) {
    console.error('Failed to finalize prompt remix job', finalizeError)
    Sentry.captureException(finalizeError)
    return {
      ...job,
      status: finalStatus,
      results,
      error_message: errors.length ? errors.join('\n') : null,
    }
  }

  return finalJob as PromptRemixJob
}
