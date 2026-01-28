import { NextRequest, NextResponse } from 'next/server'
import { generateColoringPage } from '@/lib/openai'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  console.log('🔄 API route /api/retry-processing called')
  
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    console.log('🔍 Finding stuck processing images for user:', userId)

    // Get all images that are stuck in processing status
    const { data: stuckImages, error: fetchError } = await supabase
      .from('images')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'processing')
      .is('coloring_page_url', null)

    if (fetchError) {
      console.error('❌ Error fetching stuck images:', fetchError)
      throw new Error(`Failed to fetch images: ${fetchError.message}`)
    }

    if (!stuckImages || stuckImages.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No stuck images found',
        processedCount: 0
      })
    }

    console.log(`🎨 Found ${stuckImages.length} stuck images, processing...`)

    let successCount = 0
    let errorCount = 0

    // Process each stuck image
    for (const image of stuckImages) {
      try {
        console.log(`🎨 Processing image: ${image.name} (${image.id})`)
        
        // Generate coloring page
        const coloringPageUrl = await generateColoringPage(image.original_url)
        
        // Update database with result
        const { error: updateError } = await supabase
          .from('images')
          .update({
            coloring_page_url: coloringPageUrl,
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', image.id)

        if (updateError) {
          console.error(`❌ Failed to update image ${image.id}:`, updateError)
          errorCount++
        } else {
          console.log(`✅ Successfully processed image: ${image.name}`)
          successCount++
        }
        
      } catch (imageError) {
        console.error(`❌ Error processing image ${image.id}:`, imageError)
        errorCount++
        
        // Mark as error in database
        await supabase
          .from('images')
          .update({
            status: 'error',
            updated_at: new Date().toISOString()
          })
          .eq('id', image.id)
      }
    }

    console.log(`✅ Retry processing complete. Success: ${successCount}, Errors: ${errorCount}`)

    return NextResponse.json({
      success: true,
      message: `Processed ${successCount} images successfully, ${errorCount} failed`,
      processedCount: successCount,
      errorCount: errorCount
    })

  } catch (error) {
    console.error('💥 Error in retry processing:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to retry processing',
        success: false 
      },
      { status: 500 }
    )
  }
}