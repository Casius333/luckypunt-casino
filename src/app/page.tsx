import PromoBanner from '@/components/PromoBanner'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="space-y-6">
        <PromoBanner />
      </div>
    </main>
  )
}
