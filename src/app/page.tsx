'use client';

import React from 'react';
import GameCanvas from '@/components/game/GameCanvas';
import { useGame } from '@/context/GameContext';
import { useMonetization } from '@/context/MonetizationContext';

export default function Home() {
  const { isPlaying, startGame, score, highScore } = useGame();
  const { credits, purchasePack, spendCredit } = useMonetization();

  const handleStart = () => {
    if (credits > 0) {
      if (spendCredit()) {
        startGame();
      }
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-8 bg-zinc-950 text-white font-mono">
      <div className="z-10 w-full max-w-5xl items-center justify-between flex mb-8">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
          ARCADE RELAY
        </h1>
        <div className="flex items-center gap-4">
          <div className="px-4 py-2 bg-zinc-800 rounded border border-zinc-700">
            CREDITS: <span className="text-yellow-400 font-bold text-xl">{credits}</span>
          </div>
          <button
            onClick={() => purchasePack('starter')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm font-bold transition-all"
          >
            + BUY CREDITS
          </button>
        </div>
      </div>

      <div className="relative flex place-items-center group">
        <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative bg-black rounded-lg p-2">
          <GameCanvas />

          {!isPlaying && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-black/60 backdrop-blur-sm z-20 rounded-lg">
              <div className="text-center space-y-2">
                <h2 className="text-6xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                  GAME OVER
                </h2>
                <p className="text-xl text-zinc-400">High Score: {highScore}</p>
              </div>

              <button
                onClick={handleStart}
                disabled={credits <= 0}
                className={`px-8 py-4 text-2xl font-bold rounded-full transform transition-all 
                    ${credits > 0
                    ? 'bg-green-600 hover:bg-green-500 hover:scale-110 shadow-[0_0_20px_rgba(34,197,94,0.5)]'
                    : 'bg-zinc-700 cursor-not-allowed opacity-50'}`}
              >
                {credits > 0 ? "INSERT COIN (START)" : "NO CREDITS"}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-12 grid grid-cols-2 gap-8 w-full max-w-2xl text-center">
        <div className="p-6 rounded-xl bg-zinc-900/50 border border-zinc-800">
          <h3 className="text-zinc-500 text-sm uppercase tracking-wider mb-2">Current Score</h3>
          <p className="text-4xl font-mono">{score}</p>
        </div>
        <div className="p-6 rounded-xl bg-zinc-900/50 border border-zinc-800">
          <h3 className="text-zinc-500 text-sm uppercase tracking-wider mb-2">Record</h3>
          <p className="text-4xl font-mono text-yellow-500">{highScore}</p>
        </div>
      </div>

      <div className="mt-8 text-zinc-600 text-xs">
        <p>Relay Framework v0.1 • Agent: Antigravity</p>
      </div>
    </main>
  );
}
