CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS songs_title_trgm_idx
  ON public.songs USING GIN (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS songs_artist_trgm_idx
  ON public.songs USING GIN (artist gin_trgm_ops);

CREATE INDEX IF NOT EXISTS songs_album_trgm_idx
  ON public.songs USING GIN (album gin_trgm_ops);

CREATE INDEX IF NOT EXISTS songs_visible_idx
  ON public.songs (is_visible) WHERE is_visible = true;