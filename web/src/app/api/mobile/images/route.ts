import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json(
      { error: 'Missing userId query parameter' },
      { status: 400 }
    )
  }

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
