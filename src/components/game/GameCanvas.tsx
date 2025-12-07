'use client';

import React, { useEffect, useRef } from 'react';
import { useGame } from '@/context/GameContext';
import { useMonetization } from '@/context/MonetizationContext';
import { BitballEngine } from '@/game/engine';
import { GAME_CONSTANTS } from '@/game/types';

const GameCanvas = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { isPlaying, endGame, addScore } = useGame();
    const { credits } = useMonetization();

    // Store engine instance in ref so it persists across renders
    const engineRef = useRef<BitballEngine | null>(null);
    // Track previous score to detect changes
    const prevHomeScoreRef = useRef(0);

    useEffect(() => {
        // Initialize engine only once
        if (!engineRef.current) {
            engineRef.current = new BitballEngine();
        }
    }, []);

    // Handle Input
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (engineRef.current && isPlaying) {
                engineRef.current.handleInput(e.key, true);
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (engineRef.current && isPlaying) {
                engineRef.current.handleInput(e.key, false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [isPlaying]);

    // Game Loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const engine = engineRef.current!;
        let animationFrameId: number;
        let lastTime = performance.now();

        const loop = (time: number) => {
            const deltaTime = (time - lastTime) / 1000;
            lastTime = time;

            // Sync engine state
            engine.state.isPlaying = isPlaying;

            if (isPlaying) {
                // Update Physics/Logic
                engine.update(deltaTime);

                // Sync Score with Global Context
                if (engine.state.score.home > prevHomeScoreRef.current) {
                    addScore(1); // Add 1 to global score
                    prevHomeScoreRef.current = engine.state.score.home;
                }
            } else {
                // If game stopped externally, reset engine
                if (engine.state.score.home > 0) {
                    // Optionally reset engine logic here if needed
                }
            }

            // Draw
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            engine.draw(ctx);

            if (!isPlaying) {
                // Overlay Text for "Insert Coin" if not playing
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                ctx.fillStyle = '#FFFFFF';
                ctx.textAlign = 'center';
                ctx.font = '30px monospace';
                ctx.fillText('INSERT COIN TO START', canvas.width / 2, canvas.height / 2);

                ctx.font = '20px monospace';
                ctx.fillStyle = '#FFFF00';
                ctx.fillText(`Credits: ${credits}`, canvas.width / 2, canvas.height / 2 + 40);
            }

            animationFrameId = requestAnimationFrame(loop);
        };

        animationFrameId = requestAnimationFrame(loop);

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [isPlaying, credits, addScore]);

    return (
        <canvas
            ref={canvasRef}
            className="border-4 border-slate-700 rounded-lg shadow-2xl bg-zinc-900"
            width={GAME_CONSTANTS.FIELD_WIDTH}
            height={GAME_CONSTANTS.FIELD_HEIGHT}
        />
    );
};

export default GameCanvas;
