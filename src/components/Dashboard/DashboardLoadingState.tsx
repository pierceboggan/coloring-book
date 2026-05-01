'use client'

import { Loader2 } from 'lucide-react'
import { FunBackground } from '@/components/FunBackground'

interface DashboardLoadingStateProps {
  authLoading: boolean
  loading: boolean
}

export function DashboardLoadingState({ authLoading, loading }: DashboardLoadingStateProps) {
  return (
    <FunBackground>
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-[2.75rem] border-4 border-[#FFB3BA] bg-white/90 px-12 py-10 text-center shadow-[14px_14px_0_0_#FF8A80]">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-[#FF6F91] text-white shadow-inner">
            <Loader2 className="h-10 w-10 animate-spin" />
          </div>
          <p className="text-lg font-semibold text-[#3A2E39]">Loading your colorful dashboard...</p>
          <p className="mt-2 text-sm font-medium text-[#FF6F91]">
            Auth: {authLoading ? 'loading' : 'ready'} • Data: {loading ? 'loading' : 'ready'}
          </p>
        </div>
      </div>
    </FunBackground>
  )
}
