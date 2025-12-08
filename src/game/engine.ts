// Core game engine for Chromatic Surge

import {
    GameData,
    GameColor,
    COLOR_VALUES,
    PowerUpType
} from './types';
import {
    createPlayer,
    updatePlayer,
    switchColor,
    tryShoot,
    drawPlayer,
    damagePlayer
} from './player';
import {
    createEnemy,
    updateEnemy,
    drawEnemy
} from './enemy';
import { EnemyType } from './types'; // Import needed type

export class GameEngine {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private gameData: GameData;
    private keys: Set<string> = new Set();
    private lastTime: number = 0;
    private animationId: number = 0;
    private shooting: boolean = false;
    private enemySpawnTimer: number = 0;
    private spawnInterval: number = 1.0; // Seconds between spawns
    private waveTransitionTimer: number = 0;

    // Visual Polish
    private shakeIntensity: number = 0;
    private shakeDecay: number = 5.0; // How fast shake subsides
    private stars: { x: number; y: number; size: number; speed: number; brightness: number }[] = [];


    // Define waves: count, spawnRate, valid types
    private readonly WAVE_CONFIG = [
        { count: 10, rate: 1.5, types: ['grunt'] },       // Wave 1
        { count: 15, rate: 1.2, types: ['grunt', 'zigzag'] }, // Wave 2
        { count: 20, rate: 1.0, types: ['grunt', 'zigzag'] }, // Wave 3
        { count: 30, rate: 0.8, types: ['grunt', 'zigzag', 'zigzag'] }, // Wave 4 (harder)
        { count: 50, rate: 0.6, types: ['grunt', 'zigzag'] }, // Wave 5
    ];

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.gameData = this.createInitialState();
        this.initStars();
    }

    private initStars(): void {
        for (let i = 0; i < 100; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() < 0.9 ? 1 : 2,
                speed: 10 + Math.random() * 40,
                brightness: Math.random()
            });
        }
    }

    private createInitialState(): GameData {
        return {
            state: 'menu',
            player: createPlayer(this.canvas.width, this.canvas.height),
            enemies: [],
            bullets: [],
            particles: [],
            powerUps: [],
            wave: 1,
            time: 0,
            enemiesSpawnedInWave: 0,
        };
    }

    start(): void {
        this.setupEventListeners();
        this.lastTime = performance.now();
        this.loop();
    }

    stop(): void {
        cancelAnimationFrame(this.animationId);
        this.removeEventListeners();
    }

    private setupEventListeners(): void {
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
        this.canvas.addEventListener('mousedown', this.handleMouseDown);
        this.canvas.addEventListener('mouseup', this.handleMouseUp);
    }

    private removeEventListeners(): void {
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        this.canvas.removeEventListener('mousedown', this.handleMouseDown);
        this.canvas.removeEventListener('mouseup', this.handleMouseUp);
    }

    private handleKeyDown = (e: KeyboardEvent): void => {
        this.keys.add(e.code);

        // Color switching
        if (e.code === 'Digit1' || e.code === 'Numpad1') {
            switchColor(this.gameData.player, 'red');
        } else if (e.code === 'Digit2' || e.code === 'Numpad2') {
            switchColor(this.gameData.player, 'blue');
        } else if (e.code === 'Digit3' || e.code === 'Numpad3') {
            switchColor(this.gameData.player, 'yellow');
        }

        // Shooting
        if (e.code === 'Space') {
            this.shooting = true;
        }

        // Start game
        if (e.code === 'Space' && this.gameData.state === 'menu') {
            this.gameData.state = 'playing';
        }

        // Restart
        if (e.code === 'KeyR' && this.gameData.state === 'gameover') {
            this.gameData = this.createInitialState();
            this.gameData.state = 'playing';
        }
    };

    private handleKeyUp = (e: KeyboardEvent): void => {
        this.keys.delete(e.code);
        if (e.code === 'Space') {
            this.shooting = false;
        }
    };

    private handleMouseDown = (): void => {
        if (this.gameData.state === 'menu') {
            this.gameData.state = 'playing';
        }
        this.shooting = true;
    };

    private handleMouseUp = (): void => {
        this.shooting = false;
    };

    private loop = (): void => {
        const now = performance.now();
        const deltaTime = (now - this.lastTime) / 1000;
        this.lastTime = now;
        this.gameData.time = now;

        this.update(deltaTime, now);

        // Apply screenshake
        this.ctx.save();
        if (this.shakeIntensity > 0) {
            const dx = (Math.random() - 0.5) * this.shakeIntensity * 2;
            const dy = (Math.random() - 0.5) * this.shakeIntensity * 2;
            this.ctx.translate(dx, dy);
        }

        this.render(now);
        this.ctx.restore();

        // Decay shake
        if (this.shakeIntensity > 0) {
            this.shakeIntensity = Math.max(0, this.shakeIntensity - this.shakeDecay * deltaTime);
        }

        this.animationId = requestAnimationFrame(this.loop);
    };

    private update(deltaTime: number, now: number): void {
        if (this.gameData.state !== 'playing' && this.gameData.state !== 'wave_clear') return;

        const { player, bullets, particles, powerUps } = this.gameData;

        // Check collisions
        this.checkCollisions(deltaTime, now);

        // Update player
        updatePlayer(
            player,
            this.keys,
            deltaTime,
            this.canvas.width,
            this.canvas.height
        );

        // Wave Logic
        const currentWaveConfig = this.WAVE_CONFIG[this.gameData.wave - 1] || this.WAVE_CONFIG[this.WAVE_CONFIG.length - 1];

        if (this.gameData.state === 'wave_clear') {
            this.waveTransitionTimer -= deltaTime;
            if (this.waveTransitionTimer <= 0) {
                this.startNextWave();
            }
        } else if (this.gameData.state === 'playing') {
            // Check if wave is done spawning
            if (this.gameData.enemiesSpawnedInWave >= currentWaveConfig.count) {
                // Wave complete condition: all enemies spawned AND killed
                if (this.gameData.enemies.length === 0) {
                    this.gameData.state = 'wave_clear';
                    this.waveTransitionTimer = 3.0; // 3 seconds between waves
                }
            } else {
                // Spawn enemies
                this.enemySpawnTimer -= deltaTime;
                if (this.enemySpawnTimer <= 0) {
                    // Pick random type allowed in this wave
                    const typeOptions = currentWaveConfig.types as EnemyType[];
                    const type = typeOptions[Math.floor(Math.random() * typeOptions.length)];

                    this.gameData.enemies.push(createEnemy(this.canvas.width, type));
                    this.gameData.enemiesSpawnedInWave++;

                    this.enemySpawnTimer = currentWaveConfig.rate;
                }
            }
        }

        // Update enemies
        const enemies = this.gameData.enemies;
        for (const enemy of enemies) {
            updateEnemy(enemy, deltaTime);

            // Deactivate off-screen enemies
            if (enemy.position.y > this.canvas.height + 50) {
                enemy.active = false;
            }
        }
        this.gameData.enemies = enemies.filter(e => e.active);

        // Handle shooting
        if (this.shooting) {
            const bullet = tryShoot(player, now);
            if (bullet) {
                bullets.push(bullet);
                this.spawnMuzzleFlash(player.position.x, player.position.y - player.size, player.color);
            }
        }

        // Update bullets
        for (const bullet of bullets) {
            bullet.position.x += bullet.velocity.x * deltaTime;
            bullet.position.y += bullet.velocity.y * deltaTime;

            // Deactivate off-screen bullets
            if (bullet.position.y < -20 || bullet.position.y > this.canvas.height + 20) {
                bullet.active = false;
            }
        }

        // Update particles
        for (const particle of particles) {
            particle.position.x += particle.velocity.x * deltaTime;
            particle.position.y += particle.velocity.y * deltaTime;
            particle.life -= deltaTime;
            particle.scale = particle.life / particle.maxLife; // Linear fade

            // Apply drag for more "physics" feel (optional, but nice)
            particle.velocity.x *= 0.95;
            particle.velocity.y *= 0.95;

            if (particle.life <= 0) {
                particle.active = false;
            }
        }

        // Update powerups
        for (const pu of powerUps) {
            pu.position.y += 100 * deltaTime; // Drifts down
            if (pu.position.y > this.canvas.height + 50) {
                pu.active = false;
            }
        }

        // Update Stars
        const speedMultiplier = this.gameData.state === 'wave_clear' ? 5 : 1; // Warp speed during transition
        for (const star of this.stars) {
            star.y += star.speed * speedMultiplier * deltaTime;
            if (star.y > this.canvas.height) {
                star.y = 0;
                star.x = Math.random() * this.canvas.width;
            }
        }

        // Clean up inactive entities
        this.gameData.bullets = bullets.filter(b => b.active);
        this.gameData.particles = particles.filter(p => p.active);
        this.gameData.powerUps = powerUps.filter(p => p.active);
    }

    private checkCollisions(deltaTime: number, now: number): void {
        const { player, enemies, bullets, powerUps } = this.gameData;

        // 1. Bullets vs Enemies
        for (const bullet of bullets) {
            if (!bullet.active) continue;

            for (const enemy of enemies) {
                if (!enemy.active) continue;

                // Simple circle collision
                const dx = bullet.position.x - enemy.position.x;
                const dy = bullet.position.y - enemy.position.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const minDistance = bullet.size + enemy.size;

                if (distance < minDistance) {
                    bullet.active = false;
                    this.spawnHitEffect(bullet.position.x, bullet.position.y, bullet.color);

                    // Logic: Match color OR Prismatic powerup active
                    const isMatch = bullet.color === enemy.color;
                    const isPrismatic = player.activePowerUp === 'white';

                    if (isMatch || isPrismatic) {
                        // Match! Kill enemy
                        enemy.active = false;
                        player.score += enemy.points * (1 + player.combo);
                        player.combo++;

                        // Spawn explosion
                        this.spawnExplosion(enemy.position.x, enemy.position.y, enemy.color);
                        this.shakeIntensity = Math.min(this.shakeIntensity + 2, 10); // Small shake on kill

                        // Spawn PowerUp Chance (10%)
                        if (Math.random() < 0.1) {
                            this.spawnPowerUp(enemy.position.x, enemy.position.y);
                        }

                    } else {
                        // Mismatch!
                        player.combo = 0; // Reset combo on miss? Design doc says "chain same-color kills".
                        // Let's be lenient and only reset on bad hits, or strict.
                        // "Mismatched: Enemy takes no damage"
                    }
                    break; // Bullet hit something, stop checking this bullet
                }
            }
        }

        // 2. Enemies vs Player
        if (now > player.invincibleUntil) {
            for (const enemy of enemies) {
                if (!enemy.active) continue;

                const dx = player.position.x - enemy.position.x;
                const dy = player.position.y - enemy.position.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const minDistance = player.size * 0.8 + enemy.size; // Slightly smaller hitbox for player feel

                if (distance < minDistance) {
                    // Collision!
                    enemy.active = false; // Enemy kamikazes
                    this.spawnExplosion(enemy.position.x, enemy.position.y, enemy.color);

                    const isGameOver = damagePlayer(player, now);
                    if (isGameOver) {
                        this.gameData.state = 'gameover';
                    } else {
                        // Screen shake or trauma could go here
                        this.shakeIntensity = 20; // BIG SHAKE
                    }
                }
            }
        }

        // 3. PowerUps vs Player
        for (const pu of powerUps) {
            if (!pu.active) continue;

            const dx = player.position.x - pu.position.x;
            const dy = player.position.y - pu.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < player.size + pu.size) {
                pu.active = false;
                player.activePowerUp = pu.type;
                player.powerUpTimer = 5000; // 5 seconds

                // Visual feedback for pickup?
                this.spawnHitEffect(pu.position.x, pu.position.y, 'red'); // just reuse red/generic for now
            }
        }
    }

    private spawnPowerUp(x: number, y: number): void {
        const types: PowerUpType[] = ['white', 'black', 'rainbow'];
        const type = types[Math.floor(Math.random() * types.length)];

        this.gameData.powerUps.push({
            id: `pu-${Date.now()}-${Math.random()}`,
            position: { x, y },
            velocity: { x: 0, y: 100 },
            size: 15,
            active: true,
            type: type
        });
    }

    private spawnHitEffect(x: number, y: number, color: GameColor): void {
        const colorHex = COLOR_VALUES[color];
        for (let i = 0; i < 3; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 50 + Math.random() * 50;
            this.gameData.particles.push({
                id: `p-hit-${Date.now()}-${i}`,
                position: { x, y },
                velocity: {
                    x: Math.cos(angle) * speed,
                    y: Math.sin(angle) * speed
                },
                size: 2,
                active: true,
                color: colorHex,
                life: 0.1,
                maxLife: 0.1,
                scale: 1,
            });
        }
    }

    private spawnExplosion(x: number, y: number, color: GameColor): void {
        const colorHex = COLOR_VALUES[color];
        for (let i = 0; i < 10; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 100 + Math.random() * 150;
            this.gameData.particles.push({
                id: `p-exp-${Date.now()}-${i}`,
                position: { x, y },
                velocity: {
                    x: Math.cos(angle) * speed,
                    y: Math.sin(angle) * speed
                },
                size: 3 + Math.random() * 3,
                active: true,
                color: colorHex,
                life: 0.3 + Math.random() * 0.2,
                maxLife: 0.5,
                scale: 1,
            });
        }
    }

    private spawnMuzzleFlash(x: number, y: number, color: GameColor): void {
        const colorHex = COLOR_VALUES[color];
        for (let i = 0; i < 5; i++) {
            const angle = (Math.random() - 0.5) * Math.PI * 0.5 - Math.PI / 2;
            const speed = 100 + Math.random() * 100;
            this.gameData.particles.push({
                id: `particle-${Date.now()}-${i}`,
                position: { x, y },
                velocity: {
                    x: Math.cos(angle) * speed,
                    y: Math.sin(angle) * speed
                },
                size: 4,
                active: true,
                color: colorHex,
                life: 0.2,
                maxLife: 0.2,
                scale: 1,
            });
        }
    }

    private render(now: number): void {
        const { ctx, canvas, gameData } = this;

        // Clear with dark background
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw subtle grid
        // this.drawGrid(); // Replaced by stars
        this.drawStars();


        if (gameData.state === 'menu') {
            this.drawMenu();
            return;
        }

        if (gameData.state === 'gameover') {
            this.drawGameOver();
            return;
        }

        // Draw game entities
        this.drawEnemies();
        this.drawPowerUps();
        this.drawBullets();
        this.drawParticles();
        drawPlayer(ctx, gameData.player, now);
        this.drawHUD();

        if (gameData.state === 'wave_clear') {
            this.drawWaveClear();
        }
    }

    private startNextWave(): void {
        this.gameData.wave++;
        this.gameData.enemiesSpawnedInWave = 0;
        this.gameData.state = 'playing';
        // You could also restore some health here if desired
    }

    private drawWaveClear(): void {
        const { ctx, canvas, gameData } = this;
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 40px "Segoe UI", sans-serif';
        ctx.fillStyle = '#fff';
        ctx.shadowColor = '#3399ff';
        ctx.shadowBlur = 20;
        ctx.fillText(`WAVE ${gameData.wave} COMPLETE`, canvas.width / 2, canvas.height / 2 - 50);

        ctx.font = '24px "Segoe UI", sans-serif';
        ctx.fillStyle = '#888';
        ctx.shadowBlur = 0;
        ctx.fillText(`Get ready for Wave ${gameData.wave + 1}...`, canvas.width / 2, canvas.height / 2 + 10);
        ctx.restore();
    }

    private drawStars(): void {
        const { ctx, stars } = this;
        ctx.fillStyle = '#fff';
        for (const star of stars) {
            ctx.globalAlpha = star.brightness * 0.8;
            ctx.beginPath();
            ctx.rect(star.x, star.y, star.size, star.size);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    private drawGrid(): void {
        const { ctx, canvas } = this;
        ctx.strokeStyle = 'rgba(50, 50, 70, 0.3)';
        ctx.lineWidth = 1;

        const gridSize = 50;
        for (let x = 0; x < canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
    }

    private drawEnemies(): void {
        const { ctx, gameData } = this;
        for (const enemy of gameData.enemies) {
            drawEnemy(ctx, enemy);
        }
    }

    private drawPowerUps(): void {
        const { ctx, gameData } = this;
        for (const pu of gameData.powerUps) {
            ctx.save();
            ctx.translate(pu.position.x, pu.position.y);

            // Animation pulse
            const pulse = Math.sin(gameData.time / 200) * 0.2 + 1;
            ctx.scale(pulse, pulse);

            // Halo
            ctx.shadowBlur = 15;

            let color = '#fff';
            let char = '?';

            if (pu.type === 'white') {
                color = '#fff';
                char = 'P'; // Prismatic
                ctx.shadowColor = '#fff';
            } else if (pu.type === 'black') {
                color = '#333';
                char = 'V'; // Void
                ctx.shadowColor = '#000';
            } else if (pu.type === 'rainbow') {
                const hue = (gameData.time / 5) % 360;
                color = `hsl(${hue}, 100%, 70%)`;
                char = 'R'; // Rapid
                ctx.shadowColor = color;
            }

            // Orb
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(0, 0, pu.size, 0, Math.PI * 2);
            ctx.fill();

            // Border
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Icon/Text
            ctx.fillStyle = pu.type === 'white' ? '#000' : '#fff';
            ctx.font = 'bold 12px "Segoe UI"';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(char, 0, 1);

            ctx.restore();
        }
    }

    private drawBullets(): void {
        const { ctx, gameData } = this;

        for (const bullet of gameData.bullets) {
            ctx.save();
            ctx.translate(bullet.position.x, bullet.position.y);

            // Glow
            ctx.shadowColor = COLOR_VALUES[bullet.color];
            ctx.shadowBlur = 15;

            // Bullet shape
            ctx.fillStyle = COLOR_VALUES[bullet.color];
            ctx.beginPath();
            ctx.ellipse(0, 0, bullet.size * 0.4, bullet.size, 0, 0, Math.PI * 2);
            ctx.fill();

            // Core
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.ellipse(0, 0, bullet.size * 0.15, bullet.size * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    }

    private drawParticles(): void {
        const { ctx, gameData } = this;

        for (const particle of gameData.particles) {
            ctx.save();
            ctx.globalAlpha = particle.scale;
            ctx.fillStyle = particle.color;
            ctx.shadowColor = particle.color;
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(
                particle.position.x,
                particle.position.y,
                particle.size * particle.scale,
                0,
                Math.PI * 2
            );
            ctx.fill();
            ctx.restore();
        }
    }

    private drawMenu(): void {
        const { ctx, canvas } = this;

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Title
        ctx.font = 'bold 48px "Segoe UI", sans-serif';
        ctx.fillStyle = '#fff';
        ctx.shadowColor = '#3399ff';
        ctx.shadowBlur = 20;
        ctx.fillText('CHROMATIC SURGE', canvas.width / 2, canvas.height / 3);

        // Subtitle
        ctx.font = '20px "Segoe UI", sans-serif';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#888';
        ctx.fillText('A Color-Matching Bullet Hell', canvas.width / 2, canvas.height / 3 + 50);

        // Instructions
        ctx.font = '16px "Segoe UI", sans-serif';
        ctx.fillStyle = '#ff3366';
        ctx.shadowColor = '#ff3366';
        ctx.fillText('1 = RED', canvas.width / 2 - 100, canvas.height / 2 + 20);
        ctx.fillStyle = '#3399ff';
        ctx.shadowColor = '#3399ff';
        ctx.fillText('2 = BLUE', canvas.width / 2, canvas.height / 2 + 20);
        ctx.fillStyle = '#ffcc00';
        ctx.shadowColor = '#ffcc00';
        ctx.fillText('3 = YELLOW', canvas.width / 2 + 100, canvas.height / 2 + 20);

        ctx.fillStyle = '#666';
        ctx.shadowBlur = 0;
        ctx.fillText('WASD / Arrows to move  •  Space / Click to shoot', canvas.width / 2, canvas.height / 2 + 60);

        // Start prompt
        ctx.font = '24px "Segoe UI", sans-serif';
        ctx.fillStyle = '#fff';
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 10;
        const pulse = Math.sin(Date.now() / 300) * 0.3 + 0.7;
        ctx.globalAlpha = pulse;
        ctx.fillText('Press SPACE or CLICK to start', canvas.width / 2, canvas.height * 0.75);
        ctx.globalAlpha = 1;
    }

    private drawGameOver(): void {
        const { ctx, canvas, gameData } = this;

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.font = 'bold 48px "Segoe UI", sans-serif';
        ctx.fillStyle = '#ff3366';
        ctx.shadowColor = '#ff3366';
        ctx.shadowBlur = 20;
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 3);

        ctx.font = '24px "Segoe UI", sans-serif';
        ctx.fillStyle = '#fff';
        ctx.shadowBlur = 0;
        ctx.fillText(`Final Score: ${gameData.player.score}`, canvas.width / 2, canvas.height / 2);

        ctx.font = '18px "Segoe UI", sans-serif';
        ctx.fillStyle = '#888';
        ctx.fillText('Press R to restart', canvas.width / 2, canvas.height * 0.65);
    }

    private drawHUD(): void {
        const { ctx, canvas, gameData } = this;
        const { player } = gameData;

        ctx.save();
        ctx.shadowBlur = 0;

        // Score
        ctx.textAlign = 'left';
        ctx.font = 'bold 24px "Segoe UI", sans-serif';
        ctx.fillStyle = '#fff';
        ctx.fillText(`Score: ${player.score}`, 20, 35);

        // Wave Indicators
        ctx.font = '18px "Segoe UI", sans-serif';
        ctx.fillStyle = '#aaa';
        ctx.fillText(`Wave ${gameData.wave}`, 20, 60);

        // Combo
        if (player.combo > 1) {
            ctx.fillStyle = COLOR_VALUES[player.color];
            ctx.font = 'bold 24px "Segoe UI", sans-serif';
            ctx.fillText(`x${player.combo} COMBO`, 20, 90);
        }

        // PowerUp Status
        if (player.activePowerUp && player.powerUpTimer > 0) {
            ctx.textAlign = 'center';
            ctx.font = 'bold 18px "Segoe UI", sans-serif';

            const seconds = Math.ceil(player.powerUpTimer / 1000);
            let text = '';
            let color = '#fff';

            if (player.activePowerUp === 'white') {
                text = `PRISMATIC: ${seconds}s`;
                color = '#fff';
            } else if (player.activePowerUp === 'black') {
                text = `VOID DECAY: ${seconds}s`; // Creative name
                color = '#888';
            } else if (player.activePowerUp === 'rainbow') {
                text = `HYPER FIRE: ${seconds}s`;
                const hue = (player.powerUpTimer / 10) % 360;
                color = `hsl(${hue}, 100%, 70%)`;
            }

            ctx.fillStyle = color;
            ctx.shadowColor = color;
            ctx.shadowBlur = 10;
            ctx.fillText(text, canvas.width / 2, 80);
        }

        // Health
        ctx.textAlign = 'right';
        ctx.fillStyle = '#fff';
        ctx.fillText('HP:', canvas.width - 100, 35);

        for (let i = 0; i < player.maxHealth; i++) {
            ctx.fillStyle = i < player.health ? '#ff3366' : '#333';
            ctx.beginPath();
            ctx.arc(canvas.width - 70 + i * 25, 30, 8, 0, Math.PI * 2);
            ctx.fill();
        }

        // Current color indicator
        ctx.fillStyle = COLOR_VALUES[player.color];
        ctx.shadowColor = COLOR_VALUES[player.color];
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(canvas.width / 2, 30, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    resize(width: number, height: number): void {
        this.canvas.width = width;
        this.canvas.height = height;

        // Reposition player if needed
        if (this.gameData.player.position.x > width) {
            this.gameData.player.position.x = width / 2;
        }
        if (this.gameData.player.position.y > height) {
            this.gameData.player.position.y = height - 100;
        }
    }
}
