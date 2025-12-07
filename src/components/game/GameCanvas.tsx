'use client';

import React, { useEffect, useRef } from 'react';
import { useGame } from '@/context/GameContext';
import { useMonetization } from '@/context/MonetizationContext';

const GameCanvas = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { isPlaying, endGame, addScore } = useGame();
    const { credits } = useMonetization();

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;

        const render = () => {
            // Clear canvas
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            if (isPlaying) {
                // Draw game loop placeholder
                ctx.fillStyle = '#00FF00';
                ctx.font = '24px monospace';
                ctx.fillText('GAME IS RUNNING', 50, 50);
                ctx.fillText(`Simulated Score: ${Math.floor(Date.now() / 100) % 1000}`, 50, 100);
            } else {
                // Draw game over / start screen
                ctx.fillStyle = '#333333';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                ctx.fillStyle = '#FFFFFF';
                ctx.font = '30px monospace';
                ctx.fillText('INSERT COIN', 50, canvas.height / 2);
                ctx.font = '16px monospace';
                ctx.fillText(`Credits Available: ${credits}`, 50, canvas.height / 2 + 40);
            }

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [isPlaying, credits]);

    return (
        <canvas
            ref={canvasRef}
            className="border-4 border-slate-700 rounded-lg shadow-2xl"
            width={800}
            height={600}
        />
    );
};

export default GameCanvas;
