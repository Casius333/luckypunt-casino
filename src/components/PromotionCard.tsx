'use client'

import {
  AlertTriangle,
  Clock,
  DollarSign,
  Gift,
  Percent,
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
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Promotion } from "@/hooks/usePromotions"

interface PromotionCardProps {
  promotion: Promotion
  onActivate: (promotionId: string) => Promise<void>
  activating: boolean
  isActive?: boolean
}

export default function PromotionCard({
  promotion,
  onActivate,
  activating,
  isActive = false,
}: PromotionCardProps) {
  const handleConfirmActivation = async () => {
    await onActivate(promotion.id)
  }

  const isExpired = promotion.end_at && new Date(promotion.end_at) < new Date()

  const getPromotionTypeLabel = () => {
    if (promotion.min_deposit_amount === 0) {
      return "Free Bonus"
    }
    return "Deposit Bonus"
  }

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between">
          <Badge
            variant={
              promotion.min_deposit_amount === 0 ? "default" : "secondary"
            }
          >
            {getPromotionTypeLabel()}
          </Badge>
          {isExpired && <Badge variant="destructive">Expired</Badge>}
        </div>
        <CardTitle className="pt-4 flex items-center gap-2">
          <Gift className="w-5 h-5" />
          {promotion.name}
        </CardTitle>
        <CardDescription>{promotion.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 flex-grow">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Percent className="w-4 h-4 text-green-400" />
          <span>{promotion.bonus_percent}% up to ${promotion.max_bonus_amount}</span>
        </div>

        {promotion.min_deposit_amount > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <DollarSign className="w-4 h-4 text-blue-400" />
            <span>Min deposit: ${promotion.min_deposit_amount}</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4 text-yellow-400" />
          <span>{promotion.wagering_multiplier}x wagering requirement</span>
        </div>

        {promotion.max_withdrawal_amount && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertTriangle className="w-4 h-4 text-orange-400" />
            <span>Max withdrawal: ${promotion.max_withdrawal_amount}</span>
          </div>
        )}
      </CardContent>
      <CardFooter>
        {isActive ? (
          <div className="w-full text-center text-sm font-semibold text-green-500">
            {promotion.min_deposit_amount === 0
              ? "Active"
              : "Waiting for deposit..."}
          </div>
        ) : isExpired ? (
            <div className="w-full text-center text-sm font-semibold text-destructive">
                Expired
            </div>
        ) : (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="w-full" disabled={activating}>
                {activating ? "Activating..." : "Activate Bonus"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Activation</AlertDialogTitle>
                <AlertDialogDescription>
                  {promotion.min_deposit_amount === 0
                    ? "Are you sure you want to activate this free bonus?"
                    : `Are you sure you want to activate this deposit bonus? You'll need to deposit $${promotion.min_deposit_amount}+ to receive your bonus.`}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmActivation}>
                  Confirm
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardFooter>
    </Card>
  )
} 