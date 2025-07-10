import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const imageId = params.id

    if (!imageId) {
      return NextResponse.json(
        { error: 'Image ID is required' },
        { status: 400 }
      )
    }

    // Get the image record to find the coloring page URL
    const { data: image, error: fetchError } = await supabaseAdmin
      .from('images')
      .select('*')
      .eq('id', imageId)
      .single()

    if (fetchError || !image) {
      console.error('❌ Image not found:', fetchError)
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      )
    }

    if (!image.coloring_page_url) {
      return NextResponse.json(
        { error: 'Coloring page not ready yet' },
        { status: 404 }
      )
    }

    // Fetch the image from Supabase storage
    const response = await fetch(image.coloring_page_url)
    
    if (!response.ok) {
      throw new Error('Failed to fetch image from storage')
    }

    const imageBuffer = await response.arrayBuffer()
    const fileName = `coloring-page-${image.name.replace(/\.[^/.]+$/, '')}.png`

    // Return the image with proper download headers
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': imageBuffer.byteLength.toString(),
      },
    })

  } catch (error) {
    console.error('💥 Download API Error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to download image',
        success: false 
      },
      { status: 500 }
    )
  }
}