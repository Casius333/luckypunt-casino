import Image from "next/image";
import AuthButton from '@/components/AuthButton'
import PromoBanner from '@/components/PromoBanner'
import GameCategories from '@/components/GameCategories'

interface Game {
  id: string
  title: string
  provider: string
  image: string
  isNew?: boolean
  isHot?: boolean
}

// Temporary game data - this would come from your game integration API
const games: Game[] = [
  {
    id: '1',
    title: 'Roulette',
    provider: 'Evolution',
    image: '/games/roulette.png',
    isHot: true
  },
  {
    id: '2',
    title: 'Blackjack',
    provider: 'Evolution',
    image: '/games/blackjack.png'
  },
  {
    id: '3',
    title: 'Baccarat',
    provider: 'Evolution',
    image: '/games/baccarat.png',
    isNew: true
  },
  // Add more games as needed
]

export default function Home() {
  return (
    <div className="space-y-6">
      <PromoBanner />
      
      <GameCategories />
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {games.map((game) => (
          <div
            key={game.id}
            className="group relative aspect-[4/3] rounded-lg overflow-hidden bg-white/5 hover:bg-white/10 transition-colors"
          >
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Replace with actual game thumbnails */}
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                {game.title[0]}
              </div>
            </div>
            
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
              <p className="text-sm font-medium text-white">{game.title}</p>
              <p className="text-xs text-gray-400">{game.provider}</p>
            </div>
            
            {game.isNew && (
              <div className="absolute top-2 right-2 px-2 py-1 bg-emerald-600 text-white text-xs rounded">
                New
              </div>
            )}
            
            {game.isHot && (
              <div className="absolute top-2 right-2 px-2 py-1 bg-red-600 text-white text-xs rounded">
                Hot
              </div>
            )}
            
            <button className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-100 bg-purple-600/80 flex items-center justify-center text-white font-medium transition-opacity">
              Play Now
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
