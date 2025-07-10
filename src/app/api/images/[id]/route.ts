import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function DELETE(
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

    console.log('🗑️ API: Deleting image:', imageId)

    // First, get the image to verify it exists
    const { data: existingImage, error: fetchError } = await supabaseAdmin
      .from('images')
      .select('*')
      .eq('id', imageId)
      .single()

    if (fetchError) {
      console.error('❌ Image not found:', fetchError)
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      )
    }

    console.log('📋 Found image to delete:', {
      id: existingImage.id,
      user_id: existingImage.user_id,
      name: existingImage.name
    })

    // Delete the image record
    const { data: deleteData, error: deleteError } = await supabaseAdmin
      .from('images')
      .delete()
      .eq('id', imageId)
      .select()

    if (deleteError) {
      console.error('❌ Delete operation failed:', deleteError)
      return NextResponse.json(
        { error: `Delete failed: ${deleteError.message}` },
        { status: 500 }
      )
    }

    console.log('✅ Image deleted successfully:', deleteData)

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully'
    })

  } catch (error) {
    console.error('💥 Delete API Error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to delete image',
        success: false 
      },
      { status: 500 }
    )
  }
}