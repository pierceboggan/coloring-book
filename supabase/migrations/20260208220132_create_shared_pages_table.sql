-- Create shared_pages table for social sharing feature
CREATE TABLE IF NOT EXISTS public.shared_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_id UUID NOT NULL REFERENCES public.images(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    share_code TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ,
    view_count INTEGER NOT NULL DEFAULT 0,
    is_variant BOOLEAN NOT NULL DEFAULT false,
    variant_url TEXT
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_shared_pages_share_code ON public.shared_pages(share_code);
CREATE INDEX IF NOT EXISTS idx_shared_pages_image_id ON public.shared_pages(image_id);
CREATE INDEX IF NOT EXISTS idx_shared_pages_user_id ON public.shared_pages(user_id);

-- Enable Row Level Security
ALTER TABLE public.shared_pages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own shares
CREATE POLICY "Users can view own shares"
    ON public.shared_pages
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can create shares for their own images
CREATE POLICY "Users can create own shares"
    ON public.shared_pages
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own shares
CREATE POLICY "Users can delete own shares"
    ON public.shared_pages
    FOR DELETE
    USING (auth.uid() = user_id);

-- Policy: Anyone can view shared pages by share_code (for public access)
CREATE POLICY "Public can view shared pages"
    ON public.shared_pages
    FOR SELECT
    USING (true);

-- Policy: Service role can do anything (for API operations)
-- Note: This is handled by service role key bypass in Supabase

COMMENT ON TABLE public.shared_pages IS 'Stores shareable links for individual coloring pages';
COMMENT ON COLUMN public.shared_pages.share_code IS 'Unique 8-character code for sharing';
COMMENT ON COLUMN public.shared_pages.view_count IS 'Number of times this share has been viewed';
COMMENT ON COLUMN public.shared_pages.is_variant IS 'Whether this share is for a variant version';
COMMENT ON COLUMN public.shared_pages.variant_url IS 'URL of the variant if is_variant is true';
