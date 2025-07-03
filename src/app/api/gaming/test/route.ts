import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { processGameTransaction } from '@/lib/gaming/transactionSystem'
import { NormalizedTransaction } from '@/types/gaming'

/**
 * Test endpoint for the generic gaming transaction system
 * Usage: POST /api/gaming/test with { type: 'bet|win|rollback|balance', amount: number, userId: string }
 */
export async function POST(request: Request) {
  try {
    const { type, amount, userId, gameId = 'test-game' } = await request.json()
    
    if (!type || !userId) {
      return NextResponse.json({ error: 'Missing required fields: type, userId' }, { status: 400 })
    }

    if ((type === 'bet' || type === 'win') && (!amount || amount <= 0)) {
      return NextResponse.json({ error: 'Amount must be greater than 0 for bet/win transactions' }, { status: 400 })
    }

    // Create normalized transaction
    const transaction: NormalizedTransaction = {
      userId,
      sessionId: `test_session_${Date.now()}`,
      provider: 'test',
      gameId,
      transactionId: `test_${type}_${Date.now()}`,
      type,
      amount: parseFloat(amount) || 0,
      timestamp: new Date().toISOString(),
      raw: { test: true, type, amount, userId, gameId }
    }

    console.log('Processing test transaction:', transaction)

    // Process the transaction
    const result = await processGameTransaction(transaction)

    console.log('Test transaction result:', result)

    return NextResponse.json({
      success: result.success,
      transaction,
      result,
      message: result.success ? 'Transaction processed successfully' : 'Transaction failed'
    })

  } catch (error) {
    console.error('Gaming test error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 })
  }
}

/**
 * GET endpoint to check system status
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Gaming transaction test endpoint active',
    timestamp: new Date().toISOString(),
    endpoints: {
      'POST /api/gaming/test': 'Test individual transactions',
      'POST /api/gaming/callback': 'Provider callback handler',
      'GET /api/gaming/test': 'System status check'
    }
  })
} 