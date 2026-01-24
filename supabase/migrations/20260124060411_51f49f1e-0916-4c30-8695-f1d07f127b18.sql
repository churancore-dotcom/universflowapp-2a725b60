-- Add section and premium fields to songs table
ALTER TABLE public.songs 
ADD COLUMN IF NOT EXISTS show_in_new_releases boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS show_in_trending boolean NOT NULL DEFAULT false;

-- Add premium_only field to artists table  
ALTER TABLE public.artists
ADD COLUMN IF NOT EXISTS is_premium_only boolean NOT NULL DEFAULT false;