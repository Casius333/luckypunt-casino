import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import { Toaster } from 'sonner'
import ModalContainer from "@/components/ModalContainer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LuckyPunt.net - Online Gaming Platform",
  description: "Experience the thrill of online gaming at Lucky Punt",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-black text-white`}>
        <div className="relative">
          <Header />
          <main className="pt-16">
            {children}
          </main>
        </div>
        <ModalContainer />
        <Toaster position="bottom-right" theme="dark" />
      </body>
    </html>
  );
}
