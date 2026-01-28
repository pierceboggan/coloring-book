import OpenAI from 'openai'

export type ImageDetailLevel = 'low' | 'auto' | 'high'

export type ImageGenerationProvider = 'openai' | 'gemini'

type UsageMetrics = Record<string, number>

export interface ImageGenerationMetadata {
  provider: ImageGenerationProvider
  model: string
  detail: ImageDetailLevel
  prompt: string
  latencyMs: number
  estimatedCostUSD?: number
  usageMetrics?: UsageMetrics
  base64Length: number
  imageBytes: number
  responseId?: string
}

export interface ImageGenerationResult {
  publicUrl: string
  storagePath: string
  metadata: ImageGenerationMetadata
}

export interface ColoringPageOptions {
  age?: number
  provider?: ImageGenerationProvider
}

interface PromptConfig {
  promptSuffix: string
  detailLevel: ImageDetailLevel
}

interface GenerationOptions {
  detail?: ImageDetailLevel
  provider?: ImageGenerationProvider
}

interface ProviderGenerationResult {
  base64: string
  model: string
  usage?: UsageMetrics
  cost?: number
  responseId?: string
}

interface ImageSource {
  base64: string
  mimeType: string
}

const BASE_COLORING_PROMPT = "Create a black and white coloring book page based on this image. Transform it into simple, clean line art suitable for coloring with bold black outlines, no shading or fills, family-friendly content, and thick outlines perfect for coloring on a pure white background. Style: coloring book, line art, black and white only."

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  organization: 'org-xBug09vn6Yh8Uf19bKLjgxxu',
})

const geminiModelName = process.env.GEMINI_IMAGE_MODEL ?? 'gemini-2.5-flash-image-preview'
const geminiApiBaseUrl = process.env.GEMINI_API_BASE_URL ?? 'https://generativelanguage.googleapis.com/v1beta'

function parseEnvNumber(name: string): number | undefined {
  const rawValue = process.env[name]
  if (!rawValue) {
    return undefined
  }

  const parsed = Number(rawValue)
  if (Number.isFinite(parsed)) {
    return parsed
  }

  console.warn(`⚠️ Environment variable ${name} is not a valid number: ${rawValue}`)
  return undefined
}

const configuredOpenAICost = parseEnvNumber('OPENAI_IMAGE_COST_USD')
const configuredGeminiCost = parseEnvNumber('GEMINI_IMAGE_COST_USD')

function getConfiguredCost(provider: ImageGenerationProvider): number | undefined {
  if (provider === 'openai') {
    return configuredOpenAICost
  }
  return configuredGeminiCost
}

function resolveProvider(provider?: ImageGenerationProvider): ImageGenerationProvider {
  if (provider === 'openai' || provider === 'gemini') {
    return provider
  }

  const fromEnv = process.env.IMAGE_GENERATION_PROVIDER
  if (fromEnv === 'gemini') {
    return 'gemini'
  }

  return 'openai'
}

async function imageUrlToBase64(url: string): Promise<ImageSource> {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status} ${response.statusText}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const mimeType = response.headers.get('content-type') ?? 'image/jpeg'

  return {
    base64: buffer.toString('base64'),
    mimeType,
  }
}

function extractNumericFields(source: Record<string, unknown> | undefined): UsageMetrics | undefined {
  if (!source) {
    return undefined
  }

  const metricsEntries = Object.entries(source)
    .filter(([, value]) => typeof value === 'number' && Number.isFinite(value as number))
    .map(([key, value]) => [key, value as number] as const)

  if (metricsEntries.length === 0) {
    return undefined
  }

  return Object.fromEntries(metricsEntries)
}

function buildPromptForAge(age?: number): PromptConfig {
  const safeAge = typeof age === 'number' && Number.isFinite(age)
    ? Math.round(age)
    : undefined

  if (!safeAge) {
    return {
      promptSuffix: 'Keep the line art moderately detailed with a mix of medium and bold outlines that work well for elementary-aged children.',
      detailLevel: 'auto',
    }
  }

  if (safeAge <= 3) {
    return {
      promptSuffix: 'Design the page for a toddler aged about 2-3 years old with very large, simple shapes, lots of open white space, and only a few bold outlines so it is not overwhelming.',
      detailLevel: 'low',
    }
  }

  if (safeAge <= 5) {
    return {
      promptSuffix: 'Aim for a preschool-friendly page for ages 4-5 with clear silhouettes, medium-sized coloring areas, and limited interior detail so young kids can stay within the lines.',
      detailLevel: 'auto',
    }
  }

  if (safeAge <= 8) {
    return {
      promptSuffix: 'Target early elementary artists around ages 6-8 with richer line work, a few smaller details, and varied line weights that still feel approachable.',
      detailLevel: 'high',
    }
  }

  return {
    promptSuffix: 'Create an intricate page for kids 9 and up with lots of fine line work, patterns, and interesting textures that reward careful coloring.',
    detailLevel: 'high',
  }
}

