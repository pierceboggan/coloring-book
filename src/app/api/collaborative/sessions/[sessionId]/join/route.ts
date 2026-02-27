import { NextRequest, NextResponse } from 'next/server'
import { 
  generateUserColor,
  COLLABORATIVE_SESSIONS_TABLE,
  COLLABORATIVE_PARTICIPANTS_TABLE 
} from '@/lib/collaborative'
import { supabaseAdmin } from '@/lib/supabase-admin'

// POST /api/collaborative/sessions/[sessionId]/join - Join a collaborative session
export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { userId, userName } = await request.json()
    const { sessionId } = params

    if (!userId || !userName) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, userName' },
        { status: 400 }
      )
    }

    // Check if session exists and is active
    const { data: session, error: sessionError } = await supabaseAdmin
      .from(COLLABORATIVE_SESSIONS_TABLE)
      .select('id, name, is_active')
      .eq('id', sessionId)
      .eq('is_active', true)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found or inactive' },
        { status: 404 }
      )
    }

    // Check if user is already a participant
    const { data: existingParticipant } = await supabaseAdmin
      .from(COLLABORATIVE_PARTICIPANTS_TABLE)
      .select('*')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .single()

    let participant

    if (existingParticipant) {
      // Update existing participant status
      const { data: updatedParticipant, error: updateError } = await supabaseAdmin
        .from(COLLABORATIVE_PARTICIPANTS_TABLE)
        .update({
          is_online: true,
          last_seen: new Date().toISOString(),
          user_name: userName
        })
        .eq('id', existingParticipant.id)
        .select()
        .single()

      if (updateError) {
        console.error('❌ Error updating participant:', updateError)
        return NextResponse.json(
          { error: 'Failed to update participant status' },
          { status: 500 }
        )
      }

      participant = updatedParticipant
    } else {
      // Add new participant
      const userColor = generateUserColor()
      const { data: newParticipant, error: insertError } = await supabaseAdmin
        .from(COLLABORATIVE_PARTICIPANTS_TABLE)
        .insert({
          session_id: sessionId,
          user_id: userId,
          user_name: userName,
          user_color: userColor,
          is_online: true,
          last_seen: new Date().toISOString()
        })
        .select()
        .single()

      if (insertError) {
        console.error('❌ Error adding participant:', insertError)
        return NextResponse.json(
          { error: 'Failed to join session' },
          { status: 500 }
        )
      }

      participant = newParticipant
    }

    // Get all current participants
    const { data: allParticipants, error: participantsError } = await supabaseAdmin
      .from(COLLABORATIVE_PARTICIPANTS_TABLE)
      .select('*')
      .eq('session_id', sessionId)
      .eq('is_online', true)

    if (participantsError) {
      console.error('❌ Error fetching participants:', participantsError)
    }

    console.log('✅ User joined session:', { sessionId, userId, userName })

    return NextResponse.json({
      session,
      participant,
      participants: allParticipants || [],
      isRejoining: !!existingParticipant
    })

  } catch (error) {
    console.error('💥 Error in POST /api/collaborative/sessions/[sessionId]/join:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/collaborative/sessions/[sessionId]/join - Leave a collaborative session
export async function DELETE(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { userId } = await request.json()
    const { sessionId } = params

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      )
    }

    // Update participant status to offline
    const { error: updateError } = await supabaseAdmin
      .from(COLLABORATIVE_PARTICIPANTS_TABLE)
      .update({
        is_online: false,
        last_seen: new Date().toISOString()
      })
      .eq('session_id', sessionId)
      .eq('user_id', userId)

    if (updateError) {
      console.error('❌ Error updating participant status:', updateError)
      return NextResponse.json(
        { error: 'Failed to leave session' },
        { status: 500 }
      )
    }

    console.log('✅ User left session:', { sessionId, userId })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('💥 Error in DELETE /api/collaborative/sessions/[sessionId]/join:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
