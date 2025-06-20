# Deposit Bonus Flow

## Overview

The deposit bonus system has been updated to provide a better user experience. Instead of requiring users to enter a deposit amount upfront when activating a promotion, the system now works as follows:

## New Flow

### 1. Activation Phase
- User clicks "Activate" on a deposit bonus promotion
- System shows confirmation: "Are you sure you want to activate this deposit bonus? You'll need to deposit $X+ to receive your bonus."
- User confirms activation
- System creates a `user_promotions` record with:
  - `status = 'active'`
  - `bonus_amount = 0` (no bonus awarded yet)
  - `wagering_requirement = 0` (no wagering required yet)

### 2. Deposit Phase
- User makes a deposit through the normal deposit workflow
- After successful deposit, the system automatically:
  - Checks if user has an active deposit promotion
  - Calculates bonus based on actual deposit amount
  - Updates `user_promotions.bonus_amount` and `wagering_requirement`
  - Adds bonus to user's wallet
  - Records a bonus transaction

### 3. UI States

#### Before Deposit
- Promotion card shows "Waiting for deposit..."
- Active promotion card shows "Waiting for deposit to receive bonus"
- Wagering progress section shows "Make a deposit of $X+ to receive your bonus and start wagering"

#### After Deposit
- Promotion card shows "Active"
- Active promotion card shows actual bonus amount
- Wagering progress section shows normal wagering progress

## Implementation Details

### Key Files

1. **`src/hooks/usePromotions.ts`**
   - Updated `activatePromotion()` to not require deposit amount
   - Added `applyDepositBonus()` function for automatic bonus application

2. **`src/components/PromotionCard.tsx`**
   - Removed deposit input form
   - Added confirmation step before activation
   - Updated status display for deposit bonuses

3. **`src/components/ActivePromotionCard.tsx`**
   - Updated to show "Waiting for deposit..." when bonus_amount is 0
   - Conditional wagering progress display

4. **`src/lib/promotionUtils.ts`**
   - New utility functions for deposit bonus application
   - `applyDepositBonus()` - Main function to apply bonus after deposit
   - `hasActiveDepositPromotion()` - Check if user has active deposit promotion
   - `getActiveDepositPromotion()` - Get active deposit promotion details

5. **`src/app/api/wallet/deposit/route.ts`**
   - Integrated automatic bonus application after successful deposit
   - Returns bonus information in response

### Database Schema

The existing schema works perfectly with this flow:

```sql
-- user_promotions table
CREATE TABLE user_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  promotion_id UUID REFERENCES promotions(id),
  status TEXT CHECK (status IN ('active', 'completed', 'forfeited', 'cancelled')),
  bonus_amount DECIMAL(10,2) DEFAULT 0, -- 0 until deposit is made
  wagering_progress DECIMAL(10,2) DEFAULT 0,
  wagering_requirement DECIMAL(10,2) DEFAULT 0, -- 0 until bonus is awarded
  max_withdrawal_amount DECIMAL(10,2),
  activated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  forfeited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### API Integration

The deposit API now automatically applies bonuses:

```typescript
// After successful deposit
const bonusResult = await applyDepositBonus(user.id, depositAmount)

return NextResponse.json({ 
  success: true,
  balance: newBalance,
  bonusApplied: bonusResult?.success || false,
  bonusAmount: bonusResult?.bonusAmount || 0,
  bonusMessage: bonusResult?.message || null
})
```

## Testing

Use the test script to verify the flow:

```bash
node scripts/test-deposit-bonus.js
```

This script:
1. Creates a test user and wallet
2. Creates a deposit bonus promotion
3. Activates the promotion (no bonus awarded)
4. Makes a deposit
5. Applies the bonus automatically
6. Verifies all database updates

## Benefits

1. **Better UX**: Users don't need to commit to a deposit amount upfront
2. **Flexibility**: Users can deposit any amount above the minimum
3. **Accuracy**: Bonus is calculated based on actual deposit amount
4. **Simplicity**: Single activation step, automatic bonus application
5. **Transparency**: Clear status indicators throughout the process

## No-Deposit Bonuses

No-deposit bonuses continue to work as before:
- Bonus is awarded immediately upon activation
- Wagering requirement is set immediately
- No changes to the existing flow

## Error Handling

- If bonus application fails, the deposit still succeeds
- Comprehensive logging for debugging
- Graceful fallbacks for edge cases
- User-friendly error messages 