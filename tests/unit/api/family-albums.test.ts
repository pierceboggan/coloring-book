// @vitest-environment node

import { readFileSync } from 'node:fs'
import { PGlite } from '@electric-sql/pglite'
import { NextRequest } from 'next/server'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from '@/app/api/family-albums/route'
import type { Database } from '@/lib/supabase'

const { rpc, from } = vi.hoisted(() => ({ rpc: vi.fn(), from: vi.fn() }))

vi.mock('@/lib/supabase', () => ({ supabase: { rpc, from } }))
vi.mock('@/lib/logger', () => ({ logger: { info: vi.fn(), error: vi.fn() } }))

type Album = Database['public']['Tables']['family_albums']['Row']
type AlbumInput = Database['public']['Tables']['family_albums']['Insert']

const firstImage = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const secondImage = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const missingImage = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
const db = new PGlite()

function createAlbum(overrides: Record<string, unknown> = {}) {
  return POST(new NextRequest('http://localhost/api/family-albums', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Family album',
      userId: 'album-owner',
      imageIds: [firstImage, secondImage],
      ...overrides,
    }),
  }))
}

async function albumCounts() {
  const result = await db.query<{ albums: number; links: number }>(`
    SELECT
      (SELECT count(*)::int FROM family_albums) AS albums,
      (SELECT count(*)::int FROM album_images) AS links
  `)
  return result.rows[0]
}

