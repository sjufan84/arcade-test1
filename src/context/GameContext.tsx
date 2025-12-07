'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface GameState {
    score: number;
    isPlaying: boolean;
    isGameOver: boolean;
    highScore: number;
}

interface GameContextType extends GameState {
    startGame: () => void;
    endGame: () => void;
    addScore: (points: number) => void;
    resetGame: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGame = () => {
    const context = useContext(GameContext);
    if (!context) {
        throw new Error('useGame must be used within a GameProvider');
    }
    return context;
};

export const GameProvider = ({ children }: { children: ReactNode }) => {
    const [score, setScore] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isGameOver, setIsGameOver] = useState(false);
    const [highScore, setHighScore] = useState(0);

    const startGame = () => {
        setIsPlaying(true);
        setIsGameOver(false);
        setScore(0);
    };

    const endGame = () => {
        setIsPlaying(false);
        setIsGameOver(true);
        if (score > highScore) {
            setHighScore(score);
        }
    };

    const addScore = (points: number) => {
        setScore((prev) => prev + points);
    };

    const resetGame = () => {
        setIsPlaying(false);
        setIsGameOver(false);
        setScore(0);
    };

    return (
        <GameContext.Provider
            value={{
                score,
                isPlaying,
                isGameOver,
                highScore,
                startGame,
                endGame,
                addScore,
                resetGame,
            }}
        >
            {children}
        </GameContext.Provider>
    );
};
