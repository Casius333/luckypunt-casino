'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, Phone } from 'lucide-react'
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

type RegistrationStep = 'email' | 'verify' | 'password' | 'mobile';

// Add these validation functions at the top of the file, after the imports
const validatePassword = (password: string): { isValid: boolean; message: string } => {
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }
  if (!/\d/.test(password)) {
    return { isValid: false, message: 'Password must contain at least 1 number' };
  }
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least 1 lowercase letter' };
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least 1 uppercase letter' };
  }
  return { isValid: true, message: '' };
};

function validatePhone(phone: string) {
  // Remove any non-digit characters
  const cleanPhone = phone.replace(/\D/g, '')
  
  // Check if it's a valid Australian mobile number
  const isValid = /^(?:\+?61|0)[4][0-9]{8}$/.test(cleanPhone)
  
  return {
    isValid: Boolean(isValid),
    message: isValid ? '' : 'Please enter a valid Australian mobile number',
    cleanPhone
  }
}

const formatPhoneNumber = (input: string): string => {
  // Remove any non-digit characters
  const digits = input.replace(/\D/g, '');
  // Limit to 10 digits
  const limitedDigits = digits.slice(0, 10);
  // Format as (XXX) XXX-XXXX
  if (limitedDigits.length >= 6) {
    return `(${limitedDigits.slice(0, 3)}) ${limitedDigits.slice(3, 6)}-${limitedDigits.slice(6)}`;
  } else if (limitedDigits.length >= 3) {
    return `(${limitedDigits.slice(0, 3)}) ${limitedDigits.slice(3)}`;
  } else if (limitedDigits.length > 0) {
    return `(${limitedDigits}`;
  }
  return '';
};

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isSignIn, setIsSignIn] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [token, setToken] = useState('')
  const [mobile, setMobile] = useState('')
  const [registrationStep, setRegistrationStep] = useState<RegistrationStep>('email')
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
    } else {
      const timer = setTimeout(() => {
        setIsVisible(false)
        resetForm()
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  useEffect(() => {
    const handleTabSwitch = (event: Event) => {
      const customEvent = event as CustomEvent<'signin' | 'signup'>;
      setIsSignIn(customEvent.detail === 'signin');
      resetForm();
    };

    tabEvents.addEventListener('switchTab', handleTabSwitch);
    return () => tabEvents.removeEventListener('switchTab', handleTabSwitch);
  }, []);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setToken('');
    setMobile('');
    setRegistrationStep('email');
    setLoading(false);
  };

  if (!isVisible) return null

  const handleClose = () => {
    console.log('Manual close button clicked')
    onClose()
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      
      toast.success('Signed in successfully!')
      onClose()
    } catch (error) {
      console.error('Auth error:', error)
      toast.error(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${location.origin}/auth/callback`,
        },
      })
      
      if (error) throw error
      setRegistrationStep('verify')
      toast.success('Verification code sent to your email!')
    } catch (error) {
      console.error('Auth error:', error)
      toast.error(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'signup'
      })
      
      if (error) throw error
      
      setRegistrationStep('password')
      toast.success('Email verified successfully!')
    } catch (error) {
      console.error('Verification error:', error)
      toast.error(error instanceof Error ? error.message : 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      toast.error(passwordValidation.message);
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      
      setRegistrationStep('mobile');
      toast.success('Password set successfully!');
    } catch (error) {
      console.error('Password update error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to set password');
    } finally {
      setLoading(false);
    }
  };

  const handleMobileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mobile && !validatePhone(mobile).isValid) {
      toast.error(validatePhone(mobile).message);
      return;
    }
    
    setLoading(true);
    try {
      if (mobile) {
        const { error } = await supabase
          .from('players')
          .update({ phone: mobile.replace(/\D/g, '') }) // Store only digits
          .eq('email', email);
        
        if (error) throw error;
      }
      
      toast.success('Registration completed successfully!');
      onClose();
    } catch (error) {
      console.error('Mobile update error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save mobile number');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipMobile = () => {
    toast.success('Registration completed successfully!')
    onClose()
  }

  const renderRegistrationStep = () => {
    switch (registrationStep) {
      case 'email':
        return (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
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
            <button
              type="submit"
              className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending code...
                </span>
              ) : (
                'Continue'
              )}
            </button>
          </form>
        )

      case 'verify':
        return (
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Verification Code
              </label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
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
                  Verifying...
                </span>
              ) : (
                'Verify Email'
              )}
            </button>
          </form>
        )

      case 'password':
        return (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-400">
                Create Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 text-white"
                required
                minLength={8}
              />
              <div className="text-sm text-gray-400 space-y-1 mt-2">
                <p>Password requirements:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li className={`${password.length >= 8 ? 'text-green-500' : 'text-gray-400'}`}>
                    At least 8 characters
                  </li>
                  <li className={`${/\d/.test(password) ? 'text-green-500' : 'text-gray-400'}`}>
                    At least 1 number
                  </li>
                  <li className={`${/[a-z]/.test(password) ? 'text-green-500' : 'text-gray-400'}`}>
                    At least 1 lowercase letter
                  </li>
                  <li className={`${/[A-Z]/.test(password) ? 'text-green-500' : 'text-gray-400'}`}>
                    At least 1 uppercase letter
                  </li>
                </ul>
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-400">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 text-white"
                required
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-red-500 text-sm mt-1">Passwords do not match</p>
              )}
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || !validatePassword(password).isValid || password !== confirmPassword ? true : undefined}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Setting password...
                </span>
              ) : (
                'Set Password'
              )}
            </button>
          </form>
        )

      case 'mobile':
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Phone className="w-12 h-12 text-purple-600 mx-auto mb-2" />
              <h3 className="text-lg font-medium text-white">Add Your Mobile Number</h3>
              <p className="text-sm text-gray-400">
                Optional: Add your mobile number for enhanced account security
              </p>
            </div>
            <form onSubmit={handleMobileSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-400">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => {
                    const formatted = formatPhoneNumber(e.target.value);
                    setMobile(formatted);
                  }}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 text-white"
                  placeholder="(555) 555-5555"
                />
                {mobile && !validatePhone(mobile).isValid && (
                  <p className="text-red-500 text-sm mt-1">{validatePhone(mobile).message}</p>
                )}
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={handleSkipMobile}
                  className="flex-1 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Skip
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={Boolean(loading || (mobile && !validatePhone(mobile).isValid))}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    'Continue'
                  )}
                </button>
              </div>
            </form>
          </div>
        )
    }
  }

  const modalContent = isSignIn ? (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-white mb-4">Sign In</h2>
      <form onSubmit={handleSignIn} className="space-y-4">
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
              Signing in...
            </span>
          ) : (
            'Sign In'
          )}
        </button>
      </form>
    </div>
  ) : (
    <div className="p-6">
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

      {renderRegistrationStep()}
    </div>
  )

  return (
    <div className="fixed inset-0 z-[9999]">
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />
      
      <div 
        className="fixed inset-0 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        <div className="flex min-h-full items-center justify-center p-2 sm:p-6">
          <div className="relative w-full max-w-xs sm:max-w-md">
            <div className="relative bg-black border border-gray-800 rounded-lg shadow-2xl">
              <button
                onClick={handleClose}
                className="absolute -right-2 -top-2 bg-gray-900 rounded-full p-1 text-gray-400 hover:text-white transition-colors border border-gray-800"
                aria-label="Close"
                style={{ minWidth: 32, minHeight: 32 }}
              >
                <X size={20} />
              </button>

              <div className="p-4 sm:p-6">
                {modalContent}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}