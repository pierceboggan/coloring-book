# ColorBook.ai Setup Guide

## 1. Supabase Setup

### Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Copy your project URL and anon key from Settings > API

### Database Schema
Run this SQL in your Supabase SQL editor:

```sql
-- Create images table
CREATE TABLE images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  original_url TEXT NOT NULL,
  coloring_page_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  status TEXT CHECK (status IN ('uploading', 'processing', 'completed', 'error')) DEFAULT 'uploading'
);

-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public) VALUES ('images', 'images', true);

-- Set up RLS policies
ALTER TABLE images ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert and read their own images
CREATE POLICY "Users can insert images" ON images FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view images" ON images FOR SELECT USING (true);
CREATE POLICY "Users can update their images" ON images FOR UPDATE USING (user_id = 'anonymous' OR auth.uid()::text = user_id);

-- Storage policies
CREATE POLICY "Anyone can upload images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'images');
CREATE POLICY "Anyone can view images" ON storage.objects FOR SELECT USING (bucket_id = 'images');
```

## 2. OpenAI Setup

1. Get your OpenAI API key from [platform.openai.com](https://platform.openai.com)
2. Make sure you have access to DALL-E 3

## 3. Environment Variables

Update your `.env.local` file:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 4. Run the Application

```bash
npm run dev
```

Visit http://localhost:3000 to see your ColorBook.ai application!

## Features Implemented

✅ Beautiful gradient UI with modern design  
✅ Drag & drop image upload  
✅ Supabase integration for storage and database  
✅ OpenAI DALL-E 3 integration for coloring page generation  
✅ Real-time status updates during processing  
✅ Download functionality for generated coloring pages  

## Next Steps (Future Development)

- User authentication with Supabase Auth
- Image gallery and management
- Stripe payment integration
- Sentry monitoring
- User profiles and saved images

## Troubleshooting

- Make sure your Supabase bucket is public
- Verify your OpenAI API key has DALL-E 3 access
- Check that your environment variables are set correctly