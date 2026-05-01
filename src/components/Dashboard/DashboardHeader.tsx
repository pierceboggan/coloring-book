'use client'

import { ArrowLeft, Book, Palette, Plus, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface DashboardHeaderProps {
  userEmail?: string | null
  hasCompletedImages: boolean
  onShowFamilyAlbumCreator: () => void
  onShowPhotobookCreator: () => void
  onShowUploader: () => void
}

export function DashboardHeader({
  userEmail,
  hasCompletedImages,
  onShowFamilyAlbumCreator,
  onShowPhotobookCreator,
  onShowUploader,
}: DashboardHeaderProps) {
  const router = useRouter()

  return (
    <nav className="container mx-auto px-4 pt-1.5">
      <div className="relative overflow-hidden rounded-2xl border-2 border-[#FFB3BA] bg-white/90 px-3.5 py-2.5 shadow-[6px_6px_0_0_#FF8A80]">
        <div className="pointer-events-none absolute -top-16 left-6 h-28 w-28 rounded-full bg-[#FFD6E0]/70 blur-sm" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-10 right-8 h-24 w-24 rounded-full bg-[#B4F8C8]/80 blur-[2px]" aria-hidden="true" />
        <div className="relative flex flex-col gap-1.5 md:flex-row md:items-center md:justify-between md:gap-2">
          <div className="flex items-center justify-center gap-2 text-center md:justify-start md:text-left">
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#FF8BA7] bg-white/80 px-3 py-1.5 text-xs font-semibold text-[#FF6F91] shadow-[0_6px_0_0_rgba(255,143,188,0.5)] transition-transform hover:-translate-y-0.5 hover:shadow-[0_8px_0_0_rgba(255,143,188,0.55)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF8BA7]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to playground
            </button>
            <div className="flex items-center justify-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#C3B5FF] to-[#FF8BA7] text-white shadow-[0_4px_0_0_rgba(255,139,167,0.35)]">
                <Palette className="h-4.5 w-4.5" />
              </span>
              <div className="text-gray-800">
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#FF8BA7]">Studio HQ</p>
                <span className="text-lg font-extrabold text-[#3A2E39]">Dashboard</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-1.5 md:justify-end">
            {userEmail && (
              <span className="inline-flex items-center gap-2 rounded-full border-2 border-[#A0E7E5] bg-[#E0FBFC] px-3 py-1 text-xs font-medium text-[#3A2E39] shadow-[0_4px_0_0_rgba(160,231,229,0.6)]">
                <span className="h-2.5 w-2.5 rounded-full bg-[#55C6C0]" />
                {userEmail}
              </span>
            )}

            <button
              onClick={onShowFamilyAlbumCreator}
              disabled={!hasCompletedImages}
              className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#B4F8C8] bg-[#E9FFE5] px-3 py-1 text-xs font-semibold text-[#2F9D66] shadow-[0_6px_0_0_rgba(180,248,200,0.5)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_0_0_rgba(180,248,200,0.55)] disabled:translate-y-0 disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:shadow-none"
            >
              <Users className="h-4 w-4" />
              <span>Family Album</span>
            </button>
            <button
              onClick={onShowPhotobookCreator}
              disabled={!hasCompletedImages}
              className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#FFD166] bg-[#FFF3BF] px-3 py-1 text-xs font-semibold text-[#D96C00] shadow-[0_6px_0_0_rgba(255,209,102,0.55)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_0_0_rgba(255,209,102,0.6)] disabled:translate-y-0 disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:shadow-none"
            >
              <Book className="h-4 w-4" />
              <span>Create Photobook</span>
            </button>
            <button
              onClick={onShowUploader}
              className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#FF8BA7] bg-gradient-to-r from-[#FF8BA7] to-[#FF6F91] px-3 py-1 text-xs font-semibold text-white shadow-[0_8px_0_0_rgba(255,111,145,0.6)] transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_0_0_rgba(255,111,145,0.65)]"
            >
              <Plus className="h-4 w-4" />
              <span>Upload Photos</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