export async function generateColoringPage(imageUrl: string, options: ColoringPageOptions = {}): Promise<string> {
  const result = await generateColoringPageDetailed(imageUrl, options)
  return result.publicUrl
}

export async function generateColoringPageDetailed(imageUrl: string, options: ColoringPageOptions = {}): Promise<ImageGenerationResult> {
  const { prompt, detailLevel } = createDefaultColoringPrompt(options.age)

  return generateColoringPageWithCustomPromptDetailed(imageUrl, prompt, {
    detail: detailLevel,
    provider: options.provider,
  })
}

export function createDefaultColoringPrompt(age?: number): { prompt: string; detailLevel: ImageDetailLevel } {
  const { promptSuffix, detailLevel } = buildPromptForAge(age)
  const prompt = `${BASE_COLORING_PROMPT} ${promptSuffix}`.trim()
  return { prompt, detailLevel }
}

export async function generateColoringPageWithCustomPrompt(
  imageUrl: string,
  customPrompt: string,
  options: GenerationOptions = {},
): Promise<string> {
  const result = await generateColoringPageWithCustomPromptDetailed(imageUrl, customPrompt, options)
  return result.publicUrl
}

export async function generateColoringPageWithCustomPromptDetailed(
  imageUrl: string,
  customPrompt: string,
  options: GenerationOptions = {},
): Promise<ImageGenerationResult> {
  const provider = resolveProvider(options.provider)
  const detailLevel = options.detail ?? 'high'

  try {
    console.log('🎨 Starting coloring page generation for image:', imageUrl)
    console.log('📝 Using prompt:', customPrompt)
    console.log('⚙️ Selected provider:', provider)

    console.log('📥 Converting image to base64...')
    const { base64: base64Image, mimeType } = await imageUrlToBase64(imageUrl)
    console.log('✅ Image converted to base64, length:', base64Image.length)

    const startTime = Date.now()

    const providerResult = await generateWithProvider({
      provider,
      base64Image,
      mimeType,
      prompt: customPrompt,
      detailLevel,
    })

    const latencyMs = Date.now() - startTime

    console.log('✅ Image generated successfully via', provider)

    if (!providerResult.base64) {
      console.error('❌ Generated image data is empty')
      throw new Error('Generated image data is empty')
    }

    const { supabase } = await import('./supabase')
    const { addWatermark } = await import('./imageProcessor')

    let buffer = Buffer.from(providerResult.base64, 'base64')
    const imageBytes = buffer.length

    console.log('🏷️ Adding watermark to coloring page...')
    buffer = await addWatermark(buffer)

    const fileName = `coloring-page-${provider}-${Date.now()}.png`
    const filePath = `coloring-pages/${fileName}`

    console.log('📤 Uploading coloring page to Supabase storage...')
    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, buffer, {
        contentType: 'image/png',
      })

    if (uploadError) {
      console.error('❌ Failed to upload coloring page:', uploadError)
      throw new Error(`Storage upload failed: ${uploadError.message}`)
    }

    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(filePath)

    console.log('✅ Coloring page uploaded successfully:', publicUrl)

    const metadata: ImageGenerationMetadata = {
      provider,
      model: providerResult.model,
      detail: detailLevel,
      prompt: customPrompt,
      latencyMs,
      estimatedCostUSD: providerResult.cost,
      usageMetrics: providerResult.usage,
      base64Length: providerResult.base64.length,
      imageBytes,
      responseId: providerResult.responseId,
    }

    return {
      publicUrl,
      storagePath: filePath,
      metadata,
    }
  } catch (error) {
    console.error('💥 Error generating coloring page:', error)

    if (error instanceof Error) {
      console.error('🔍 Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack?.substring(0, 500),
        provider,
      })

      if (provider === 'openai') {
        throw new Error(`OpenAI API error: ${error.message}`)
      }

      throw new Error(`Gemini API error: ${error.message}`)
    }

    throw new Error('Failed to generate coloring page')
  }
}

export interface ProviderEvaluationResult {
  provider: ImageGenerationProvider
  success: boolean
  result?: ImageGenerationResult
  error?: string
}

