'use client'

import { ColoringPageCard } from './ColoringPageCard'
import type { ColoringDisplayItem, UserImage } from './types'
import type { LayoutMode } from './DashboardToolbar'

interface ColoringPageGridProps {
  items: ColoringDisplayItem[]
  layoutMode: LayoutMode
  onColor: (image: UserImage, coloringPageUrl: string) => void
  onCollaborate: (image: UserImage) => void
  onToggleFavorite: (imageId: string, isFavorite: boolean) => void
  onOpenVariants: (image: UserImage) => void
  onRegenerate: (image: UserImage) => void
  onArchive: (imageId: string) => void
}

export function ColoringPageGrid({ items, layoutMode, ...handlers }: ColoringPageGridProps) {
  return (
    <div className={layoutMode === 'compact'
      ? 'grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
      : 'grid grid-cols-2 gap-6 lg:grid-cols-3'
    }>
      {items.map((item) => (
        <ColoringPageCard
          key={item.displayId}
          item={item}
          layoutMode={layoutMode}
          {...handlers}
        />
      ))}
    </div>
  )
}
