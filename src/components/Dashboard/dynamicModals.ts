import dynamic from 'next/dynamic'
import type { UserImage, VariantSummary } from './types'

export type PhotobookCreatorProps = {
  images: UserImage[]
  onClose: () => void
}

export type FamilyAlbumCreatorProps = {
  images: UserImage[]
  onClose: () => void
}

export type RegenerateModalProps = {
  isOpen: boolean
  onClose: () => void
  imageId: string
  imageName: string
  currentColoringPageUrl: string
  onRegenerateComplete: (regeneratedUrl: string) => void
}

export type ImageUploaderProps = {
  onUploadComplete?: () => void
}

export type ColoringCanvasModalProps = {
  imageUrl: string
  imageName: string
  onClose: () => void
  collaboration?: { sessionId: string; userId: string }
}

export type PromptRemixModalProps = {
  isOpen: boolean
  onClose: () => void
  imageName: string
  imageUrl: string
}

export type VariantsModalProps = {
  isOpen: boolean
  onClose: () => void
  imageId: string
  imageName: string
  originalUrl: string
  variants: VariantSummary[]
  onVariantsUpdated: (variants: VariantSummary[]) => void
  onUseVariant: (variantUrl: string) => Promise<void>
}

export const PhotobookCreator = dynamic<PhotobookCreatorProps>(
  () =>
    import('@/components/PhotobookCreator').then((mod) => ({
      default: mod.PhotobookCreator,
    })),
  { ssr: false, loading: () => null }
)

export const FamilyAlbumCreator = dynamic<FamilyAlbumCreatorProps>(
  () =>
    import('@/components/FamilyAlbumCreator').then((mod) => ({
      default: mod.FamilyAlbumCreator,
    })),
  { ssr: false, loading: () => null }
)

export const RegenerateModal = dynamic<RegenerateModalProps>(
  () =>
    import('@/components/RegenerateModal').then((mod) => ({
      default: mod.RegenerateModal,
    })),
  { ssr: false, loading: () => null }
)

export const ImageUploader = dynamic<ImageUploaderProps>(
  () => import('@/components/ImageUploader'),
  { ssr: false, loading: () => null }
)

export const ColoringCanvasModal = dynamic<ColoringCanvasModalProps>(
  () =>
    import('@/components/ColoringCanvasModal').then((mod) => ({
      default: mod.ColoringCanvasModal,
    })),
  { ssr: false, loading: () => null }
)

export const PromptRemixModal = dynamic<PromptRemixModalProps>(
  () =>
    import('@/components/PromptRemixModal').then((mod) => ({
      default: mod.PromptRemixModal,
    })),
  { ssr: false, loading: () => null }
)

export const VariantsModal = dynamic<VariantsModalProps>(
  () =>
    import('@/components/VariantsModal').then((mod) => ({
      default: mod.VariantsModal,
    })),
  { ssr: false, loading: () => null }
)
