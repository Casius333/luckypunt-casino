import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import { Toaster } from 'sonner'
import ModalContainer from "@/components/ModalContainer";

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
      <body className={`${inter.className} bg-black min-h-screen`}>
        <Header />
        <main className="pt-40">
          {children}
        </main>
        <ModalContainer />
        <Toaster position="bottom-right" theme="dark" />
      </body>
    </html>
  );
}
