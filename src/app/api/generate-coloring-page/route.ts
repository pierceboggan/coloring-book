import { NextRequest, NextResponse } from 'next/server'
import { generateColoringPage, ImageGenerationProvider, isImageGenerationProvider } from '@/lib/openai'
import { supabaseAdmin } from '@/lib/supabase-admin'
import * as Sentry from '@sentry/nextjs'

function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.slice('Bearer '.length).trim()
  return token || null
}

export async function POST(request: NextRequest) {
  return Sentry.startSpan(
    {
      op: 'http.server',
      name: 'POST /api/generate-coloring-page',
    },
    async (span) => {
      console.log('🚀 API route /api/generate-coloring-page called')

      let body: {
        imageId?: string
        imageUrl?: string
        age?: number
        provider?: ImageGenerationProvider | string
      } | null = null

      let authenticatedUserId: string | null = null

      try {
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
          console.error('❌ Failed to verify access token:', userError)
          return NextResponse.json(
            { error: 'Unable to verify user session' },
            { status: 401 }
          )
        }

        authenticatedUserId = user.id

        console.log('📥 Parsing request body...')
        body = await request.json()
        console.log('✅ Request body parsed successfully:', body)

        const imageId = body?.imageId
        const imageUrl = body?.imageUrl
        const requestedAge = typeof body?.age === 'number' && Number.isFinite(body.age)
          ? Math.round(body.age)
          : undefined

        const provider = isImageGenerationProvider(body?.provider)
          ? body?.provider
          : undefined

        const clampedAge = requestedAge
          ? Math.min(12, Math.max(2, requestedAge))
          : undefined

        span.setAttribute('imageId', imageId)
        span.setAttribute('userId', authenticatedUserId)
        span.setAttribute('hasImageUrl', !!imageUrl)
        span.setAttribute('agePreference', clampedAge ?? 'unspecified')
        span.setAttribute('imageProvider', provider ?? 'default')

        if (!imageId) {
          console.error('❌ Missing required field: imageId')
          return NextResponse.json(
            { error: 'Missing imageId' },
            { status: 400 }
          )
        }

        const { data: existingRecord, error: fetchError } = await supabaseAdmin
          .from('images')
          .select('id, user_id, original_url, status, coloring_page_url')
          .eq('id', imageId)
          .single()

        if (fetchError || !existingRecord) {
          console.error('❌ Failed to fetch existing record:', fetchError)
          return NextResponse.json(
            { error: 'Image record not found' },
            { status: 404 }
          )
        }

        if (existingRecord.user_id !== authenticatedUserId) {
          console.error('❌ User attempted to process image they do not own', {
            imageId,
            requestUserId: authenticatedUserId,
            ownerUserId: existingRecord.user_id,
          })

          return NextResponse.json(
            { error: 'Forbidden' },
            { status: 403 }
          )
        }

        const effectiveImageUrl = existingRecord.original_url || imageUrl

        if (!effectiveImageUrl) {
          return NextResponse.json(
            { error: 'Image URL is missing on this record' },
            { status: 400 }
          )
        }

        console.log('🎨 About to call generateColoringPage with URL:', effectiveImageUrl, 'age:', clampedAge)
        const coloringPageUrl = await generateColoringPage(effectiveImageUrl, { age: clampedAge, provider })
        console.log('✅ generateColoringPage completed, result:', coloringPageUrl.substring(0, 50) + '...')

        if (!coloringPageUrl) {
          console.error('❌ generateColoringPage returned null/undefined')
          throw new Error('Failed to generate coloring page: No URL returned')
        }

        console.log('💾 Updating database with result...')

        const updatePayload = {
          coloring_page_url: coloringPageUrl,
          status: 'completed' as const,
          updated_at: new Date().toISOString(),
        }

        const { data: updateData, error: updateError } = await supabaseAdmin
          .from('images')
          .update(updatePayload)
          .eq('id', imageId)
          .eq('user_id', authenticatedUserId)
          .select()

        if (updateError) {
          console.error('❌ Database update failed:', updateError)
          throw new Error(`Database update failed: ${updateError.message}`)
        }

        console.log('✅ Database updated successfully')
        console.log('📊 Updated record:', updateData)

        return NextResponse.json({
          success: true,
          coloringPageUrl,
        })
      } catch (error) {
        console.error('💥 API Error caught:', error)
        Sentry.captureException(error)

        const imageId = body?.imageId

        if (imageId && authenticatedUserId) {
          try {
            await supabaseAdmin
              .from('images')
              .update({
                status: 'error',
                updated_at: new Date().toISOString(),
              })
              .eq('id', imageId)
              .eq('user_id', authenticatedUserId)
          } catch (dbError) {
            console.error('Database error:', dbError)
          }
        }

        return NextResponse.json(
          {
            error: error instanceof Error ? error.message : 'Failed to generate coloring page',
            success: false,
          },
          { status: 500 }
        )
      }
    }
  )
}
