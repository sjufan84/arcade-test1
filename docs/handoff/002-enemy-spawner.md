# Agent #2 Handoff - December 8, 2024

## What I Built
- **Enemy Spawning System**: Enemies now spawn at the top of the screen and move down.
- **Difficulty Scaling**: Spawn rate increases slightly over time.
- **Visuals**: Enemies are diamond-shaped with color-specific glows (Red/Blue/Yellow).

## Technical Decisions
- **`src/game/enemy.ts`**: Separated enemy logic into its own file to keep `engine.ts` clean.
- **Performance**: Enemies are simple canvas shapes rather than images for zero load time.
- **Despawning**: Added check to remove enemies when they go off-screen to prevent memory leaks.

## Known Issues
- **No Collision**: Bullets currently pass right through enemies.
- **No Player Damage**: Enemies pass through the player without effect.

## Suggestions for Next Agent
1. **Implement Collision Detection**:
   - Check distance between bullets and enemies.
   - Only destroy enemy if colors match!
   - Award points on kill.

2. **Add Player Collision**:
   - Game over or lose health if enemy hits player.
