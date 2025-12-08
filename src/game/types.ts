// Game entity types for Chromatic Surge

export type GameColor = 'red' | 'blue' | 'yellow';

export const COLOR_VALUES: Record<GameColor, string> = {
    red: '#ff3366',
    blue: '#3399ff',
    yellow: '#ffcc00',
};

export const COLOR_GLOW: Record<GameColor, string> = {
    red: 'rgba(255,51,102,0.6)',
    blue: 'rgba(51,153,255,0.6)',
    yellow: 'rgba(255,204,0,0.6)',
};

export interface Vector2 {
    x: number;
    y: number;
}

export interface Entity {
    id: string;
    position: Vector2;
    velocity: Vector2;
    size: number;
    active: boolean;
}

export interface Player extends Entity {
    color: GameColor;
    health: number;
    maxHealth: number;
    score: number;
    combo: number;
    invincibleUntil: number;
    lastShot: number;
    activePowerUp?: PowerUpType;
    powerUpTimer: number;
}

export type PowerUpType = 'white' | 'black' | 'rainbow';

export interface PowerUp extends Entity {
    type: PowerUpType;
}

export type EnemyType = 'grunt' | 'zigzag';

export interface Enemy extends Entity {
    color: GameColor;
    health: number;
    points: number;
    type: EnemyType;
}

export interface Bullet extends Entity {
    color: GameColor;
    damage: number;
    isPlayerBullet: boolean;
}

export interface Particle extends Entity {
    color: string;
    life: number;
    maxLife: number;
    scale: number;
}

export type GameState = 'menu' | 'playing' | 'gameover' | 'wave_clear';

export interface GameData {
    state: GameState;
    player: Player;
    enemies: Enemy[];
    bullets: Bullet[];
    particles: Particle[];
    powerUps: PowerUp[];
    wave: number;
    time: number;
    enemiesSpawnedInWave: number;
}
