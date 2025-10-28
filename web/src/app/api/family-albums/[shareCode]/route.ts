import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { jsPDF } from 'jspdf'

interface RouteParams {
  params: {
    shareCode: string
  }
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
            status
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

    // Filter only completed images with coloring pages
    const completedImages = album.album_images
      .map((ai: any) => ai.images)
      .filter((img: any) => img.status === 'completed' && img.coloring_page_url)

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
          imageCount: completedImages.length
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