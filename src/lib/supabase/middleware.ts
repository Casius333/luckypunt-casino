import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import type { NextRequest, NextResponse } from 'next/server'

export const createClient = (req: NextRequest, res: NextResponse) => {
  return createMiddlewareClient({ req, res })
} 