import { Enemy, GameColor, COLOR_VALUES, EnemyType } from './types';

// Constants
const ENEMY_SIZE = 30; // Slightly larger than bullets
const ENEMY_SPEED = 150; // Pixels per second
const SPAWN_MARGIN = 50;

export function createEnemy(screenWidth: number, type: EnemyType = 'grunt'): Enemy {
    // Random color
    const colors: GameColor[] = ['red', 'blue', 'yellow'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    // Random X position within screen bounds
    const x = Math.random() * (screenWidth - ENEMY_SIZE * 2) + ENEMY_SIZE;

    // Start slightly above the screen
    const y = -ENEMY_SIZE;

    return {
        id: `enemy-${Date.now()}-${Math.random()}`,
        position: { x, y },
        velocity: { x: 0, y: ENEMY_SPEED },
        size: ENEMY_SIZE,
        active: true,
        color: color,
        health: type === 'zigzag' ? 2 : 1, // Zigzags have 2 HP
        points: type === 'zigzag' ? 200 : 100,
        type: type,
    };
}

export function updateEnemy(enemy: Enemy, deltaTime: number): void {
    enemy.position.y += enemy.velocity.y * deltaTime;

    if (enemy.type === 'zigzag') {
        // Sine wave movement (frequency 3, amplitude 150)
        // We use position.y to drive the sine so it's consistent
        enemy.velocity.x = Math.sin(enemy.position.y * 0.02) * 150;
        enemy.position.x += enemy.velocity.x * deltaTime;
    }
}

export function drawEnemy(ctx: CanvasRenderingContext2D, enemy: Enemy): void {
    ctx.save();
    ctx.translate(enemy.position.x, enemy.position.y);

    const colorHex = COLOR_VALUES[enemy.color];

    // Glow effect
    ctx.shadowColor = colorHex;
    ctx.shadowBlur = 10;

    ctx.fillStyle = colorHex;
    ctx.beginPath();

    if (enemy.type === 'zigzag') {
        // Chevron / Arrow shape
        ctx.moveTo(0, enemy.size / 2); // Bottom tip
        ctx.lineTo(enemy.size / 2, -enemy.size / 2); // Top right
        ctx.lineTo(0, -enemy.size / 4); // Inner notch
        ctx.lineTo(-enemy.size / 2, -enemy.size / 2); // Top left
    } else {
        // Diamond (Grunt)
        ctx.moveTo(0, -enemy.size / 2); // Top
        ctx.lineTo(enemy.size / 2, 0);  // Right
        ctx.lineTo(0, enemy.size / 2);  // Bottom
        ctx.lineTo(-enemy.size / 2, 0); // Left
    }

    ctx.closePath();
    ctx.fill();

    // Inner detail
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    if (enemy.type === 'zigzag') {
        ctx.moveTo(0, 0);
        ctx.lineTo(enemy.size / 6, -enemy.size / 2);
        ctx.lineTo(-enemy.size / 6, -enemy.size / 2);
    } else {
        ctx.moveTo(0, -enemy.size / 4);
        ctx.lineTo(enemy.size / 4, 0);
        ctx.lineTo(0, enemy.size / 4);
        ctx.lineTo(-enemy.size / 4, 0);
    }
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}
