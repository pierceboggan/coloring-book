import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import path from 'path'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'

function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }
  const token = authHeader.slice('Bearer '.length).trim()
  return token || null
}

export async function POST(request: NextRequest) {
  const accessToken = extractBearerToken(request)

  if (!accessToken) {
    return NextResponse.json(
      { error: 'Missing or invalid authorization header' },
      { status: 401 }
    )
  }

  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(accessToken)

  if (userError || !user) {
    console.error('❌ Mobile upload: failed to verify access token:', userError)
    return NextResponse.json(
      { error: 'Unable to verify user session' },
      { status: 401 }
    )
  }

  const userId = user.id

  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const fileExtension = path.extname(file.name) || '.jpg'
    const storagePath = `uploads/${Date.now()}-${randomUUID()}${fileExtension}`

    const { error: storageError } = await supabaseAdmin.storage
      .from('images')
      .upload(storagePath, buffer, {
        contentType: file.type || 'image/jpeg',
        upsert: false
      })

    if (storageError) {
      throw storageError
    }

    const {
      data: { publicUrl }
    } = supabaseAdmin.storage
      .from('images')
      .getPublicUrl(storagePath)

    const { data: insertedImage, error: insertError } = await supabaseAdmin
      .from('images')
      .insert({
        name: file.name || 'Uploaded Photo',
        original_url: publicUrl,
        user_id: userId,
        status: 'processing'
      })
      .select()
      .single()

    if (insertError) {
      throw insertError
    }

    return NextResponse.json({ data: insertedImage })
  } catch (error) {
    console.error('📱 Mobile upload failed', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Unable to upload image from mobile client'
      },
      { status: 500 }
    )
  }
}
