# Android AGENTS.md
# ColoringBook Android App - Agent Instructions

## Overview
Native Android application port of ColoringBook.AI, built with Kotlin and Jetpack Compose sharing the same Supabase backend as the web and iOS apps.

## Architecture

### Tech Stack
- **Language**: Kotlin 2.1
- **UI**: Jetpack Compose with Material 3
- **Architecture**: MVVM + Repository pattern
- **DI**: Hilt (Dagger)
- **Backend**: Supabase Kotlin SDK (Auth, Database, Storage, Realtime)
- **AI Processing**: Delegates to shared Next.js API (`/api/generate-coloring-page`)
- **Image Loading**: Coil
- **Drawing**: Android Canvas API (Compose Canvas)
- **Offline**: Room database + DataStore preferences
- **Monitoring**: Sentry Android SDK
- **Build**: Gradle Kotlin DSL with version catalogs

### Project Structure
```
android/
├── app/
│   ├── build.gradle.kts
│   ├── proguard-rules.pro
│   └── src/
│       ├── main/
│       │   ├── AndroidManifest.xml
│       │   ├── java/com/coloringbook/ai/
│       │   │   ├── ColoringBookApp.kt          # Application class (Hilt entry)
│       │   │   ├── MainActivity.kt             # Single activity host
│       │   │   ├── data/
│       │   │   │   ├── model/Models.kt         # Data classes matching Supabase schema
│       │   │   │   ├── local/
│       │   │   │   │   ├── AppDatabase.kt      # Room database
│       │   │   │   │   ├── dao/                # Room DAOs
│       │   │   │   │   └── entity/             # Room entities
│       │   │   │   └── repository/             # Repository layer
│       │   │   ├── di/
│       │   │   │   ├── AppModule.kt            # Supabase client provision
│       │   │   │   └── DatabaseModule.kt       # Room database provision
│       │   │   ├── service/
│       │   │   │   ├── SupabaseService.kt      # Auth, DB, Storage operations
│       │   │   │   ├── WebApiService.kt        # Calls shared Next.js API
│       │   │   │   └── NetworkMonitor.kt       # Connectivity tracking
│       │   │   ├── ui/
│       │   │   │   ├── auth/                   # Sign in/up screens + ViewModel
│       │   │   │   ├── dashboard/              # Gallery grid + ViewModel
│       │   │   │   ├── upload/                 # Photo upload + processing
│       │   │   │   ├── canvas/                 # Drawing canvas + tools
│       │   │   │   ├── albums/                 # Family albums
│       │   │   │   ├── kidmode/                # Kid mode (PIN locked)
│       │   │   │   ├── settings/               # App settings
│       │   │   │   ├── navigation/             # Nav graph + bottom tabs
│       │   │   │   └── theme/                  # Material 3 theme
│       │   │   └── util/                       # Utilities
│       │   └── res/                            # Android resources
│       ├── test/                               # Unit tests
│       └── androidTest/                        # Instrumented tests
├── build.gradle.kts                            # Root build config
├── settings.gradle.kts
├── gradle.properties
└── gradle/
    ├── wrapper/
    └── libs.versions.toml                      # Version catalog
```

## Core Features

### 1. Digital Coloring Canvas
- **Location**: `ui/canvas/`
- Custom Compose Canvas with touch/stylus drawing
- 11 preset colors + adjustable brush size (2-30px)
- 15-level undo/redo stack
- Coloring page loaded as background image
- Save artwork to storage

### 2. Kid Mode
- **Location**: `ui/kidmode/`
- PIN-protected (default: 1234) via DataStore
- Horizontal pager showing only completed coloring pages
- Hidden unlock button in top-right corner
- Full-screen lock to coloring-only experience

### 3. Image Upload & AI Processing
- **Location**: `ui/upload/`
- Photo picker (gallery) and camera capture
- JPEG compression at 80% quality
- Upload to Supabase Storage → create DB record → trigger AI via WebApiService
- Progress tracking: Compressing → Uploading → Processing → Complete

### 4. Dashboard Gallery
- **Location**: `ui/dashboard/`
- LazyVerticalGrid (2 columns) with async image loading
- Status badges (Uploading, Processing, Ready, Error)
- Pull-to-refresh, favorite toggle, delete
- Navigate to canvas for coloring

### 5. Family Albums
- **Location**: `ui/albums/`
- Create albums with auto-generated 8-char share codes
- Share via Android intent system
- Copy share code to clipboard

### 6. Authentication
- **Location**: `ui/auth/`
- Email/password via Supabase Auth
- Session state observed via `SessionStatus` flow
- Automatic routing between auth and main screens

## Development Workflow

### Setup
1. Clone the repository
2. Open `android/` in Android Studio
3. Create `local.properties` with Supabase config:
   ```properties
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   WEB_API_BASE_URL=https://coloringbook.ai
   SENTRY_DSN=your-sentry-dsn
   ```
4. Sync Gradle and run on device/emulator

### Building & Running
```bash
cd android

# Debug build
./gradlew assembleDebug

# Release build
./gradlew assembleRelease

# Run unit tests
./gradlew test

# Run instrumented tests
./gradlew connectedAndroidTest

# Lint check
./gradlew lint
```

### Environment Variables
Config values are read from `local.properties` or system environment:
- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_ANON_KEY` — Supabase anonymous key
- `WEB_API_BASE_URL` — Web API base URL (defaults to https://coloringbook.ai)
- `SENTRY_DSN` — Sentry DSN for error tracking

## Supabase Schema (Shared)
Same schema as web and iOS apps:
- **images**: `id`, `user_id`, `original_url`, `coloring_page_url`, `name`, `status`, `created_at`
- **family_albums**: `id`, `name`, `share_code`, `image_ids[]`, `created_by`, `created_at`
- **colored_artworks**: `id`, `image_id`, `user_id`, `artwork_url`, `created_at`

## Coding Conventions
- MVVM with `@HiltViewModel` and `StateFlow`
- Compose UI with Material 3 components
- Coroutines for all async operations
- Console logging with emoji prefixes (🚀, ✅, ❌) matching iOS/web conventions
- `@Singleton` services injected via Hilt
- Room for offline persistence, DataStore for preferences

## Key Differences from iOS
1. **Drawing**: Compose Canvas API instead of PencilKit
2. **Offline**: Room database instead of CoreData
3. **Preferences**: DataStore instead of UserDefaults
4. **Navigation**: Compose Navigation instead of SwiftUI NavigationStack
5. **DI**: Hilt instead of manual singletons
6. **Sharing**: Android Intent system instead of UIActivityViewController
7. **Permissions**: Accompanist permissions library

## Common Tasks

### Adding a New Screen
1. Create ViewModel in `ui/feature/FeatureViewModel.kt`
2. Create Composable screen in `ui/feature/FeatureScreen.kt`
3. Add route to `Screen` sealed class in `navigation/Screen.kt`
4. Add composable to `AppNavHost.kt`
5. Add service methods if needed

### Debugging
- Check Logcat for emoji-prefixed logs (filter by tag)
- Supabase Dashboard for backend state
- Android Studio Layout Inspector for Compose debugging
- Network Inspector for API calls
