'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function Header() {
  const [balance] = useState<number>(0)

  return (
    <header className="bg-gray-800 text-white p-4">
      <nav className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          LuckyPunt
        </Link>
        <div className="flex items-center space-x-4">
          <span>Balance: ${balance}</span>
          <Link href="/cashier" className="hover:text-gray-300">
            Cashier
          </Link>
        </div>
      </nav>
    </header>
  )
} 