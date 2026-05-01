'use client'

import {
  Archive,
  Download,
  Heart,
  Images,
  Loader2,
  Paintbrush,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import { ImageTitleEditor } from './ImageTitleEditor'
import { formatImageDate, getVariantSummaries } from './utils'
import type { UserImage } from './types'

interface UploadCardProps {
  image: UserImage
  isRenaming: boolean
  onRename: (imageId: string, newName: string) => Promise<void>
  onOpenVariants: (image: UserImage) => void
  onOpenPromptRemix: (image: UserImage) => void
  onColor: (image: UserImage) => void
  onDownload: (imageId: string, imageName: string) => void
  onToggleFavorite: (imageId: string, isFavorite: boolean) => void
  onRegenerate: (image: UserImage) => void
  onArchive: (imageId: string) => void
}

export function UploadCard({
  image,
  isRenaming,
  onRename,
  onOpenVariants,
  onOpenPromptRemix,
  onColor,
  onDownload,
  onToggleFavorite,
  onRegenerate,
  onArchive,
}: UploadCardProps) {
  const variantSummaries = getVariantSummaries(image)

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-[#A0E7E5] bg-white/90 shadow-[6px_6px_0_0_#55C6C0] transition-transform hover:-translate-y-1">
      <div className="relative aspect-[4/3] max-h-64 overflow-hidden bg-gray-100">
        <img src={image.original_url} alt={image.name} className="h-full w-full object-cover" />
        {image.status === 'processing' && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-[#3A2E39]/40 text-sm font-semibold text-white backdrop-blur-[1px]">
            <Loader2 className="h-5 w-5 animate-spin" />
            Processing
          </div>
        )}
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-1">
            <ImageTitleEditor
              image={image}
              isSaving={isRenaming}
              onSave={(newName) => onRename(image.id, newName)}
            />
            <p className="text-sm font-medium text-[#594144]/70">{formatImageDate(image.created_at)}</p>
          </div>
          {image.status === 'completed' && image.coloring_page_url ? (
            <span className="rounded-full border-2 border-[#A0E7E5] bg-[#E0F7FA] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#1DB9B3]">
              Coloring ready
            </span>
          ) : (
            <span className="rounded-full border-2 border-dashed border-[#FFD166] bg-[#FFF3BF] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#AA6A00]">
              {image.status}
            </span>
          )}
        </div>

        {(image.variant_urls?.length || 0) > 0 && (
          <div className="inline-flex items-center gap-1 rounded-full border-2 border-[#C3B5FF] bg-[#F6F3FF] px-3 py-1 text-[11px] font-semibold text-[#6C63FF]">
            <Images className="h-3 w-3" />
            {image.variant_urls!.length} stored variant{image.variant_urls!.length === 1 ? '' : 's'}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onOpenVariants(image)}
            className="flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-[#6C63FF] bg-[#6C63FF] px-3 py-1.5 text-xs font-semibold text-white shadow-[3px_3px_0_0_#5650E0] transition-transform hover:-translate-y-0.5"
          >
            <Images className="h-3.5 w-3.5" />
            Variants studio
          </button>
          <button
            onClick={() => onOpenPromptRemix(image)}
            className="flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-[#FFD166] bg-[#FFF3BF] px-3 py-1.5 text-xs font-semibold text-[#AA6A00] shadow-[3px_3px_0_0_#FFB84C] transition-transform hover:-translate-y-0.5"
          >
            <Sparkles className="h-4 w-4" />
            Scene prompts
          </button>
        </div>

        {image.coloring_page_url && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onColor(image)}
              className="flex items-center gap-2 rounded-full border-2 border-[#A0E7E5] bg-white px-3 py-1.5 text-xs font-semibold text-[#1DB9B3] shadow-[3px_3px_0_0_#55C6C0] transition-transform hover:-translate-y-0.5"
            >
              <Paintbrush className="h-3.5 w-3.5" />
              Open coloring page
            </button>
            <button
              onClick={() => onDownload(image.id, image.name)}
              className="flex items-center gap-2 rounded-full border-2 border-[#FFB3BA] bg-[#FF6F91] px-3 py-1.5 text-xs font-semibold text-white shadow-[3px_3px_0_0_#f2557b] transition-transform hover:-translate-y-0.5"
            >
              <Download className="h-4 w-4" />
              Download page
            </button>
          </div>
        )}

        {variantSummaries.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6C63FF]">Saved variants</p>
            <div className="grid grid-cols-3 gap-2">
              {variantSummaries.slice(0, 3).map((variant) => (
                <button
                  key={variant.url}
                  onClick={() => onOpenVariants(image)}
                  className="group relative overflow-hidden rounded-xl border-2 border-[#C3B5FF]/60 bg-[#F6F3FF]"
                  type="button"
                >
                  <img src={variant.url} alt={variant.prompt} className="h-20 w-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-[#6C63FF]/70 text-xs font-semibold text-white opacity-0 transition group-hover:opacity-100">
                    View
                  </div>
                </button>
              ))}
            </div>
            {variantSummaries.length > 3 && (
              <p className="text-xs font-semibold text-[#6C63FF]">
                +{variantSummaries.length - 3} more variant{variantSummaries.length - 3 === 1 ? '' : 's'} saved
              </p>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-semibold text-[#594144]/60">Last updated {formatImageDate(image.created_at)}</p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onToggleFavorite(image.id, image.is_favorite ?? false)}
              className={`flex h-8 w-8 items-center justify-center rounded-full border-2 shadow-[3px_3px_0_0] transition-transform hover:-translate-y-0.5 ${
                image.is_favorite
                  ? 'border-[#FF6F91] bg-[#FF6F91] text-white shadow-[#f2557b]'
                  : 'border-[#FFB3BA] bg-white text-[#FF6F91] shadow-[#FF8A80]'
              }`}
              title={image.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart className={`h-4 w-4 ${image.is_favorite ? 'fill-current' : ''}`} />
            </button>
            {image.status === 'completed' && image.coloring_page_url && (
              <button
                onClick={() => onRegenerate(image)}
                className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#FFD166] bg-[#FFF3BF] text-[#AA6A00] shadow-[3px_3px_0_0_#FFB84C] transition-transform hover:-translate-y-0.5"
                title="Regenerate coloring page"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={() => onArchive(image.id)}
              className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#FFB3BA] bg-[#FFE6EB] text-[#FF6F91] shadow-[3px_3px_0_0_#FF8A80] transition-transform hover:-translate-y-0.5"
              title="Archive upload"
            >
              <Archive className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
