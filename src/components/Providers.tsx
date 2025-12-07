'use client';

import React from 'react';
import { GameProvider } from '@/context/GameContext';
import { MonetizationProvider } from '@/context/MonetizationContext';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <MonetizationProvider>
            <GameProvider>
                {children}
            </GameProvider>
        </MonetizationProvider>
    );
}
