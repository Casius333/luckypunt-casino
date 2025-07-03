// Gaming Provider Types - Generic interfaces for any gaming provider

export interface NormalizedTransaction {
  userId: string
  sessionId: string
  provider: string // 'softmaya' | 'evolution' | 'pragmatic' | etc.
  gameId: string
  roundId?: string
  transactionId: string
  type: 'bet' | 'win' | 'rollback' | 'balance'
  amount: number
  timestamp: string
  raw: any // Store full original payload for audit
}

export interface GameSession {
  userId: string
  sessionId: string
  gameId: string
  provider: string
  launchedAt: Date
  lastActivityAt: Date
  isActive: boolean
}

export interface GameInfo {
  id: string
  name: string
  provider: string
  type: 'slot' | 'livecasino' | 'skill' | 'table' | 'sportsbook'
  contributionRate: number // For wagering requirements (0.0 to 1.0)
  isActive: boolean
}

export interface ProviderCallback {
  action: 'balance' | 'bet' | 'win' | 'rollback' | 'betandwin'
  userId: string
  sessionId: string
  gameId: string
  roundId?: string
  transactions: CallbackTransaction[]
  timestamp: string
  provider: string
}

export interface CallbackTransaction {
  type: 'bet' | 'win'
  amount: number
  transactionId: string
  roundId?: string
}

export interface CallbackResponse {
  status: 'success' | 'error'
  balance: string
  userId: string
  error?: {
    code: number
    message: string
  }
}

// Standard error codes (based on Softmaya but generic)
export const GAMING_ERROR_CODES = {
  INSUFFICIENT_FUNDS: 220,
  DUPLICATE_TRANSACTION: 320,
  USER_NOT_FOUND: 240,
  TRANSACTION_NOT_FOUND: 340,
  INVALID_AUTH: 230,
  GAME_NOT_FOUND: 350,
  SESSION_EXPIRED: 360
} as const

// Game type contribution rates (industry standard defaults)
export const DEFAULT_CONTRIBUTION_RATES = {
  slot: 1.0,
  livecasino: 0.1,
  skill: 0.3,
  table: 0.05,
  sportsbook: 0.0
} as const

export interface BetProcessingResult {
  success: boolean
  newBalance: number
  lockedBalance?: number
  wageringProgress?: number
  error?: string
  transactionId?: string
}

export interface WageringContribution {
  gameType: string
  betAmount: number
  contributionRate: number
  contributionAmount: number
} 