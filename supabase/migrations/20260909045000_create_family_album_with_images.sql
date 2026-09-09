CREATE OR REPLACE FUNCTION public.create_family_album_with_images(
  p_title text,
  p_description text,
  p_user_id text,
  p_share_code text,
  p_created_at timestamptz,
  p_cover_image_id uuid,
  p_expires_at timestamptz,
  p_comments_enabled boolean,
  p_downloads_enabled boolean,
  p_image_ids uuid[]
)
RETURNS public.family_albums
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  created_album public.family_albums;
BEGIN
  INSERT INTO public.family_albums (
    title,
    description,
    user_id,
    share_code,
    created_at,
    cover_image_id,
    expires_at,
    comments_enabled,
    downloads_enabled
  )
  VALUES (
    p_title,
    p_description,
    p_user_id,
    p_share_code,
    p_created_at,
    p_cover_image_id,
    p_expires_at,
    p_comments_enabled,
    p_downloads_enabled
  )
  RETURNING * INTO created_album;

  INSERT INTO public.album_images (album_id, image_id, created_at)
  SELECT created_album.id, image_id, p_created_at
  FROM unnest(p_image_ids) AS image_id;

  RETURN created_album;
END;
$$;

REVOKE ALL ON FUNCTION public.create_family_album_with_images(
  text,
  text,
  text,
  text,
  timestamptz,
  uuid,
  timestamptz,
  boolean,
  boolean,
  uuid[]
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_family_album_with_images(
  text,
  text,
  text,
  text,
  timestamptz,
  uuid,
  timestamptz,
  boolean,
  boolean,
  uuid[]
) TO service_role;
