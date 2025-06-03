import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Lucky Punt - Online Gaming Platform",
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
        <Sidebar />
        <Header />
        <main className="ml-[240px] pt-16 min-h-screen">
          <div className="container mx-auto p-6">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
