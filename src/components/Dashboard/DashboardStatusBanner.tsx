'use client'

import { Loader2, Paintbrush, Sparkles, Star } from 'lucide-react'

interface DashboardStatusBannerProps {
  totalImages: number
  completedCount: number
  processingCount: number
  retryingProcessing: boolean
  onRetryStuck: () => void
}

export function DashboardStatusBanner({
  totalImages,
  completedCount,
  processingCount,
  retryingProcessing,
  onRetryStuck,
}: DashboardStatusBannerProps) {
  const isProcessing = processingCount > 0

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-[#A0E7E5] bg-white/90 px-4 py-3 shadow-[6px_6px_0_0_#55C6C0]">
      <div className="pointer-events-none absolute -top-10 right-10 h-24 w-24 rounded-full bg-[#FF8A80]/70" aria-hidden="true" />
      <div className="flex flex-col gap-4">
        <div className="max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full border-2 border-dashed border-[#FFD166] bg-[#FFF3BF] px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-[#E97777]">
            <Sparkles className="h-3.5 w-3.5" />
            Studio status
          </div>
          <h1 className="text-xl font-extrabold text-[#3A2E39] md:text-[1.75rem] md:leading-tight">
            Your Coloring Pages Playground
          </h1>
          <p className="hidden text-xs font-medium text-[#594144] xl:block">
            Keep track of every doodle-ready download, peek at works-in-progress, and build magical books for your crew.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full border-2 border-dashed border-[#FFB3BA] bg-[#FFE6EB] px-3 py-1 text-xs font-semibold text-[#FF6F91] shadow-[3px_3px_0_0_#FF8A80]">
              <Star className="h-3.5 w-3.5" />
              {totalImages} creations
            </div>
            <div className="flex items-center gap-1.5 rounded-full border-2 border-dashed border-[#A0E7E5] bg-[#E0F7FA] px-3 py-1 text-xs font-semibold text-[#1DB9B3] shadow-[3px_3px_0_0_#55C6C0]">
              <Paintbrush className="h-3.5 w-3.5" />
              {completedCount} ready to color
            </div>
            {isProcessing && (
              <div className="flex items-center gap-1.5 rounded-full border-2 border-dashed border-[#FFD166] bg-[#FFF3BF] px-3 py-1 text-xs font-semibold text-[#AA6A00] shadow-[3px_3px_0_0_#FFB84C]">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {processingCount} brewing
              </div>
            )}
            {(isProcessing || retryingProcessing) && (
              <button
                onClick={onRetryStuck}
                disabled={!isProcessing || retryingProcessing}
                className="flex items-center gap-1.5 rounded-full border-2 border-[#FFD166] bg-[#FFF3BF] px-3 py-1 text-xs font-semibold text-[#AA6A00] shadow-[3px_3px_0_0_#FFB84C] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
              >
                <Loader2 className={`h-3.5 w-3.5 ${retryingProcessing ? 'animate-spin' : ''}`} />
                Fix stuck pages
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
