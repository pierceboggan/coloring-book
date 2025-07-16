# AI Coloring Book - Copilot Instructions

## Project Overview
This is a Next.js 15 app that transforms photos into coloring pages using OpenAI's Responses API. Users upload images, which are processed into black-and-white line art suitable for coloring.

## Core Architecture

### Tech Stack
- **Frontend**: Next.js 15 App Router, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes, Supabase (database + auth + storage)
- **AI**: OpenAI Responses API (gpt-4o model)
- **Monitoring**: Sentry for error tracking and performance monitoring
- **Deployment**: Vercel with environment variables

### Key Components Flow
1. **Upload**: `ImageUploader` → Supabase Storage → Database record
2. **Processing**: API calls `generateColoringPage()` → OpenAI Responses API → Updates database
3. **Dashboard**: Real-time subscription to database changes + polling fallback
4. **Sharing**: Family albums with shareable codes

## Critical Developer Knowledge

### Authentication Pattern
- **Development**: Password protection (`parkcityutah`) via `PasswordProtection` component
- **User Auth**: Supabase auth with email/password via `AuthContext`
- **Database**: RLS policies enforce user isolation

### API Route Structure
- `POST /api/generate-coloring-page` - Main AI processing endpoint
- `GET /api/family-albums/[shareCode]` - Public album sharing
- `DELETE /api/images/[id]` - Image deletion with cleanup
- All routes use Sentry spans for monitoring

### Database Schema (Supabase)
```typescript
images: {
  id: string
  user_id: string
  original_url: string
  coloring_page_url: string | null
  name: string
  status: 'uploading' | 'processing' | 'completed' | 'error'
  created_at: string
  updated_at: string
}
```

### OpenAI Integration Pattern
- Uses **Responses API** (not Chat Completions)
- Converts images to base64 for API calls
- Standard prompt: "Create a black and white coloring book page... bold black outlines, no shading..."
- Custom prompts supported via `generateColoringPageWithCustomPrompt()`

## Development Workflow

### Environment Setup
Required `.env.local` variables:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
NEXT_PUBLIC_APP_URL=
```

### Common Commands
```bash
npm run dev          # Development server
npm run build        # Production build
npm run lint         # ESLint checking
```

### Real-time Updates
Dashboard uses dual approach:
1. **Primary**: Supabase real-time subscriptions
2. **Fallback**: Polling every 3 seconds if real-time fails

## Key Conventions

### Error Handling
- All API routes wrapped in Sentry spans
- Console logging with emoji prefixes (🚀, ✅, ❌, 🎨)
- Status tracking in database (`processing` → `completed` | `error`)

### Component Patterns
- All interactive components are client-side (`'use client'`)
- Context providers at root level (`AuthProvider`, `PasswordProtection`)
- Consistent loading states with Lucide React icons

### File Organization
- `/api/` - Next.js API routes
- `/components/` - Reusable UI components
- `/contexts/` - React contexts
- `/lib/` - Utility functions (supabase, openai, etc.)

## Common Tasks

### Adding New Features
1. Check if user authentication is required
2. Add API route with Sentry monitoring
3. Update database schema if needed
4. Add real-time subscription for live updates

### Debugging AI Issues
- Check OpenAI API limits and usage
- Verify base64 image conversion is working
- Monitor Sentry for AI processing errors
- Test with different image formats/sizes

### Database Operations
- Use `supabaseAdmin` for service role operations
- Use `supabase` for client-side operations
- All user data is isolated via RLS policies
