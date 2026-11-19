import { NextRequest, NextResponse } from 'next/server'
import { supabase, type Database } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { logger } from '@/lib/logger'

type FamilyAlbumRow = Database['public']['Tables']['family_albums']['Row']

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

    if (!title || !Array.isArray(imageIds) || imageIds.length === 0 || !userId) {
      return NextResponse.json(
        { error: 'Title, imageIds, and userId are required' },
        { status: 400 }
      )
    }

    if (
      imageIds.some((imageId: unknown) => typeof imageId !== 'string' || imageId.trim() === '') ||
      (coverImageId !== undefined && coverImageId !== null && typeof coverImageId !== 'string')
    ) {
      return NextResponse.json(
        { error: 'Image IDs must be non-empty strings' },
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

    const uniqueImageIds = Array.from(new Set(imageIds as string[]))
    const imageIdsToValidate = coverImageId
      ? Array.from(new Set([...uniqueImageIds, coverImageId]))
      : uniqueImageIds

    const { data: validImages, error: validationError } = await supabaseAdmin
      .from('images')
      .select('id')
      .eq('user_id', userId)
      .in('id', imageIdsToValidate)

    if (validationError) {
      logger.error('Failed to validate album images', validationError)
      throw new Error(`Failed to validate album images: ${validationError.message}`)
    }

    if ((validImages?.length ?? 0) !== imageIdsToValidate.length) {
      return NextResponse.json(
        { error: 'One or more image IDs are invalid' },
        { status: 400 }
      )
    }

    // Generate unique share code
    const shareCode = generateShareCode()

    logger.info('Creating family album in database...')

    const createdAt = new Date().toISOString()

    // Create the family album and image links atomically in the database.
    const { data: createdAlbum, error: albumError } = await supabaseAdmin
      .rpc('create_family_album_with_images', {
        p_title: title,
        p_description: description || '',
        p_user_id: userId,
        p_share_code: shareCode,
        p_created_at: createdAt,
        p_cover_image_id: coverImageId || null,
        p_expires_at: parsedExpiresAt ? parsedExpiresAt.toISOString() : null,
        p_comments_enabled: commentsEnabled ?? true,
        p_downloads_enabled: downloadsEnabled ?? true,
        p_image_ids: uniqueImageIds,
      })
      .single()

    if (albumError) {
      logger.error('Failed to create album', albumError)
      throw new Error(`Failed to create album: ${albumError.message}`)
    }

    const albumData = createdAlbum as FamilyAlbumRow | null

    if (!albumData) {
      throw new Error('Failed to create album')
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