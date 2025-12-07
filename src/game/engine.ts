import { Ball, Entity, GAME_CONSTANTS, GameState, Player, Vector2 } from './types';

export class BitballEngine {
    state: GameState;
    keys: { [key: string]: boolean } = {};

    constructor() {
        this.state = this.getInitialState();
    }

    getInitialState(): GameState {
        const { FIELD_WIDTH, FIELD_HEIGHT, PLAYER_RADIUS, BALL_RADIUS } = GAME_CONSTANTS;
        return {
            player: {
                pos: { x: 100, y: FIELD_HEIGHT / 2 },
                vel: { x: 0, y: 0 },
                radius: PLAYER_RADIUS,
                color: '#3b82f6', // blue-500
                speed: GAME_CONSTANTS.PLAYER_SPEED,
                team: 'home',
            },
            cpu: {
                pos: { x: FIELD_WIDTH - 100, y: FIELD_HEIGHT / 2 },
                vel: { x: 0, y: 0 },
                radius: PLAYER_RADIUS,
                color: '#ef4444', // red-500
                speed: GAME_CONSTANTS.PLAYER_SPEED * 0.85, // Creating a slightly slower AI
                team: 'away',
            },
            ball: {
                pos: { x: FIELD_WIDTH / 2, y: FIELD_HEIGHT / 2 },
                vel: { x: 0, y: 0 },
                radius: BALL_RADIUS,
                color: '#ffffff',
                friction: GAME_CONSTANTS.BALL_FRICTION,
            },
            field: {
                width: FIELD_WIDTH,
                height: FIELD_HEIGHT,
            },
            score: {
                home: 0,
                away: 0,
            },
            isPlaying: false,
        };
    }

    handleInput(key: string, isPressed: boolean) {
        this.keys[key] = isPressed;
    }

    update(deltaTime: number) {
        if (!this.state.isPlaying) return;

        this.updatePlayerVelocity();
        this.updateAI();
        this.applyPhysics(deltaTime);
        this.checkCollisions();
        this.checkGoals();
    }

    updatePlayerVelocity() {
        const { player } = this.state;
        player.vel.x = 0;
        player.vel.y = 0;

        if (this.keys['ArrowUp'] || this.keys['w']) player.vel.y = -player.speed;
        if (this.keys['ArrowDown'] || this.keys['s']) player.vel.y = player.speed;
        if (this.keys['ArrowLeft'] || this.keys['a']) player.vel.x = -player.speed;
        if (this.keys['ArrowRight'] || this.keys['d']) player.vel.x = player.speed;
    }

