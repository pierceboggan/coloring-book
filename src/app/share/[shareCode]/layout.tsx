import { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: { shareCode: string }
}): Promise<Metadata> {
  try {
    const shareCode = params.shareCode
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/share/${shareCode}`,
      { cache: 'no-store' }
    )

    if (!response.ok) {
      return {
        title: 'Coloring Page - ColoringBook.AI',
        description: 'Create your own AI-powered coloring pages',
      }
    }

    const data = await response.json()
    const title = `${data.image.name} - Coloring Page`
    const description = `Check out this coloring page: ${data.image.name}. Print it, color it online, or create your own!`
    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/share/${shareCode}`

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: shareUrl,
        siteName: 'ColoringBook.AI',
        images: [
          {
            url: data.image.coloringPageUrl,
            width: 1200,
            height: 630,
            alt: data.image.name,
          },
        ],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [data.image.coloringPageUrl],
      },
    }
  } catch (error) {
    console.error('Failed to generate metadata:', error)
    return {
      title: 'Coloring Page - ColoringBook.AI',
      description: 'Create your own AI-powered coloring pages',
    }
  }
}

export default function ShareLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
