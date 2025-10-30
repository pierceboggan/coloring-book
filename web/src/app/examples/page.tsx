import Link from 'next/link'
import { Metadata } from 'next'
import { Palette, Sparkles, Camera, Stars, Heart, PartyPopper } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Peek at Examples | ColoringBook.AI',
  description:
    'Explore curated ColoringBook.AI examples that showcase how photos transform into whimsical, printable coloring adventures.',
}

const curatedCollections = [
  {
    name: 'Birthday Bash',
    blurb: 'Capture the cake, candles, and confetti from your best celebration.',
    accent: 'bg-[#FFB3BA]',
    shadow: 'shadow-[10px_10px_0_0_#FF8A80]',
    icon: PartyPopper,
    details: [
      'Perfect for party photo booths and kiddo selfies.',
      'Includes festive borders and balloon clusters.',
      'Great for thank-you cards and keepsakes.',
    ],
  },
  {
    name: 'Pet Pals',
    blurb: 'Show off wagging tails and whisker wiggles in crisp line art.',
    accent: 'bg-[#A0E7E5]',
    shadow: 'shadow-[10px_10px_0_0_#55C6C0]',
    icon: Heart,
    details: [
      'Works wonders with energetic action shots.',
      'Captures fur textures without muddy shading.',
      'Add their name in playful bubble lettering.',
    ],
  },
  {
    name: 'Adventure Squad',
    blurb: 'Turn park playdates and family hikes into storybook scenes.',
    accent: 'bg-[#FFF3BF]',
    shadow: 'shadow-[10px_10px_0_0_#FFD166]',
    icon: Stars,
    details: [
      'Handles groups with plenty of personality.',
      'Outlines gear like backpacks and scooters cleanly.',
      'Optional comic-style panels to narrate the day.',
    ],
  },
] as const

type CuratedCollection = (typeof curatedCollections)[number]

const heroFeatures = [
  {
    icon: Sparkles,
    title: 'Hand-Drawn Feel',
    description: 'Organic strokes and tidy outlines keep every page easy to color.',
  },
  {
    icon: Camera,
    title: 'Any Photo Works',
    description: 'Upload snapshots straight from your phone roll or family album.',
  },
  {
    icon: Palette,
    title: 'Ready to Print',
    description: 'Download high-resolution PDFs sized for crayons, markers, or gel pens.',
  },
] as const

type HeroFeature = (typeof heroFeatures)[number]

function CollectionCard({ collection }: { collection: CuratedCollection }) {
  const Icon = collection.icon

  return (
    <article className={`relative overflow-hidden rounded-[2rem] border-4 border-white/70 bg-white/90 p-8 text-left ${collection.shadow}`}>
      <div className={`absolute -top-10 -right-10 h-28 w-28 rounded-full opacity-30 ${collection.accent}`} aria-hidden="true" />
      <div className={`mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full border-4 border-dashed border-white text-white ${collection.accent}`}>
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="text-2xl font-extrabold text-[#3A2E39]">{collection.name}</h3>
      <p className="mt-2 text-[#594144]">{collection.blurb}</p>
      <ul className="mt-6 space-y-2 text-sm text-[#594144]">
        {collection.details.map((detail) => (
          <li key={detail} className="flex items-start gap-2">
            <span className="mt-1 h-2 w-2 rounded-full bg-[#FF6F91]" aria-hidden="true" />
            <span>{detail}</span>
          </li>
        ))}
      </ul>
    </article>
  )
}

function FeatureCard({ feature }: { feature: HeroFeature }) {
  const Icon = feature.icon

  return (
    <div className="flex flex-col items-center rounded-[2rem] border-4 border-[#FFB3BA] bg-[#FFE6EB]/80 px-6 py-10 text-center shadow-[10px_10px_0_0_#FF8A80]">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border-4 border-dashed border-white bg-[#FF6F91] text-white">
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="text-xl font-extrabold text-[#3A2E39]">{feature.title}</h3>
      <p className="mt-2 text-sm text-[#594144]">{feature.description}</p>
    </div>
  )
}

export default function ExamplesPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#FFF5D6]">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\\'120\\' height=\\'120\\' viewBox=\\'0 0 120 120\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cg fill=\\'%23ffe9a8\\' fill-opacity=\\'0.35\\'%3E%3Ccircle cx=\\'20\\' cy=\\'20\\' r=\\'8\\'/%3E%3Ccircle cx=\\'80\\' cy=\\'50\\' r=\\'6\\'/%3E%3Ccircle cx=\\'60\\' cy=\\'100\\' r=\\'10\\'/%3E%3C/g%3E%3C/svg%3E')]" aria-hidden="true" />

      <header className="relative z-10 container mx-auto px-4 pt-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-[2.5rem] border-4 border-[#FFD166] bg-white/90 px-6 py-6 shadow-[10px_10px_0_0_#FFB3BA] backdrop-blur">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-[#FF6F91]">Curated Coloring Moments</p>
            <h1 className="text-3xl font-extrabold text-[#3A2E39]">Peek at Examples</h1>
          </div>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border-4 border-[#A0E7E5] bg-[#55C6C0] px-6 py-2 font-semibold text-white shadow-[6px_6px_0_0_#1DB9B3] transition-transform hover:translate-y-[-2px]"
          >
            Back to home
          </Link>
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-4 py-16">
        <section className="mx-auto mb-16 max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border-4 border-dashed border-[#FFB3BA] bg-white/90 px-6 py-3 text-sm font-bold uppercase tracking-widest text-[#E97777]">
            <Sparkles className="h-4 w-4" />
            Featured Galleries
          </div>
          <h2 className="mt-6 text-4xl font-extrabold text-[#3A2E39]">See how memories transform into playful coloring pages.</h2>
          <p className="mt-4 text-lg text-[#594144]">
            Each example started as an everyday snapshot. ColoringBook.AI cleans up the details, simplifies the shapes, and keeps the whimsy alive for crayons, markers, or digital brushes.
          </p>
        </section>

        <section className="grid gap-10 md:grid-cols-3">
          {curatedCollections.map((collection) => (
            <CollectionCard key={collection.name} collection={collection} />
          ))}
        </section>

        <section className="mt-20 grid gap-10 rounded-[3rem] border-4 border-[#A0E7E5] bg-white/90 p-12 shadow-[16px_16px_0_0_#55C6C0]">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-[#3A2E39]">What makes these pages pop?</h2>
            <p className="mt-4 text-lg text-[#594144]">
              We fine-tune the outlines, balance the shading, and remove clutter so every coloring page feels polished and kid-friendly.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {heroFeatures.map((feature) => (
              <FeatureCard key={feature.title} feature={feature} />
            ))}
          </div>

          <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/"
              className="rounded-full border-4 border-[#FFB3BA] bg-[#FF6F91] px-8 py-4 text-lg font-semibold text-white shadow-[10px_10px_0_0_#f2557b] transition-transform hover:translate-y-[-3px]"
            >
              Start your own coloring page
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full border-4 border-[#A0E7E5] bg-white/90 px-8 py-4 text-lg font-semibold text-[#1DB9B3] shadow-[10px_10px_0_0_#55C6C0] transition-transform hover:translate-y-[-3px]"
            >
              Explore your albums
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
