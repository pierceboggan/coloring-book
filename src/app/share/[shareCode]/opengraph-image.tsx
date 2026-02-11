import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Coloring Page'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image({ params }: { params: { shareCode: string } }) {
  try {
    const shareCode = params.shareCode
    
    // Fetch share data
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/share/${shareCode}`,
      { cache: 'no-store' }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch share data')
    }

    const data = await response.json()

    return new ImageResponse(
      (
        <div
          style={{
            background: 'linear-gradient(135deg, #FFE6EB 0%, #E0FBFC 50%, #FFF3BF 100%)',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'system-ui',
            padding: '40px',
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '24px',
              padding: '40px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
              maxWidth: '1000px',
            }}
          >
            <div
              style={{
                fontSize: 48,
                fontWeight: 'bold',
                color: '#3A2E39',
                marginBottom: '20px',
                textAlign: 'center',
              }}
            >
              {data.image.name}
            </div>
            <div
              style={{
                fontSize: 24,
                color: '#594144',
                marginBottom: '30px',
                textAlign: 'center',
              }}
            >
              Shared Coloring Page from ColoringBook.AI
            </div>
            {data.image.coloringPageUrl && (
              <img
                src={data.image.coloringPageUrl}
                alt={data.image.name}
                style={{
                  maxWidth: '600px',
                  maxHeight: '400px',
                  objectFit: 'contain',
                  borderRadius: '12px',
                  border: '3px solid #A0E7E5',
                }}
              />
            )}
          </div>
        </div>
      ),
      {
        ...size,
      }
    )
  } catch (error) {
    console.error('Failed to generate OG image:', error)
    
    // Fallback image
    return new ImageResponse(
      (
        <div
          style={{
            background: 'linear-gradient(135deg, #FFE6EB 0%, #E0FBFC 50%, #FFF3BF 100%)',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'system-ui',
          }}
        >
          <div
            style={{
              fontSize: 60,
              fontWeight: 'bold',
              color: '#3A2E39',
            }}
          >
            ColoringBook.AI
          </div>
        </div>
      ),
      {
        ...size,
      }
    )
  }
}
