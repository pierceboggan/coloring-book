export type PromptRemixJobStatus = 'queued' | 'processing' | 'completed' | 'failed'

export type PromptRemixJobResultStatus = 'queued' | 'processing' | 'succeeded' | 'failed'

export interface PromptRemixJobResult {
  prompt: string
  status: PromptRemixJobResultStatus
  url?: string | null
  error?: string | null
  started_at?: string | null
  completed_at?: string | null
}

export interface PromptRemixJob {
  id: string
  status: PromptRemixJobStatus
  image_id?: string | null
  image_url: string
  prompts: string[]
  results: PromptRemixJobResult[]
  provider?: string | null
  created_at?: string
  updated_at?: string
  started_at?: string | null
  completed_at?: string | null
  error_message?: string | null
}
