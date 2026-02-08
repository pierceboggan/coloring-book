# iOS AGENTS.md
# ColoringBook iOS App - Agent Instructions

## Overview
Native iOS application port of ColoringBook.AI web app, built with SwiftUI and Supabase.

## Architecture

### Tech Stack
- **Framework**: SwiftUI with iOS 16+ deployment target
- **Architecture**: MVVM (Model-View-ViewModel) pattern
- **Backend**: Supabase (Auth, Firestore, Storage, Analytics)
- **AI Processing**: OpenAI API for image-to-coloring-page conversion
- **Drawing**: PencilKit for digital coloring experience
- **Languages**: Swift 6.0

### Project Structure
```
ColoringBook/
├── ColoringBook/               # Main app code
│   ├── Models/                 # Data models matching web app schema
│   │   └── Models.swift
│   ├── Views/                  # SwiftUI views
│   │   ├── WelcomeView.swift
│   │   ├── AuthView.swift
│   │   ├── MainTabView.swift
│   │   ├── DashboardView.swift
│   │   ├── ImageUploadView.swift
│   │   ├── ColoringCanvasView.swift  # Primary feature!
│   │   ├── KidModeView.swift
│   │   ├── AlbumsView.swift
│   │   └── SettingsView.swift
│   ├── ViewModels/             # View models for business logic
│   │   ├── DashboardViewModel.swift
│   │   ├── ImageUploadViewModel.swift
│   │   ├── ColoringCanvasViewModel.swift
│   │   ├── KidModeViewModel.swift
│   │   └── AlbumsViewModel.swift
│   ├── Services/               # Service layer
│   │   ├── SupabaseService.swift
│   │   └── OpenAIService.swift
│   ├── Utils/                  # Utility extensions
│   │   └── Color+Hex.swift
│   ├── Resources/              # Assets, config files
│   ├── ColoringBookApp.swift   # App entry point
│   └── ContentView.swift       # Root view
├── ColoringBookTests/          # Unit tests
│   └── ColoringBookTests.swift
├── ColoringBookUITests/        # UI tests
│   └── ColoringBookUITests.swift
└── Package.swift               # Swift Package Manager dependencies
```

## Core Features

### 1. Digital Coloring Canvas (Primary Experience)
- **Location**: `Views/ColoringCanvasView.swift`
- Uses PencilKit for smooth, responsive drawing
- Supports Apple Pencil on iPad with pressure sensitivity
- Multiple brush types: pen, marker, brush
- Color palette with preset colors and custom picker
- Adjustable brush size (2-30px)
- Undo/redo functionality (15-level history)
- Save artwork to Supabase and Photos library
- Optimized for both iPhone and iPad

### 2. Kid Mode
- **Location**: `Views/KidModeView.swift`
- Locks app to coloring-only experience
- PIN code protection (default: 1234)
- Parent access via hidden unlock button
- Shows only completed coloring pages
- Colorful, child-friendly UI

### 3. Image Upload & AI Processing
- **Location**: `Views/ImageUploadView.swift`, `Services/OpenAIService.swift`
- Camera and photo library access
- Image compression and optimization
- Supabase Storage upload with progress tracking
- OpenAI API integration for coloring page generation
- Automatic watermarking
- Real-time status updates via Firestore

### 4. Dashboard & Gallery
- **Location**: `Views/DashboardView.swift`
- Grid view of user's coloring pages
- Status badges (uploading, processing, ready)
- Pull-to-refresh for real-time updates
- Direct access to coloring canvas

### 5. Authentication
- **Location**: `Views/AuthView.swift`, `Services/SupabaseService.swift`
- Email/password authentication via Supabase
- Sign in and sign up flows
- Session management
- Secure token storage

## Development Workflow

### Setup
1. Open `ios/ColoringBook/Package.swift` in Xcode or use command line:
   ```bash
   cd ios/ColoringBook
   swift build
   ```

