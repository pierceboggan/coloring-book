import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }
  const token = authHeader.slice('Bearer '.length).trim()
  return token || null
}

export async function GET(request: NextRequest) {
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
    console.error('❌ Mobile images: failed to verify access token:', userError)
    return NextResponse.json(
      { error: 'Unable to verify user session' },
      { status: 401 }
    )
  }

  const userId = user.id

  try {
    const { data, error } = await supabaseAdmin
      .from('images')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('📱 Mobile images fetch failed', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Unable to fetch images for mobile client'
      },
      { status: 500 }
    )
  }
}
