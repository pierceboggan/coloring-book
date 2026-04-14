# ColoringBook.AI

**ColoringBook.AI** turns any photo into a printable coloring page using AI. Upload a picture, get back clean black-and-white line art, and build shareable albums or PDF photobooks from the results. It runs on **web**, **iOS**, and **Android** — all backed by the same Supabase database.

## Screenshots

| Web | iOS |
|-----|-----|
| ![Web landing page](public/readme-screenshots/web/web-home.png) | ![iPhone](public/readme-screenshots/ios/ios-iphone17-native.png) |
| ![Web examples](public/readme-screenshots/web/web-examples.png) | ![iPad](public/readme-screenshots/ios/ios-ipadpro13-native.png) |

## How It Works

1. Upload a photo
2. AI (OpenAI or Gemini) converts it to line art
3. A watermark is applied and the result is saved
4. Real-time status updates tell you when it's ready

You can then download individual pages, remix them with different prompts, or bundle them into photobooks and family albums with shareable links.

## Platforms

| | Web | iOS | Android |
|-|-----|-----|---------|
| **Language** | TypeScript | Swift 6 | Kotlin 2.1 |
| **UI** | Next.js 15 + Tailwind 4 | SwiftUI | Jetpack Compose (Material 3) |
| **Min version** | Node 18+ | iOS 16 | API 26 |
| **Backend** | Supabase | Supabase (shared) | Supabase (shared) |
| **Deployment** | Vercel | Xcode / TestFlight | Gradle |
| **Extras** | PDF photobooks, provider benchmarks | AR Gallery, Apple Pencil, Kid Mode | Room offline cache, Kid Mode |

## Features

- **AI coloring page generation** — OpenAI Responses API + Google Gemini
- **Provider benchmarks** — `/api/evaluate-image-providers` compares quality, latency, and cost
- **Prompt remix** — regenerate with different styles or complexity
- **Family albums** — share collections via unique codes
- **Social sharing** — Twitter, Facebook, WhatsApp share links
- **Photobook PDF** — combine up to 20 pages into a downloadable PDF
- **Dashboard** — manage pages with real-time status tracking
- **Digital coloring canvas** — draw on pages with touch/stylus/Apple Pencil (mobile)
- **Kid Mode** — PIN-protected parental controls (mobile)
- **Offline support** — keep coloring without internet (mobile)
- **AR Gallery** — view pages in augmented reality (iOS)

## Quick Start

### Web

```bash
git clone https://github.com/pierceboggan/coloring-book.git
cd coloring-book
npm install
cp .env.local.example .env.local   # fill in your keys
npm run dev                         # http://localhost:3000
```

Dev password: `parkcityutah`

Required env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `NEXT_PUBLIC_APP_URL`

Optional: `GOOGLE_API_KEY`, `GEMINI_IMAGE_MODEL`, `GEMINI_API_BASE_URL`, `IMAGE_GENERATION_PROVIDER`, `OPENAI_IMAGE_COST_USD`, `GEMINI_IMAGE_COST_USD`

### iOS

```bash
brew install xcodegen
cd ios/ColoringBook
xcodegen generate
open ColoringBook.xcodeproj
# Set SUPABASE_URL, SUPABASE_ANON_KEY, OPENAI_API_KEY in scheme env vars
# Cmd+R to run
```

### Android

Open `android/` in Android Studio. Add your Supabase credentials to `local.properties`, sync Gradle, and run on API 26+.

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/generate-coloring-page` | Convert photo → coloring page |
| POST | `/api/regenerate-coloring-page` | Regenerate with custom prompt |
| POST | `/api/retry-processing` | Retry a failed job |
| DELETE | `/api/images/[id]` | Delete an image |
| GET | `/api/download/[id]` | Download coloring page |
| POST | `/api/family-albums` | Create shareable album |
| GET | `/api/family-albums/[shareCode]` | Access shared album |
| POST | `/api/generate-photobook` | Generate PDF photobook |
| POST | `/api/share` | Create public share link |
| POST | `/api/evaluate-image-providers` | Compare AI providers |
| POST | `/api/prompt-remix` | Start batch style variants |

## Testing

```bash
npm run test:unit       # unit tests (Vitest)
npm run test:coverage   # with coverage report
npm run test:e2e        # end-to-end (Playwright)
npm run lint            # ESLint
```

80%+ coverage target across library utilities, components, and E2E workflows.

## Deploying

### Vercel (web)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fbogganpierce%2Fcoloringbook)

Or manually: push to GitHub → import in Vercel → set env vars → deploy.

## Troubleshooting

- **Images not processing** — check your OpenAI key and Supabase storage policies
- **No real-time updates** — verify Supabase real-time is enabled
- **Debug logging** — look for emoji indicators (🚀 ✅ ❌ 🔄) in console and Vercel logs

## Contributing

1. Fork and branch (`git checkout -b feature/my-feature`)
2. Follow [AGENTS.md](AGENTS.md) and [CONTRIBUTING.md](CONTRIBUTING.md) conventions
3. Run `npm run lint && npm run test:unit`
4. Open a PR

Platform-specific guides: [ios/AGENTS.md](ios/AGENTS.md) | [android/AGENTS.md](android/AGENTS.md)

## License

Private and proprietary.