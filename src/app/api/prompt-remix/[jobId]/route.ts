import { NextRequest, NextResponse } from 'next/server'
import { getPromptRemixJob } from '@/lib/prompt-remix-jobs'

interface PromptRemixJobRouteContext {
  params: {
    jobId: string
  }
}

export async function GET(_request: NextRequest, { params }: PromptRemixJobRouteContext) {
  try {
    const job = await getPromptRemixJob(params.jobId)

    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, job })
  } catch (error) {
    console.error('Failed to fetch prompt remix job', error)
    return NextResponse.json(
      { success: false, error: 'Unable to fetch prompt remix job' },
      { status: 500 }
    )
  }
}