export async function evaluateImageProviders(
  imageUrl: string,
  customPrompt: string,
  providers: ImageGenerationProvider[],
  options: GenerationOptions = {},
): Promise<ProviderEvaluationResult[]> {
  const uniqueProviders = Array.from(new Set(providers))
  const results: ProviderEvaluationResult[] = []

  for (const provider of uniqueProviders) {
    try {
      const result = await generateColoringPageWithCustomPromptDetailed(imageUrl, customPrompt, {
        ...options,
        provider,
      })

      results.push({
        provider,
        success: true,
        result,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate coloring page'
      results.push({
        provider,
        success: false,
        error: errorMessage,
      })
    }
  }

  return results
}

async function generateWithProvider({
  provider,
  base64Image,
  mimeType,
  prompt,
  detailLevel,
}: {
  provider: ImageGenerationProvider
  base64Image: string
  mimeType: string
  prompt: string
  detailLevel: ImageDetailLevel
}): Promise<ProviderGenerationResult> {
  if (provider === 'openai') {
    return generateWithOpenAI({ base64Image, prompt, detailLevel, mimeType })
  }

  return generateWithGemini({ base64Image, prompt, mimeType })
}

async function generateWithOpenAI({
  base64Image,
  prompt,
  detailLevel,
  mimeType,
}: {
  base64Image: string
  prompt: string
  detailLevel: ImageDetailLevel
  mimeType: string
}): Promise<ProviderGenerationResult> {
  console.log('🤖 Calling OpenAI Responses API...')
  const response = await openai.responses.create({
    model: 'gpt-4o',
    input: [
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: prompt,
          },
          {
            type: 'input_image',
            image_url: `data:${mimeType};base64,${base64Image}`,
            detail: detailLevel,
          },
        ],
      },
    ],
    tools: [{ type: 'image_generation' }],
  })

  console.log('📡 Received response from OpenAI')
  console.log('📊 Response output count:', response.output.length)
  console.log('📋 Response output types:', response.output.map((output) => output.type))

  const imageData = response.output
    .filter((output) => output.type === 'image_generation_call')
    .map((output) => output.result)

  console.log('🖼️ Image generation calls found:', imageData.length)

  if (imageData.length === 0 || !imageData[0]) {
    console.error('❌ No image data found in OpenAI response')
    console.log('🔍 Full response output:', JSON.stringify(response.output, null, 2))
    throw new Error('No image generated in response')
  }

  const usage = extractNumericFields(response.usage as Record<string, unknown> | undefined)

  return {
    base64: imageData[0],
    model: response.model ?? 'gpt-4o',
    usage,
    cost: getConfiguredCost('openai'),
    responseId: response.id,
  }
}

async function generateWithGemini({
  base64Image,
  prompt,
  mimeType,
}: {
  base64Image: string
  prompt: string
  mimeType: string
}): Promise<ProviderGenerationResult> {
  console.log('🌟 Calling Gemini image model...')
  const apiKey = process.env.GOOGLE_API_KEY

  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY environment variable is not set')
  }

  const endpoint = `${geminiApiBaseUrl}/models/${geminiModelName}:generateContent?key=${apiKey}`

  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: [
          { inlineData: { mimeType, data: base64Image } },
          { text: prompt },
        ],
      },
    ],
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const errorPayload = await response.text()
    console.error('❌ Gemini API responded with an error:', {
      status: response.status,
      statusText: response.statusText,
      body: errorPayload,
    })
    throw new Error(`Gemini API error: ${response.status} ${response.statusText}`)
  }

  const result = await response.json() as {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          inlineData?: { data?: string }
          text?: string
        }>
      }
    }>
    usageMetadata?: Record<string, unknown>
  }

  const candidates = result.candidates ?? []
  let imageBase64: string | undefined

  for (const candidate of candidates) {
    const parts = candidate.content?.parts ?? []
    for (const part of parts) {
      if ('inlineData' in part && part.inlineData?.data) {
        imageBase64 = part.inlineData.data
        break
      }
    }

    if (imageBase64) {
      break
    }
  }

  if (!imageBase64) {
    console.error('❌ No image data returned from Gemini')
    throw new Error('Gemini did not return image data')
  }

  const usage = extractNumericFields(result.usageMetadata)

  return {
    base64: imageBase64,
    model: geminiModelName,
    usage,
    cost: getConfiguredCost('gemini'),
  }
}

export { openai }
export function isImageGenerationProvider(value: unknown): value is ImageGenerationProvider {
  return value === 'openai' || value === 'gemini'
}
