import { NextRequest, NextResponse } from 'next/server'
import { getPromptRemixJob } from '@/lib/prompt-remix-jobs'
import * as Sentry from '@sentry/nextjs'

interface PromptRemixJobRouteContext {
  params: {
    jobId: string
  }
}

export async function GET(_request: NextRequest, { params }: PromptRemixJobRouteContext) {
  return Sentry.startSpan(
    {
      op: 'http.server',
      name: 'GET /api/prompt-remix/[jobId]',
    },
    async (span) => {
      try {
        span.setAttribute('jobId', params.jobId)

        const job = await getPromptRemixJob(params.jobId)

        if (!job) {
          return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 })
        }

        return NextResponse.json({ success: true, job })
      } catch (error) {
        console.error('Failed to fetch prompt remix job', error)
        Sentry.captureException(error)
        return NextResponse.json(
          { success: false, error: 'Unable to fetch prompt remix job' },
          { status: 500 }
        )
      }
    }
  )
}
