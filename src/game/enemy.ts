import { Enemy, GameColor, COLOR_VALUES, EnemyType } from './types';

// Constants
const ENEMY_SIZE = 30; // Slightly larger than bullets
const ENEMY_SPEED = 150; // Pixels per second

export function createEnemy(screenWidth: number, type: EnemyType = 'grunt', bossTier: number = 1): Enemy {
    // Random color
    const colors: GameColor[] = ['red', 'blue', 'yellow'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    let size = ENEMY_SIZE;
    let hp = 1;
    let points = 100;
    let y = -ENEMY_SIZE;
    let shootCooldown: number | undefined = undefined;
    // Boss specific vars
    let x = Math.random() * (screenWidth - ENEMY_SIZE * 2) + ENEMY_SIZE;

    if (type === 'zigzag') {
        hp = 2;
        points = 200;
    } else if (type === 'boss') {
        size = 80 + bossTier * 5; // Slightly bigger each tier
        hp = 50 + (bossTier - 1) * 25; // 50, 75, 100, 125...
        points = 5000 * bossTier; // More points per tier
        y = -100; // Start higher up
        x = screenWidth / 2; // Start centered
        // Faster shooting at higher tiers: 2.0s -> 1.5s -> 1.2s...
        shootCooldown = Math.max(0.8, 2.0 - (bossTier - 1) * 0.3);
    }

    return {
        id: `enemy-${Date.now()}-${Math.random()}`,
        position: { x, y },
        velocity: { x: 0, y: type === 'boss' ? 50 : ENEMY_SPEED },
        size: size,
        active: true,
        color: color,
        health: hp,
        maxHealth: hp,
        points: points,
        type: type,
        shootCooldown: shootCooldown,
        bossTier: type === 'boss' ? bossTier : undefined,
        bossPhase: type === 'boss' ? 1 : undefined,
    };
}

export function updateEnemy(enemy: Enemy, deltaTime: number, screenWidth: number = 800): void {
    if (enemy.type === 'boss') {
        // Boss moves down to a certain point, then strafes
        if (enemy.position.y < 100) {
            enemy.position.y += enemy.velocity.y * deltaTime;
        } else {
            // Strafe logic
            const time = Date.now() / 1000;
            const centerX = screenWidth / 2;
            const amplitude = screenWidth * 0.25;

            // Oscillate around center
            enemy.position.x = centerX + Math.sin(time) * amplitude;
        }
    } else {
        enemy.position.y += enemy.velocity.y * deltaTime;

        if (enemy.type === 'zigzag') {
            // Sine wave movement (frequency 3, amplitude 150)
            enemy.velocity.x = Math.sin(enemy.position.y * 0.02) * 150;
            enemy.position.x += enemy.velocity.x * deltaTime;
        }
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

    if (enemy.type === 'boss') {
        // Hexagon shape for Boss
        const sides = 6;
        for (let i = 0; i < sides; i++) {
            const angle = (i * 2 * Math.PI) / sides;
            const px = Math.cos(angle) * (enemy.size / 2);
            const py = Math.sin(angle) * (enemy.size / 2);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
    } else if (enemy.type === 'zigzag') {
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

    if (enemy.type === 'boss') {
        // Eye of the boss
        ctx.arc(0, 0, enemy.size / 4, 0, Math.PI * 2);
    } else if (enemy.type === 'zigzag') {
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
