import { NextRequest, NextResponse } from 'next/server'
import { processPromptRemixJob } from '@/lib/prompt-remix-jobs'
import * as Sentry from '@sentry/nextjs'

interface PromptRemixResumeContext {
  params: {
    jobId: string
  }
}

export async function POST(_request: NextRequest, { params }: PromptRemixResumeContext) {
  return Sentry.startSpan(
    {
      op: 'http.server',
      name: 'POST /api/prompt-remix/[jobId]/resume',
    },
    async (span) => {
      try {
        span.setAttribute('jobId', params.jobId)

        const job = await processPromptRemixJob(params.jobId)

        if (!job) {
          return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 })
        }

        return NextResponse.json({ success: true, job })
      } catch (error) {
        console.error('Failed to resume prompt remix job', error)
        Sentry.captureException(error)
        return NextResponse.json(
          { success: false, error: 'Unable to resume prompt remix job' },
          { status: 500 }
        )
      }
    }
  )
}
