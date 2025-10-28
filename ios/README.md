# ColoringBook iOS Client

This directory contains a lightweight SwiftUI client that integrates with the existing Next.js/Supabase backend. It is designed as a starting point for a native implementation and keeps most business logic on the server.

## Getting started

1. Open Xcode 15 or newer.
2. Double-click `ColoringBookApp/ColoringBookApp.xcodeproj` and select the **ColoringBookApp** scheme.
3. Update the placeholder values in `ColoringBookApp/AppConfig.swift` with your Supabase project URL, anon key, and the base URL of the deployed web backend. If you prefer to keep secrets out of source control, duplicate the file to `AppConfig.local.swift`, update the project reference in Xcode, and add the new file to `.gitignore`.
4. When prompted, resolve the Swift Package Manager dependency on [`supabase-swift`](https://github.com/supabase-community/supabase-swift). Xcode will fetch version `1.x` automatically because the project pins the dependency to the next major release.
5. Run the app on an iOS 17+ simulator. You should be able to authenticate, upload an image from the photo library, and request a new coloring page.
6. Add an application icon by placing a `1024x1024` PNG at `ColoringBookApp/Assets.xcassets/AppIcon.appiconset/AppIcon.png`. The asset catalog entry is checked in without an image so the repository stays binary-free.

## Project structure

- `ColoringBookApp.swift`: Entry point that wires up shared view models.
- `Views/ContentView.swift`: High-level navigation and state handling for authentication and job status.
- `Services/SupabaseSession.swift`: Observable object that exposes Supabase auth state and user metadata.
- `Services/ColoringPageService.swift`: Minimal API client that calls the mobile-focused API routes (`/api/mobile/images` and `/api/mobile/upload`) plus the existing `/api/generate-coloring-page` endpoint.
- `Models/ImageJob.swift`: Shared model describing the Supabase `images` table entries.

## Next steps

- Expand the UI with dedicated flows for viewing albums and photobooks.
- Implement realtime listeners (Supabase Realtime) to automatically refresh job status instead of manual polling.
- Add caching and background tasks for long-running jobs so users receive notifications when a coloring page is ready.
- Wrap uploads in a dedicated `UploadService` that streams large files directly to Supabase storage.
