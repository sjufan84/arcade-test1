# Game Design Document

## Pitch
A "one-more-try" arcade game that encourages small micro-transactions (or fake currency in dev) to keep playing.

## Monetization: The Loop
1. **Free Token**: Player starts with 3 free turns.
2. **Game Loop**: Fast-paced, high-skill ceiling, easy to die/fail.
3. **The Hook**: When you fail, you see your score is *just* below the high score.
4. **Paywall**: "Insert Coin to Continue" (Purchase Turn Pack).

## Technical Pillars
- **Framework**: Next.js 14 (App Router).
- **Styling**: Tailwind CSS + Shadcn UI.
- **State**: React Context (simplicity first).

## Rules
- No Space Shooters.
- Must be mobile responsive (touch controls).
- Must have "juice" (screenshake, particles, punchy audio).
