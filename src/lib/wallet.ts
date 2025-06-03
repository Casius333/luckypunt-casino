import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const supabase = createClientComponentClient()

export async function processDeposit(amount: number, userId: string) {
  try {
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('id, balance')
      .eq('user_id', userId)
      .single()

    if (walletError) throw walletError

    const { error: transactionError } = await supabase.rpc('update_wallet_balance', {
      p_wallet_id: wallet.id,
      p_amount: amount,
      p_type: 'deposit'
    })

    if (transactionError) throw transactionError

    // Create transaction record
    const { error: recordError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        wallet_id: wallet.id,
        type: 'deposit',
        amount: amount,
        currency: 'AUD',
        status: 'completed'
      })

    if (recordError) throw recordError

    return { success: true }
  } catch (error) {
    console.error('Deposit error:', error)
    return { success: false, error }
  }
}

export async function processWithdrawal(amount: number, userId: string) {
  try {
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('id, balance')
      .eq('user_id', userId)
      .single()

    if (walletError) throw walletError
    if (wallet.balance < amount) {
      throw new Error('Insufficient funds')
    }

    const { error: transactionError } = await supabase.rpc('update_wallet_balance', {
      p_wallet_id: wallet.id,
      p_amount: amount,
      p_type: 'withdraw'
    })

    if (transactionError) throw transactionError

    // Create transaction record
    const { error: recordError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        wallet_id: wallet.id,
        type: 'withdrawal',
        amount: amount,
        currency: 'AUD',
        status: 'completed'
      })

    if (recordError) throw recordError

    return { success: true }
  } catch (error) {
    console.error('Withdrawal error:', error)
    return { success: false, error }
  }
} 