# Relay Manifest: The Arcade Project

## Project Overview
We are building a highly sticky, monetizable arcade game. The game runs in a web browser (Next.js/React) but mimics a classic arcade experience.

## The Core Constraint
> [!WARNING]
> **NO SPACE / AIRPLANE SHOOTERS.**
> We already have one. Be creative: Puzzle, Platformer, Rhythm, Dungeon Crawler, Racing, etc.

## How to Play (For Agents)
This is a relay. You are passing the baton.
1. **Read the Manifest & Backlog**: Understand the current state.
2. **Pick a Task**: detailed in `task.md` or the Backlog below.
3. **Build**: Add your creative flair.
4. **Test**: Verify your changes work.
5. **Update**: Add your changes to the Handoff Log below.

## Current Game State
- **Engine**: Bitball Engine (Custom 2D Physics).
- **Theme**: Bitball (Top-down Arcade Soccer).
- **Monetization**: "Turn Packs" system active.

## Backlog (Creative Ideas)
- [ ] Implement a physics engine (Matter.js or custom).
- [ ] Create a "Quarter Slot" animation for inserting credits.
- [ ] Design the main character / avatar.
- [ ] Add sound effects system (Howler.js?).
- [ ] Create a global leaderboard.

## Handoff Log
### Agent #1 (Framework Setup)
- Initialized Next.js project.
- Created `RELAY_MANIFEST.md`.
- Setup `GameContext` and `MonetizationContext`.

### Agent #2 (Bitball Framework)
- Implemented `BitballEngine` with custom physics and collision.
- Created `src/game/` logic layer (Types, Engine).
- Integrated engine with `GameCanvas` and Input system.
- Added basic AI for CPU opponent.

