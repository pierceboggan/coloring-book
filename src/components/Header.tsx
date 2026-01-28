'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { AuthModal } from './AuthModal'

export function Header() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const { user, signOut, deleteAccount, loading } = useAuth()

  console.log('📊 Header render - User state:', user ? `Logged in as ${user.email}` : 'Not logged in')

  if (loading) {
    return (
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-xl font-bold text-gray-900">
              Coloring Book AI
            </h1>
            <div className="w-20 h-8 bg-gray-200 animate-pulse rounded"></div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <>
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-xl font-bold text-gray-900">
              Coloring Book AI
            </h1>
            
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <span className="text-sm text-gray-600">
                    {user.email}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={async () => {
                        if (isDeletingAccount) {
                          return
                        }

                        const confirmed = window.confirm(
                          'Deleting your account will permanently remove your coloring pages and uploaded photos. This action cannot be undone. Do you want to continue?'
                        )

                        if (!confirmed) {
                          return
                        }

                        try {
                          setIsDeletingAccount(true)
                          const { error } = await deleteAccount()

                          if (error) {
                            alert(error)
                          }
                        } finally {
                          setIsDeletingAccount(false)
                        }
                      }}
                      className="bg-white text-red-600 px-4 py-2 rounded-md text-sm font-medium border border-red-200 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-60"
                      disabled={isDeletingAccount}
                    >
                      {isDeletingAccount ? 'Deleting...' : 'Delete Account'}
                    </button>
                    <button
                      onClick={signOut}
                      className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  )
}