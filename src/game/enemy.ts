import { Enemy, GameColor, COLOR_VALUES } from './types';

// Constants
const ENEMY_SIZE = 30; // Slightly larger than bullets
const ENEMY_SPEED = 150; // Pixels per second
const SPAWN_MARGIN = 50;

export function createEnemy(screenWidth: number): Enemy {
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
        health: 1, // Basic enemies die in 1 hit
        points: 100,
    };
}

export function updateEnemy(enemy: Enemy, deltaTime: number): void {
    enemy.position.y += enemy.velocity.y * deltaTime;
}

export function drawEnemy(ctx: CanvasRenderingContext2D, enemy: Enemy): void {
    ctx.save();
    ctx.translate(enemy.position.x, enemy.position.y);

    const colorHex = COLOR_VALUES[enemy.color];

    // Glow effect
    ctx.shadowColor = colorHex;
    ctx.shadowBlur = 10;

    // Enemy shape (Square rotated 45 degrees - Diamond)
    ctx.fillStyle = colorHex;
    ctx.beginPath();
    ctx.moveTo(0, -enemy.size / 2); // Top
    ctx.lineTo(enemy.size / 2, 0);  // Right
    ctx.lineTo(0, enemy.size / 2);  // Bottom
    ctx.lineTo(-enemy.size / 2, 0); // Left
    ctx.closePath();
    ctx.fill();

    // Inner detail (darker center)
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.moveTo(0, -enemy.size / 4);
    ctx.lineTo(enemy.size / 4, 0);
    ctx.lineTo(0, enemy.size / 4);
    ctx.lineTo(-enemy.size / 4, 0);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}
