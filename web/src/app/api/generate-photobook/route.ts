import { NextRequest, NextResponse } from 'next/server'
import { jsPDF } from 'jspdf'
import { supabase } from '@/lib/supabase'

interface PhotobookImage {
  id: string
  name: string
  coloring_page_url: string
}

interface PhotobookRequest {
  images: PhotobookImage[]
  title: string
  userId: string
}

export async function POST(request: NextRequest) {
  console.log('📖 API route /api/generate-photobook called')
  
  try {
    const body: PhotobookRequest = await request.json()
    console.log('📥 Request body parsed:', { 
      imageCount: body.images.length, 
      title: body.title,
      userId: body.userId 
    })
    
    const { images, title, userId } = body

    if (!images || images.length === 0) {
      return NextResponse.json(
        { error: 'No images provided' },
        { status: 400 }
      )
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      )
    }

    console.log('📄 Creating PDF with jsPDF...')
    
    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    // PDF dimensions (A4: 210mm x 297mm)
    const pageWidth = 210
    const pageHeight = 297
    const margin = 20
    const imageWidth = pageWidth - (margin * 2)
    const imageHeight = imageWidth // Square aspect ratio
    
    // Add title page
    pdf.setFontSize(24)
    pdf.text(title, pageWidth / 2, 50, { align: 'center' })
    
    pdf.setFontSize(12)
    pdf.text('Generated with ColoringBook.ai', pageWidth / 2, 70, { align: 'center' })
    
    pdf.setFontSize(10)
    pdf.text(new Date().toLocaleDateString(), pageWidth / 2, 80, { align: 'center' })

    // Process each image
    for (let i = 0; i < images.length; i++) {
      const image = images[i]
      console.log(`🖼️ Processing image ${i + 1}/${images.length}: ${image.name}`)
      
      try {
        // Add new page for each image
        pdf.addPage()
        
        // Fetch image data
        const imageResponse = await fetch(image.coloring_page_url)
        if (!imageResponse.ok) {
          console.error(`❌ Failed to fetch image: ${image.coloring_page_url}`)
          continue
        }
        
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
        
        console.log(`✅ Added image ${i + 1} to PDF`)
        
      } catch (imageError) {
        console.error(`❌ Error processing image ${image.name}:`, imageError)
        // Continue with other images
      }
    }

    console.log('💾 Generating PDF buffer...')
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'))
    
    console.log('📤 Uploading PDF to Supabase storage...')
    const fileName = `photobook-${userId}-${Date.now()}.pdf`
    const filePath = `photobooks/${fileName}`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, pdfBuffer, {
        contentType: 'application/pdf'
      })

    if (uploadError) {
      console.error('❌ Failed to upload PDF:', uploadError)
      throw new Error(`Storage upload failed: ${uploadError.message}`)
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(filePath)

    console.log('✅ Photobook generated and uploaded successfully:', publicUrl)

    // Store photobook record in database
    const { error: dbError } = await supabase
      .from('photobooks')
      .insert({
        user_id: userId,
        title: title,
        pdf_url: publicUrl,
        image_count: images.length,
        created_at: new Date().toISOString()
      })

    if (dbError) {
      console.error('❌ Failed to save photobook record:', dbError)
      // Continue anyway, user still gets the PDF
    }

    return NextResponse.json({
      success: true,
      downloadUrl: publicUrl,
      title: title,
      pageCount: images.length + 1 // +1 for title page
    })

  } catch (error) {
    console.error('💥 Error generating photobook:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to generate photobook',
        success: false 
      },
      { status: 500 }
    )
  }
}