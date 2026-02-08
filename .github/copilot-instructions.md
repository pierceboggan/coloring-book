# ColoringBook.AI - AI Agent Instructions

## Architecture Overview

**Core Flow**: User uploads photos → AI generates coloring pages → User creates photobooks/albums
- Next.js 15 App Router with TypeScript
- Supabase for database, storage, and authentication
- OpenAI Responses API for image-to-coloring-page conversion
- Sentry for error monitoring, extensive console logging

## Key Components & Data Flow

### Image Processing Pipeline
1. **Upload** (`src/components/ImageUploader.tsx`) → Supabase Storage
2. **Database Insert** → `images` table with `status: 'processing'`
3. **Background Processing** → `/api/generate-coloring-page` calls OpenAI
4. **Result Storage** → Processed coloring page with watermark
5. **Status Update** → `status: 'completed'`, real-time updates via Supabase subscriptions

### Database Schema (`src/lib/supabase.ts`)
```typescript
images: {
  id: string, user_id: string, original_url: string, 
  coloring_page_url: string | null, name: string,
  status: 'uploading' | 'processing' | 'completed' | 'error'
}
```

### Authentication Pattern
- **Development**: Password protection (`parkcityutah`) via `PasswordProtection` component
- **Production**: Supabase Auth with React Context (`src/contexts/AuthContext.tsx`)
- **Middleware**: Server-side auth handling with cookie management

## Critical Implementation Details

### OpenAI Integration (`src/lib/openai.ts`)
- Uses **Responses API** (not DALL-E directly) with base64 image input
- Prompt: "Create a black and white coloring book page..." with specific styling requirements
- Image watermarking via Sharp library (`src/lib/imageProcessor.ts`)
- Extensive error handling and logging

### API Route Patterns
- **POST** `/api/generate-coloring-page` - Main AI processing endpoint
- **GET/POST** `/api/family-albums/[shareCode]` - Album sharing functionality
- **DELETE** `/api/images/[id]` - Image cleanup
- All routes use `supabaseAdmin` for server-side operations

### Real-time Updates
Dashboard uses Supabase real-time subscriptions with fallback polling:
```typescript
subscription = supabase.channel('images_changes')
  .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'images' }, ...)
```

## Development Workflow

### Setup & Environment
```bash
npm install
# Required env vars in .env.local:
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, 
SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY
npm run dev
```

### Key Files to Understand
- `src/app/page.tsx` - Landing page with upload flow
- `src/app/dashboard/page.tsx` - User image management
- `src/components/PhotobookCreator.tsx` - PDF generation with jsPDF
- `src/components/FamilyAlbumCreator.tsx` - Shareable album creation

### Error Handling Conventions
- Console logging with emojis (🚀, ❌, ✅) for easy debugging
- Sentry integration with span tracking
- Graceful degradation (watermarking failures return original image)
- Status-based UI states with proper loading indicators

## Project-Specific Patterns

### Client-Server Communication
- Use `supabase` client for user operations
- Use `supabaseAdmin` for privileged server operations
- All mutations update status fields for UI feedback

### Image Processing
- Sharp for watermarking and image manipulation
- Supabase Storage for both original and processed images
- Base64 conversion for OpenAI API compatibility

### Feature Flags & Development
- Password protection for development environment
- Subscription-based limits (max 20 pages per photobook)
- Watermark system for free tier (future premium feature)

## Common Tasks

### Adding New Image Processing Features
1. Extend the `generateColoringPageWithCustomPrompt` function
2. Update the `images` table schema if needed
3. Add UI controls in `RegenerateModal` component
4. Test with various image types and sizes

### Debugging Processing Issues
1. Check console logs with emoji patterns
2. Verify OpenAI API key and organization
3. Check Supabase storage policies and bucket configuration
4. Monitor real-time subscription connectivity

### Adding New API Endpoints
- Follow the pattern in `/api/generate-coloring-page/route.ts`
- Use proper error handling and Sentry tracking
- Include detailed console logging
- Use `supabaseAdmin` for privileged operations

