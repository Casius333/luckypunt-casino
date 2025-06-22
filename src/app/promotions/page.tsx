'use client'

import { useUser } from '@/hooks/useUser'
import { usePromotions } from '@/hooks/usePromotions'
import PromotionCard from '@/components/PromotionCard'
import ActivePromotionCard from '@/components/ActivePromotionCard'
import { Gift, Trophy, History, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export default function PromotionsPage() {
  const { user, loading: authLoading } = useUser()
  const {
    availablePromotions,
    activePromotion,
    completedPromotions,
    cancelledPromotions,
    loading,
    activating,
    cancelling,
    activatePromotion,
    cancelPromotion,
  } = usePromotions(user?.id)

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="flex items-center gap-2 text-foreground">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading promotions...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-2">
        <Gift className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold">Promotions & Bonuses</h1>
      </div>
      <p className="text-muted-foreground mb-8">
        Claim exclusive bonuses and promotions to boost your gaming experience.
      </p>

      {/* Active Promotion Section */}
      {activePromotion && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-400" />
              Your Active Bonus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ActivePromotionCard
              userPromotion={activePromotion}
              onCancel={cancelPromotion}
              cancelling={cancelling === activePromotion.id}
            />
          </CardContent>
        </Card>
      )}

      {/* Available Promotions Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-6 h-6 text-primary" />
            Available Promotions
          </CardTitle>
          {activePromotion && (
            <p className="text-sm text-muted-foreground">
              You can only have one active promotion at a time.
            </p>
          )}
        </CardHeader>
        <CardContent>
          {availablePromotions.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <Gift className="w-12 h-12 mx-auto mb-4" />
              <p>No promotions available at the moment.</p>
              <p className="text-sm mt-2">Check back later for new offers!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availablePromotions.map((promotion) => (
                <PromotionCard
                  key={promotion.id}
                  promotion={promotion}
                  onActivate={activatePromotion}
                  activating={activating}
                  isActive={activePromotion?.promotion_id === promotion.id}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>


      {/* Promotion History Section */}
      {(completedPromotions.length > 0 || cancelledPromotions.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-6 h-6" />
              Promotion History
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Completed Promotions */}
            {completedPromotions.map((userPromotion) => (
              <div key={userPromotion.id} className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <h3 className="text-lg font-semibold">
                    {userPromotion.promotion?.name || 'Completed Promotion'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Bonus: ${userPromotion.bonus_amount.toFixed(2)} | 
                    Wagered: ${userPromotion.wagering_progress.toFixed(2)} / ${userPromotion.wagering_required.toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                    <span className="px-2 py-1 rounded text-xs font-medium bg-green-500 text-white">
                        Completed
                    </span>
                  <p className="text-xs text-muted-foreground mt-1">
                    {userPromotion.completed_at && new Date(userPromotion.completed_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
            
            <Separator />

            {/* Cancelled/Forfeited Promotions */}
            {cancelledPromotions.map((userPromotion) => (
                <div key={userPromotion.id} className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                    <h3 className="text-lg font-semibold">
                        {userPromotion.promotion?.name || 'Cancelled Promotion'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Bonus: ${userPromotion.bonus_amount.toFixed(2)} | 
                        Wagered: ${userPromotion.wagering_progress.toFixed(2)} / ${userPromotion.wagering_required.toFixed(2)}
                    </p>
                    </div>
                    <div className="text-right">
                    <span className="px-2 py-1 rounded text-xs font-medium bg-red-500 text-white">
                        {userPromotion.status === 'cancelled' ? 'Cancelled' : 'Forfeited'}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">
                        {userPromotion.forfeited_at && new Date(userPromotion.forfeited_at).toLocaleDateString()}
                    </p>
                    </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
} 