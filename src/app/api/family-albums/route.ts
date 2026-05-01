import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  logger.info('API route /api/family-albums called')
  
  try {
    const body = await request.json()
    logger.info('Request body parsed', body)
    
    const {
      title,
      description,
      imageIds,
      userId,
      coverImageId,
      expiresAt,
      commentsEnabled,
      downloadsEnabled,
    } = body

    if (!title || !imageIds || !userId) {
      return NextResponse.json(
        { error: 'Title, imageIds, and userId are required' },
        { status: 400 }
      )
    }

    const parsedExpiresAt = expiresAt ? new Date(expiresAt) : null

    if (parsedExpiresAt && Number.isNaN(parsedExpiresAt.getTime())) {
      return NextResponse.json(
        { error: 'Invalid expiration date' },
        { status: 400 }
      )
    }

    // Generate unique share code
    const shareCode = generateShareCode()

    logger.info('Creating family album in database...')

    // Create the family album
    const { data: albumData, error: albumError } = await supabase
      .from('family_albums')
      .insert({
        title,
        description: description || '',
        user_id: userId,
        share_code: shareCode,
        created_at: new Date().toISOString(),
        cover_image_id: coverImageId || null,
        expires_at: parsedExpiresAt ? parsedExpiresAt.toISOString() : null,
        comments_enabled: commentsEnabled ?? true,
        downloads_enabled: downloadsEnabled ?? true,
      })
      .select()
      .single()

    if (albumError) {
      logger.error('Failed to create album', albumError)
      throw new Error(`Failed to create album: ${albumError.message}`)
    }

    logger.info('Adding images to album...')
    
    // Add images to the album
    const albumImageInserts = imageIds.map((imageId: string) => ({
      album_id: albumData.id,
      image_id: imageId,
      created_at: new Date().toISOString()
    }))

    const { error: imageError } = await supabase
      .from('album_images')
      .insert(albumImageInserts)

    if (imageError) {
      logger.error('Failed to add images to album', imageError)
      throw new Error(`Failed to add images to album: ${imageError.message}`)
    }

    logger.info('Family album created successfully')

    return NextResponse.json({
      success: true,
      album: {
        id: albumData.id,
        title: albumData.title,
        description: albumData.description,
        shareCode: albumData.share_code,
        shareUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/album/${albumData.share_code}`,
        coverImageId: albumData.cover_image_id,
        expiresAt: albumData.expires_at,
        commentsEnabled: albumData.comments_enabled,
        downloadsEnabled: albumData.downloads_enabled,
      }
    })

  } catch (error) {
    logger.error('Error creating family album', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to create family album',
        success: false 
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json(
      { error: 'userId is required' },
      { status: 400 }
    )
  }

  try {
    logger.info('Fetching family albums for user', userId)
    
    const { data: albums, error } = await supabase
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
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Failed to fetch albums', error)
      throw new Error(`Failed to fetch albums: ${error.message}`)
    }

    logger.info('Fetched albums', albums?.length || 0)

    return NextResponse.json({
      success: true,
      albums: albums || []
    })

  } catch (error) {
    logger.error('Error fetching family albums', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch family albums',
        success: false 
      },
      { status: 500 }
    )
  }
}

function generateShareCode(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15)
}