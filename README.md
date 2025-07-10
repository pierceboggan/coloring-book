# ColoringBook.AI

Transform any photo into a beautiful coloring page with AI-powered technology. Perfect for family memories, gifts, or creative fun!

## Features

- **AI-Powered**: Advanced AI analyzes photos and creates perfect line art
- **Family Friendly**: Safe and suitable for all ages
- **Instant Download**: Get coloring pages ready to print within minutes
- **Dashboard**: Manage your coloring pages with a user-friendly interface
- **Photobook Creator**: Combine multiple coloring pages into collections

## Getting Started

### Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables in `.env.local`:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key

   # OpenAI
   OPENAI_API_KEY=your_openai_api_key

   # App
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Password Protection

The site is currently protected with a development password: `parkcityutah`

## Deploy to Vercel

### Prerequisites

1. Push your code to a GitHub repository
2. Have a [Vercel account](https://vercel.com)
3. Set up your Supabase project and get the keys
4. Get an OpenAI API key

### Deployment Steps

1. **Connect Repository**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository

2. **Configure Environment Variables**:
   Add these environment variables in Vercel project settings:
   
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key
   OPENAI_API_KEY=your_openai_api_key
   NEXT_PUBLIC_APP_URL=https://your-vercel-domain.vercel.app
   ```

3. **Deploy**:
   - Vercel will automatically detect Next.js and configure build settings
   - Click "Deploy" to start the deployment

### Alternative: Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel
   ```

4. Set environment variables:
   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
   vercel env add SUPABASE_SERVICE_ROLE_KEY
   vercel env add OPENAI_API_KEY
   vercel env add NEXT_PUBLIC_APP_URL
   ```

5. Redeploy with environment variables:
   ```bash
   vercel --prod
   ```

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS
- **Database**: Supabase
- **Authentication**: Supabase Auth
- **AI**: OpenAI Responses API
- **Storage**: Supabase Storage
- **Deployment**: Vercel

## API Routes

- `POST /api/generate-coloring-page` - Generate coloring page from image
- `DELETE /api/images/[id]` - Delete image and coloring page
- `GET /api/download/[id]` - Download coloring page with proper headers

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is private and proprietary.