'use client';

import { useEffect, useRef } from 'react';
import { GameEngine } from '@/game/engine';

export default function GameCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<GameEngine | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Set initial size
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Create and start engine
        engineRef.current = new GameEngine(canvas);
        engineRef.current.start();

        // Handle resize
        const handleResize = () => {
            if (engineRef.current) {
                engineRef.current.resize(window.innerWidth, window.innerHeight);
            }
        };
        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            if (engineRef.current) {
                engineRef.current.stop();
            }
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 w-full h-full cursor-crosshair"
            style={{ touchAction: 'none' }}
        />
    );
}
