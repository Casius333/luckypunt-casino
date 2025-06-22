import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simple in-memory store for rate limiting
const rateLimit = new Map<string, { count: number; timestamp: number }>()

// Rate limit configuration
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const MAX_REQUESTS = 10

function isAuthRequest(req: NextRequest): boolean {
  const authPaths = [
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/api/auth'
  ]
  return authPaths.some(authPath => req.nextUrl.pathname.startsWith(authPath))
}

function getRateLimitKey(req: NextRequest): string {
  const forwardedFor = req.headers.get('x-forwarded-for')
  const realIp = req.headers.get('x-real-ip')
  return forwardedFor?.split(',')[0] || realIp || 'anonymous'
}

async function checkRateLimit(req: NextRequest): Promise<boolean> {
  if (!isAuthRequest(req)) return true

  const key = getRateLimitKey(req)
  const now = Date.now()
  const windowStart = now - RATE_LIMIT_WINDOW

  // Clean up old entries
  for (const [storedKey, data] of rateLimit.entries()) {
    if (data.timestamp < windowStart) {
      rateLimit.delete(storedKey)
    }
  }

  const currentLimit = rateLimit.get(key)
  if (!currentLimit) {
    rateLimit.set(key, { count: 1, timestamp: now })
    return true
  }

  if (currentLimit.timestamp < windowStart) {
    rateLimit.set(key, { count: 1, timestamp: now })
    return true
  }

  if (currentLimit.count >= MAX_REQUESTS) {
    return false
  }

  currentLimit.count++
  return true
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => req.cookies.set(name, value))
          res.headers.set('set-cookie', res.headers.get('set-cookie')!)
        },
      },
    }
  )

  try {
    // Optional: Rate limiting check
    const path = req.nextUrl.pathname
    const { data: { user } } = await supabase.auth.getUser()
    console.log(`Rate limit check for path: ${path} isAuth: ${!!user}`)
    
    // Refresh session if expired - required for Server Components
    const { data: { session } } = await supabase.auth.getSession()
    
    // Optional: Redirect unauthenticated users from protected routes
    if (!session && path.startsWith('/api/protected')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
  } catch (error) {
    console.error('Middleware error:', error)
  }

  return res
}

// Specify which paths should be protected by the middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
} 