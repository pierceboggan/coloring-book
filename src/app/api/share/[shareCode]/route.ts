import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(
  request: NextRequest,
  { params }: { params: { shareCode: string } }
) {
  try {
    const shareCode = params.shareCode

    if (!shareCode) {
      return NextResponse.json(
        { error: 'Share code is required' },
        { status: 400 }
      )
    }

    // Get the shared page
    const { data: sharedPage, error: shareError } = await supabaseAdmin
      .from('shared_pages')
      .select('*')
      .eq('share_code', shareCode)
      .single()

    if (shareError || !sharedPage) {
      return NextResponse.json(
        { error: 'Share not found' },
        { status: 404 }
      )
    }

    // Check if expired
    if (sharedPage.expires_at) {
      const expiryDate = new Date(sharedPage.expires_at)
      if (expiryDate < new Date()) {
        return NextResponse.json(
          { error: 'Share link has expired' },
          { status: 410 }
        )
      }
    }

    // Get the image details
    const { data: image, error: imageError } = await supabaseAdmin
      .from('images')
      .select('id, name, coloring_page_url, variant_urls, created_at')
      .eq('id', sharedPage.image_id)
      .single()

    if (imageError || !image) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      )
    }

    // Increment view count
    await supabaseAdmin
      .from('shared_pages')
      .update({ view_count: (sharedPage.view_count || 0) + 1 })
      .eq('id', sharedPage.id)

    // Determine which URL to use
    let coloringPageUrl = image.coloring_page_url
    if (sharedPage.is_variant && sharedPage.variant_url) {
      coloringPageUrl = sharedPage.variant_url
    }

    return NextResponse.json({
      image: {
        id: image.id,
        name: image.name,
        coloringPageUrl,
        createdAt: image.created_at,
      },
      shareCode: sharedPage.share_code,
      expiresAt: sharedPage.expires_at,
      viewCount: sharedPage.view_count + 1,
    })

  } catch (error) {
    console.error('💥 Share View API Error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to load shared page',
        success: false 
      },
      { status: 500 }
    )
  }
}
