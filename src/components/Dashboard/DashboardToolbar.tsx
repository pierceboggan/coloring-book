'use client'

import { Grid3x3, Heart, Images, LayoutGrid, Palette } from 'lucide-react'

export type ViewMode = 'coloring' | 'uploads'
export type LayoutMode = 'expanded' | 'compact'

interface DashboardToolbarProps {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  layoutMode: LayoutMode
  onLayoutModeChange: (mode: LayoutMode) => void
  favoritesOnly: boolean
  onFavoritesOnlyToggle: () => void
  showLayoutSwitch: boolean
}

export function DashboardToolbar({
  viewMode,
  onViewModeChange,
  layoutMode,
  onLayoutModeChange,
  favoritesOnly,
  onFavoritesOnlyToggle,
  showLayoutSwitch,
}: DashboardToolbarProps) {
  return (
    <div className="flex items-center justify-center gap-3">
      <div className="inline-flex items-center gap-1 rounded-full border-2 border-[#FFB3BA] bg-white/95 p-1 shadow-[4px_4px_0_0_#FF8A80]">
        <button
          type="button"
          onClick={() => onViewModeChange('coloring')}
          className={`flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold transition-all ${
            viewMode === 'coloring'
              ? 'bg-[#FF6F91] text-white shadow-[3px_3px_0_0_#f2557b]'
              : 'text-[#FF6F91] hover:bg-[#FFE6EB]'
          }`}
        >
          <Palette className="h-4 w-4" />
          Coloring pages
        </button>
        <button
          type="button"
          onClick={() => onViewModeChange('uploads')}
          className={`flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold transition-all ${
            viewMode === 'uploads'
              ? 'bg-[#55C6C0] text-white shadow-[3px_3px_0_0_#1DB9B3]'
              : 'text-[#1DB9B3] hover:bg-[#E0F7FA]'
          }`}
        >
          <Images className="h-4 w-4" />
          Uploads
        </button>
      </div>

      <button
        type="button"
        onClick={onFavoritesOnlyToggle}
        className={`inline-flex items-center gap-2 rounded-full border-2 px-3 py-1 text-sm font-semibold shadow-[4px_4px_0_0] transition-all ${
          favoritesOnly
            ? 'border-[#FF6F91] bg-[#FF6F91] text-white shadow-[#f2557b]'
            : 'border-[#FFB3BA] bg-white/95 text-[#FF6F91] shadow-[#FF8A80] hover:bg-[#FFE6EB]'
        }`}
        title={favoritesOnly ? 'Show all items' : 'Show favorites only'}
      >
        <Heart className={`h-4 w-4 ${favoritesOnly ? 'fill-current' : ''}`} />
        Favorites
      </button>

      {showLayoutSwitch && (
        <div className="inline-flex items-center gap-1 rounded-full border-2 border-[#FFB3BA] bg-white/95 p-1 shadow-[4px_4px_0_0_#FF8A80]">
          <button
            type="button"
            onClick={() => onLayoutModeChange('expanded')}
            className={`flex items-center justify-center rounded-full p-2 transition-all ${
              layoutMode === 'expanded'
                ? 'bg-[#FF6F91] text-white shadow-[3px_3px_0_0_#f2557b]'
                : 'text-[#FF6F91] hover:bg-[#FFE6EB]'
            }`}
            title="Expanded view"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onLayoutModeChange('compact')}
            className={`flex items-center justify-center rounded-full p-2 transition-all ${
              layoutMode === 'compact'
                ? 'bg-[#FF6F91] text-white shadow-[3px_3px_0_0_#f2557b]'
                : 'text-[#FF6F91] hover:bg-[#FFE6EB]'
            }`}
            title="Compact view"
          >
            <Grid3x3 className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
