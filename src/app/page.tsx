'use client';

import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues with canvas
const GameCanvas = dynamic(
  () => import('@/components/game/GameCanvas'),
  { ssr: false }
);

export default function Home() {
  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#0a0a0f]">
      <GameCanvas />
    </main>
  );
}
