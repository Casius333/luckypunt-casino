# Phase 3: Generic Gaming Transaction System

## Overview

We've implemented a flexible, provider-agnostic gaming transaction system that can handle bets, wins, and rollbacks from any gaming provider while integrating seamlessly with our bonus system.

## Architecture

### Core Components

1. **Generic Types** (`src/types/gaming.ts`)
   - `NormalizedTransaction`: Standard transaction format for all providers
   - `GameSession`: Session tracking across providers
   - `BetProcessingResult`: Standardized response format
   - `DEFAULT_CONTRIBUTION_RATES`: Industry-standard wagering contribution rates

2. **Transaction System** (`src/lib/gaming/transactionSystem.ts`)
   - `processGameTransaction()`: Main entry point for all gaming transactions
   - Handles bet, win, rollback, and balance queries
   - Integrates with bonus system for wagering progress
   - Automatic promotion completion when requirements met

3. **Callback Handler** (`src/app/api/gaming/callback/route.ts`)
   - Provider-agnostic endpoint for gaming callbacks
   - Auto-detects provider from request structure
   - Normalizes different provider formats into standard format
   - Supports Softmaya, test, and generic providers

4. **Updated Coin Toss Game** (`src/app/api/games/coin-toss/play/route.ts`)
   - Now uses the generic transaction system
   - Demonstrates how internal games integrate with the system
   - Maintains existing UI compatibility

## Key Features

### Provider Flexibility
- **Softmaya Support**: Ready for Softmaya integration with HMAC authentication
- **Generic Support**: Can handle unknown providers with common field mapping
- **Test Provider**: Built-in test provider for development
- **Extensible**: Easy to add new providers by creating normalization functions

### Bonus Integration
- **Wagering Progress**: Automatic tracking based on game type contribution rates
- **Fund Segregation**: Proper handling of locked vs. regular funds
- **Completion Detection**: Automatic promotion completion when requirements met
- **Multiple Games**: Supports different contribution rates per game type

### Transaction Safety
- **Idempotency**: Prevents duplicate transaction processing
- **Rollback Support**: Can reverse transactions on provider request
- **Error Handling**: Comprehensive error codes and responses
- **Audit Trail**: Full transaction logging with original provider data

## Game Type Contribution Rates

| Game Type | Contribution Rate | Use Case |
|-----------|------------------|----------|
| Slots | 100% | Standard slot games |
| Live Casino | 10% | Live dealer games |
| Skill Games | 30% | Coin toss, poker variants |
| Table Games | 5% | RNG table games |
| Sportsbook | 0% | Sports betting (optional) |

## API Endpoints

### Gaming Callback
```
POST /api/gaming/callback
```
Handles callbacks from any gaming provider. Auto-detects provider and processes transactions.

**Softmaya Example:**
```json
{
  "action": "bet",
  "userId": "user123",
  "sessionId": "session456", 
  "gameId": "slot001",
  "transactions": [
    {
      "type": "bet",
      "amount": "10.00",
      "transactionId": "tx789"
    }
  ]
}
```

**Response:**
```json
{
  "status": "success",
  "balance": "90.00",
  "userId": "user123"
}
```

### Test Endpoint
```
POST /api/gaming/test
```
Test individual transactions for development.

**Example:**
```json
{
  "type": "bet",
  "amount": 10,
  "userId": "user123",
  "gameId": "test-game"
}
```

## Integration Examples

### Adding a New Provider

1. **Add Provider Detection** in `determineProvider()`:
```typescript
if (body.method && body.player_id) {
  return 'evolution'
}
```

2. **Add Normalization Function**:
```typescript
function normalizeEvolutionCallback(body: any): NormalizedTransaction[] {
  return [{
    userId: body.player_id,
    sessionId: body.session_id,
    provider: 'evolution',
    gameId: body.game_id,
    transactionId: body.transaction_id,
    type: body.method === 'debit' ? 'bet' : 'win',
    amount: parseFloat(body.amount),
    timestamp: new Date().toISOString(),
    raw: body
  }]
}
```

3. **Add to Switch Statement** in `normalizeCallback()`:
```typescript
case 'evolution':
  return normalizeEvolutionCallback(body)
```

### Creating Internal Games

1. **Use the Transaction System**:
```typescript
import { processGameTransaction } from '@/lib/gaming/transactionSystem'
import { NormalizedTransaction } from '@/types/gaming'

const betTransaction: NormalizedTransaction = {
  userId: user.id,
  sessionId: `game_${Date.now()}`,
  provider: 'internal',
  gameId: 'my-game',
  transactionId: `bet_${Date.now()}`,
  type: 'bet',
  amount: betAmount,
  timestamp: new Date().toISOString(),
  raw: { gameSpecificData: true }
}

const result = await processGameTransaction(betTransaction)
```

## Testing

### Test the System
```bash
# Test bet transaction
curl -X POST http://localhost:3333/api/gaming/test \
  -H "Content-Type: application/json" \
  -d '{"type":"bet","amount":10,"userId":"your-user-id"}'

# Test balance query
curl -X POST http://localhost:3333/api/gaming/test \
  -H "Content-Type: application/json" \
  -d '{"type":"balance","userId":"your-user-id"}'
```

### Play Coin Toss
The coin toss game now uses the generic system and will:
- Process bets through the transaction system
- Update wagering progress if you have an active promotion
- Handle fund segregation properly
- Complete promotions automatically when requirements are met

## Benefits

1. **Provider Independence**: Can switch or add providers without changing core logic
2. **Consistent Bonus Handling**: All games contribute to wagering requirements uniformly
3. **Audit Compliance**: Complete transaction trail with original provider data
4. **Scalability**: Easy to add new game types and providers
5. **Testing**: Built-in test capabilities for development
6. **Error Recovery**: Rollback support for failed transactions

## Next Steps

- **Phase 4**: Promotion completion/cancellation UI
- **Phase 5**: Frontend refinements and real-time updates
- **Phase 6**: Variable game contribution rates per specific games
- **Production**: Add real provider integrations (Softmaya, Evolution, etc.)

## Notes

- The coin toss game remains fully functional for testing bonus flows
- All existing bonus logic continues to work unchanged
- The system is ready for real gaming provider integration
- Transaction safety and idempotency are built-in
- Comprehensive logging for debugging and compliance 