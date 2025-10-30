import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import * as Sentry from '@sentry/nextjs'
import { supabaseAdmin } from '@/lib/supabase-admin'
import type { Database } from '@/lib/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

async function getAuthenticatedUserId(request: NextRequest) {
  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll().map(({ name, value }) => ({ name, value }))
      },
    },
  })

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    console.error('❌ Failed to verify Supabase session:', error)
    return null
  }

  return user?.id ?? null
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return Sentry.startSpan(
    {
      op: 'photobook.job_status',
      name: 'GET /api/photobook-jobs/[id]',
    },
    async (span) => {
      try {
        const jobId = params.id

        if (!jobId) {
          span.setStatus('invalid_argument')
          return NextResponse.json({ error: 'Job ID required' }, { status: 400 })
        }

        const userId = await getAuthenticatedUserId(request)
        if (!userId) {
          span.setStatus('unauthenticated')
          return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
        }

        span.setAttribute('photobook.jobId', jobId)
        span.setAttribute('photobook.userId', userId)

        const { data: job, error } = await supabaseAdmin
          .from('photobook_jobs')
          .select('*')
          .eq('id', jobId)
          .eq('user_id', userId)
          .maybeSingle()

        if (error) {
          span.setStatus('internal_error')
          console.error('❌ Failed to fetch photobook job:', error)
          throw error
        }

        if (!job) {
          span.setStatus('not_found')
          return NextResponse.json({ error: 'Photobook job not found' }, { status: 404 })
        }

        return NextResponse.json({
          id: job.id,
          status: job.status,
          title: job.title,
          processedCount: job.processed_count ?? 0,
          totalCount: job.total_count ?? 0,
          downloadUrl: job.pdf_url,
          error: job.error_message,
          createdAt: job.created_at,
          startedAt: job.started_at,
          completedAt: job.completed_at,
        })
      } catch (error) {
        span.setStatus('internal_error')
        console.error('💥 Error fetching photobook job status:', error)
        Sentry.captureException(error)
        return NextResponse.json(
          {
            error: error instanceof Error ? error.message : 'Failed to fetch photobook job status',
          },
          { status: 500 }
        )
      }
    }
  )
}
