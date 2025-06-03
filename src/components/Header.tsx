'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Header() {
  const [balance, setBalance] = useState('0.00')

  return (
    <header className="fixed top-0 right-0 left-[240px] h-16 bg-black/90 border-b border-white/10 px-6 flex items-center justify-between">
      <div className="flex-1 flex justify-center">
        <Image
          src="/logo.png"
          alt="Lucky Punt"
          width={160}
          height={40}
          className="object-contain"
        />
      </div>
      
      <div className="flex items-center gap-4">
        <div className="bg-white/5 rounded-lg px-4 py-2">
          <span className="text-gray-400 text-sm mr-2">Balance:</span>
          <span className="text-white font-medium">${balance}</span>
        </div>
        
        <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors">
          Deposit
        </button>
      </div>
    </header>
  )
} 