export interface Vector2 {
    x: number;
    y: number;
}

export interface Entity {
    pos: Vector2;
    vel: Vector2;
    radius: number;
    color: string;
}

export interface Post {
    pos: Vector2;
    radius: number;
}

export interface Particle {
    pos: Vector2;
    vel: Vector2;
    life: number; // 0 to 1
    maxLife: number;
    color: string;
    size: number;
    decay: number;
}

export type Emotion = 'normal' | 'pain' | 'happy' | 'angry';

export interface Player extends Entity {
    speed: number;
    team: 'home' | 'away'; // home = blue, away = red
    emotion: Emotion;
    emotionTimer: number;
    // New Visuals
    skin: {
        primary: string;
        secondary: string;
        skinColor: string;
        hairColor: string;
    };
    // Dash Mechanic
    dashCooldown: number;
}

export interface Ball extends Entity {
    friction: number;
}

export interface GameState {
    player: Player;
    cpu: Player;
    ball: Ball;
    field: {
        width: number;
        height: number;
    };
    score: {
        home: number;
        away: number;
    };
    isPlaying: boolean;
    // Juice
    particles: Particle[];
    screenShake: {
        intensity: number;
        duration: number;
    };
    // UI
    goalMessage: {
        text: string;
        color: string;
        timer: number;
    } | null;
    kickoffTimer: number;
}

export const GAME_CONSTANTS = {
    FIELD_WIDTH: 800,
    FIELD_HEIGHT: 600,
    PLAYER_RADIUS: 20,
    BALL_RADIUS: 10,
    PLAYER_SPEED: 400, // px per second
    PLAYER_DASH_SPEED: 1000,
    PLAYER_DASH_COOLDOWN: 1.5,
    BALL_FRICTION: 0.98,
    GOAL_WIDTH: 150,
};
