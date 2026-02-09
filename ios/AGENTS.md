# iOS AGENTS.md
# ColoringBook iOS App - Agent Instructions

## Overview
Native iOS application port of ColoringBook.AI web app, built with SwiftUI and Supabase (shared backend with the web app).

## Architecture

### Tech Stack
- **Framework**: SwiftUI with iOS 16+ deployment target
- **Architecture**: MVVM (Model-View-ViewModel) pattern
- **Backend**: Supabase (Auth, Database, Storage) — same project as the web app
- **AI Processing**: OpenAI API for image-to-coloring-page conversion
- **Drawing**: PencilKit for digital coloring experience
- **Monitoring**: Sentry for error tracking and performance monitoring
- **Languages**: Swift 5 (compiled with Swift 6 compiler)
- **Project Generation**: XcodeGen (`project.yml`)

### Project Structure
```
ColoringBook/
├── project.yml                 # XcodeGen project definition
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
│   │   ├── OpenAIService.swift
│   │   ├── SentryService.swift
│   │   ├── NetworkMonitor.swift
│   │   └── OfflinePersistence.swift
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
- Save artwork to Supabase Storage and Photos library
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
- Real-time status updates via Supabase subscriptions

### 4. Dashboard & Gallery
- **Location**: `Views/DashboardView.swift`
- Grid view of user's coloring pages
- Status badges (uploading, processing, ready)
- Pull-to-refresh for real-time updates
- Direct access to coloring canvas

### 5. Authentication
- **Location**: `Views/AuthView.swift`, `Services/SupabaseService.swift`
- Email/password authentication via Supabase Auth
- Email/password authentication via Supabase
- Sign in and sign up flows
- Session management
- Secure token storage

## Development Workflow

### Setup
1. Install XcodeGen and generate the project:
   ```bash
   brew install xcodegen
   cd ios/ColoringBook
   xcodegen generate
   ```

2. Open `ColoringBook.xcodeproj` in Xcode. Dependencies resolve automatically.

3. Configure Supabase:
   - The iOS app uses the same Supabase project as the web app
   - Supabase URL and anon key are set in Info.plist
   - These can be overridden with environment variables if needed

4. Set environment variables:
   - `OPENAI_API_KEY`: OpenAI API key for image processing
   - `SUPABASE_URL`: Your Supabase project URL (optional, defaults to Info.plist)
   - `SUPABASE_ANON_KEY`: Your Supabase anonymous key (optional, defaults to Info.plist)
   - `SENTRY_DSN`: Sentry DSN for error tracking (optional)

### Building & Running
```bash
# Generate project (required after project.yml changes)
xcodegen generate

# Build
xcodebuild -scheme ColoringBook -destination 'platform=iOS Simulator,name=iPhone 17'

# Run tests
xcodebuild test -scheme ColoringBook -destination 'platform=iOS Simulator,name=iPhone 17'

# Run on device (requires signing configuration)
xcodebuild -scheme ColoringBook -destination 'platform=iOS,name=YOUR_DEVICE'
```

### Testing
- **Unit Tests**: Business logic, models, view models
- **UI Tests**: User flows, navigation, key interactions
- **Manual Testing**: Drawing experience, offline mode, kid mode

## Supabase Schema (Shared with Web)
## Supabase Schema

### Collections
- **users**: User profiles and settings
  - `id`, `email`, `display_name`, `created_at`, `is_kid_mode_enabled`

### Tables
- **images**: Coloring page records
  - `id: uuid`, `user_id: text`, `original_url: text`, `coloring_page_url: text | null`, `name: text`, `status: text` (`uploading` | `processing` | `completed` | `error`), `created_at: timestamptz`, `updated_at: timestamptz`

- **family_albums**: Shared albums
  - `id: uuid`, `name: text`, `share_code: text`, `image_ids: text[]`, `created_by: text`, `created_at: timestamptz`

### Storage Buckets
- Uses the same Supabase Storage buckets as the web app
- Original photos and generated coloring pages
- User's colored artwork saves

## Offline Support
- Local persistence for offline viewing
- Cached images for offline coloring
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
- Supabase Dashboard for backend debugging
- Supabase Console for backend debugging
- Network Link Conditioner for offline testing

### Updating Dependencies
Edit `Package.swift` or `project.yml`, then:
```bash
xcodegen generate
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
- [x] AR Gallery for viewing coloring pages in augmented reality
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

## AR Gallery Feature

### Overview
The AR Gallery feature allows users to view their completed coloring pages in augmented reality. Users can place their artwork on walls, floors, or any surface in the real world, creating an immersive gallery experience.

### Components
- **ARGalleryView.swift**: Main AR interface with camera view and controls
- **ARGalleryViewModel.swift**: Business logic for AR session management and gesture handling

### Features
- **Surface Detection**: Automatically detects horizontal and vertical planes (walls, floors, tables)
- **Tap to Place**: Tap any detected surface to place your coloring page artwork
- **Pinch to Resize**: Use pinch gesture to scale the image up or down
- **Drag to Reposition**: Move placed artwork to different surfaces
- **Size Controls**: +/- buttons for precise size adjustments
- **Screenshot Capture**: Save your AR scene to Photos
- **Reset Scene**: Clear all placed artwork and start fresh
- **Instructions Overlay**: Helpful guide for first-time users

### Usage
1. Open any completed coloring page from the Dashboard
2. Tap "View in AR" button in the management panel
3. Point camera at surfaces and wait for detection
4. Tap to place your artwork on detected surfaces
5. Use gestures or controls to adjust size and position
6. Take screenshots to save your AR gallery scenes

### Technical Details
- Uses ARKit's ARWorldTrackingConfiguration
- Supports both horizontal and vertical plane detection
- SceneKit for 3D rendering of image planes
- Automatic lighting and shadow support
- Gesture recognizers for intuitive interaction
- Photo library integration for screenshot saving

### Requirements
- iOS 16.0+
- ARKit-compatible device (iPhone 6s or newer, iPad Pro or newer)
- Camera permission (automatically requested)
- Photo library permission (for screenshots)

### Known Limitations
- AR features require a physical iOS device with ARKit support
- Does not work on iOS Simulator (limited AR simulation only)
- Requires good lighting conditions for best surface detection
- Large images may impact performance on older devices
