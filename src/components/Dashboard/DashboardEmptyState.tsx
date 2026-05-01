'use client'

import { Images, Palette, Plus } from 'lucide-react'

interface DashboardEmptyStateProps {
  variant: 'coloring' | 'uploads'
  favoritesOnly: boolean
  onShowAll: () => void
  onShowUploader: () => void
}

export function DashboardEmptyState({
  variant,
  favoritesOnly,
  onShowAll,
  onShowUploader,
}: DashboardEmptyStateProps) {
  const isColoring = variant === 'coloring'

  const headline = favoritesOnly
    ? isColoring ? 'No favorite coloring pages yet' : 'No favorite uploads yet'
    : isColoring ? 'No coloring pages yet' : 'No uploads yet'

  const body = favoritesOnly
    ? isColoring ? 'Tap the heart on any page to pin it here.' : 'Heart an upload to quickly find it here.'
    : isColoring ? 'Upload photos or explore uploads to start creating pages.' : 'Drop in photos to start building your variant library.'

  const cardClass = isColoring
    ? 'border-[#FFB3BA] shadow-[6px_6px_0_0_#FF8A80]'
    : 'border-[#A0E7E5] shadow-[6px_6px_0_0_#55C6C0]'

  const haloA = isColoring ? 'bg-[#FF8A80]/40' : 'bg-[#55C6C0]/40'
  const haloB = isColoring ? 'bg-[#A0E7E5]/40' : 'bg-[#FFB3BA]/40'

  const iconClass = isColoring ? 'bg-[#FF6F91]' : 'bg-[#55C6C0]'
  const Icon = isColoring ? Palette : Images

  const showAllBtnClass = isColoring
    ? 'border-[#FFB3BA] bg-white text-[#FF6F91] shadow-[3px_3px_0_0_#FF8A80]'
    : 'border-[#55C6C0] bg-white text-[#1DB9B3] shadow-[3px_3px_0_0_#55C6C0]'

  const uploadBtnClass = isColoring
    ? 'border-[#FFB3BA] bg-[#FF6F91] text-white shadow-[3px_3px_0_0_#f2557b]'
    : 'border-[#55C6C0] bg-[#55C6C0] text-white shadow-[3px_3px_0_0_#1DB9B3]'

  return (
    <div className="mx-auto max-w-2xl">
      <div className={`relative overflow-hidden rounded-2xl border-2 bg-white/90 p-8 text-center ${cardClass}`}>
        <div className={`pointer-events-none absolute -top-10 right-10 h-20 w-20 rounded-full ${haloA}`} aria-hidden="true" />
        <div className={`pointer-events-none absolute -bottom-8 left-8 h-20 w-20 rounded-full ${haloB}`} aria-hidden="true" />
        <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-white text-white shadow-inner ${iconClass}`}>
          <Icon className="h-7 w-7" />
        </div>
        <h3 className="mb-2 text-xl font-bold text-gray-800">{headline}</h3>
        <p className="mb-4 text-sm text-gray-600">{body}</p>
        {favoritesOnly ? (
          <button
            onClick={onShowAll}
            className={`inline-flex items-center gap-2 rounded-full border-2 px-5 py-2 text-sm font-semibold transition-transform hover:-translate-y-0.5 ${showAllBtnClass}`}
          >
            {isColoring ? 'Show all pages' : 'Show all uploads'}
          </button>
        ) : (
          <button
            onClick={onShowUploader}
            className={`inline-flex items-center gap-2 rounded-full border-2 px-5 py-2 text-sm font-semibold transition-transform hover:-translate-y-0.5 ${uploadBtnClass}`}
          >
            <Plus className="h-4 w-4" />
            Upload photos
          </button>
        )}
      </div>
    </div>
  )
}
