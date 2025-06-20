'use client';

import { useState } from 'react';
import { CoinSide } from '@/types/coin-toss';
import { CoinTossControlsProps } from '@/types/components';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Card, CardContent } from '@/components/ui/card';

const PRESET_AMOUNTS = [1, 5, 10, 25, 50, 100];

const CoinTossControls = ({ onPlay, disabled, maxBet }: CoinTossControlsProps) => {
    const [betAmount, setBetAmount] = useState<number>(1);
    const [selectedSide, setSelectedSide] = useState<CoinSide>('heads');

    const handlePlay = () => {
        if (betAmount <= 0 || betAmount > maxBet || disabled) return;
        onPlay(betAmount, selectedSide);
    };

    return (
        <Card>
            <CardContent className="pt-6">
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label>Bet Amount</Label>
                        <div className="grid grid-cols-3 gap-2">
                            {PRESET_AMOUNTS.map(amount => (
                                <Button
                                    key={amount}
                                    variant={betAmount === amount ? 'default' : 'outline'}
                                    onClick={() => setBetAmount(amount)}
                                    disabled={amount > maxBet}
                                >
                                    ${amount}
                                </Button>
                            ))}
                        </div>
                        <Input
                            type="number"
                            value={betAmount}
                            onChange={(e) => setBetAmount(Math.min(maxBet, Math.max(0, Number(e.target.value))))}
                            min={0}
                            max={maxBet}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Choose Side</Label>
                        <ToggleGroup 
                            type="single" 
                            value={selectedSide} 
                            onValueChange={(value) => setSelectedSide(value as CoinSide)}
                            className="grid grid-cols-2"
                        >
                            <ToggleGroupItem value="heads" className="h-12 text-base">Heads</ToggleGroupItem>
                            <ToggleGroupItem value="tails" className="h-12 text-base">Tails</ToggleGroupItem>
                        </ToggleGroup>
                    </div>

                    <Button
                        onClick={handlePlay}
                        disabled={disabled || betAmount <= 0 || betAmount > maxBet}
                        className="w-full text-lg h-12"
                        size="lg"
                    >
                        {disabled ? 'Flipping...' : 'Flip Coin'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default CoinTossControls; 