export interface Player {
  id: string
  username: string | null
  email: string
  full_name: string | null
  avatar_url: string | null
  kyc_status: 'pending' | 'approved' | 'rejected'
  account_status: 'active' | 'suspended' | 'blocked'
  created_at: string
  updated_at: string
}

export interface Wallet {
  id: string
  user_id: string
  currency: string
  balance: number
  locked_balance: number
  last_updated: string
}

export interface Transaction {
  id: string
  user_id: string
  wallet_id: string
  type: 'deposit' | 'withdraw' | 'bet' | 'win' | 'bonus'
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  reference_id: string | null
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface GameSession {
  id: string
  user_id: string
  game_id: string
  provider: string
  start_time: string
  end_time: string | null
  initial_balance: number
  final_balance: number | null
  status: 'active' | 'completed' | 'cancelled'
  metadata: Record<string, any>
}

export interface AdminRole {
  id: string
  name: string
  permissions: Record<string, any>
  created_at: string
}

export interface AdminUser {
  id: string
  user_id: string
  role_id: string
  status: 'active' | 'inactive'
  last_login: string | null
  created_at: string
} 