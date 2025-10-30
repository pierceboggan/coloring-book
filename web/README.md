# 🎨 ColoringBook.AI

Transform any photo into a beautiful coloring page with AI-powered technology. Perfect for family memories, gifts, or creative fun!

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green?logo=supabase)](https://supabase.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-API-orange?logo=openai)](https://openai.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-blue?logo=tailwindcss)](https://tailwindcss.com/)

## ✨ Features

### 🤖 AI-Powered Processing
- **Smart Line Art Generation**: Advanced OpenAI and Google Gemini APIs analyze photos and create perfect line art
- **Provider Benchmarks**: Built-in evaluation endpoint compares output quality, latency, and cost metadata across providers
- **Custom Prompts**: Regenerate coloring pages with different styles and complexity levels
- **Real-time Status Updates**: Live progress tracking during AI processing
- **Automatic Watermarking**: Professional watermark system for processed images

### 👨‍👩‍👧‍👦 Family & Sharing
- **Family Albums**: Create and share coloring page collections with unique share codes
- **Photobook Creator**: Combine multiple coloring pages into PDF collections (up to 20 pages)
- **Instant Download**: Get coloring pages ready to print within minutes
- **Safe & Family-Friendly**: Suitable for all ages with content protection

### 🎛️ User Management
- **Dashboard**: Intuitive interface to manage your coloring pages
- **Real-time Updates**: Live status updates using Supabase subscriptions
- **Image Gallery**: View and organize all your created coloring pages
- **Bulk Operations**: Delete multiple images or create collections easily

## 🏗️ Tech Stack

- **Framework**: Next.js 15 with App Router & TypeScript
- **Styling**: Tailwind CSS with modern gradient design
- **Database**: Supabase with real-time subscriptions
- **Authentication**: Supabase Auth with React Context
- **AI Processing**: OpenAI Responses API (not DALL-E directly)
- **Storage**: Supabase Storage for images
- **Image Processing**: Sharp for watermarking and manipulation
- **PDF Generation**: jsPDF for photobook creation
- **Monitoring**: Sentry for error tracking and performance
- **Deployment**: Vercel with automatic builds

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- A Supabase account
- An OpenAI API key
- (Optional) A Google Gemini API key for Gemini-based image generation and benchmarking

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/bogganpierce/coloringbook.git
   cd coloringbook
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key

   # OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key

   # Gemini Configuration (optional)
   GOOGLE_API_KEY=your_gemini_api_key
   GEMINI_IMAGE_MODEL=gemini-2.5-flash-image-preview
   GEMINI_API_BASE_URL=https://generativelanguage.googleapis.com/v1beta

   # Image Generation Defaults (optional)
   IMAGE_GENERATION_PROVIDER=openai
   OPENAI_IMAGE_COST_USD=0.00
   GEMINI_IMAGE_COST_USD=0.00

   # App Configuration
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Set up Supabase**
   
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
   CREATE POLICY "Users can insert images" ON images FOR INSERT WITH CHECK (true);
   CREATE POLICY "Users can view images" ON images FOR SELECT USING (true);
   CREATE POLICY "Users can update their images" ON images FOR UPDATE USING (user_id = 'anonymous' OR auth.uid()::text = user_id);

   -- Storage policies
   CREATE POLICY "Anyone can upload images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'images');
   CREATE POLICY "Anyone can view images" ON storage.objects FOR SELECT USING (bucket_id = 'images');
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   
   Visit [http://localhost:3000](http://localhost:3000)

   > **Note**: The development environment is password-protected with: `parkcityutah`

## 🔬 Evaluating image providers

Use the `/api/evaluate-image-providers` route to compare OpenAI and Gemini results side-by-side. The endpoint accepts the same `imageUrl` you send to the standard generator and optionally a custom prompt, target age, detail level, or explicit provider list.

```http
POST /api/evaluate-image-providers
Content-Type: application/json

{
  "imageUrl": "https://example.com/source-photo.jpg",
  "age": 6,
  "providers": ["openai", "gemini"],
  "prompt": "Keep the composition playful but faithful to the original photo."
}
```

Each provider response contains the public URL for the generated page plus timing, usage, and cost metadata so you can track quality versus spend.

## 🚀 Deploy to Vercel

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fbogganpierce%2Fcoloringbook)

### Manual Deployment

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Connect to Vercel**
   - Visit [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js settings

3. **Configure Environment Variables**
   
   Add these in your Vercel project settings:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key
   OPENAI_API_KEY=your_openai_api_key
   NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
   ```

4. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy automatically
   - Your app will be live at `https://your-project.vercel.app`

### Vercel CLI Alternative

```bash
# Install Vercel CLI
npm i -g vercel

# Login and deploy
vercel login
vercel

# Add environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add OPENAI_API_KEY
vercel env add NEXT_PUBLIC_APP_URL

# Deploy to production
vercel --prod
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | ✅ |
| `OPENAI_API_KEY` | OpenAI API key with access to Responses API | ✅ |
| `NEXT_PUBLIC_APP_URL` | Your app's URL for proper redirects | ✅ |

### Supabase Configuration

1. **Storage Bucket**: Create a public bucket named `images`
2. **RLS Policies**: Set up row-level security for user data protection
3. **Real-time**: Enable real-time subscriptions for live updates

### OpenAI Configuration

- Ensure your API key has access to the **Responses API** (not DALL-E directly)
- The system uses base64 image input for processing
- Custom prompts are supported for regeneration

## 🐛 Troubleshooting

### Common Issues

**Images not processing:**
- Check OpenAI API key and organization access
- Verify Supabase storage policies are public
- Check browser console for error messages

**Real-time updates not working:**
- Ensure Supabase real-time is enabled
- Check network connectivity
- Verify subscription setup in code

**Deployment issues:**
- Confirm all environment variables are set
- Check Vercel build logs
- Verify Supabase project is accessible

### Debug Logging

The app includes extensive console logging with emoji indicators:
- 🚀 Process started
- ✅ Success
- ❌ Error
- 🔄 Processing

Check browser console and Vercel logs for detailed information.

## 🔧 API Reference

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/generate-coloring-page` | Main AI processing endpoint - converts uploaded image to coloring page |
| `POST` | `/api/regenerate-coloring-page` | Regenerate coloring page with custom prompts |
| `POST` | `/api/retry-processing` | Retry failed image processing |
| `DELETE` | `/api/images/[id]` | Delete image and associated coloring page |
| `GET` | `/api/download/[id]` | Download coloring page with proper headers |

### Album & Sharing
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/family-albums` | Create shareable family album |
| `GET` | `/api/family-albums/[shareCode]` | Access shared album by code |
| `POST` | `/api/generate-photobook` | Generate PDF photobook from multiple images |

### Image Processing Flow
1. **Upload** → Image stored in Supabase Storage
2. **Database Insert** → Record created with `status: 'processing'`
3. **AI Processing** → OpenAI Responses API generates coloring page
4. **Watermarking** → Sharp library adds watermark
5. **Storage** → Processed image saved to Supabase Storage
6. **Status Update** → Real-time notification via Supabase subscriptions

## 🎯 Usage Examples

### Basic Upload & Processing
```typescript
// Upload image and start processing
const response = await fetch('/api/generate-coloring-page', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    imageId: 'uuid-here',
    userId: 'user-id-here'
  })
});
```

### Custom Regeneration
```typescript
// Regenerate with custom prompt
const response = await fetch('/api/regenerate-coloring-page', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    imageId: 'uuid-here',
    customPrompt: 'Create a simpler coloring page with fewer details'
  })
});
```

### Real-time Status Updates
```typescript
// Subscribe to real-time updates
const subscription = supabase
  .channel('images_changes')
  .on('postgres_changes', { 
    event: 'UPDATE', 
    schema: 'public', 
    table: 'images' 
  }, (payload) => {
    console.log('Image status updated:', payload.new);
  })
  .subscribe();
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is private and proprietary.