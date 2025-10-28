# ColoringBook Monorepo

This repository houses multiple clients for the ColoringBook platform:

- `apps/web` – the Next.js 15 web experience that powers coloringbook.ai
- `ios/ColoringBookApp` – a native SwiftUI starter client that consumes the same Supabase/OpenAI backend

## Getting started

### Web (Next.js)
1. Install dependencies from the repository root:
   ```bash
   npm install
   ```
2. Run development commands through the workspace helpers, for example:
   ```bash
   npm run dev:web
   npm run lint:web
   npm run test:e2e
   ```
   These proxies invoke the scripts defined in `apps/web/package.json`. You can also `cd apps/web` and run them directly if you prefer.
3. Follow the detailed setup instructions in [`apps/web/SETUP.md`](apps/web/SETUP.md) to configure Supabase, environment variables, and OpenAI credentials.

### iOS (SwiftUI)
1. Open `ios/ColoringBookApp/ColoringBookApp.xcodeproj` in Xcode 15 or newer.
2. Duplicate `ios/ColoringBookApp/AppConfig.swift` or adjust its placeholder values with your Supabase URL, anon key, and the base URL of the deployed web API.
3. Resolve the Swift Package Manager dependency on [`supabase-swift`](https://github.com/supabase-community/supabase-swift) when prompted.
4. Build and run the **ColoringBookApp** scheme on an iOS 17+ simulator to authenticate, upload images, and kick off coloring-page generation.
5. Provide your own `1024x1024` PNG app icon by copying it to `ios/ColoringBookApp/Assets.xcassets/AppIcon.appiconset/AppIcon.png`. The path is git-ignored so local icons do not trigger repository changes.

For more platform-specific notes, see [`ios/README.md`](ios/README.md) and the documentation inside each app directory.
