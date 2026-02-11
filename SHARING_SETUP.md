# Social Sharing Feature Setup

This document explains how to set up and use the social sharing feature for ColoringBook.AI.

## Database Setup

### Option 1: Using Supabase Dashboard (Recommended for Production)

1. Log in to your Supabase dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `supabase/migrations/*_create_shared_pages_table.sql`
4. Run the SQL script
5. Verify the table was created by checking the Table Editor

### Option 2: Using Supabase CLI (Recommended for Development)

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Apply migrations
supabase db push

# Or run specific migration
supabase db execute --file supabase/migrations/*_create_shared_pages_table.sql
```

## Environment Variables

Make sure you have the following environment variables set in your `.env.local`:

```bash
NEXT_PUBLIC_APP_URL=https://your-domain.com  # Or http://localhost:3000 for development
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key
```

## Features

### For Users

- **Share Individual Pages**: Users can share any completed coloring page with a unique link
- **Multiple Sharing Options**: 
  - Copy shareable link
  - Share via Twitter
  - Share via Facebook
  - Share via WhatsApp
  - Native mobile sharing
- **Public View Page**: Recipients can view, print, and color pages online without an account
- **Social Media Previews**: Automatic Open Graph and Twitter Card metadata for rich link previews

### Technical Details

#### API Endpoints

- `POST /api/share` - Create a shareable link for an image
- `GET /api/share/[shareCode]` - Retrieve shared page data

#### Database Schema

```sql
shared_pages (
  id UUID PRIMARY KEY,
  image_id UUID REFERENCES images(id),
  user_id UUID,
  share_code TEXT UNIQUE,
  created_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  view_count INTEGER,
  is_variant BOOLEAN,
  variant_url TEXT
)
```

#### Share Codes

- 8-character alphanumeric codes (excluding confusing characters like 0/O, 1/I/l)
- Format: `ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789`
- Example: `aBc3dEf7`

## Usage

### Creating a Share

From the dashboard:
1. Click the Share button on any completed coloring page
2. A unique share link is automatically generated
3. Copy the link or use the social sharing buttons

### Viewing a Shared Page

Recipients can:
1. Click the shared link (e.g., `https://your-domain.com/share/aBc3dEf7`)
2. View the coloring page
3. Download the image
4. Print the page
5. Color online using the built-in canvas
6. Share with others

## Security

- Row Level Security (RLS) is enabled on the `shared_pages` table
- Users can only create/delete their own shares
- Public can view shares via share_code (read-only)
- Service role operations bypass RLS for API functionality

## Analytics

- View counts are automatically tracked when a share is accessed
- View count increments on each page load
- Can be used to measure viral growth and engagement

## Future Enhancements

Potential improvements:
- Expiration dates for shares (optional)
- Password protection for sensitive shares
- Custom share codes (vanity URLs)
- Share analytics dashboard
- Share comments/reactions
- Batch sharing (multiple pages)
