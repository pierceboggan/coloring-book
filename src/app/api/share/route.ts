import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin } from '@/lib/supabase-admin'
import type { Database } from '@/lib/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Generate a random share code
function generateShareCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: () => {},
      },
    })

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { imageId, expiresAt, isVariant, variantUrl } = body

    if (!imageId) {
      return NextResponse.json(
        { error: 'Image ID is required' },
        { status: 400 }
      )
    }

    // Verify the image belongs to the user
    const { data: image, error: imageError } = await supabaseAdmin
      .from('images')
      .select('*')
      .eq('id', imageId)
      .eq('user_id', user.id)
      .single()

    if (imageError || !image) {
      return NextResponse.json(
        { error: 'Image not found or unauthorized' },
        { status: 404 }
      )
    }

    if (image.status !== 'completed') {
      return NextResponse.json(
        { error: 'Image is not ready for sharing' },
        { status: 400 }
      )
    }

    // Check if a share already exists for this image
    const { data: existingShare } = await supabaseAdmin
      .from('shared_pages')
      .select('*')
      .eq('image_id', imageId)
      .eq('user_id', user.id)
      .eq('is_variant', isVariant || false)
      .eq('variant_url', variantUrl || null)
      .single()

    if (existingShare) {
      // Return existing share
      const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/share/${existingShare.share_code}`
      return NextResponse.json({
        shareCode: existingShare.share_code,
        shareUrl,
        id: existingShare.id,
      })
    }

    // Create a new share
    const shareCode = generateShareCode()
    const { data: newShare, error: createError } = await supabaseAdmin
      .from('shared_pages')
      .insert({
        image_id: imageId,
        user_id: user.id,
        share_code: shareCode,
        expires_at: expiresAt || null,
        is_variant: isVariant || false,
        variant_url: variantUrl || null,
      })
      .select()
      .single()

    if (createError || !newShare) {
      console.error('❌ Failed to create share:', createError)
      return NextResponse.json(
        { error: 'Failed to create share' },
        { status: 500 }
      )
    }

    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/share/${shareCode}`

    console.log('✅ Created share:', { shareCode, imageId })

    return NextResponse.json({
      shareCode,
      shareUrl,
      id: newShare.id,
    })

  } catch (error) {
    console.error('💥 Share API Error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to create share',
        success: false 
      },
      { status: 500 }
    )
  }
}
