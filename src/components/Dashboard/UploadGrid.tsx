'use client'

import { UploadCard } from './UploadCard'
import type { UserImage } from './types'

interface UploadGridProps {
  images: UserImage[]
  renamingImageId: string | null
  onRename: (imageId: string, newName: string) => Promise<void>
  onOpenVariants: (image: UserImage) => void
  onOpenPromptRemix: (image: UserImage) => void
  onColor: (image: UserImage) => void
  onDownload: (imageId: string, imageName: string) => void
  onToggleFavorite: (imageId: string, isFavorite: boolean) => void
  onRegenerate: (image: UserImage) => void
  onArchive: (imageId: string) => void
}

export function UploadGrid({ images, renamingImageId, ...handlers }: UploadGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
      {images.map((image) => (
        <UploadCard
          key={image.id}
          image={image}
          isRenaming={renamingImageId === image.id}
          {...handlers}
        />
      ))}
    </div>
  )
}