    updateAI() {
        const { cpu, ball } = this.state;
        // Simple AI: Move towards ball
        const dx = ball.pos.x - cpu.pos.x;
        const dy = ball.pos.y - cpu.pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 10) { // Don't jitter when close
            cpu.vel.x = (dx / dist) * cpu.speed;
            cpu.vel.y = (dy / dist) * cpu.speed;
        } else {
            cpu.vel.x = 0;
            cpu.vel.y = 0;
        }
    }

    applyPhysics(dt: number) {
        const { player, cpu, ball } = this.state;

        // Apply velocity to positions
        player.pos.x += player.vel.x * dt;
        player.pos.y += player.vel.y * dt;

        cpu.pos.x += cpu.vel.x * dt;
        cpu.pos.y += cpu.vel.y * dt;

        ball.pos.x += ball.vel.x * dt;
        ball.pos.y += ball.vel.y * dt;

        // Apply friction to ball
        ball.vel.x *= ball.friction;
        ball.vel.y *= ball.friction;

        // Stop ball if very slow
        if (Math.abs(ball.vel.x) < 5) ball.vel.x = 0;
        if (Math.abs(ball.vel.y) < 5) ball.vel.y = 0;
    }

    checkCollisions() {
        const { player, cpu, ball, field } = this.state;

        // Wall Collisions (Player)
        this.clampEntity(player);
        this.clampEntity(cpu);

        // Wall Collisions (Ball) - Bounce
        if (ball.pos.y - ball.radius < 0) {
            ball.pos.y = ball.radius;
            ball.vel.y *= -0.8;
        }
        if (ball.pos.y + ball.radius > field.height) {
            ball.pos.y = field.height - ball.radius;
            ball.vel.y *= -0.8;
        }
        // X-axis walls checks are handled in checkGoals but we add bounds here preventing out of bounds without goal
        // (Simplified for now, goals will reset)

        // Player vs Ball
        this.resolveEntityCollision(player, ball);
        this.resolveEntityCollision(cpu, ball);

        // Player vs CPU collision (Optional, adds roughness)
        this.resolveEntityCollision(player, cpu, 0.5);
    }

    clampEntity(entity: Player | Ball) {
        const { field } = this.state;
        if (entity.pos.x - entity.radius < 0) entity.pos.x = entity.radius;
        if (entity.pos.x + entity.radius > field.width) entity.pos.x = field.width - entity.radius;
        if (entity.pos.y - entity.radius < 0) entity.pos.y = entity.radius;
        if (entity.pos.y + entity.radius > field.height) entity.pos.y = field.height - entity.radius;
    }

    resolveEntityCollision(e1: Player, e2: Ball | Player, massRatio = 1.0) {
        const dx = e2.pos.x - e1.pos.x;
        const dy = e2.pos.y - e1.pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = e1.radius + e2.radius;

        if (dist < minDist) {
            // Normalize collision vector
            const nx = dx / dist;
            const ny = dy / dist;

            // Push apart
            const push = (minDist - dist) / 2;
            e1.pos.x -= nx * push;
            e1.pos.y -= ny * push;
            e2.pos.x += nx * push;
            e2.pos.y += ny * push;

            // Transfer velocity (Simple elastic-ish)
            // We want e2 (Ball) to take e1 (Player) velocity
            if (e2 !== e1) { // Basic impulse transfer
                e2.vel.x += e1.vel.x * 1.5; // Add extra "kick" power
                e2.vel.y += e1.vel.y * 1.5;

                // If e2 is ball, dampen e1 slightly
                // e1.vel.x *= 0.5;
            }
        }
    }

    checkGoals() {
        const { ball, field, score } = this.state;

        // Check if ball went past left or right edge
        // In a real game we check if it is within goal posts Y range
        // For arcade fun, whole wall is NOT goal, let's say middle 1/3 is goal.
        const goalTop = field.height / 2 - GAME_CONSTANTS.GOAL_WIDTH / 2;
        const goalBottom = field.height / 2 + GAME_CONSTANTS.GOAL_WIDTH / 2;

        const inGoalRange = ball.pos.y > goalTop && ball.pos.y < goalBottom;

        if (ball.pos.x < 0) {
            if (inGoalRange) {
                score.away++; // Ball in left goal (Home side) -> Away scores
                this.resetPositions();
            } else {
                // Bounce off back wall
                ball.pos.x = ball.radius;
                ball.vel.x *= -0.8;
            }
        } else if (ball.pos.x > field.width) {
            if (inGoalRange) {
                score.home++; // Ball in right goal -> Home scores
                this.resetPositions();
            } else {
                // Bounce off back wall
                ball.pos.x = field.width - ball.radius;
                ball.vel.x *= -0.8;
            }
        }
    }

    resetPositions() {
        // Center everyone
        const { FIELD_WIDTH, FIELD_HEIGHT } = GAME_CONSTANTS;
        this.state.player.pos = { x: 100, y: FIELD_HEIGHT / 2 };
        this.state.cpu.pos = { x: FIELD_WIDTH - 100, y: FIELD_HEIGHT / 2 };
        this.state.ball.pos = { x: FIELD_WIDTH / 2, y: FIELD_HEIGHT / 2 };
        this.state.ball.vel = { x: 0, y: 0 };
        // Small delay or pause could be added here in UI layer
    }

    draw(ctx: CanvasRenderingContext2D) {
        const { width, height } = this.state.field;

        // Field Grass
        ctx.fillStyle = '#10b981'; // emerald-500
        ctx.fillRect(0, 0, width, height);

        // Lines
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        // Center Line
        ctx.moveTo(width / 2, 0);
        ctx.lineTo(width / 2, height);
        ctx.stroke();

        // Center Circle
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, 80, 0, Math.PI * 2);
        ctx.stroke();

        // Goals
        const goalY = height / 2 - GAME_CONSTANTS.GOAL_WIDTH / 2;
        ctx.fillStyle = '#ffffff';
        // Left Goal
        ctx.fillRect(0, goalY, 4, GAME_CONSTANTS.GOAL_WIDTH);
        // Right Goal
        ctx.fillRect(width - 4, goalY, 4, GAME_CONSTANTS.GOAL_WIDTH);

        // Draw Entities
        this.drawEntity(ctx, this.state.player);
        this.drawEntity(ctx, this.state.cpu);
        this.drawEntity(ctx, this.state.ball);
    }

    drawEntity(ctx: CanvasRenderingContext2D, entity: Entity) {
        ctx.fillStyle = entity.color;
        ctx.beginPath();
        ctx.arc(entity.pos.x, entity.pos.y, entity.radius, 0, Math.PI * 2);
        ctx.fill();

        // Stroke
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}
