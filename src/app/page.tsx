'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ImageUploader from '@/components/ImageUploader'
import { AuthModal } from '@/components/AuthModal'
import { useAuth } from '@/contexts/AuthContext'
import { Palette, Sparkles, Download, Heart, Star, ArrowRight } from 'lucide-react'

const PaintSplotches = () => (
  <>
    <div
      className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 bg-[radial-gradient(circle_at_30%_30%,#FFB3BA,transparent_60%)] opacity-70 rotate-[12deg]"
      aria-hidden="true"
    />
    <div
      className="pointer-events-none absolute top-24 -right-20 w-80 h-80 bg-[radial-gradient(circle_at_50%_50%,#FFD166,transparent_65%)] opacity-60 rotate-[-18deg]"
      aria-hidden="true"
    />
    <div
      className="pointer-events-none absolute bottom-[-80px] left-1/3 w-96 h-96 bg-[radial-gradient(circle_at_40%_40%,#9BF6FF,transparent_55%)] opacity-60 rotate-[22deg]"
      aria-hidden="true"
    />
    <div
      className="pointer-events-none absolute top-1/3 left-10 w-40 h-40 bg-[radial-gradient(circle_at_60%_40%,#C3F584,transparent_60%)] opacity-60 rotate-[-8deg]"
      aria-hidden="true"
    />
  </>
)

export default function Home() {
  const [showUploader, setShowUploader] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const { user } = useAuth()
  const router = useRouter()

  if (showUploader) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#FFF5D6]">
        <PaintSplotches />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\\'120\\' height=\\'120\\' viewBox=\\'0 0 120 120\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cg fill=\\'%23ffe9a8\\' fill-opacity=\\'0.35\\'%3E%3Ccircle cx=\\'20\\' cy=\\'20\\' r=\\'8\\'/%3E%3Ccircle cx=\\'80\\' cy=\\'50\\' r=\\'6\\'/%3E%3Ccircle cx=\\'60\\' cy=\\'100\\' r=\\'10\\'/%3E%3C/g%3E%3C/svg%3E')]" aria-hidden="true" />
        <div className="relative z-10 container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/90 backdrop-blur border-4 border-dashed border-[#FFB3BA] rounded-[2.5rem] shadow-[12px_12px_0_0_#FF8A80] p-10">
              <div className="text-center mb-10">
                <button
                  onClick={() => setShowUploader(false)}
                  className="text-[#FF6F91] hover:text-[#f2557b] mb-6 flex items-center mx-auto font-semibold"
                >
                  ← Back to the playground
                </button>
                <h1 className="text-4xl font-extrabold text-[#3A2E39] mb-4">
                  Upload Your Photo Adventure
                </h1>
                <p className="text-lg text-[#594144]">
                  Choose a family snapshot, a silly selfie, or your favorite pet and we&apos;ll turn it into a printable coloring page!
                </p>
              </div>

              <ImageUploader />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#FFF5D6]">
      <PaintSplotches />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\\'120\\' height=\\'120\\' viewBox=\\'0 0 120 120\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cg fill=\\'%23ffe9a8\\' fill-opacity=\\'0.35\\'%3E%3Ccircle cx=\\'20\\' cy=\\'20\\' r=\\'8\\'/%3E%3Ccircle cx=\\'80\\' cy=\\'50\\' r=\\'6\\'/%3E%3Ccircle cx=\\'60\\' cy=\\'100\\' r=\\'10\\'/%3E%3C/g%3E%3C/svg%3E')]" aria-hidden="true" />

      {/* Header */}
      <nav className="relative z-10 container mx-auto px-4 pt-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between rounded-[2.5rem] border-4 border-[#FFD166] bg-white/90 px-6 py-6 shadow-[10px_10px_0_0_#FFB3BA] backdrop-blur">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:gap-3 sm:text-left">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FFB3BA] text-white shadow-inner">
              <Palette className="h-7 w-7" />
            </div>
            <div>
              <span className="block text-sm font-semibold text-[#FF6F91] tracking-widest uppercase">Coloring fun</span>
              <span className="text-2xl font-extrabold text-[#3A2E39]">ColoringBook.AI</span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center">
            {user ? (
              <>
                <span className="text-sm font-semibold text-[#594144] bg-[#FFF3BF] px-4 py-2 rounded-full border-2 border-[#FFD166] text-center">
                  {user.email}
                </span>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="w-full sm:w-auto rounded-full border-4 border-[#A0E7E5] bg-[#55C6C0] px-6 py-2 font-semibold text-white shadow-[6px_6px_0_0_#1DB9B3] transition-transform hover:translate-y-[-2px]"
                >
                  Dashboard
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="w-full sm:w-auto rounded-full border-4 border-[#FFB3BA] bg-white/90 px-5 py-2 font-semibold text-[#FF6F91] transition-transform hover:translate-y-[-2px]"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setShowUploader(true)}
                  className="w-full sm:w-auto rounded-full border-4 border-[#A0E7E5] bg-[#55C6C0] px-6 py-2 font-semibold text-white shadow-[6px_6px_0_0_#1DB9B3] transition-transform hover:translate-y-[-2px]"
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-4 py-16">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[3rem] border-4 border-[#A0E7E5] bg-white/90 p-12 text-center shadow-[16px_16px_0_0_#55C6C0]">
          <div className="pointer-events-none absolute -top-10 right-12 flex h-24 w-24 items-center justify-center rounded-full bg-[#FF8A80] text-white shadow-lg" aria-hidden="true">
            <Sparkles className="h-10 w-10" />
          </div>
          <div className="pointer-events-none absolute -bottom-6 left-8 h-28 w-28 rounded-full bg-[#B4F8C8] opacity-70" aria-hidden="true" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border-4 border-dashed border-[#FFD166] bg-[#FFF3BF] px-6 py-3 text-sm font-bold uppercase tracking-widest text-[#E97777] mb-8">
              <Sparkles className="h-4 w-4" />
              AI Crayons on Duty
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold text-[#3A2E39] mb-6 leading-tight">
              Turn Your Photos into
              <span className="block text-[#FF6F91]">Coloring Adventures!</span>
            </h1>

            <p className="mx-auto mb-12 max-w-2xl text-xl text-[#594144] leading-relaxed">
              Our friendly AI helpers trace every giggle, wiggle, and wagging tail into playful line art that’s ready for crayons, markers, and imagination.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row mb-16">
              <button
                onClick={() => setShowUploader(true)}
                className="flex items-center justify-center gap-2 rounded-full border-4 border-[#FFB3BA] bg-[#FF6F91] px-8 py-4 text-lg font-semibold text-white shadow-[10px_10px_0_0_#f2557b] transition-transform hover:translate-y-[-3px]"
              >
                Create a Coloring Page
                <ArrowRight className="h-5 w-5" />
              </button>
              <Link
                href="/examples"
                className="rounded-full border-4 border-[#A0E7E5] bg-white/90 px-8 py-4 text-lg font-semibold text-[#1DB9B3] shadow-[10px_10px_0_0_#55C6C0] transition-transform hover:translate-y-[-3px]"
              >
                Peek at Examples
              </Link>
            </div>

            {/* Demo Image */}
            <div className="mx-auto max-w-4xl rounded-[2.5rem] border-4 border-dashed border-[#FFB3BA] bg-white/90 p-8 shadow-[12px_12px_0_0_#FF8A80]">
              <div className="grid gap-10 md:grid-cols-2">
                <div className="text-center">
                  <h3 className="mb-4 text-xl font-extrabold text-[#3A2E39]">Original Photo</h3>
                  <div className="relative flex aspect-square items-center justify-center rounded-[1.75rem] border-4 border-dotted border-[#A0E7E5] bg-[#E0F7FA]">
                    <span className="text-lg font-semibold text-[#1DB9B3]">Upload your photo</span>
                    <Star className="absolute -top-4 -right-4 h-10 w-10 text-[#FF6F91]" />
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="mb-4 text-xl font-extrabold text-[#3A2E39]">Coloring Page</h3>
                  <div className="relative flex aspect-square items-center justify-center rounded-[1.75rem] border-4 border-dotted border-[#FFB3BA] bg-[#FFF3BF]">
                    <span className="text-lg font-semibold text-[#FF6F91]">AI-lined and ready to color</span>
                    <Star className="absolute -bottom-4 -left-4 h-10 w-10 text-[#FFD166]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 container mx-auto px-4 py-16">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <h2 className="mb-4 text-4xl font-extrabold text-[#3A2E39]">Why Kiddos Love ColoringBook.AI</h2>
          <p className="text-xl text-[#594144]">
            Spark creativity with whimsical tools that turn your memories into printable coloring sheets in minutes.
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-3">
          <div className="group relative overflow-hidden rounded-[2rem] border-4 border-[#FFB3BA] bg-[#FFE6EB] p-8 text-center shadow-[10px_10px_0_0_#FF8A80]">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border-4 border-dashed border-white bg-[#FF6F91] text-white shadow-inner">
              <Sparkles className="h-10 w-10" />
            </div>
            <h3 className="mb-4 text-2xl font-extrabold text-[#3A2E39]">Magical Line Art</h3>
            <p className="text-[#594144]">
              Our crayons-on-the-cloud trace every detail to create smooth, ready-to-color outlines from any photo.
            </p>
            <div className="pointer-events-none absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-[#FFB3BA]/40" aria-hidden="true" />
          </div>

          <div className="group relative overflow-hidden rounded-[2rem] border-4 border-[#A0E7E5] bg-[#E0F7FA] p-8 text-center shadow-[10px_10px_0_0_#55C6C0]">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border-4 border-dashed border-white bg-[#55C6C0] text-white shadow-inner">
              <Heart className="h-10 w-10" />
            </div>
            <h3 className="mb-4 text-2xl font-extrabold text-[#3A2E39]">Family Friendly Fun</h3>
            <p className="text-[#594144]">
              Make rainy afternoons sparkle with printable pages perfect for parties, classrooms, and cozy family time.
            </p>
            <div className="pointer-events-none absolute -top-10 left-6 h-24 w-24 rounded-full bg-[#A0E7E5]/40" aria-hidden="true" />
          </div>

          <div className="group relative overflow-hidden rounded-[2rem] border-4 border-[#FFD166] bg-[#FFF3BF] p-8 text-center shadow-[10px_10px_0_0_#FFB84C]">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border-4 border-dashed border-white bg-[#FFB84C] text-white shadow-inner">
              <Download className="h-10 w-10" />
            </div>
            <h3 className="mb-4 text-2xl font-extrabold text-[#3A2E39]">Ready, Set, Print!</h3>
            <p className="text-[#594144]">
              Download high-resolution pages instantly so little artists can color right away.
            </p>
            <div className="pointer-events-none absolute bottom-4 right-1/3 h-16 w-16 rounded-full bg-white/40" aria-hidden="true" />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 container mx-auto px-4 py-16">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <h2 className="mb-4 text-4xl font-extrabold text-[#3A2E39]">How the Magic Happens</h2>
          <p className="text-xl text-[#594144]">
            Three super-simple steps turn your favorite memories into coloring book pages.
          </p>
        </div>

        <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
          {[{
            number: '1',
            title: 'Pick a Picture',
            description: 'Snap a new photo or grab a favorite from your gallery — pets, pals, and playground poses all welcome!',
            color: 'bg-[#FFB3BA]',
            border: 'border-[#FF6F91]',
          }, {
            number: '2',
            title: 'AI Trace Time',
            description: 'Our cheerful robots outline the fun parts and skip the messy bits for smooth coloring lines.',
            color: 'bg-[#A0E7E5]',
            border: 'border-[#55C6C0]',
          }, {
            number: '3',
            title: 'Print & Color',
            description: 'Download your masterpiece instantly and bust out the crayons, markers, or glitter glue.',
            color: 'bg-[#FFF3BF]',
            border: 'border-[#FFD166]',
          }].map((step) => (
            <div
              key={step.number}
              className={`relative overflow-hidden rounded-[2rem] border-4 ${step.border} bg-white/90 p-8 text-center shadow-[10px_10px_0_0_rgba(0,0,0,0.05)]`}
            >
              <div className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border-4 border-dashed border-white text-2xl font-extrabold text-[#3A2E39] ${step.color}`}>
                {step.number}
              </div>
              <h3 className="mb-3 text-2xl font-extrabold text-[#3A2E39]">{step.title}</h3>
              <p className="text-[#594144]">{step.description}</p>
              <div className="pointer-events-none absolute -bottom-6 right-6 h-16 w-16 rounded-full bg-[#FFB3BA]/30" aria-hidden="true" />
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 container mx-auto px-4 py-20">
        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-[3rem] border-4 border-[#FFB3BA] bg-[#FF6F91] p-14 text-center text-white shadow-[16px_16px_0_0_#f2557b]">
          <div className="pointer-events-none absolute -top-12 left-10 h-32 w-32 rounded-full bg-[#FFE066] opacity-60" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-16 right-6 h-36 w-36 rounded-full bg-[#A0E7E5] opacity-50" aria-hidden="true" />
          <div className="relative z-10">
            <h2 className="text-4xl font-extrabold mb-4">Ready to Doodle Some Joy?</h2>
            <p className="text-xl mb-10 font-semibold opacity-90">
              Join thousands of families turning their snapshots into keepsake coloring pages.
            </p>
            <button
              onClick={() => setShowUploader(true)}
              className="rounded-full border-4 border-white bg-[#FFE066] px-10 py-4 text-lg font-extrabold text-[#FF6F91] shadow-[10px_10px_0_0_rgba(0,0,0,0.15)] transition-transform hover:translate-y-[-3px]"
            >
              Start Creating Now
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 container mx-auto mt-20 px-4 pb-16">
        <div className="mx-auto max-w-3xl rounded-[2.5rem] border-4 border-dashed border-[#A0E7E5] bg-white/90 px-8 py-10 text-center text-[#594144] shadow-[10px_10px_0_0_#55C6C0]">
          <div className="mb-4 flex items-center justify-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FFB3BA] text-white">
              <Palette className="h-7 w-7" />
            </div>
            <span className="text-2xl font-extrabold text-[#3A2E39]">ColoringBook.AI</span>
          </div>
          <p className="text-lg font-semibold">
            © 2024 ColoringBook.AI. Made with ❤️ for creative families everywhere.
          </p>
        </div>
      </footer>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  )
}
