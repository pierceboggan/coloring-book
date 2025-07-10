import { NextRequest, NextResponse } from 'next/server'
import { generateColoringPage } from '@/lib/openai'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  console.log('🔄 API route /api/regenerate-coloring-page called')
  
  try {
    const body = await request.json()
    console.log('📥 Request body parsed:', body)
    
    const { imageId, feedback, userId } = body

    if (!imageId || !userId) {
      return NextResponse.json(
        { error: 'imageId and userId are required' },
        { status: 400 }
      )
    }

    // Check if user has already regenerated this image
    const { data: existingRegeneration, error: checkError } = await supabase
      .from('image_regenerations')
      .select('*')
      .eq('image_id', imageId)
      .eq('user_id', userId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('❌ Error checking regeneration history:', checkError)
      throw new Error('Failed to check regeneration history')
    }

    if (existingRegeneration) {
      return NextResponse.json(
        { error: 'This image has already been regenerated once. Please choose between the original and regenerated versions.' },
        { status: 400 }
      )
    }

    // Get the original image data
    const { data: imageData, error: imageError } = await supabase
      .from('images')
      .select('*')
      .eq('id', imageId)
      .eq('user_id', userId)
      .single()

    if (imageError || !imageData) {
      console.error('❌ Image not found:', imageError)
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      )
    }

    console.log('🎨 Regenerating coloring page with feedback:', feedback)

    // Generate new coloring page with enhanced prompt based on feedback
    const enhancedPrompt = createEnhancedPrompt(feedback)
    const regeneratedColoringPageUrl = await generateColoringPageWithFeedback(imageData.original_url, enhancedPrompt)

    console.log('💾 Saving regeneration data...')

    // Store the regeneration record
    const { error: regenerationError } = await supabase
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
      console.error('❌ Failed to save regeneration:', regenerationError)
      throw new Error('Failed to save regeneration data')
    }

    console.log('✅ Coloring page regenerated successfully')

    return NextResponse.json({
      success: true,
      regeneratedColoringPageUrl,
      originalColoringPageUrl: imageData.coloring_page_url
    })

  } catch (error) {
    console.error('💥 Error regenerating coloring page:', error)
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

async function generateColoringPageWithFeedback(imageUrl: string, enhancedPrompt: string): Promise<string> {
  // This is similar to the original generateColoringPage function but with custom prompt
  const { generateColoringPageWithCustomPrompt } = await import('@/lib/openai')
  return await generateColoringPageWithCustomPrompt(imageUrl, enhancedPrompt)
}