'use client'

import { useState } from 'react'
import {
  AlertTriangle,
  BarChart3,
  Clock,
  DollarSign,
  Gift,
  X,
} from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { UserPromotion } from "@/hooks/usePromotions"

interface ActivePromotionCardProps {
  userPromotion: UserPromotion
  onCancel: (userPromotionId: string) => Promise<void>
  cancelling: boolean
}

export default function ActivePromotionCard({
  userPromotion,
  onCancel,
  cancelling,
}: ActivePromotionCardProps) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  const progress =
    userPromotion.wagering_requirement > 0
      ? (userPromotion.wagering_progress /
          userPromotion.wagering_requirement) *
        100
      : 0

  const remainingWagering = userPromotion.wagering_requirement - userPromotion.wagering_progress

  const handleCancel = async () => {
    await onCancel(userPromotion.id)
    setShowCancelConfirm(false)
  }

  const isAwaitingDeposit = userPromotion.bonus_amount === 0 && userPromotion.promotion.min_deposit_amount > 0

  const getStatusColor = () => {
    if (progress >= 100) return 'text-green-400'
    if (progress >= 50) return 'text-yellow-400'
    return 'text-blue-400'
  }

  const getProgressColor = () => {
    if (progress >= 100) return 'bg-green-500'
    if (progress >= 50) return 'bg-yellow-500'
    return 'bg-blue-500'
  }

  return (
    <Card className="border-primary">
      <CardHeader>
        <div className="flex items-start justify-between">
          <Badge>Active Bonus</Badge>
          <div className="text-sm text-muted-foreground">
            Activated {new Date(userPromotion.activated_at).toLocaleDateString()}
          </div>
        </div>
        <CardTitle className="pt-4 flex items-center gap-2">
          <Gift className="w-5 h-5" />
          {userPromotion.promotion?.name || "Active Promotion"}
        </CardTitle>
        <CardDescription>
          {userPromotion.promotion?.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAwaitingDeposit ? (
          <div className="p-3 bg-blue-500/20 border border-blue-500/30 rounded-md text-center">
            <p className="text-blue-300 font-semibold">
              Waiting for deposit...
            </p>
            <p className="text-blue-400 text-sm mt-1">
              Deposit at least ${userPromotion.promotion.min_deposit_amount} to claim your bonus.
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Wagering Progress</span>
              <span className="text-sm font-medium text-primary">
                {progress.toFixed(1)}%
              </span>
            </div>
            <Progress value={progress} className="h-3" />
            <div className="grid grid-cols-2 gap-4 text-sm mt-2">
              <div>
                <span className="text-muted-foreground">Wagered:</span>
                <div className="font-medium">
                  ${userPromotion.wagering_progress.toFixed(2)}
                </div>
              </div>
              <div className="text-right">
                <span className="text-muted-foreground">Required:</span>
                <div className="font-medium">
                  ${userPromotion.wagering_requirement.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        )}

        {userPromotion.promotion?.max_withdrawal_amount && (
            <div className="flex items-center gap-2 text-sm text-orange-400">
                <AlertTriangle className="w-4 h-4" />
                <span>
                Max withdrawal: ${userPromotion.promotion.max_withdrawal_amount}
                </span>
            </div>
        )}

      </CardContent>
      <CardFooter>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-full" disabled={cancelling}>
              {cancelling ? "Cancelling..." : "Cancel Bonus"}
              <X className="w-4 h-4 ml-2" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                Cancelling this promotion will forfeit:
                <br />• All bonus funds received from this promotion
                <br />• Any winnings earned during this promotion
                <br />
                <br />You will keep your original deposit and any remaining genuine funds.
                <br />This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep Bonus</AlertDialogCancel>
              <AlertDialogAction onClick={handleCancel}>
                Confirm Cancel
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  )
} 