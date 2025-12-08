// Player ship class for Chromatic Surge

import {
    Player,
    GameColor,
    COLOR_VALUES,
    COLOR_GLOW,
    Vector2,
    Bullet
} from './types';

const PLAYER_SPEED = 300;
const PLAYER_SIZE = 24;
const FIRE_RATE = 200; // ms between shots
const INVINCIBILITY_DURATION = 1500;

export function createPlayer(canvasWidth: number, canvasHeight: number): Player {
    return {
        id: 'player',
        position: { x: canvasWidth / 2, y: canvasHeight - 100 },
        velocity: { x: 0, y: 0 },
        size: PLAYER_SIZE,
        active: true,
        color: 'blue',
        health: 3,
        maxHealth: 3,
        score: 0,
        combo: 0,
        invincibleUntil: 0,
        lastShot: 0,
        activePowerUp: undefined,
        powerUpTimer: 0,
    };
}

export function updatePlayer(
    player: Player,
    keys: Set<string>,
    deltaTime: number,
    canvasWidth: number,
    canvasHeight: number
): void {
    // Movement
    const input: Vector2 = { x: 0, y: 0 };

    if (keys.has('KeyW') || keys.has('ArrowUp')) input.y = -1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) input.y = 1;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) input.x = -1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) input.x = 1;

    // Normalize diagonal movement
    const magnitude = Math.sqrt(input.x * input.x + input.y * input.y);
    if (magnitude > 0) {
        input.x /= magnitude;
        input.y /= magnitude;
    }

    player.velocity.x = input.x * PLAYER_SPEED;
    player.velocity.y = input.y * PLAYER_SPEED;

    player.position.x += player.velocity.x * deltaTime;
    player.position.y += player.velocity.y * deltaTime;

    // Clamp to canvas bounds
    const halfSize = player.size / 2;
    player.position.x = Math.max(halfSize, Math.min(canvasWidth - halfSize, player.position.x));
    player.position.y = Math.max(halfSize, Math.min(canvasHeight - halfSize, player.position.y));

    // PowerUp Timer
    if (player.activePowerUp) {
        player.powerUpTimer -= deltaTime * 1000;
        if (player.powerUpTimer <= 0) {
            player.activePowerUp = undefined;
        }
    }
}

export function switchColor(player: Player, color: GameColor): void {
    player.color = color;
}

export function tryShoot(player: Player, now: number): Bullet | null {
    // Black orb (Void) prevents shooting
    if (player.activePowerUp === 'black') return null;

    // Rainbow streak (Rapid Fire) triples fire rate
    const currentRate = player.activePowerUp === 'rainbow' ? FIRE_RATE / 3 : FIRE_RATE;

    if (now - player.lastShot < currentRate) return null;

    player.lastShot = now;

    return {
        id: `bullet-${now}-${Math.random()}`,
        position: { x: player.position.x, y: player.position.y - player.size },
        velocity: { x: 0, y: -600 },
        size: 8,
        active: true,
        color: player.color,
        damage: 1,
        isPlayerBullet: true,
    };
}

export function damagePlayer(player: Player, now: number): boolean {
    if (now < player.invincibleUntil) return false;

    // Black orb (Void) makes player invincible
    if (player.activePowerUp === 'black') return false;

    player.health--;
    player.combo = 0;
    player.invincibleUntil = now + INVINCIBILITY_DURATION;

    // Lose powerup on hit? Maybe strict, but fair.
    // player.activePowerUp = undefined; 

    return player.health <= 0;
}

export function drawPlayer(
    ctx: CanvasRenderingContext2D,
    player: Player,
    now: number
): void {
    const { position, size, color, activePowerUp } = player;
    const isInvincible = now < player.invincibleUntil;

    // Flicker when invincible
    if (isInvincible && Math.floor(now / 100) % 2 === 0) return;

    ctx.save();
    ctx.translate(position.x, position.y);

    // PowerUp Aura
    if (activePowerUp) {
        ctx.save();
        const pulse = Math.sin(now / 100) * 0.2 + 0.8;
        if (activePowerUp === 'white') {
            ctx.shadowColor = '#fff';
            ctx.strokeStyle = '#fff';
        } else if (activePowerUp === 'black') {
            ctx.shadowColor = '#000'; // Hard to see on black bg?
            ctx.strokeStyle = '#555';
        } else if (activePowerUp === 'rainbow') {
            const hue = (now / 5) % 360;
            ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
            ctx.strokeStyle = `hsl(${hue}, 100%, 50%)`;
        }
        ctx.shadowBlur = 20 * pulse;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, size * 1.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    // Glow effect
    ctx.shadowColor = COLOR_GLOW[color];
    ctx.shadowBlur = 20;

    // Ship body (triangle pointing up)
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(-size * 0.7, size * 0.5);
    ctx.lineTo(size * 0.7, size * 0.5);
    ctx.closePath();

    ctx.fillStyle = activePowerUp === 'black' ? '#333' : COLOR_VALUES[color];
    ctx.fill();

    // Inner highlight
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.5);
    ctx.lineTo(-size * 0.3, size * 0.2);
    ctx.lineTo(size * 0.3, size * 0.2);
    ctx.closePath();

    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fill();

    ctx.restore();
}
