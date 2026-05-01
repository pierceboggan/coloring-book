'use client'

import {
  Archive,
  Download,
  Heart,
  Images,
  Paintbrush,
  RotateCcw,
  Users,
} from 'lucide-react'
import { formatImageDate } from './utils'
import type { ColoringDisplayItem, UserImage } from './types'
import type { LayoutMode } from './DashboardToolbar'

interface ColoringPageCardProps {
  item: ColoringDisplayItem
  layoutMode: LayoutMode
  onColor: (image: UserImage, coloringPageUrl: string) => void
  onCollaborate: (image: UserImage) => void
  onToggleFavorite: (imageId: string, isFavorite: boolean) => void
  onOpenVariants: (image: UserImage) => void
  onRegenerate: (image: UserImage) => void
  onArchive: (imageId: string) => void
}

export function ColoringPageCard({
  item,
  layoutMode,
  onColor,
  onCollaborate,
  onToggleFavorite,
  onOpenVariants,
  onRegenerate,
  onArchive,
}: ColoringPageCardProps) {
  if (layoutMode === 'compact') {
    return (
      <div
        className={`group relative overflow-hidden rounded-2xl border-2 bg-white/90 transition-all hover:-translate-y-0.5 hover:shadow-lg ${
          item.isVariant ? 'border-[#C3B5FF]' : 'border-[#FFB3BA]'
        }`}
      >
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <img src={item.coloringPageUrl} alt={item.name} className="h-full w-full object-cover" />

          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#3A2E39]/60 opacity-0 backdrop-blur-[2px] transition-opacity group-hover:opacity-100">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onColor(item.parentImage, item.coloringPageUrl)}
                className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/80 bg-white/90 text-[#1DB9B3] transition-transform hover:scale-110"
                title="Color"
              >
                <Paintbrush className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => onCollaborate(item.parentImage)}
                className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/80 bg-white/90 text-[#FFB3BA] transition-transform hover:scale-110"
                title="Start Collaboration"
              >
                <Users className="h-3.5 w-3.5" />
              </button>
              <a
                href={item.coloringPageUrl}
                download={`coloring-page-${item.name}${item.isVariant ? '-variant' : ''}.png`}
                className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/80 bg-[#FF6F91] text-white transition-transform hover:scale-110"
                title="Download"
              >
                <Download className="h-3.5 w-3.5" />
              </a>
              <button
                onClick={() => onToggleFavorite(item.id, item.isFavorite)}
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/80 transition-transform hover:scale-110 ${
                  item.isFavorite ? 'bg-[#FF6F91] text-white' : 'bg-white/90 text-[#FF6F91]'
                }`}
                title={item.isFavorite ? 'Unfavorite' : 'Favorite'}
              >
                <Heart className={`h-3.5 w-3.5 ${item.isFavorite ? 'fill-current' : ''}`} />
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onOpenVariants(item.parentImage)}
                className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/80 bg-white/90 text-[#6C63FF] transition-transform hover:scale-110"
                title="Variants"
              >
                <Images className="h-3.5 w-3.5" />
              </button>
              {!item.isVariant && (
                <>
                  <button
                    onClick={() => onRegenerate(item.parentImage)}
                    className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/80 bg-white/90 text-[#AA6A00] transition-transform hover:scale-110"
                    title="Regenerate"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => onArchive(item.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/80 bg-white/90 text-[#FF6F91] transition-transform hover:scale-110"
                    title="Archive"
                  >
                    <Archive className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#3A2E39]/80 to-transparent px-2.5 pb-2 pt-6">
            <p className="truncate text-xs font-bold text-white drop-shadow-sm">{item.name}</p>
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(item.id, item.isFavorite) }}
            className={`absolute right-1.5 top-1.5 z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 transition-transform hover:scale-110 ${
              item.isFavorite
                ? 'border-[#FF6F91] bg-[#FF6F91] text-white shadow-sm'
                : 'border-white/80 bg-white/70 text-[#FF6F91] opacity-0 shadow-sm backdrop-blur-sm group-hover:opacity-100'
            }`}
            title={item.isFavorite ? 'Unfavorite' : 'Favorite'}
          >
            <Heart className={`h-3.5 w-3.5 ${item.isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border-2 bg-white/90 shadow-[6px_6px_0_0] transition-transform hover:-translate-y-1 ${
        item.isVariant
          ? 'border-[#C3B5FF] shadow-[#A599E9]'
          : 'border-[#FFB3BA] shadow-[#FF8A80]'
      }`}
    >
      <div className="aspect-[4/3] max-h-64 overflow-hidden bg-gray-100">
        <img src={item.coloringPageUrl} alt={item.name} className="h-full w-full object-cover" />
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-1">
            <h3 className="max-w-[14rem] truncate text-base font-extrabold text-[#3A2E39]">{item.name}</h3>
            {item.isVariant && item.variantPrompt && (
              <p className="text-sm font-medium text-[#6C63FF] line-clamp-2">{item.variantPrompt}</p>
            )}
            <p className="text-sm font-medium text-[#594144]/70">{formatImageDate(item.createdAt)}</p>
          </div>
          {item.isVariant ? (
            <span className="rounded-full border-2 border-[#C3B5FF] bg-[#F6F3FF] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#6C63FF]">
              Variant
            </span>
          ) : (
            <span className="rounded-full border-2 border-[#A0E7E5] bg-[#E0F7FA] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#1DB9B3]">
              Ready!
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onColor(item.parentImage, item.coloringPageUrl)}
              className="flex items-center gap-2 rounded-full border-2 border-[#A0E7E5] bg-white px-3 py-1.5 text-xs font-semibold text-[#1DB9B3] shadow-[3px_3px_0_0_#55C6C0] transition-transform hover:-translate-y-0.5"
            >
              <Paintbrush className="h-3.5 w-3.5" />
              Color
            </button>
            <a
              href={item.coloringPageUrl}
              download={`coloring-page-${item.name}${item.isVariant ? '-variant' : ''}.png`}
              className="flex items-center gap-2 rounded-full border-2 border-[#FFB3BA] bg-[#FF6F91] px-3 py-1.5 text-xs font-semibold text-white shadow-[3px_3px_0_0_#f2557b] transition-transform hover:-translate-y-0.5"
            >
              <Download className="h-4 w-4" />
              Download
            </a>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenVariants(item.parentImage)}
              className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#C3B5FF] bg-[#F6F3FF] text-[#6C63FF] shadow-[3px_3px_0_0_#A599E9] transition-transform hover:-translate-y-0.5"
              title="Variants studio"
            >
              <Images className="h-4 w-4" />
            </button>
            {!item.isVariant && (
              <>
                <button
                  onClick={() => onToggleFavorite(item.id, item.isFavorite)}
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 shadow-[3px_3px_0_0] transition-transform hover:-translate-y-0.5 ${
                    item.isFavorite
                      ? 'border-[#FF6F91] bg-[#FF6F91] text-white shadow-[#f2557b]'
                      : 'border-[#FFB3BA] bg-white text-[#FF6F91] shadow-[#FF8A80]'
                  }`}
                  title={item.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Heart className={`h-4 w-4 ${item.isFavorite ? 'fill-current' : ''}`} />
                </button>
                <button
                  onClick={() => onRegenerate(item.parentImage)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#FFD166] bg-[#FFF3BF] text-[#AA6A00] shadow-[3px_3px_0_0_#FFB84C] transition-transform hover:-translate-y-0.5"
                  title="Regenerate"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => onArchive(item.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#FFB3BA] bg-[#FFE6EB] text-[#FF6F91] shadow-[3px_3px_0_0_#FF8A80] transition-transform hover:-translate-y-0.5"
                  title="Archive"
                >
                  <Archive className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
