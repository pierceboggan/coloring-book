import { NextRequest, NextResponse } from 'next/server'
import { processPromptRemixJob } from '@/lib/prompt-remix-jobs'

interface PromptRemixResumeContext {
  params: {
    jobId: string
  }
}

export async function POST(_request: NextRequest, { params }: PromptRemixResumeContext) {
  try {
    const job = await processPromptRemixJob(params.jobId)

    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, job })
  } catch (error) {
    console.error('Failed to resume prompt remix job', error)
    return NextResponse.json(
      { success: false, error: 'Unable to resume prompt remix job' },
      { status: 500 }
    )
  }
}
