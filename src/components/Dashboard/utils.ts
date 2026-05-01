import type { ColoringDisplayItem, UserImage, VariantSummary } from './types'

const getOrdinalSuffix = (day: number) => {
  const remainder = day % 100

  if (remainder >= 11 && remainder <= 13) {
    return 'th'
  }

  switch (day % 10) {
    case 1:
      return 'st'
    case 2:
      return 'nd'
    case 3:
      return 'rd'
    default:
      return 'th'
  }
}

export const formatImageDate = (value: string) => {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  const month = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(date)
  const day = date.getDate()
  const year = date.getFullYear()
  const formattedDate = `${month} ${day}${getOrdinalSuffix(day)}, ${year}`

  const startOfDay = (input: Date) => new Date(input.getFullYear(), input.getMonth(), input.getDate())
  const today = startOfDay(new Date())
  const targetDay = startOfDay(date)
  const msPerDay = 1000 * 60 * 60 * 24
  const diffInDays = Math.round((today.getTime() - targetDay.getTime()) / msPerDay)

  let relativeLabel: string

  if (diffInDays === 0) {
    relativeLabel = 'today'
  } else if (diffInDays > 0) {
    relativeLabel = diffInDays === 1 ? '1 day ago' : `${diffInDays} days ago`
  } else {
    const daysAhead = Math.abs(diffInDays)
    relativeLabel = daysAhead === 1 ? 'in 1 day' : `in ${daysAhead} days`
  }

  return `${formattedDate} (${relativeLabel})`
}

export const getVariantSummaries = (image: UserImage): VariantSummary[] => {
  const urls = image.variant_urls || []
  const prompts = image.variant_prompts || []

  return urls
    .map((url, index) => ({
      url,
      prompt: prompts[index] || 'Custom variant scene',
    }))
    .filter((variant): variant is VariantSummary => Boolean(variant.url))
}

export const buildColoringDisplayItems = (images: UserImage[]): ColoringDisplayItem[] => {
  const coloringPages = images.filter(img => img.status === 'completed' && img.coloring_page_url)

  const items = coloringPages.flatMap((image) => {
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

  items.sort((a, b) => {
    if (a.isFavorite !== b.isFavorite) {
      return a.isFavorite ? -1 : 1
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  return items
}

export const sortUploads = (images: UserImage[]): UserImage[] => {
  return [...images].sort((a, b) => {
    const aFav = a.is_favorite ?? false
    const bFav = b.is_favorite ?? false
    if (aFav !== bFav) {
      return aFav ? -1 : 1
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
}
