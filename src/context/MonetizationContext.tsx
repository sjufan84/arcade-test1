'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface MonetizationContextType {
    credits: number;
    purchasePack: (packId: string) => void;
    spendCredit: () => boolean; // Returns true if spent successfully
    canPlay: boolean;
}

const MonetizationContext = createContext<MonetizationContextType | undefined>(undefined);

export const useMonetization = () => {
    const context = useContext(MonetizationContext);
    if (!context) {
        throw new Error('useMonetization must be used within a MonetizationProvider');
    }
    return context;
};

export const MonetizationProvider = ({ children }: { children: ReactNode }) => {
    const [credits, setCredits] = useState(3); // Start with 3 free credits

    const purchasePack = (packId: string) => {
        // Mock purchase logic
        console.log(`Purchasing pack: ${packId}`);
        if (packId === 'starter') setCredits((prev) => prev + 5);
        if (packId === 'pro') setCredits((prev) => prev + 10);
        if (packId === 'whale') setCredits((prev) => prev + 50);
    };

    const spendCredit = () => {
        if (credits > 0) {
            setCredits((prev) => prev - 1);
            return true;
        }
        return false;
    };

    return (
        <MonetizationContext.Provider
            value={{
                credits,
                purchasePack,
                spendCredit,
                canPlay: credits > 0,
            }}
        >
            {children}
        </MonetizationContext.Provider>
    );
};
