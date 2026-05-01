export interface DashboardImage {
  id: string
  name: string
  original_url: string
  coloring_page_url?: string
  status: 'processing' | 'completed' | 'error'
  created_at: string
  variant_urls?: string[] | null
  variant_prompts?: string[] | null
  archived_at?: string | null
  is_favorite?: boolean | null
}

export interface ColoringDisplayItem {
  id: string
  displayId: string
  name: string
  coloringPageUrl: string
  createdAt: string
  isVariant: boolean
  variantPrompt?: string
  parentImage: DashboardImage
  isFavorite: boolean
}

type DeriveDashboardDisplayDataInput = {
  images: DashboardImage[]
  favoritesOnly: boolean
}

export const deriveDashboardDisplayData = ({ images, favoritesOnly }: DeriveDashboardDisplayDataInput) => {
  const totalImages = images.length
  const coloringPages = images.filter((img) => img.status === 'completed' && img.coloring_page_url)
  const processingCount = images.filter((img) => img.status === 'processing').length
  const isProcessing = processingCount > 0

  const coloringDisplayItems: ColoringDisplayItem[] = coloringPages.flatMap((image) => {
    const mainItem: ColoringDisplayItem = {
      id: image.id,
      displayId: image.id,
      name: image.name,
      coloringPageUrl: image.coloring_page_url!,
      createdAt: image.created_at,
      isVariant: false,
      parentImage: image,
      isFavorite: image.is_favorite ?? false,
    }

    const variantItems: ColoringDisplayItem[] = (image.variant_urls || []).map((url, index) => ({
      id: image.id,
      displayId: `${image.id}-variant-${index}`,
      name: image.name,
      coloringPageUrl: url,
      createdAt: image.created_at,
      isVariant: true,
      variantPrompt: image.variant_prompts?.[index] || 'Custom variant',
      parentImage: image,
      isFavorite: image.is_favorite ?? false,
    }))

    return [mainItem, ...variantItems]
  })

  const sortedColoringDisplayItems = [...coloringDisplayItems].sort((a, b) => {
    if (a.isFavorite !== b.isFavorite) {
      return a.isFavorite ? -1 : 1
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  const sortedUploadsViewImages = [...images].sort((a, b) => {
    const aFav = a.is_favorite ?? false
    const bFav = b.is_favorite ?? false
    if (aFav !== bFav) {
      return aFav ? -1 : 1
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  return {
    totalImages,
    processingCount,
    isProcessing,
    completedCount: sortedColoringDisplayItems.length,
    filteredColoringDisplayItems: favoritesOnly
      ? sortedColoringDisplayItems.filter((item) => item.isFavorite)
      : sortedColoringDisplayItems,
    filteredUploadsViewImages: favoritesOnly
      ? sortedUploadsViewImages.filter((image) => image.is_favorite ?? false)
      : sortedUploadsViewImages,
  }
}
