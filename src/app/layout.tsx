import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import { Toaster } from 'sonner'
import ModalContainer from "@/components/ModalContainer";
import ClientOnlySupabaseDebug from "@/components/ClientOnlySupabaseDebug";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LuckyPunt Casino",
  description: "Your favorite online casino",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className={`${inter.className} bg-black min-h-screen`}>
        <Header />
        <main className="pt-8 sm:pt-40">
          {children}
        </main>
        <ModalContainer />
        <Toaster position="bottom-right" theme="dark" />
        <ClientOnlySupabaseDebug />
      </body>
    </html>
  );
}
