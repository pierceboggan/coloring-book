CREATE OR REPLACE FUNCTION public.create_family_album(
  p_album jsonb,
  p_image_ids uuid[]
)
RETURNS public.family_albums
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  album public.family_albums;
BEGIN
  IF p_image_ids IS NULL
    OR cardinality(p_image_ids) = 0
    OR array_position(p_image_ids, NULL) IS NOT NULL
    OR cardinality(p_image_ids) <> (
      SELECT count(DISTINCT image_id) FROM unnest(p_image_ids) AS ids(image_id)
    )
  THEN
    RAISE EXCEPTION 'imageIds must be a non-empty array of unique UUIDs'
      USING ERRCODE = '22023';
  END IF;

  album := jsonb_populate_record(NULL::public.family_albums, p_album);

  IF (
    SELECT count(*) FROM public.images
    WHERE id = ANY(p_image_ids) AND user_id::text = album.user_id::text
  ) <> cardinality(p_image_ids) THEN
    RAISE EXCEPTION 'All imageIds must identify existing images owned by the album user'
      USING ERRCODE = '22023';
  END IF;

  IF album.cover_image_id IS NOT NULL
    AND NOT (album.cover_image_id = ANY(p_image_ids))
  THEN
    RAISE EXCEPTION 'The cover image must be included in imageIds'
      USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.family_albums (
    title, description, user_id, share_code, cover_image_id,
    expires_at, comments_enabled, downloads_enabled
  ) VALUES (
    album.title, coalesce(album.description, ''), album.user_id,
    album.share_code, album.cover_image_id, album.expires_at,
    coalesce(album.comments_enabled, true), coalesce(album.downloads_enabled, true)
  )
  RETURNING * INTO album;

  INSERT INTO public.album_images (album_id, image_id)
  SELECT album.id, image_id FROM unnest(p_image_ids) AS ids(image_id);

  RETURN album;
END;
$$;

REVOKE ALL ON FUNCTION public.create_family_album(jsonb, uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_family_album(jsonb, uuid[])
  TO anon, authenticated, service_role;
