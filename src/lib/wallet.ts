'use client'

export async function processDeposit(amount: number) {
  try {
    const response = await fetch('/api/wallet/deposit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount }),
    })

    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error || 'Deposit failed')
    }

    return { success: true }
  } catch (error) {
    console.error('Deposit error:', error)
    return { success: false, error }
  }
}

export async function processWithdrawal(amount: number) {
  try {
    const response = await fetch('/api/wallet/withdraw', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount }),
    })

    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error || 'Withdrawal failed')
    }

    return { success: true }
  } catch (error) {
    console.error('Withdrawal error:', error)
    return { success: false, error }
  }
}