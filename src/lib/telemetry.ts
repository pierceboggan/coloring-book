import {
  metrics,
  trace,
  SpanStatusCode,
  type Attributes,
  type Span,
} from '@opentelemetry/api'

const tracer = trace.getTracer('coloringbook.ai')
const meter = metrics.getMeter('coloringbook.ai')

const imageGenerationCounter = meter.createCounter('coloringbook.image_generation.requests', {
  description: 'Number of coloring page generation attempts.',
})

const imageGenerationDuration = meter.createHistogram('coloringbook.image_generation.duration', {
  description: 'Duration of coloring page generation operations.',
  unit: 'ms',
})

const imageGenerationImageBytes = meter.createHistogram('coloringbook.image_generation.image_bytes', {
  description: 'Output size of generated coloring page images.',
  unit: 'By',
})

const imageGenerationPromptLength = meter.createHistogram('coloringbook.image_generation.prompt_length', {
  description: 'Prompt length for image generation requests.',
  unit: '{character}',
})

const imageGenerationTokens = meter.createHistogram('coloringbook.image_generation.tokens', {
  description: 'Token usage reported by image generation providers.',
  unit: '{token}',
})

const imageGenerationCostUsd = meter.createHistogram('coloringbook.image_generation.cost_usd', {
  description: 'Estimated image generation cost in USD.',
  unit: 'USD',
})

const uploadCounter = meter.createCounter('coloringbook.upload.requests', {
  description: 'Number of upload requests received by the coloring book app.',
})

const uploadBytes = meter.createHistogram('coloringbook.upload.bytes', {
  description: 'Uploaded file sizes.',
  unit: 'By',
})

const promptRemixJobs = meter.createCounter('coloringbook.prompt_remix.jobs', {
  description: 'Number of prompt remix jobs created and processed.',
})

const promptRemixPromptCount = meter.createHistogram('coloringbook.prompt_remix.prompt_count', {
  description: 'Number of prompts requested for a prompt remix job.',
  unit: '{prompt}',
})

const photobookJobs = meter.createCounter('coloringbook.photobook.jobs', {
  description: 'Number of photobook jobs queued or processed.',
})

const photobookPageCount = meter.createHistogram('coloringbook.photobook.page_count', {
  description: 'Number of coloring pages included in a photobook job.',
  unit: '{page}',
})

const photobookDuration = meter.createHistogram('coloringbook.photobook.duration', {
  description: 'Duration of photobook generation jobs.',
  unit: 'ms',
})

type SpanCallback<T> = (span: Span) => Promise<T> | T

export async function withActiveSpan<T>(
  name: string,
  attributes: Attributes,
  callback: SpanCallback<T>,
): Promise<T> {
  return tracer.startActiveSpan(name, { attributes }, async (span) => {
    try {
      const result = await callback(span)
      span.setStatus({ code: SpanStatusCode.OK })
      return result
    } catch (error) {
      if (error instanceof Error) {
        span.recordException(error)
        span.setStatus({ code: SpanStatusCode.ERROR, message: error.message })
      } else {
        span.setStatus({ code: SpanStatusCode.ERROR, message: 'Unknown error' })
      }

      throw error
    } finally {
      span.end()
    }
  })
}

interface ImageGenerationMetricInput {
  provider: string
  detail: string
  status: 'success' | 'error'
  latencyMs?: number
  imageBytes?: number
  promptLength?: number
  model?: string
  estimatedCostUsd?: number
  usageMetrics?: Record<string, number>
}

export function recordImageGenerationMetrics(input: ImageGenerationMetricInput) {
  const attributes: Attributes = {
    'coloringbook.provider': input.provider,
    'coloringbook.detail': input.detail,
    'coloringbook.status': input.status,
  }

  if (input.model) {
    attributes['coloringbook.model'] = input.model
  }

  imageGenerationCounter.add(1, attributes)

  if (typeof input.latencyMs === 'number') {
    imageGenerationDuration.record(input.latencyMs, attributes)
  }

  if (typeof input.imageBytes === 'number') {
    imageGenerationImageBytes.record(input.imageBytes, attributes)
  }

  if (typeof input.promptLength === 'number') {
    imageGenerationPromptLength.record(input.promptLength, attributes)
  }

  if (typeof input.estimatedCostUsd === 'number') {
    imageGenerationCostUsd.record(input.estimatedCostUsd, attributes)
  }

  const totalTokens =
    input.usageMetrics?.total_tokens ??
    input.usageMetrics?.totalTokens

  const inputTokens =
    input.usageMetrics?.input_tokens ??
    input.usageMetrics?.prompt_tokens

  const outputTokens =
    input.usageMetrics?.output_tokens ??
    input.usageMetrics?.completion_tokens

  if (typeof totalTokens === 'number') {
    imageGenerationTokens.record(totalTokens, {
      ...attributes,
      'coloringbook.token_type': 'total',
    })
  }

  if (typeof inputTokens === 'number') {
    imageGenerationTokens.record(inputTokens, {
      ...attributes,
      'coloringbook.token_type': 'input',
    })
  }

  if (typeof outputTokens === 'number') {
    imageGenerationTokens.record(outputTokens, {
      ...attributes,
      'coloringbook.token_type': 'output',
    })
  }
}

interface UploadMetricInput {
  route: string
  status: 'success' | 'error'
  contentType?: string
  fileBytes?: number
}

export function recordUploadMetrics(input: UploadMetricInput) {
  const attributes: Attributes = {
    'coloringbook.route': input.route,
    'coloringbook.status': input.status,
  }

  if (input.contentType) {
    attributes['coloringbook.content_type'] = input.contentType
  }

  uploadCounter.add(1, attributes)

  if (typeof input.fileBytes === 'number') {
    uploadBytes.record(input.fileBytes, attributes)
  }
}

interface PromptRemixMetricInput {
  status: 'queued' | 'completed' | 'failed'
  promptCount: number
  provider: string
}

export function recordPromptRemixMetrics(input: PromptRemixMetricInput) {
  const attributes: Attributes = {
    'coloringbook.status': input.status,
    'coloringbook.provider': input.provider,
  }

  promptRemixJobs.add(1, attributes)
  promptRemixPromptCount.record(input.promptCount, attributes)
}

interface PhotobookMetricInput {
  status: 'queued' | 'completed' | 'failed'
  pageCount: number
  durationMs?: number
}

export function recordPhotobookMetrics(input: PhotobookMetricInput) {
  const attributes: Attributes = {
    'coloringbook.status': input.status,
  }

  photobookJobs.add(1, attributes)
  photobookPageCount.record(input.pageCount, attributes)

  if (typeof input.durationMs === 'number') {
    photobookDuration.record(input.durationMs, attributes)
  }
}