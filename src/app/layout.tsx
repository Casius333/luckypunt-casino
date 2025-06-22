import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import { Toaster } from 'sonner'
import ModalContainer from "@/components/ModalContainer";
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { SupabaseProvider } from '@/components/SupabaseProvider'

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LuckyPunt Casino",
  description: "Your favorite online casino",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  console.log('=== LAYOUT RENDERING STARTED ===')
  
  const cookieStore = await cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  
  console.log('[SERVER] Layout - session:', session ? `User: ${session.user.email}` : 'No session')
  console.log('[SERVER] Layout - session valid:', !!session)

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className={`${inter.className} bg-black min-h-screen`}>
        <SupabaseProvider session={session}>
          <Header />
          <main className="pt-8 sm:pt-40">
            {children}
          </main>
          <ModalContainer />
          <Toaster position="bottom-right" theme="dark" />
        </SupabaseProvider>
      </body>
    </html>
  );
}
