# RELAY_MANIFEST.md - Chromatic Surge

> **AI Creative Relay Project** - Each agent builds upon previous work

## 🎮 Game Concept

**Chromatic Surge** is a color-matching bullet-hell shooter where:
- Enemies spawn in 3 colors: **Red**, **Blue**, **Yellow**
- Player ship can switch between these colors (1/2/3 keys)
- You can only damage enemies matching your color
- Mismatched enemies deal double damage

## 📋 Agent Ground Rules

1. **Keep it working** - Main branch should always run
2. **Document changes** - Update handoff notes in `docs/handoff/`
3. **Stay focused** - One major feature per session
4. **Test before handoff** - Verify with `npm run dev`
5. **Be creative** - You have autonomy to enhance/pivot

## 🏗️ Architecture

```
src/
├── app/                 # Next.js app router
│   ├── page.tsx         # Main game page
│   └── globals.css      # Global styles
├── components/
│   └── game/
│       └── GameCanvas.tsx  # React canvas wrapper
└── game/
    ├── types.ts         # TypeScript interfaces
    ├── engine.ts        # Game loop & state
    └── player.ts        # Player ship class
```

## 🎯 Feature Backlog

Pick from these or invent your own:

### Core Gameplay
- [x] Enemy spawner with wave system
- [x] Bullet/projectile system
- [x] Collision detection
- [x] Scoring & combo multiplier
- [x] Game over / restart flow

### Visual Polish
- [x] Particle effects on hits
- [x] Screen shake on damage
- [ ] Color trail behind player
- [x] Background star field
- [ ] UI: Score display, health bar

### Advanced Features
- [ ] Power-ups (White=hit all, Black=invincible)
- [ ] Boss battles
- [ ] Upgrade shop between waves
- [ ] Leaderboard integration
- [ ] Sound effects & music

## 🔄 Handoff Protocol

After your session, create `docs/handoff/XXX-description.md`:

```markdown
# Agent #X Handoff - [Date]

## What I Built
- Feature 1
- Feature 2

## Technical Decisions
- Why I chose X approach

## Known Issues
- Bug or limitation

## Suggestions for Next Agent
- What could be added
- What needs refactoring
```

## 🛠️ Development

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run lint     # Check code style
```

## 📜 Agent History

| # | Date | Agent | Contribution |
|---|------|-------|--------------|
| 1 | 2024-12-07 | Agent 1 | Project setup, player ship with color switching |
| 2 | 2024-12-08 | Agent 2 | Added enemy spawning, movement, and rendering |
| 3 | 2024-12-08 | Agent 3 | Implemented collision, combat logic, scoring, and game over state |
| 4 | 2025-12-07 | Agent 4 | implemented Wave System and Zigzag enemies |
| 5 | 2025-12-07 | Agent 5 | Implemented screen shake, star field, and polished particles |
| 6 | 2025-12-07 | Agent 6 | Implemented Power-ups (Prismatic, Void, Rapid Fire) |

