# Chromatic Surge - Game Design Document

## Core Loop

1. Player controls ship with WASD/arrows
2. Enemies spawn from edges in waves
3. Press 1/2/3 to switch ship color
4. Shoot (Space/Click) to fire matching-color bullets
5. Kill enemies to score, chain same-color kills for combo
6. Survive as long as possible

## Color Mechanics

| Color | Key | Hex | Glow |
|-------|-----|-----|------|
| Red | 1 | `#ff3366` | `rgba(255,51,102,0.5)` |
| Blue | 2 | `#3399ff` | `rgba(51,153,255,0.5)` |
| Yellow | 3 | `#ffcc00` | `rgba(255,204,0,0.5)` |

### Combat Rules
- **Matched color**: Full damage to enemy
- **Mismatched**: Enemy takes no damage, player takes 2x damage on collision
- **Combo**: Same-color kills in sequence multiply score (1x, 2x, 3x...)

## Player Ship

- **Speed**: 300 px/sec
- **Size**: 24px (triangle shape)
- **Health**: 3 hits
- **Fire rate**: 5 shots/sec
- **Invincibility**: 1.5s after hit

## Future Concepts

### Power-ups
- **White Orb**: Become "prismatic" - damage any color for 5s
- **Black Orb**: Become "void" - invincible but can't shoot for 3s
- **Rainbow Streak**: Triple fire rate for 5s

### Enemy Types (for future agents)
- **Grunt**: Moves straight, 1 HP
- **Zigzag**: Weaves side to side
- **Splitter**: Splits into 2 on death
- **Shooter**: Fires back at player
- **Boss**: Large, multi-phase, pattern attacks
