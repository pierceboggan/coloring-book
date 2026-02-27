# ColoringBook Android App

Native Android companion app for [ColoringBook.AI](https://coloringbook.ai), built with Kotlin and Jetpack Compose.

## Features

- 📸 **Photo Upload** — Pick from gallery or take a photo to transform into a coloring page
- 🎨 **Digital Coloring** — Touch/stylus drawing canvas with colors, brush sizes, undo/redo
- 👶 **Kid Mode** — PIN-locked coloring-only experience for children
- 📚 **Family Albums** — Create and share coloring page albums with share codes
- 📱 **Offline Support** — Room database caching for offline viewing
- 🔐 **Authentication** — Email/password via Supabase Auth

## Setup

1. Open `android/` folder in Android Studio
2. Copy `local.properties.example` and fill in your Supabase credentials:
   ```properties
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   ```
3. Sync Gradle and run on device or emulator (API 26+)

## Tech Stack

- **Kotlin 2.1** + **Jetpack Compose** (Material 3)
- **Hilt** for dependency injection
- **Supabase Kotlin SDK** for backend
- **Coil** for image loading
- **Room** for offline database
- **Sentry** for error monitoring

## Architecture

MVVM pattern with:
- `ui/` — Compose screens and ViewModels
- `service/` — Supabase and API services
- `data/` — Models, Room entities, DAOs
- `di/` — Hilt modules

See [AGENTS.md](AGENTS.md) for detailed architecture documentation.
