import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type ImageRow = Database['public']['Tables']['images']['Row']
type AlbumImageRow = { images: ImageRow }
import { jsPDF } from 'jspdf'

interface RouteParams {
  params: {
    shareCode: string
  }
}

function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false
  const expiresDate = new Date(expiresAt)
  if (Number.isNaN(expiresDate.getTime())) return false
  return expiresDate.getTime() < Date.now()
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { shareCode } = params
  const { searchParams } = new URL(request.url)
  const downloadPdf = searchParams.get('download') === 'true'

  console.log('🔗 Fetching shared album:', shareCode, downloadPdf ? '(PDF download)' : '')

  try {
    // Fetch album with images
    const { data: album, error } = await supabase
      .from('family_albums')
      .select(`
        *,
        album_images (
          images (
            id,
            name,
            original_url,
            coloring_page_url,
            status,
            archived_at
          )
        )
      `)
      .eq('share_code', shareCode)
      .single()

    if (error || !album) {
      console.error('❌ Album not found:', error)
      return NextResponse.json(
        { error: 'Album not found' },
        { status: 404 }
      )
    }

    if (isExpired(album.expires_at)) {
      console.warn('⏰ Album link expired:', shareCode)
      return NextResponse.json(
        { error: 'Album link has expired' },
        { status: 410 }
      )
    }

    if (downloadPdf && album.downloads_enabled === false) {
      console.warn('⛔ PDF download blocked for album:', shareCode)
      return NextResponse.json(
        { error: 'Downloads are disabled for this album' },
        { status: 403 }
      )
    }

    // Filter only completed images with coloring pages
    const albumImages = (album.album_images ?? []) as AlbumImageRow[]
    const completedImages = albumImages
      .map(ai => ai.images)
      .filter(img => img.status === 'completed' && img.coloring_page_url && !img.archived_at)

    const coverImage = completedImages.find(image => image.id === album.cover_image_id) || null

    if (downloadPdf) {
      // Generate and return PDF
      console.log('📄 Generating PDF for shared album...')
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      // PDF dimensions
      const pageWidth = 210
      const pageHeight = 297
      const margin = 20
      const imageWidth = pageWidth - (margin * 2)
      const imageHeight = imageWidth

      // Add title page
      pdf.setFontSize(24)
      pdf.text(album.title, pageWidth / 2, 50, { align: 'center' })
      
      if (album.description) {
        pdf.setFontSize(14)
        pdf.text(album.description, pageWidth / 2, 70, { align: 'center' })
      }
      
      pdf.setFontSize(12)
      pdf.text('Family Coloring Album', pageWidth / 2, 90, { align: 'center' })
      pdf.text('Generated with ColoringBook.ai', pageWidth / 2, 100, { align: 'center' })
      pdf.text(new Date().toLocaleDateString(), pageWidth / 2, 110, { align: 'center' })

      // Add each coloring page
      for (let i = 0; i < completedImages.length; i++) {
        const image = completedImages[i]
        console.log(`🖼️ Adding image ${i + 1}/${completedImages.length}: ${image.name}`)
        
        try {
          pdf.addPage()
          
          // Fetch image data
          const imageResponse = await fetch(image.coloring_page_url)
          if (!imageResponse.ok) continue
          
          const imageBuffer = await imageResponse.arrayBuffer()
          const base64Image = Buffer.from(imageBuffer).toString('base64')
          
          // Add image to PDF
          const yPosition = (pageHeight - imageHeight) / 2
          pdf.addImage(
            `data:image/png;base64,${base64Image}`,
            'PNG',
            margin,
            yPosition,
            imageWidth,
            imageHeight,
            undefined,
            'FAST'
          )
          
          // Add image name at bottom
          pdf.setFontSize(10)
          pdf.text(image.name, pageWidth / 2, pageHeight - 15, { align: 'center' })

        } catch (imageError) {
          console.error(`❌ Error processing image ${image.name}:`, imageError)
        }
      }

      const pdfBuffer = Buffer.from(pdf.output('arraybuffer'))
      
      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${album.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_coloring_book.pdf"`
        }
      })

    } else {
      // Return album data for viewing
      return NextResponse.json({
        success: true,
        album: {
          id: album.id,
          title: album.title,
          description: album.description,
          createdAt: album.created_at,
          images: completedImages,
          imageCount: completedImages.length,
          coverImage,
          expiresAt: album.expires_at,
          commentsEnabled: album.comments_enabled,
          downloadsEnabled: album.downloads_enabled
        }
      })
    }

  } catch (error) {
    console.error('💥 Error fetching shared album:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch album',
        success: false 
      },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { shareCode } = params

  try {
    const body = await request.json()
    const {
      userId,
      downloadsEnabled,
      expiresAt,
      commentsEnabled,
      coverImageId,
    } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    const { data: album, error } = await supabase
      .from('family_albums')
      .select('*')
      .eq('share_code', shareCode)
      .single()

    if (error || !album) {
      console.error('❌ Album not found during update:', error)
      return NextResponse.json(
        { error: 'Album not found' },
        { status: 404 }
      )
    }

    if (album.user_id !== userId) {
      return NextResponse.json(
        { error: 'You do not have permission to update this album' },
        { status: 403 }
      )
    }

    const updates: Partial<Database['public']['Tables']['family_albums']['Update']> = {}

    if (typeof downloadsEnabled === 'boolean') {
      updates.downloads_enabled = downloadsEnabled
    }

    if (typeof commentsEnabled === 'boolean') {
      updates.comments_enabled = commentsEnabled
    }

    if (typeof coverImageId === 'string' || coverImageId === null) {
      updates.cover_image_id = coverImageId ?? null
    }

    if (typeof expiresAt === 'string') {
      const parsedExpiresAt = new Date(expiresAt)
      if (Number.isNaN(parsedExpiresAt.getTime())) {
        return NextResponse.json(
          { error: 'Invalid expiration date' },
          { status: 400 }
        )
      }
      updates.expires_at = parsedExpiresAt.toISOString()
    } else if (expiresAt === null) {
      updates.expires_at = null
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({
        success: true,
        album: {
          downloadsEnabled: album.downloads_enabled,
          commentsEnabled: album.comments_enabled,
          coverImageId: album.cover_image_id,
          expiresAt: album.expires_at,
        }
      })
    }

    const { data: updatedAlbum, error: updateError } = await supabase
      .from('family_albums')
      .update(updates)
      .eq('id', album.id)
      .select()
      .single()

    if (updateError || !updatedAlbum) {
      console.error('❌ Failed to update album options:', updateError)
      return NextResponse.json(
        { error: 'Failed to update album settings' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      album: {
        downloadsEnabled: updatedAlbum.downloads_enabled,
        commentsEnabled: updatedAlbum.comments_enabled,
        coverImageId: updatedAlbum.cover_image_id,
        expiresAt: updatedAlbum.expires_at,
      }
    })
  } catch (error) {
    console.error('💥 Error updating shared album settings:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to update album settings',
        success: false
      },
      { status: 500 }
    )
  }
}