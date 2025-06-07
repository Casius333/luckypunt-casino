import Link from 'next/link'
import { Play } from 'lucide-react'

interface Game {
  id: string
  title: string
  provider: string
  isHot?: boolean
  isNew?: boolean
}

const games: Game[] = [
  {
    id: 'sweet-bonanza',
    title: 'Sweet Bonanza',
    provider: 'Pragmatic Play',
    isHot: true
  },
  {
    id: 'gates-of-olympus',
    title: 'Gates of Olympus',
    provider: 'Pragmatic Play',
    isHot: true
  },
  {
    id: 'fruit-party',
    title: 'Fruit Party',
    provider: 'Pragmatic Play',
    isNew: true
  },
  {
    id: 'book-of-dead',
    title: 'Book of Dead',
    provider: 'Play\'n GO',
    isHot: true
  },
  {
    id: 'starburst',
    title: 'Starburst',
    provider: 'NetEnt',
    isNew: true
  },
  {
    id: 'gonzo-quest',
    title: 'Gonzo\'s Quest',
    provider: 'NetEnt'
  },
  {
    id: 'big-bass-bonanza',
    title: 'Big Bass Bonanza',
    provider: 'Pragmatic Play',
    isHot: true
  },
  {
    id: 'wolf-gold',
    title: 'Wolf Gold',
    provider: 'Pragmatic Play'
  },
  {
    id: 'dog-house',
    title: 'The Dog House',
    provider: 'Pragmatic Play',
    isNew: true
  },
  {
    id: 'reactoonz',
    title: 'Reactoonz',
    provider: 'Play\'n GO',
    isHot: true
  },
  {
    id: 'dead-or-alive',
    title: 'Dead or Alive 2',
    provider: 'NetEnt'
  },
  {
    id: 'money-train',
    title: 'Money Train 2',
    provider: 'Relax Gaming',
    isHot: true
  },
  {
    id: 'jammin-jars',
    title: 'Jammin\' Jars',
    provider: 'Push Gaming',
    isNew: true
  },
  {
    id: 'book-of-ra',
    title: 'Book of Ra',
    provider: 'Novomatic',
    isHot: true
  },
  {
    id: 'buffalo-king',
    title: 'Buffalo King',
    provider: 'Pragmatic Play'
  },
  {
    id: 'razor-shark',
    title: 'Razor Shark',
    provider: 'Push Gaming',
    isNew: true
  },
  {
    id: 'wild-west-gold',
    title: 'Wild West Gold',
    provider: 'Pragmatic Play',
    isHot: true
  },
  {
    id: 'book-of-shadows',
    title: 'Book of Shadows',
    provider: 'Nolimit City'
  },
  {
    id: 'fire-joker',
    title: 'Fire Joker',
    provider: 'Play\'n GO'
  },
  {
    id: 'rise-of-olympus',
    title: 'Rise of Olympus',
    provider: 'Play\'n GO',
    isNew: true
  },
  {
    id: 'moon-princess',
    title: 'Moon Princess',
    provider: 'Play\'n GO',
    isHot: true
  },
  {
    id: 'mental',
    title: 'Mental',
    provider: 'Nolimit City',
    isNew: true
  },
  {
    id: 'san-quentin',
    title: 'San Quentin',
    provider: 'Nolimit City',
    isHot: true
  },
  {
    id: 'immortal-romance',
    title: 'Immortal Romance',
    provider: 'Microgaming'
  }
]

export default function GameGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1">
      {games.map((game) => (
        <div key={game.id} className="group relative">
          <div className="aspect-[4/3] relative rounded-lg overflow-hidden bg-gradient-to-br from-purple-900/50 to-blue-900/50">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <Link
                  href={`/play/${game.id}`}
                  className="flex items-center justify-center gap-2 w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Play size={16} />
                  <span>Play Now</span>
                </Link>
              </div>
            </div>
          </div>
          
          <div className="absolute top-2 right-2 flex gap-1">
            {game.isHot && (
              <span className="px-1.5 py-0.5 text-xs bg-red-500 text-white rounded">Hot</span>
            )}
            {game.isNew && (
              <span className="px-1.5 py-0.5 text-xs bg-green-500 text-white rounded">New</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
} 