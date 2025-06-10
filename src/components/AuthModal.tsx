'use client'

import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'sonner'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

// Create a global event system for tab switching
const tabEvents = new EventTarget();
export const switchTab = (tab: 'signin' | 'signup') => {
  const event = new CustomEvent('switchTab', { detail: tab });
  tabEvents.dispatchEvent(event);
};

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isSignIn, setIsSignIn] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
    } else {
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, 200) // Add a small delay to allow for animations
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  useEffect(() => {
    const handleTabSwitch = (event: Event) => {
      const customEvent = event as CustomEvent<'signin' | 'signup'>;
      setIsSignIn(customEvent.detail === 'signin');
    };

    tabEvents.addEventListener('switchTab', handleTabSwitch);
    return () => tabEvents.removeEventListener('switchTab', handleTabSwitch);
  }, []);

  if (!isVisible) return null

  const handleClose = () => {
    console.log('Manual close button clicked')
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      if (isSignIn) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        
        toast.success('Signed in successfully!')
        onClose()
      } else {
        console.log('Starting signup process...')
        const { error: signUpError, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${location.origin}/auth/callback`,
          },
        })
        
        if (signUpError) {
          console.error('Signup error:', signUpError)
          throw signUpError
        }

        if (data?.user) {
          toast.success('Registration successful!')
          onClose()
        } else {
          throw new Error('No user data returned from signup')
        }
      }
    } catch (error) {
      console.error('Auth error:', error)
      toast.error(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0" style={{ position: 'fixed', zIndex: 9999 }}>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />
      
      {/* Modal Container */}
      <div 
        className="fixed inset-0 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
          <div className="relative w-full max-w-md">
            <div className="relative bg-black border border-gray-800 rounded-lg shadow-2xl">
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute -right-2 -top-2 bg-gray-900 rounded-full p-1 text-gray-400 hover:text-white transition-colors border border-gray-800"
                aria-label="Close"
              >
                <X size={20} />
              </button>

              <div className="p-6">
                {/* Tabs */}
                <div className="flex gap-4 mb-8" role="tablist">
                  <button
                    role="tab"
                    aria-selected={isSignIn}
                    className={`flex-1 py-3 text-center transition-colors ${
                      isSignIn ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400'
                    }`}
                    onClick={() => setIsSignIn(true)}
                  >
                    Sign In
                  </button>
                  <button
                    role="tab"
                    aria-selected={!isSignIn}
                    className={`flex-1 py-3 text-center transition-colors ${
                      !isSignIn ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400'
                    }`}
                    onClick={() => setIsSignIn(false)}
                  >
                    Register
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 text-white"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Please wait...
                      </span>
                    ) : (
                      isSignIn ? 'Sign In' : 'Register'
                    )}
                  </button>
                </form>

                {isSignIn && (
                  <button
                    onClick={() => {/* TODO: Implement forgot password */}}
                    className="mt-4 text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 