import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

function extractStoragePath(url: string | null): string | null {
  if (!url) {
    return null
  }

  try {
    const parsedUrl = new URL(url)
    const pathSegments = parsedUrl.pathname.split('/').filter(Boolean)

    const publicIndex = pathSegments.findIndex((segment) => segment === 'public')
    if (publicIndex === -1 || publicIndex === pathSegments.length - 1) {
      return null
    }

    const objectPath = pathSegments.slice(publicIndex + 2).join('/')
    return objectPath || null
  } catch (error) {
    console.error('❌ Failed to parse storage path from URL:', { url, error })
    return null
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')

    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 })
    }

    const accessToken = authHeader.slice('Bearer '.length).trim()

    if (!accessToken) {
      return NextResponse.json({ error: 'Access token is required' }, { status: 401 })
    }

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(accessToken)

    if (userError || !user) {
      console.error('❌ Failed to verify user before account deletion:', userError)
      return NextResponse.json({ error: 'Unable to verify user session' }, { status: 401 })
    }

    const userId = user.id

    console.log('🗑️ Deleting account for user:', { userId, email: user.email })

    const { data: userImages, error: fetchImagesError } = await supabaseAdmin
      .from('images')
      .select('id, original_url, coloring_page_url')
      .eq('user_id', userId)

    if (fetchImagesError) {
      console.error('❌ Failed to fetch user images before deletion:', fetchImagesError)
      return NextResponse.json({ error: 'Unable to fetch user assets' }, { status: 500 })
    }

    const storagePaths = Array.from(
      new Set(
        (userImages ?? [])
          .flatMap((image) => [extractStoragePath(image.original_url), extractStoragePath(image.coloring_page_url)])
          .filter((path): path is string => Boolean(path))
      )
    )

    if (storagePaths.length > 0) {
      const { error: storageRemoveError } = await supabaseAdmin.storage.from('images').remove(storagePaths)
      if (storageRemoveError) {
        console.error('❌ Failed to remove storage assets during account deletion:', storageRemoveError)
        return NextResponse.json({ error: 'Unable to remove stored images' }, { status: 500 })
      }
    }

    const { error: deleteImagesError } = await supabaseAdmin.from('images').delete().eq('user_id', userId)

    if (deleteImagesError) {
      console.error('❌ Failed to delete database records during account deletion:', deleteImagesError)
      return NextResponse.json({ error: 'Unable to remove image records' }, { status: 500 })
    }

    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteUserError) {
      console.error('❌ Failed to delete auth user during account deletion:', deleteUserError)
      return NextResponse.json({ error: 'Unable to delete user account' }, { status: 500 })
    }

    console.log('✅ Account deletion completed successfully for user:', userId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('💥 Account deletion failed with unexpected error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete account' },
      { status: 500 }
    )
  }
}
