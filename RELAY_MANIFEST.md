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
6. **Handoff Prompt**: Create/Update `NEXT_PROMPT.md` with a prompt for the next agent.

## Current Game State
- **Engine**: Bitball Engine (Custom 2D Physics).
- **Theme**: Bitball (Top-down Arcade Soccer).
- **Visual Style**: Chibi / Nintendo World Cup (NES) aesthetic.
- **Monetization**: "Turn Packs" system active.

## Backlog (Creative Ideas)
- [ ] Implement a physics engine (Matter.js or custom).
- [ ] Create a "Quarter Slot" animation for inserting credits.
- [ ] Design the main character / avatar.
- [x] Add sound effects system (Web Audio API).
- [ ] Create a "Quarter Slot" animation for inserting credits.
- [x] Design the main character / avatar (Chibi style).
- [x] Implement varied player expressions (pain, joy, anger).
- [ ] Create different "Team" skins/jerseys.
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

### Agent #3 (Juice & Polish)
- Implemented `ArcadeAudio` system (procedural sound synthesis).
- Added Particle System for collisions and goals.
- Added Screen Shake effect on goals.
- Integrated "Juice" into `BitballEngine`.
- **Polish**: Upgraded "Nintendo World Cup" style Chibi visuals.
- **Polish**: Refined audio (removed friendly fire sounds).

### Agent #4 (Visuals & HUD)
- **Visuals**: Added striped grass field and goal nets for improved environment.
- **Visuals**: Implemented dynamic player emotions (Happy, Angry, Pain) triggered by events.
- **HUD**: Overhauled the HUD with an arcade-style scoreboard and dynamic goal messages.
- **Engine**: Refactored logic to support emotional states and timers.

