'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ImageUploader from '@/components/ImageUploader'
import { AuthModal } from '@/components/AuthModal'
import { useAuth } from '@/contexts/AuthContext'
import { Palette, Sparkles, Download, Heart, Star, ArrowRight } from 'lucide-react'

export default function Home() {
  const [showUploader, setShowUploader] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const { user } = useAuth()
  const router = useRouter()

  if (showUploader) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="text-center mb-8">
                <button
                  onClick={() => setShowUploader(false)}
                  className="text-purple-600 hover:text-purple-700 mb-4 flex items-center mx-auto"
                >
                  ← Back to home
                </button>
                <h1 className="text-3xl font-bold text-gray-800 mb-3">
                  Upload Your Photo
                </h1>
                <p className="text-gray-600 text-lg">
                  Upload a family photo and we'll create a beautiful coloring page for you
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      {/* Header */}
      <nav className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Palette className="w-8 h-8 text-purple-600" />
            <span className="text-2xl font-bold text-gray-800">ColoringBook.AI</span>
          </div>
          <div className="flex items-center space-x-3">
            {user ? (
              <>
                <span className="text-sm text-gray-600">{user.email}</span>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-full font-medium transition-colors"
                >
                  Dashboard
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="text-purple-600 hover:text-purple-700 px-4 py-2 rounded-full font-medium transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setShowUploader(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-full font-medium transition-colors"
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4 mr-2" />
            Powered by Advanced AI
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-gray-800 mb-6 leading-tight">
            Turn Photos into
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600"> Magic</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            Transform any photo into a beautiful coloring page with our AI-powered tool. 
            Perfect for family memories, gifts, or creative fun!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button
              onClick={() => setShowUploader(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-full font-medium text-lg transition-colors shadow-lg flex items-center justify-center"
            >
              Create Coloring Page
              <ArrowRight className="ml-2 w-5 h-5" />
            </button>
            <button className="bg-white hover:bg-gray-50 text-gray-700 px-8 py-4 rounded-full font-medium text-lg transition-colors shadow-lg border border-gray-200">
              View Examples
            </button>
          </div>

          {/* Demo Image */}
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Original Photo</h3>
                <div className="bg-gray-100 rounded-xl p-4 aspect-square flex items-center justify-center">
                  <span className="text-gray-400">Upload your photo</span>
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Coloring Page</h3>
                <div className="bg-gray-100 rounded-xl p-4 aspect-square flex items-center justify-center">
                  <span className="text-gray-400">AI-generated coloring page</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">Why Choose ColoringBook.AI?</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Experience the magic of AI-powered creativity with features designed for everyone
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-center">
            <div className="bg-purple-100 rounded-full p-4 w-16 h-16 mx-auto mb-6 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">AI-Powered Magic</h3>
            <p className="text-gray-600">
              Our advanced AI analyzes your photo and creates perfect line art suitable for coloring
            </p>
          </div>
          
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-center">
            <div className="bg-pink-100 rounded-full p-4 w-16 h-16 mx-auto mb-6 flex items-center justify-center">
              <Heart className="w-8 h-8 text-pink-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Family Friendly</h3>
            <p className="text-gray-600">
              Perfect for creating memorable family activities and preserving special moments
            </p>
          </div>
          
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-center">
            <div className="bg-orange-100 rounded-full p-4 w-16 h-16 mx-auto mb-6 flex items-center justify-center">
              <Download className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Instant Download</h3>
            <p className="text-gray-600">
              Get your coloring page ready to print and enjoy within minutes
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">How It Works</h2>
          <p className="text-xl text-gray-600">
            Three simple steps to create your perfect coloring page
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="bg-purple-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              1
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Upload Photo</h3>
            <p className="text-gray-600">
              Choose any photo from your device - family photos, pets, landscapes, anything!
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-pink-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              2
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">AI Magic</h3>
            <p className="text-gray-600">
              Our AI analyzes your image and transforms it into beautiful line art
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-orange-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              3
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Download & Color</h3>
            <p className="text-gray-600">
              Download your custom coloring page and start creating memories
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-12 text-center text-white max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold mb-4">Ready to Create Magic?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of families creating beautiful memories with AI-powered coloring pages
          </p>
          <button
            onClick={() => setShowUploader(true)}
            className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-4 rounded-full font-medium text-lg transition-colors shadow-lg"
          >
            Start Creating Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-16">
        <div className="text-center text-gray-600">
          <div className="flex items-center justify-center mb-4">
            <Palette className="w-6 h-6 text-purple-600 mr-2" />
            <span className="text-xl font-bold text-gray-800">ColoringBook.AI</span>
          </div>
          <p>© 2024 ColoringBook.AI. Made with ❤️ for creative families.</p>
        </div>
      </footer>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  )
}
