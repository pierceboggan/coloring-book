import sharp from 'sharp'
import { logger } from './logger'

interface WatermarkOptions {
  text: string
  position: 'bottom-right' | 'bottom-center' | 'bottom-left'
  fontSize: number
  opacity: number
}

export async function addWatermark(
  imageBuffer: Buffer,
  options: WatermarkOptions = {
    text: 'Generated with ColoringBook.ai',
    position: 'bottom-right',
    fontSize: 24,
    opacity: 0.7
  }
): Promise<Buffer> {
  try {
    logger.debug('Adding watermark to image')
    
    // Get image dimensions
    const image = sharp(imageBuffer)
    const { width, height } = await image.metadata()
    
    if (!width || !height) {
      throw new Error('Could not determine image dimensions')
    }
    
    // Create SVG watermark
    // Render the SVG only over the strip the text occupies, not the full image
    const { svg: svgWatermark, left, top } = createSVGWatermark(options.text, width, height, options)
    
    // Composite the watermark onto the image
    const watermarkedImage = await image
      .composite([{
        input: Buffer.from(svgWatermark),
        left,
        top,
      }])
      .png()
      .toBuffer()
    
    logger.debug('Watermark added successfully')
    return watermarkedImage
    
  } catch (error) {
    logger.error('Error adding watermark', { error })
    // Return original image if watermarking fails
    return imageBuffer
  }
}

function createSVGWatermark(text: string, imageWidth: number, imageHeight: number, options: WatermarkOptions): { svg: string; left: number; top: number } {
  const padding = 20
  const fontSize = Math.max(16, Math.min(options.fontSize, imageWidth / 20)) // Responsive font size
  
  // Calculate text width approximation
  const textWidth = text.length * fontSize * 0.6
  
  let x: number
  let y: number
  
  switch (options.position) {
    case 'bottom-left':
      x = padding
      y = imageHeight - padding
      break
    case 'bottom-center':
      x = (imageWidth - textWidth) / 2
      y = imageHeight - padding
      break
    case 'bottom-right':
    default:
      x = imageWidth - textWidth - padding
      y = imageHeight - padding
      break
  }
  
  // Keep the full width so approximate glyph widths cannot clip the watermark.
  const stripHeight = Math.min(imageHeight, Math.ceil(fontSize * 2) + padding * 2)
  const stripWidth = imageWidth
  const left = 0
  const top = imageHeight - stripHeight

  const svg = `
    <svg width="${stripWidth}" height="${stripHeight}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="1" dy="1" stdDeviation="1" flood-color="white" flood-opacity="0.8"/>
        </filter>
      </defs>
      <text 
        x="${x - left}"
        y="${y - top}"
        font-family="Arial, sans-serif" 
        font-size="${fontSize}" 
        fill="rgba(0,0,0,${options.opacity})" 
        filter="url(#shadow)"
        font-weight="500"
      >${text}</text>
    </svg>
  `
  return { svg, left, top }
}
