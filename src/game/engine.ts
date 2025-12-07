import { Ball, Entity, GAME_CONSTANTS, GameState, Player, Vector2, Particle } from './types';
import { ArcadeAudio } from './audio';

export class BitballEngine {
    state: GameState;
    keys: { [key: string]: boolean } = {};
    audio: ArcadeAudio;

    constructor() {
        this.audio = new ArcadeAudio();
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
            particles: [],
            screenShake: {
                intensity: 0,
                duration: 0,
            },
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
        this.updateParticles(deltaTime);
        this.updateScreenShake(deltaTime);
        this.checkCollisions();
        this.checkGoals();
    }

    addParticles(pos: Vector2, color: string, count: number = 10, speed: number = 100) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const velocity = Math.random() * speed;
            this.state.particles.push({
                pos: { ...pos },
                vel: {
                    x: Math.cos(angle) * velocity,
                    y: Math.sin(angle) * velocity
                },
                life: 1.0,
                maxLife: 1.0,
                color: color,
                size: Math.random() * 4 + 2,
                decay: Math.random() * 2 + 1
            });
        }
    }

    updateParticles(dt: number) {
        // Filter out dead particles
        this.state.particles = this.state.particles.filter(p => p.life > 0);

        this.state.particles.forEach(p => {
            p.pos.x += p.vel.x * dt;
            p.pos.y += p.vel.y * dt;
            p.life -= p.decay * dt;
            p.size *= 0.95; // Shrink
        });
    }

    triggerShake(intensity: number, duration: number) {
        this.state.screenShake = { intensity, duration };
    }

    updateScreenShake(dt: number) {
        if (this.state.screenShake.duration > 0) {
            this.state.screenShake.duration -= dt;
            if (this.state.screenShake.duration <= 0) {
                this.state.screenShake.intensity = 0;
            }
        }
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
            this.audio.playWall();
        }
        if (ball.pos.y + ball.radius > field.height) {
            ball.pos.y = field.height - ball.radius;
            ball.vel.y *= -0.8;
            this.audio.playWall();
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

                // Only play sound and particles if e2 is the Ball
                if ('friction' in e2) {
                    // Juice: Particles & Sound
                    this.addParticles(
                        { x: (e1.pos.x + e2.pos.x) / 2, y: (e1.pos.y + e2.pos.y) / 2 },
                        '#ffffff',
                        5,
                        200
                    );
                    this.audio.playKick();
                }
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
                this.audio.playScore(false);
                this.triggerShake(10, 0.5);
                this.addParticles(ball.pos, '#ef4444', 30, 400);
                this.resetPositions();
            } else {
                // Bounce off back wall
                ball.pos.x = ball.radius;
                ball.vel.x *= -0.8;
                this.audio.playWall();
            }
        } else if (ball.pos.x > field.width) {
            if (inGoalRange) {
                score.home++; // Ball in right goal -> Home scores
                this.audio.playScore(true);
                this.triggerShake(10, 0.5);
                this.addParticles(ball.pos, '#3b82f6', 30, 400);
                this.resetPositions();
            } else {
                // Bounce off back wall
                ball.pos.x = field.width - ball.radius;
                ball.vel.x *= -0.8;
                this.audio.playWall();
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
        const { screenShake } = this.state;

        ctx.save();

        // Apply Screen Shake
        if (screenShake.intensity > 0) {
            const dx = (Math.random() - 0.5) * screenShake.intensity;
            const dy = (Math.random() - 0.5) * screenShake.intensity;
            ctx.translate(dx, dy);
        }

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
        this.drawPlayer(ctx, this.state.player);
        this.drawPlayer(ctx, this.state.cpu);
        this.drawBall(ctx, this.state.ball);

        // Draw Particles
        this.state.particles.forEach(p => {
            ctx.fillStyle = p.color; // Could use alpha based on life
            ctx.globalAlpha = p.life;
            ctx.beginPath();
            ctx.arc(p.pos.x, p.pos.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
        });

        ctx.restore(); // Restore shake transform
    }

    drawBall(ctx: CanvasRenderingContext2D, ball: Ball) {
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(ball.pos.x, ball.pos.y + ball.radius * 0.5, ball.radius, ball.radius * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Ball Base
        ctx.fillStyle = ball.color;
        ctx.beginPath();
        ctx.arc(ball.pos.x, ball.pos.y, ball.radius, 0, Math.PI * 2);
        ctx.fill();

        // Ball Detail (Soccer pattern - simple circles)
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(ball.pos.x, ball.pos.y, ball.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    drawPlayer(ctx: CanvasRenderingContext2D, player: Player) {
        const x = player.pos.x;
        const y = player.pos.y;
        const r = player.radius;
        const isRun = Math.abs(player.vel.x) > 10 || Math.abs(player.vel.y) > 10;
        const bob = isRun ? Math.sin(performance.now() / 100) * 3 : 0;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(x, y + r - 5, r, r * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body (Shirt) - Squircle
        ctx.fillStyle = player.color;

        // Draw body relative to center
        // Body is slightly lower than center to leave room for big head
        const bodyW = r * 1.4;
        const bodyH = r * 1.2;
        ctx.fillRect(x - bodyW / 2, y - r * 0.2 + bob, bodyW, bodyH);

        // Shorts (White or Black)
        ctx.fillStyle = player.team === 'home' ? '#fff' : '#000';
        ctx.fillRect(x - bodyW / 2, y + r * 0.8 + bob, bodyW, r * 0.3); // Shorts

        // Head (Big!)
        // Flesh color
        ctx.fillStyle = '#ffdbac'; // Simple flesh tone
        const headR = r * 0.9;
        const headY = y - r * 0.6 + bob;
        ctx.beginPath();
        ctx.arc(x, headY, headR, 0, Math.PI * 2);
        ctx.fill();

        // Hair (Brown)
        ctx.fillStyle = '#5d4037';
        ctx.beginPath();
        ctx.arc(x, headY - 4, headR, Math.PI, Math.PI * 2); // Top half
        ctx.fill();
        // Sideburns
        ctx.fillRect(x - headR, headY - 5, 4, 15);
        ctx.fillRect(x + headR - 4, headY - 5, 4, 15);


        // Eyes
        ctx.fillStyle = '#111';
        const lookDir = player.vel.x >= 0 ? 1 : -1;

        // Left Eye
        ctx.beginPath();
        ctx.arc(x - 5 + (lookDir * 2), headY + 2, 2, 0, Math.PI * 2);
        ctx.fill();

        // Right Eye
        ctx.beginPath();
        ctx.arc(x + 5 + (lookDir * 2), headY + 2, 2, 0, Math.PI * 2);
        ctx.fill();
    }
}
