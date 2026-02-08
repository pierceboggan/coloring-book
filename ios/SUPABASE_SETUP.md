# Supabase Setup Guide for ColoringBook iOS

## Prerequisites
- Supabase account (same project as web app)
- Xcode 15.0+
- ColoringBook iOS project

## Step 1: Use Existing Supabase Project

The iOS app uses the **same Supabase project** as the web app. You don't need to create a new project - just use your existing configuration.

## Step 2: Get Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

## Step 3: Configure iOS App

### Option A: Environment Variables (Recommended for Development)

1. In Xcode, select the ColoringBook scheme
2. Edit Scheme → Run → Arguments → Environment Variables
3. Add:
   - `SUPABASE_URL`: Your project URL
   - `SUPABASE_ANON_KEY`: Your anon key
   - `OPENAI_API_KEY`: Your OpenAI API key

### Option B: Info.plist (For Production)

Add to your `Info.plist`:
```xml
<key>SUPABASE_URL</key>
<string>https://xxxxx.supabase.co</string>

<key>SUPABASE_ANON_KEY</key>
<string>eyJhbGc...</string>
```

⚠️ **Note**: For production, consider using a configuration file or secure key management.

## Step 4: Database Schema

The iOS app uses the **same tables** as the web app. No additional setup needed if you've already set up the web app.

### Tables Used
- `images`: Coloring page records
- `album_images`: Album-image relationships
- `family_albums`: Shared albums
- `photobook_jobs`: PDF generation jobs
- `photobooks`: Created photobooks

See the web app's Supabase setup for the full schema.

## Step 5: Storage Buckets

The iOS app uses the **same storage bucket** (`images`) as the web app.

### Storage Structure
```
images/
  {uuid}-{filename}.jpg   # Original photos
  coloring-{filename}.jpg # Generated coloring pages
  artworks/{uuid}.png     # User's colored artwork
```

## Step 6: Row Level Security (RLS)

The iOS app follows the same RLS policies as the web app. If you've already configured the web app, you're all set.

Key policies:
- Users can only access their own images
- Users can create new images
- Users can update/delete their own images
- Family albums are readable by anyone with the share code

## Step 7: Real-time Subscriptions

The iOS app uses Supabase real-time for live updates. Ensure real-time is enabled in your Supabase project:

1. Go to **Database** → **Replication**
2. Enable replication for the `images` table
3. Select events: `INSERT`, `UPDATE`, `DELETE`

## Step 8: Test Connection

1. Build and run the app in Xcode (`Cmd+R`)
2. Check Xcode console for connection logs:
   - ✅ "User signed in" when logging in
   - ✅ "Image uploaded" when uploading
   - ✅ "Fetched N images" when loading dashboard

## Troubleshooting

### Connection Failed
- Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correct
- Check network connectivity
- Ensure Supabase project is active

### Authentication Errors
- Verify email/password authentication is enabled in Supabase
- Check RLS policies allow user creation
- Review Supabase auth logs

### Storage Upload Failed
- Verify storage policies allow authenticated uploads
- Check bucket name is `images`
- Ensure file size is within limits

### Real-time Not Working
- Verify real-time is enabled in Supabase dashboard
- Check replication settings for `images` table
- Review network connectivity

## Testing Checklist

- [ ] User can sign up
- [ ] User can sign in
- [ ] Images upload to Storage
- [ ] Database records are created
- [ ] Real-time updates work (image status changes)
- [ ] Offline persistence works
- [ ] Albums can be created
- [ ] Share codes work

## Environment Variables Summary

Required for iOS app:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anon/public key
- `OPENAI_API_KEY`: Your OpenAI API key

## Production Considerations

Before deploying to production:

1. **Secure Keys**: Use secure configuration management
2. **Rate Limiting**: Configure rate limits in Supabase
3. **Monitoring**: Enable Supabase logging and alerts
4. **Backups**: Ensure automated backups are configured
5. **Cost Monitoring**: Set up billing alerts

## Differences from Web App

The iOS app implementation:
- Uses `supabase-swift` SDK (vs `@supabase/ssr` on web)
- Implements native Swift types for models
- Uses Swift's async/await (vs Promises on web)
- Includes offline-first Core Data persistence
- Otherwise shares the same backend and schema

## Additional Resources

- [Supabase Swift Documentation](https://github.com/supabase/supabase-swift)
- [Supabase Documentation](https://supabase.com/docs)
- [Web App Supabase Setup](../README.md) - For full schema reference
