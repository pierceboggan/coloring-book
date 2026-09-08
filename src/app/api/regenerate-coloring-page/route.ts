import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { isImageGenerationProvider } from '@/lib/openai'
import type { ImageGenerationProvider } from '@/lib/openai'
import { supabaseAdmin } from '@/lib/supabase-admin'
import type { Database } from '@/lib/supabase'
import { logger } from '@/lib/logger'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

type RegenerationRequestBody = {
  imageId: string
  feedback?: string
  provider?: string
}

function isRegenerationRequestBody(value: unknown): value is RegenerationRequestBody {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const body = value as Record<string, unknown>

  return typeof body.imageId === 'string'
    && body.imageId.trim() !== ''
    && (body.feedback === undefined || typeof body.feedback === 'string')
    && (body.provider === undefined || typeof body.provider === 'string')
}

async function getAuthenticatedUserId(request: NextRequest) {
  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll().map(({ name, value }) => ({ name, value }))
      },
    },
  })

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    logger.error('Failed to verify Supabase session', { error })
    return null
  }

  return user?.id ?? null
}

export async function POST(request: NextRequest) {
  logger.info('API route /api/regenerate-coloring-page called')
  
  try {
    let body: RegenerationRequestBody

    try {
      const parsedBody: unknown = await request.json()

      if (!isRegenerationRequestBody(parsedBody)) {
        return NextResponse.json(
          { error: 'A valid imageId and optional feedback string are required' },
          { status: 400 }
        )
      }

      body = parsedBody
    } catch (error) {
      logger.warn('Failed to parse regeneration request body', { error })
      return NextResponse.json(
        { error: 'Request body must be valid JSON' },
        { status: 400 }
      )
    }

    logger.info('Request body parsed')
    
    const { imageId, feedback } = body

    const provider = isImageGenerationProvider(body?.provider)
      ? (body.provider as ImageGenerationProvider)
      : undefined

    const userId = await getAuthenticatedUserId(request)

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { data: imageData, error: imageError } = await supabaseAdmin
      .from('images')
      .select('*')
      .eq('id', imageId)
      .single()

    if (imageError || !imageData) {
      logger.error('Image not found', imageError)
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      )
    }

    if (imageData.user_id !== userId) {
      logger.warn('User attempted to regenerate an image they do not own', {
        imageId,
        ownerId: imageData.user_id,
        requesterId: userId,
      })
      return NextResponse.json(
        { error: 'You do not have permission to regenerate this image' },
        { status: 403 }
      )
    }

    // Check if user has already regenerated this image
    const { data: existingRegeneration, error: checkError } = await supabaseAdmin
      .from('image_regenerations')
      .select('*')
      .eq('image_id', imageId)
      .eq('user_id', userId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found"
      logger.error('Error checking regeneration history', checkError)
      throw new Error('Failed to check regeneration history')
    }

    if (existingRegeneration) {
      return NextResponse.json(
        { error: 'This image has already been regenerated once. Please choose between the original and regenerated versions.' },
        { status: 400 }
      )
    }

    logger.info('Regenerating coloring page with feedback', feedback)

    // Generate new coloring page with enhanced prompt based on feedback
    const enhancedPrompt = createEnhancedPrompt(feedback)
    const regeneratedColoringPageUrl = await generateColoringPageWithFeedback(imageData.original_url, enhancedPrompt, provider)

    logger.info('Saving regeneration data...')

    // Store the regeneration record
    const { error: regenerationError } = await supabaseAdmin
      .from('image_regenerations')
      .insert({
        image_id: imageId,
        user_id: userId,
        original_coloring_page_url: imageData.coloring_page_url,
        regenerated_coloring_page_url: regeneratedColoringPageUrl,
        feedback: feedback || '',
        created_at: new Date().toISOString()
      })

    if (regenerationError) {
      logger.error('Failed to save regeneration', regenerationError)
      throw new Error('Failed to save regeneration data')
    }

    logger.info('Coloring page regenerated successfully')

    return NextResponse.json({
      success: true,
      regeneratedColoringPageUrl,
      originalColoringPageUrl: imageData.coloring_page_url
    })

  } catch (error) {
    logger.error('Error regenerating coloring page', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to regenerate coloring page',
        success: false 
      },
      { status: 500 }
    )
  }
}

function createEnhancedPrompt(feedback: string): string {
  const basePrompt = "Create a black and white coloring book page based on this image. Transform it into simple, clean line art suitable for coloring with bold black outlines, no shading or fills, family-friendly content, and thick outlines perfect for coloring on a pure white background. Style: coloring book, line art, black and white only."
  
  if (!feedback || feedback.trim() === '') {
    return basePrompt
  }

  // Enhance the prompt based on user feedback
  const feedbackLower = feedback.toLowerCase()
  let enhancement = ""

  if (feedbackLower.includes('too complex') || feedbackLower.includes('complicated') || feedbackLower.includes('detailed')) {
    enhancement = " Make the design much simpler with fewer details and larger areas to color."
  } else if (feedbackLower.includes('too simple') || feedbackLower.includes('more detail') || feedbackLower.includes('boring')) {
    enhancement = " Add more interesting details and intricate patterns while keeping it suitable for coloring."
  } else if (feedbackLower.includes('lines too thin') || feedbackLower.includes('thicker')) {
    enhancement = " Use much thicker, bolder outlines that are easy to see and color within."
  } else if (feedbackLower.includes('lines too thick') || feedbackLower.includes('thinner')) {
    enhancement = " Use slightly thinner, more refined outlines while keeping them clear for coloring."
  } else if (feedbackLower.includes('cartoon') || feedbackLower.includes('fun')) {
    enhancement = " Make it more cartoon-like and fun with playful, exaggerated features."
  } else if (feedbackLower.includes('realistic') || feedbackLower.includes('accurate')) {
    enhancement = " Keep the design more realistic and true to the original image proportions."
  } else {
    enhancement = ` Taking into account this feedback: "${feedback}"`
  }

  return basePrompt + enhancement
}

async function generateColoringPageWithFeedback(
  imageUrl: string,
  enhancedPrompt: string,
  provider?: ImageGenerationProvider,
): Promise<string> {
  // This is similar to the original generateColoringPage function but with custom prompt
  const { generateColoringPageWithCustomPrompt } = await import('@/lib/openai')
  return await generateColoringPageWithCustomPrompt(imageUrl, enhancedPrompt, { provider })
}