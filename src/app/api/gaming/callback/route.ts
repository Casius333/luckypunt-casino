import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { processGameTransaction } from '@/lib/gaming/transactionSystem'
import { 
  NormalizedTransaction, 
  ProviderCallback, 
  CallbackResponse,
  GAMING_ERROR_CODES 
} from '@/types/gaming'

/**
 * Generic gaming provider callback endpoint
 * Handles callbacks from any gaming provider by normalizing the data
 */
export async function POST(request: Request) {
  console.log('=== GAMING CALLBACK RECEIVED ===')
  
  try {
    const body = await request.json()
    console.log('Raw callback body:', JSON.stringify(body, null, 2))

    // Determine provider from request (could be from headers, URL params, or body)
    const provider = determineProvider(request, body)
    console.log('Detected provider:', provider)

    // Normalize the callback based on provider
    const normalizedTransactions = await normalizeCallback(provider, body)
    
    if (!normalizedTransactions || normalizedTransactions.length === 0) {
      console.log('No transactions to process')
      return createErrorResponse('No valid transactions found', GAMING_ERROR_CODES.TRANSACTION_NOT_FOUND)
    }

    console.log(`Processing ${normalizedTransactions.length} transactions`)

    // Process each transaction
    const results = []
    for (const transaction of normalizedTransactions) {
      console.log(`Processing transaction: ${transaction.type} - ${transaction.amount}`)
      const result = await processGameTransaction(transaction)
      results.push(result)
      
      if (!result.success) {
        console.error(`Transaction failed: ${result.error}`)
        return createErrorResponse(result.error || 'Transaction failed', GAMING_ERROR_CODES.INSUFFICIENT_FUNDS)
      }
    }

    // Return success response with the final balance
    const finalResult = results[results.length - 1]
    const response: CallbackResponse = {
      status: 'success',
      balance: finalResult.newBalance.toFixed(2),
      userId: normalizedTransactions[0].userId
    }

    console.log('Callback processed successfully:', response)
    return NextResponse.json(response)

  } catch (error) {
    console.error('Gaming callback error:', error)
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      GAMING_ERROR_CODES.INVALID_AUTH
    )
  }
}

/**
 * Determine which gaming provider sent the callback
 */
function determineProvider(request: Request, body: any): string {
  // Check URL path for provider
  const url = new URL(request.url)
  const pathSegments = url.pathname.split('/')
  const providerFromPath = pathSegments[pathSegments.length - 1]
  
  if (providerFromPath && providerFromPath !== 'callback') {
    return providerFromPath
  }

  // Check headers
  const userAgent = request.headers.get('user-agent') || ''
  if (userAgent.toLowerCase().includes('softmaya')) {
    return 'softmaya'
  }

  // Check body structure for known patterns
  if (body.action && body.userId && body.sessionId) {
    return 'softmaya' // Softmaya pattern
  }

  // Check for other provider patterns here
  // if (body.method && body.player_id) return 'evolution'
  // if (body.type && body.user_id) return 'pragmatic'

  // Default fallback
  return 'unknown'
}

/**
 * Normalize callback data from different providers into our standard format
 */
async function normalizeCallback(provider: string, body: any): Promise<NormalizedTransaction[]> {
  switch (provider) {
    case 'softmaya':
      return normalizeSoftmayaCallback(body)
    
    case 'test':
      return normalizeTestCallback(body)
    
    // Add other providers here
    // case 'evolution':
    //   return normalizeEvolutionCallback(body)
    // case 'pragmatic':
    //   return normalizePragmaticCallback(body)
    
    default:
      console.warn(`Unknown provider: ${provider}, attempting generic normalization`)
      return normalizeGenericCallback(body)
  }
}

/**
 * Normalize Softmaya callback format
 */
function normalizeSoftmayaCallback(body: any): NormalizedTransaction[] {
  const { action, userId, sessionId, gameId, transactions = [] } = body

  if (action === 'balance') {
    return [{
      userId,
      sessionId: sessionId || 'unknown',
      provider: 'softmaya',
      gameId: gameId || 'unknown',
      transactionId: `balance_${Date.now()}`,
      type: 'balance',
      amount: 0,
      timestamp: new Date().toISOString(),
      raw: body
    }]
  }

  return transactions.map((tx: any, index: number) => ({
    userId,
    sessionId: sessionId || 'unknown',
    provider: 'softmaya',
    gameId: gameId || 'unknown',
    roundId: tx.roundId,
    transactionId: tx.transactionId || `${action}_${Date.now()}_${index}`,
    type: tx.type || action,
    amount: parseFloat(tx.amount) || 0,
    timestamp: new Date().toISOString(),
    raw: body
  }))
}

/**
 * Normalize test callback format (for our coin toss game)
 */
function normalizeTestCallback(body: any): NormalizedTransaction[] {
  const { type, userId, gameId, amount, transactionId, sessionId } = body

  return [{
    userId,
    sessionId: sessionId || `test_session_${Date.now()}`,
    provider: 'test',
    gameId: gameId || 'coin-toss',
    transactionId: transactionId || `test_${Date.now()}`,
    type,
    amount: parseFloat(amount) || 0,
    timestamp: new Date().toISOString(),
    raw: body
  }]
}

/**
 * Generic callback normalization for unknown providers
 */
function normalizeGenericCallback(body: any): NormalizedTransaction[] {
  // Try to extract common fields
  const userId = body.userId || body.user_id || body.playerId || body.player_id
  const gameId = body.gameId || body.game_id || body.gameType
  const amount = parseFloat(body.amount || body.bet || body.win || 0)
  const type = body.type || body.action || 'bet'
  const transactionId = body.transactionId || body.transaction_id || body.id || `generic_${Date.now()}`
  const sessionId = body.sessionId || body.session_id || `generic_session_${Date.now()}`

  if (!userId) {
    throw new Error('Unable to determine user ID from callback')
  }

  return [{
    userId,
    sessionId,
    provider: 'generic',
    gameId: gameId || 'unknown',
    transactionId,
    type,
    amount,
    timestamp: new Date().toISOString(),
    raw: body
  }]
}

/**
 * Create error response in the expected format
 */
function createErrorResponse(message: string, code: number): NextResponse {
  const response: CallbackResponse = {
    status: 'error',
    balance: '0.00',
    userId: 'unknown',
    error: {
      code,
      message
    }
  }
  
  return NextResponse.json(response, { status: 400 })
}

/**
 * Handle GET requests for provider verification
 */
export async function GET(request: Request) {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'Gaming callback endpoint active',
    timestamp: new Date().toISOString()
  })
} 