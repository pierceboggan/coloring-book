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


export async function PATCH(
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

    const body = (await request.json().catch(() => ({}))) as {
      action?: string
      name?: string
    }
    const action = typeof body.action === 'string' ? body.action : undefined

    if (action === 'archive' || action === 'restore') {
      const archivedAt = action === 'archive' ? new Date().toISOString() : null
      console.log('🗂️ API: Updating archive status', { imageId, action })

      const { data: updatedImage, error: archiveError } = await supabaseAdmin
        .from('images')
        .update({ archived_at: archivedAt })
        .eq('id', imageId)
        .select()
        .single()

      if (archiveError) {
        console.error('❌ Archive operation failed:', archiveError)
        return NextResponse.json(
          { error: `Archive failed: ${archiveError.message}` },
          { status: 500 }
        )
      }

      console.log('✅ Archive status updated successfully:', {
        id: updatedImage.id,
        archived_at: updatedImage.archived_at,
      })

      return NextResponse.json({
        success: true,
        data: updatedImage,
      })
    }

    const newName = typeof body.name === 'string' ? body.name.trim() : ''

    if (!newName) {
      return NextResponse.json(
        { error: 'Image name is required' },
        { status: 400 }
      )
    }

    console.log('✏️ API: Renaming image', { imageId, newName })

    const { data: updatedImage, error: updateError } = await supabaseAdmin
      .from('images')
      .update({ name: newName })
      .eq('id', imageId)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Rename operation failed:', updateError)
      return NextResponse.json(
        { error: `Rename failed: ${updateError.message}` },
        { status: 500 }
      )
    }

    console.log('✅ Image renamed successfully:', { id: updatedImage.id, name: updatedImage.name })

    return NextResponse.json({
      success: true,
      data: updatedImage
    })
  } catch (error) {
    console.error('💥 PATCH API Error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to update image',
        success: false
      },
      { status: 500 }
    )
  }
}