2. Configure Supabase:
   - Download `GoogleService-Info.plist` from Supabase Console
   - Add to Xcode project at root level
   - Ensure bundle ID matches: `com.coloringbook.app`

3. Set environment variables:
   - `OPENAI_API_KEY`: OpenAI API key for image processing

### Building & Running
```bash
# Build
xcodebuild -scheme ColoringBook -destination 'platform=iOS Simulator,name=iPhone 15 Pro'

# Run tests
xcodebuild test -scheme ColoringBook -destination 'platform=iOS Simulator,name=iPhone 15 Pro'

# Run on device (requires signing configuration)
xcodebuild -scheme ColoringBook -destination 'platform=iOS,name=YOUR_DEVICE'
```

### Testing
- **Unit Tests**: Business logic, models, view models
- **UI Tests**: User flows, navigation, key interactions
- **Manual Testing**: Drawing experience, offline mode, kid mode

## Supabase Schema

### Collections
- **users**: User profiles and settings
  - `id`, `email`, `display_name`, `created_at`, `is_kid_mode_enabled`

- **images**: Coloring page records
  - `id`, `user_id`, `original_url`, `coloring_page_url`, `name`, `status`, `created_at`, `updated_at`

- **colored_artworks**: User's colored creations
  - `id`, `image_id`, `user_id`, `artwork_url`, `thumbnail_url`, `created_at`

- **family_albums**: Shared albums
  - `id`, `name`, `share_code`, `image_ids`, `created_by`, `created_at`

### Storage Buckets
- **images/**: Original photos and generated coloring pages
- **artworks/**: User's colored artwork saves

## Offline Support
- Supabase local persistence enabled
- Cached images for offline viewing
- Queue system for uploads when connection restored
- Offline indicator in UI

## Coding Conventions
- Follow Swift API Design Guidelines
- Use MARK comments to organize code sections
- ViewModels must be `@MainActor` for thread safety
- Published properties for reactive UI updates
- Async/await for asynchronous operations
- Error handling with descriptive messages
- Logging with emoji prefixes (✅, ❌, 🚀) for easy debugging

## Key Differences from Web App
1. **Native Drawing**: PencilKit instead of HTML5 Canvas
2. **Offline-First**: Local persistence with Supabase sync
3. **Kid Mode**: Mobile-specific parental control feature
4. **Apple Pencil**: Pressure sensitivity and palm rejection on iPad
5. **Photos Integration**: Save directly to Photos library
6. **Haptic Feedback**: Enhanced touch interactions
7. **Dark Mode**: Native iOS dark mode support

## Common Tasks

### Adding a New Feature
1. Create model in `Models/` if needed
2. Create view in `Views/`
3. Create view model in `ViewModels/` for business logic
4. Add service methods in appropriate service file
5. Write unit tests in `ColoringBookTests/`
6. Write UI tests in `ColoringBookUITests/`

### Debugging
- Use Xcode's built-in debugger and breakpoints
- Check console for emoji-prefixed logs
- Supabase Console for backend debugging
- Network Link Conditioner for offline testing

### Updating Dependencies
```bash
cd ios/ColoringBook
swift package update
```

## CI/CD
- GitHub Actions workflow: `.github/workflows/ios-ci.yml`
- Runs on every push to `main` and `develop`
- Builds for iPhone and iPad simulators
- Runs unit and UI tests
- SwiftLint for code quality
- Test results uploaded as artifacts

## Deployment
- TestFlight for beta distribution
- App Store Connect for production releases
- Requires Apple Developer Program membership
- Follow Apple's Human Interface Guidelines
- Ensure compliance with App Store Review Guidelines

## Future Enhancements
- [ ] iCloud sync across devices
- [ ] Widgets for quick access to recent pages
- [ ] Siri Shortcuts integration
- [ ] Share Extension for importing from other apps
- [ ] Today Extension with coloring page of the day
- [ ] Apple Sign In
- [ ] Push notifications for processing completion
- [ ] Advanced drawing tools (layers, blend modes)
- [ ] Social sharing features
- [ ] In-app purchases for premium features
