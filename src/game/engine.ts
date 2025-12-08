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
                emotion: 'normal',
                emotionTimer: 0,
            },
            cpu: {
                pos: { x: FIELD_WIDTH - 100, y: FIELD_HEIGHT / 2 },
                vel: { x: 0, y: 0 },
                radius: PLAYER_RADIUS,
                color: '#ef4444', // red-500
                speed: GAME_CONSTANTS.PLAYER_SPEED * 0.85, // Creating a slightly slower AI
                team: 'away',
                emotion: 'normal',
                emotionTimer: 0,
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
            goalMessage: null,
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
        this.updateTimers(deltaTime);
        this.checkCollisions();
        this.checkGoals();
    }


    updateTimers(dt: number) {
        const { player, cpu, goalMessage } = this.state;

        // Update Emotions
        if (player.emotionTimer > 0) {
            player.emotionTimer -= dt;
            if (player.emotionTimer <= 0) player.emotion = 'normal';
        }
        if (cpu.emotionTimer > 0) {
            cpu.emotionTimer -= dt;
            if (cpu.emotionTimer <= 0) cpu.emotion = 'normal';
        }

        // Update Goal Message
        if (goalMessage) {
            goalMessage.timer -= dt;
            if (goalMessage.timer <= 0) {
                this.state.goalMessage = null;
            }
        }
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

            // Emotion: Pain on collision
            e1.emotion = 'pain';
            e1.emotionTimer = 0.5;

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
        const goalTop = field.height / 2 - GAME_CONSTANTS.GOAL_WIDTH / 2;
        const goalBottom = field.height / 2 + GAME_CONSTANTS.GOAL_WIDTH / 2;

        const inGoalRange = ball.pos.y > goalTop && ball.pos.y < goalBottom;

        if (ball.pos.x < 0) {
            if (inGoalRange) {
                score.away++; // Ball in left goal (Home side) -> Away scores
                this.audio.playScore(false);
                this.triggerShake(10, 0.5);
                this.addParticles(ball.pos, '#ef4444', 30, 400);

                // Emotions
                this.state.cpu.emotion = 'happy';
                this.state.cpu.emotionTimer = 2.0;
                this.state.player.emotion = 'angry';
                this.state.player.emotionTimer = 2.0;

                // UI
                this.state.goalMessage = { text: 'RED GOAL!', color: '#ef4444', timer: 2.0 };

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

                // Emotions
                this.state.player.emotion = 'happy';
                this.state.player.emotionTimer = 2.0;
                this.state.cpu.emotion = 'angry';
                this.state.cpu.emotionTimer = 2.0;

                // UI
                this.state.goalMessage = { text: 'BLUE GOAL!', color: '#3b82f6', timer: 2.0 };

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

        // Draw Crowd/Stadium background (behind grass)
        ctx.fillStyle = '#222';
        ctx.fillRect(-50, -50, width + 100, height + 100);

        // Field Grass (Striped)
        ctx.fillStyle = '#10b981'; // emerald-500
        ctx.fillRect(0, 0, width, height);

        const stripeWidth = 50;
        ctx.fillStyle = '#059669'; // emerald-600
        for (let i = 0; i < width; i += stripeWidth * 2) {
            ctx.fillRect(i, 0, stripeWidth, height);
        }

        // Lines
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.beginPath();

        // Center Line
        ctx.moveTo(width / 2, 0);
        ctx.lineTo(width / 2, height);

        // Center Circle
        ctx.moveTo(width / 2 + 80, height / 2);
        ctx.arc(width / 2, height / 2, 80, 0, Math.PI * 2);

        // Penalty Box Left
        ctx.rect(0, height / 2 - 150, 100, 300);

        // Penalty Box Right
        ctx.rect(width - 100, height / 2 - 150, 100, 300);

        ctx.stroke();

        // Goals
        const goalY = height / 2 - GAME_CONSTANTS.GOAL_WIDTH / 2;
        // Left Goal Net
        this.drawNet(ctx, -40, goalY, 40, GAME_CONSTANTS.GOAL_WIDTH);
        // Right Goal Net
        this.drawNet(ctx, width, goalY, 40, GAME_CONSTANTS.GOAL_WIDTH);


        // Draw Entities
        // Sort by Y for depth
        const entities = [this.state.player, this.state.cpu, this.state.ball].sort((a, b) => a.pos.y - b.pos.y);

        entities.forEach(e => {
            if ('team' in e) {
                this.drawPlayer(ctx, e as Player);
            } else {
                this.drawBall(ctx, e as Ball);
            }
        });

        // Draw Particles
        this.state.particles.forEach(p => {
            ctx.fillStyle = p.color; // Could use alpha based on life
            ctx.globalAlpha = p.life;
            ctx.beginPath();
            ctx.arc(p.pos.x, p.pos.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
        });

        // Draw HUD (Score, Messages)
        this.drawHUD(ctx);

        ctx.restore(); // Restore shake transform
    }

    drawNet(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);
        // Net pattern
        ctx.beginPath();
        for (let i = 0; i <= w; i += 10) { ctx.moveTo(x + i, y); ctx.lineTo(x + i, y + h); }
        for (let i = 0; i <= h; i += 10) { ctx.moveTo(x, y + i); ctx.lineTo(x + w, y + i); }
        ctx.stroke();
    }

    drawHUD(ctx: CanvasRenderingContext2D) {
        const { score, field, goalMessage } = this.state;

        // Scoreboard
        ctx.font = 'bold 40px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillText(`${score.home} - ${score.away}`, field.width / 2 + 4, 54);

        // Text
        ctx.fillStyle = '#fff';
        ctx.fillText(`${score.home} - ${score.away}`, field.width / 2, 50);

        // Goal Message
        if (goalMessage) {
            ctx.save();
            ctx.translate(field.width / 2, field.height / 2);

            // Pulse scale
            const scale = 1 + Math.sin(performance.now() / 100) * 0.1;
            ctx.scale(scale, scale);

            // Background banner
            ctx.fillStyle = 'rgba(0,0,0,0.8)';
            ctx.fillRect(-300, -50, 600, 100);

            // Text
            ctx.font = 'bold 60px monospace';
            ctx.fillStyle = goalMessage.color;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(goalMessage.text, 0, 0);

            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.strokeText(goalMessage.text, 0, 0);

            ctx.restore();
        }
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

        // Ball Detail (rotate with movement would be cool, but simple for now)
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.arc(ball.pos.x, ball.pos.y, ball.radius * 0.5, 0, Math.PI * 2); // Center spot
        ctx.fill();

        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    drawPlayer(ctx: CanvasRenderingContext2D, player: Player) {
        const x = player.pos.x;
        const y = player.pos.y;
        const r = player.radius;
        const isRun = Math.abs(player.vel.x) > 10 || Math.abs(player.vel.y) > 10;
        const time = performance.now();
        const bob = isRun ? Math.sin(time / 100) * 3 : 0;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(x, y + r - 5, r, r * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Legs
        if (isRun) {
            ctx.fillStyle = '#000'; // Black shoes/legs
            const legOffset = Math.sin(time / 80) * 5;
            // Left leg
            ctx.fillRect(x - 8, y + r - 5 + legOffset, 6, 12);
            // Right leg
            ctx.fillRect(x + 2, y + r - 5 - legOffset, 6, 12);
        } else {
            ctx.fillStyle = '#000';
            ctx.fillRect(x - 8, y + r - 5, 6, 10);
            ctx.fillRect(x + 2, y + r - 5, 6, 10);
        }

        // Body (Shirt) - Squircle
        ctx.fillStyle = player.color;
        const bodyW = r * 1.4;
        const bodyH = r * 1.2;
        ctx.fillRect(x - bodyW / 2, y - r * 0.2 + bob, bodyW, bodyH);

        // Shorts (White or Black)
        ctx.fillStyle = player.team === 'home' ? '#fff' : '#000';
        ctx.fillRect(x - bodyW / 2, y + r * 0.8 + bob, bodyW, r * 0.3);

        // Head (Big!)
        ctx.fillStyle = '#ffdbac'; // Skin
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

        // Face / Emotion
        ctx.fillStyle = '#000';
        const lookDir = player.vel.x >= 0 ? 1 : -1;

        const ex = x + (lookDir * 2);
        const ey = headY + 2;

        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;

        if (player.emotion === 'pain') {
            // > < 
            // Left (>)
            this.drawXEye(ctx, ex - 6, ey);
            // Right (<)
            this.drawXEye(ctx, ex + 6, ey);
            // Mouth (O)
            ctx.beginPath();
            ctx.arc(ex, ey + 8, 3, 0, Math.PI * 2);
            ctx.stroke();

        } else if (player.emotion === 'happy') {
            // ^ ^
            this.drawHappyEye(ctx, ex - 6, ey);
            this.drawHappyEye(ctx, ex + 6, ey);
            // Mouth D
            ctx.beginPath();
            ctx.arc(ex, ey + 6, 5, 0, Math.PI, false);
            ctx.fill();

        } else if (player.emotion === 'angry') {
            // \ /
            this.drawAngryEye(ctx, ex - 6, ey, true);
            this.drawAngryEye(ctx, ex + 6, ey, false);
            // Mouth line
            ctx.beginPath();
            ctx.moveTo(ex - 4, ey + 8);
            ctx.lineTo(ex + 4, ey + 8);
            ctx.stroke();

        } else {
            // Normal
            ctx.beginPath(); ctx.arc(ex - 5, ey, 2, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(ex + 5, ey, 2, 0, Math.PI * 2); ctx.fill();
        }
    }

    drawXEye(ctx: CanvasRenderingContext2D, x: number, y: number) {
        ctx.beginPath();
        ctx.moveTo(x - 3, y - 3); ctx.lineTo(x + 3, y + 3);
        ctx.moveTo(x + 3, y - 3); ctx.lineTo(x - 3, y + 3);
        ctx.stroke();
    }

    drawHappyEye(ctx: CanvasRenderingContext2D, x: number, y: number) {
        ctx.beginPath();
        ctx.arc(x, y, 3, Math.PI, 0); // Arch up
        ctx.stroke();
    }

    drawAngryEye(ctx: CanvasRenderingContext2D, x: number, y: number, isLeft: boolean) {
        ctx.beginPath();
        ctx.arc(x, y + 2, 2, 0, Math.PI * 2); // Eye
        ctx.fill();
        // Eyebrow
        ctx.beginPath();
        if (isLeft) {
            ctx.moveTo(x - 4, y - 3); ctx.lineTo(x + 4, y + 1);
        } else {
            ctx.moveTo(x - 4, y + 1); ctx.lineTo(x + 4, y - 3);
        }
        ctx.stroke();
    }
}
