import { NextRequest, NextResponse } from 'next/server'
import { 
  generateShareCode, 
  generateUserColor,
  COLLABORATIVE_SESSIONS_TABLE,
  COLLABORATIVE_PARTICIPANTS_TABLE 
} from '@/lib/collaborative'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const { name, imageId, userId, userName } = await request.json()

    if (!name || !imageId || !userId || !userName) {
      return NextResponse.json(
        { error: 'Missing required fields: name, imageId, userId, userName' },
        { status: 400 }
      )
    }

    // Generate unique share code
    let shareCode = generateShareCode()
    let attempts = 0
    const maxAttempts = 10

    // Ensure share code is unique
    while (attempts < maxAttempts) {
      const { data: existing } = await supabaseAdmin
        .from(COLLABORATIVE_SESSIONS_TABLE)
        .select('id')
        .eq('share_code', shareCode)
        .single()

      if (!existing) break
      shareCode = generateShareCode()
      attempts++
    }

    if (attempts >= maxAttempts) {
      return NextResponse.json(
        { error: 'Unable to generate unique share code' },
        { status: 500 }
      )
    }

    // Create collaborative session
    const { data: session, error: sessionError } = await supabaseAdmin
      .from(COLLABORATIVE_SESSIONS_TABLE)
      .insert({
        name,
        image_id: imageId,
        created_by: userId,
        share_code: shareCode,
        is_active: true
      })
      .select()
      .single()

    if (sessionError) {
      console.error('❌ Error creating session:', sessionError)
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      )
    }

    // Add creator as first participant
    const userColor = generateUserColor()
    const { error: participantError } = await supabaseAdmin
      .from(COLLABORATIVE_PARTICIPANTS_TABLE)
      .insert({
        session_id: session.id,
        user_id: userId,
        user_name: userName,
        user_color: userColor,
        is_online: true,
        last_seen: new Date().toISOString()
      })

    if (participantError) {
      console.error('❌ Error adding participant:', participantError)
      // Rollback session creation
      await supabaseAdmin
        .from(COLLABORATIVE_SESSIONS_TABLE)
        .delete()
        .eq('id', session.id)
      
      return NextResponse.json(
        { error: 'Failed to add participant' },
        { status: 500 }
      )
    }

    // Get the complete session with participants
    const { data: fullSession, error: fetchError } = await supabaseAdmin
      .from(COLLABORATIVE_SESSIONS_TABLE)
      .select(`
        *,
        participants:collaborative_participants(
          id,
          user_id,
          user_name,
          user_color,
          is_online,
          last_seen,
          joined_at
        )
      `)
      .eq('id', session.id)
      .single()

    if (fetchError) {
      console.error('❌ Error fetching full session:', fetchError)
    }

    console.log('✅ Created collaborative session:', { sessionId: session.id, shareCode })
    
    return NextResponse.json({
      session: fullSession || session,
      shareCode,
      joinUrl: `${process.env.NEXT_PUBLIC_APP_URL}/collaborative/${shareCode}`
    })

  } catch (error) {
    console.error('💥 Error in POST /api/collaborative/sessions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const shareCode = searchParams.get('shareCode')

    if (shareCode) {
      // Get session by share code
      const { data: session, error } = await supabaseAdmin
        .from(COLLABORATIVE_SESSIONS_TABLE)
        .select(`
          *,
          participants:collaborative_participants(
            id,
            user_id,
            user_name,
            user_color,
            is_online,
            last_seen,
            joined_at
          )
        `)
        .eq('share_code', shareCode)
        .eq('is_active', true)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return NextResponse.json(
            { error: 'Session not found' },
            { status: 404 }
          )
        }
        console.error('❌ Error fetching session by share code:', error)
        return NextResponse.json(
          { error: 'Failed to fetch session' },
          { status: 500 }
        )
      }

      return NextResponse.json({ session })
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId or shareCode parameter' },
        { status: 400 }
      )
    }

    // Get user's sessions (created or participated)
    const { data: sessions, error } = await supabaseAdmin
      .from(COLLABORATIVE_SESSIONS_TABLE)
      .select(`
        *,
        participants:collaborative_participants(
          id,
          user_id,
          user_name,
          user_color,
          is_online,
          last_seen,
          joined_at
        )
      `)
      .or(`created_by.eq.${userId},participants.user_id.eq.${userId}`)
      .eq('is_active', true)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching user sessions:', error)
      return NextResponse.json(
        { error: 'Failed to fetch sessions' },
        { status: 500 }
      )
    }

    return NextResponse.json({ sessions })

  } catch (error) {
    console.error('💥 Error in GET /api/collaborative/sessions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