describe('family album creation with PostgreSQL', () => {
  beforeAll(async () => {
    await db.exec(`
      CREATE ROLE anon;
      CREATE ROLE authenticated;
      CREATE ROLE service_role;
      CREATE TABLE images (
        id uuid PRIMARY KEY,
        user_id text NOT NULL
      );
      CREATE TABLE family_albums (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id text NOT NULL,
        title text NOT NULL,
        description text,
        share_code text NOT NULL UNIQUE,
        created_at timestamptz DEFAULT now(),
        cover_image_id uuid REFERENCES images(id),
        expires_at timestamptz,
        comments_enabled boolean NOT NULL DEFAULT true,
        downloads_enabled boolean NOT NULL DEFAULT true
      );
      CREATE TABLE album_images (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        album_id uuid NOT NULL REFERENCES family_albums(id) ON DELETE CASCADE,
        image_id uuid NOT NULL REFERENCES images(id),
        created_at timestamptz DEFAULT now(),
        UNIQUE (album_id, image_id)
      );
    `)
    await db.exec(readFileSync(
      new URL('../../../supabase/migrations/20260909000000_create_family_album.sql', import.meta.url),
      'utf8'
    ))
  }, 30_000)

  beforeEach(async () => {
    vi.clearAllMocks()
    await db.exec(`
      DROP TRIGGER IF EXISTS reject_album_image ON album_images;
      TRUNCATE album_images, family_albums, images;
    `)
    await db.query('INSERT INTO images (id, user_id) VALUES ($1, $3), ($2, $3)', [
      firstImage, secondImage, 'album-owner',
    ])

    // Emulate the PostgREST response while executing the real migration function.
    rpc.mockImplementation((name: string, args: { p_album: AlbumInput; p_image_ids: string[] }) => {
      expect(name).toBe('create_family_album')
      return {
        single: async () => {
          try {
            const result = await db.query<Album>(
              'SELECT * FROM public.create_family_album($1::jsonb, $2::uuid[])',
              [JSON.stringify(args.p_album), args.p_image_ids]
            )
            return { data: result.rows[0], error: null }
          } catch (error) {
            if (!(error instanceof Error) || !('code' in error)) throw error
            return { data: null, error: { message: error.message, code: error.code } }
          }
        },
      }
    })
  })

  afterAll(async () => {
    await db.close()
  })

  it('creates the album and all links, preserving the API response and settings', async () => {
    const response = await createAlbum({
      description: 'Summer photos',
      coverImageId: secondImage,
      expiresAt: '2027-01-01T00:00:00.000Z',
      commentsEnabled: false,
      downloadsEnabled: false,
    })
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({
      success: true,
      album: {
        id: expect.any(String),
        title: 'Family album',
        description: 'Summer photos',
        shareCode: expect.any(String),
        shareUrl: expect.stringContaining(`/album/${body.album.shareCode}`),
        coverImageId: secondImage,
        expiresAt: expect.anything(),
        commentsEnabled: false,
        downloadsEnabled: false,
      },
    })
    expect(new Date(body.album.expiresAt).toISOString()).toBe('2027-01-01T00:00:00.000Z')
    const links = await db.query<{ image_id: string; album_id: string }>(
      'SELECT image_id, album_id FROM album_images ORDER BY image_id'
    )
    expect(links.rows).toEqual([
      { image_id: firstImage, album_id: body.album.id },
      { image_id: secondImage, album_id: body.album.id },
    ])
    expect(await albumCounts()).toEqual({ albums: 1, links: 2 })
    expect(from).not.toHaveBeenCalled()
  })

  it('preserves defaults for optional settings', async () => {
    const response = await createAlbum()
    expect(response.status).toBe(200)
    expect((await response.json()).album).toMatchObject({
      description: '',
      coverImageId: null,
      expiresAt: null,
      commentsEnabled: true,
      downloadsEnabled: true,
    })
  })

  it('rolls back the new album and partial links when a later link insert fails', async () => {
    const existing = await createAlbum({ imageIds: [firstImage] })
    expect(existing.status).toBe(200)
    const existingId = (await existing.json()).album.id
    await db.exec(`
      CREATE OR REPLACE FUNCTION reject_second_image() RETURNS trigger
      LANGUAGE plpgsql AS $$
      BEGIN
        IF NEW.image_id = '${secondImage}'::uuid THEN
          IF NOT EXISTS (
            SELECT 1 FROM public.family_albums WHERE id = NEW.album_id
          ) OR NOT EXISTS (
            SELECT 1 FROM public.album_images
            WHERE album_id = NEW.album_id AND image_id = '${firstImage}'::uuid
          ) THEN
            RAISE EXCEPTION 'Expected album and first link before failure';
          END IF;
          RAISE EXCEPTION 'Forced album-image insert failure';
        END IF;
        RETURN NEW;
      END;
      $$;
      CREATE TRIGGER reject_album_image BEFORE INSERT ON album_images
        FOR EACH ROW EXECUTE FUNCTION reject_second_image();
    `)

    const response = await createAlbum()
    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({
      success: false,
      error: 'Failed to create album: Forced album-image insert failure',
    })
    expect(await albumCounts()).toEqual({ albums: 1, links: 1 })
    expect((await db.query('SELECT id FROM family_albums')).rows).toEqual([{ id: existingId }])
    expect(from).not.toHaveBeenCalled()
  })

  it.each([
    null, 'not-an-array', {}, [], [null], [123], ['not-a-uuid'],
    [firstImage, firstImage], [firstImage, firstImage.toUpperCase()],
  ].map(imageIds => ({ imageIds })))('rejects invalid image IDs before calling the database: $imageIds', async ({ imageIds }) => {
    const response = await createAlbum({ imageIds })
    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({ success: false, error: expect.any(String) })
    expect(rpc).not.toHaveBeenCalled()
    expect(await albumCounts()).toEqual({ albums: 0, links: 0 })
  })

  it('rejects missing images before inserting an album', async () => {
    const response = await createAlbum({ imageIds: [firstImage, missingImage] })
    expect(response.status).toBe(400)
    expect(await albumCounts()).toEqual({ albums: 0, links: 0 })
  })

  it.each(['title', 'userId', 'imageIds'])('returns a consistent error for missing %s', async field => {
    const response = await createAlbum({ [field]: undefined })
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      success: false,
      error: 'Title, imageIds, and userId are required',
    })
    expect(rpc).not.toHaveBeenCalled()
  })

  it.each(['not-a-uuid', '', 0, 123, false, true, {}, [], [firstImage]].map(coverImageId => ({ coverImageId })))(
    'rejects an invalid cover before calling the database: $coverImageId',
    async ({ coverImageId }) => {
      const response = await createAlbum({ coverImageId })
      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({
        success: false,
        error: 'coverImageId must be a UUID or null',
      })
      expect(rpc).not.toHaveBeenCalled()
      expect(await albumCounts()).toEqual({ albums: 0, links: 0 })
    }
  )

  it('accepts an explicit null cover', async () => {
    const response = await createAlbum({ coverImageId: null })
    expect(response.status).toBe(200)
    expect((await response.json()).album.coverImageId).toBeNull()
  })

  it('rejects images belonging to another user', async () => {
    const response = await createAlbum({ userId: 'another-owner' })
    expect(response.status).toBe(400)
    expect(await albumCounts()).toEqual({ albums: 0, links: 0 })
  })

  it('rejects a cover outside the selected images', async () => {
    const response = await createAlbum({ imageIds: [firstImage], coverImageId: secondImage })
    expect(response.status).toBe(400)
    expect(await albumCounts()).toEqual({ albums: 0, links: 0 })
  })

  it('rejects invalid expiration dates before calling the database', async () => {
    const response = await createAlbum({ expiresAt: 'invalid-date' })
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ success: false, error: 'Invalid expiration date' })
    expect(rpc).not.toHaveBeenCalled()
  })

  it.each([null, [], [null], [firstImage, firstImage]].map(imageIds => ({ imageIds })))(
    'validates image IDs for direct RPC callers: $imageIds',
    async ({ imageIds }) => {
      await expect(db.query(
        'SELECT * FROM public.create_family_album($1::jsonb, $2::uuid[])',
        [JSON.stringify({ title: 'Direct call', user_id: 'album-owner', share_code: 'direct' }), imageIds]
      )).rejects.toMatchObject({ code: '22023' })
      expect(await albumCounts()).toEqual({ albums: 0, links: 0 })
    }
  )
})
