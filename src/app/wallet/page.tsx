'use client'

import { useUser } from '@/hooks/useUser'
import { useWallet } from '@/hooks/useWallet'
import { useTransactions } from '@/hooks/useTransactions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Wallet as WalletIcon, RefreshCw, ArrowUp, ArrowDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function WalletPage() {
    const { user, loading: userLoading } = useUser()
    const { wallet, loading: walletLoading, refetch: refetchWallet } = useWallet()
    const { transactions, loading: transactionsLoading, refetch: refetchTransactions } = useTransactions()

    const isLoading = userLoading || walletLoading || transactionsLoading

    const handleRefresh = () => {
        refetchWallet()
        refetchTransactions()
    }

    const getTransactionIcon = (type: string) => {
        switch(type) {
            case 'deposit':
                return <ArrowDown className="w-4 h-4 text-green-500" />
            case 'bonus':
                return <ArrowDown className="w-4 h-4 text-blue-500" />
            case 'withdrawal':
                return <ArrowUp className="w-4 h-4 text-red-500" />
            default:
                return null
        }
    }

    return (
        <div className="container mx-auto px-4 py-8 space-y-8">
            <section>
                <h1 className="text-3xl font-bold">Wallet</h1>
                <p className="text-muted-foreground">Manage your funds and view your transaction history.</p>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <WalletIcon className="w-6 h-6" /> Balance
                                </div>
                                <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={isLoading}>
                                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                                </Button>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {wallet ? (
                                <>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Main Balance</p>
                                        <p className="text-3xl font-bold">${wallet.balance.toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Bonus Balance</p>
                                        <p className="text-3xl font-bold">${wallet.bonus_balance.toFixed(2)}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button className="flex-1">Deposit</Button>
                                        <Button variant="secondary" className="flex-1">Withdraw</Button>
                                    </div>
                                </>
                            ) : (
                                <p>Loading wallet...</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="md:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Transaction History</CardTitle>
                            <CardDescription>A record of your recent account activity.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transactions.length > 0 ? transactions.map(tx => (
                                        <TableRow key={tx.id}>
                                            <TableCell>{new Date(tx.created_at).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="capitalize flex items-center gap-1">
                                                    {getTransactionIcon(tx.type)}
                                                    {tx.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{tx.description}</TableCell>
                                            <TableCell className={`text-right font-semibold ${tx.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                {tx.amount > 0 ? '+' : ''}${tx.amount.toFixed(2)}
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center">No transactions yet.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </section>
        </div>
    )
} 