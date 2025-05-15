
        /***** Define Game Pixel & Internal Resolution *****/
        const GAME_PIXEL = 4;             // Each game unit = 4 physical pixels.
        const GAME_WIDTH = 125;           // Internal game width (125 game units = 500 physical pixels)
        const GAME_HEIGHT = 125;          // Internal game height
        const PHYSICAL_WIDTH = GAME_WIDTH * GAME_PIXEL;
        const PHYSICAL_HEIGHT = GAME_HEIGHT * GAME_PIXEL;
        const safeMargin = 1;             // Minimum gap (in game units) between enemy formation and rock top

        // Define a general margin for texts.
        const TEXT_MARGIN = 4;

        /***** Pixel Art Sprites *****/
        // Player sprite: 8×5 game units
        const playerSprite = [
            "   XX   ",
            "  XXXX  ",
            "XXXXXXXX",
            "XXXXXXXX",
            " XX  XX "
        ];

        // Enemy sprites now include two frames per row for simple animation.
        const enemySprites = [
            [  // Row 0 (Pastel Pink)
                [
                    "  XX  ",
                    " X  X ",
                    "XXXXXX",
                    "X XX X",
                    "XXXXXX"
                ],
                [
                    "  XX  ",
                    "  XX X",
                    "XXXXXX",
                    "XX XX ",
                    "XXXXXX"
                ]
            ],
            [  // Row 1 (Pastel Peach)
                [
                    "  XX  ",
                    "X  X X",
                    "XXXXXX",
                    " XX XX",
                    " X  X "
                ],
                [
                    "  XX  ",
                    "X XX  ",
                    "XXXXXX",
                    "XX XX ",
                    "  X  X"
                ]
            ],
            [  // Row 2 (Pastel Yellow)
                [
                    "  XX  ",
                    " XXXX ",
                    "XX  XX",
                    "XXXXXX",
                    "X    X"
                ],
                [
                    "  XX  ",
                    "XXXX  ",
                    "XX  XX",
                    "XXXXXX",
                    "X    X"
                ]
            ],
            [  // Row 3 (Pastel Green)
                [
                    " XXXX ",
                    "X    X",
                    "X XX X",
                    "X    X",
                    " XXXX "
                ],
                [
                    " XXXX ",
                    "X  X  ",
                    "X XX X",
                    "  X  X",
                    " XXXX "
                ]
            ],
            [  // Row 4 (Pastel Blue)
                [
                    "  XX  ",
                    " X  X ",
                    "X    X",
                    " X  X ",
                    "  XX  "
                ],
                [
                    "  XX  ",
                    " XX  X",
                    "X    X",
                    " X  XX",
                    "  XX  "
                ]
            ],
            [  // Row 5 (Pastel Lavender)
                [
                    "  XX  ",
                    "X XX X",
                    "XXXXXX",
                    "X    X",
                    " XXXX "
                ],
                [
                    "  XX  ",
                    "X  XX ",
                    "XXXXXX",
                    " X   X",
                    " XXXX "
                ]
            ]
        ];

        // Pastel colors for each enemy row.
        const enemyColors = [
            "#FFB3BA", // pastel pink
            "#FFDFBA", // pastel peach
            "#FFFFBA", // pastel yellow
            "#BAFFC9", // pastel green
            "#BAE1FF", // pastel blue
            "#D3B3FF"  // pastel lavender
        ];

        /***** Helper: Draw a Sprite *****/
        // Draws a sprite (an array of strings) at (x,y) in game coordinates.
        // Each "X" is drawn as a 1×1 filled rectangle in the given color.
        function drawSprite(ctx, sprite, x, y, color) {
            ctx.fillStyle = color;
            for (let row = 0; row < sprite.length; row++) {
                let line = sprite[row];
                for (let col = 0; col < line.length; col++) {
                    if (line[col] === "X") {
                        ctx.fillRect(x + col, y + row, 1, 1);
                    }
                }
            }
        }

        /***** Global Game Variables *****/
        let canvas, ctx;
        let gameState;       // "playing", "win", or "lose"
        let player;          // Player ship object
        let playerBullets;   // Array of player bullet objects
        let enemyBullets;    // Array of enemy bullet objects
        let enemies;         // Array of enemy objects
        let enemyDirection;  // 1 (right) or -1 (left)
        let rocks;           // Array of rock (shield) objects
        let fireCooldown;    // Frames until next allowed player shot
        let score;
        let respawnTimer;    // Frames to wait after getting hit

        // NEW: Control enemy movement speed (delay in frames between moves).
        const ENEMY_MOVE_DELAY = 15;
        let enemyMoveTimer = ENEMY_MOVE_DELAY;

        // Global frame counter for animations.
        let frameCount = 0;

        // Maximum rock health (for erosion scaling)
        const MAX_ROCK_HEALTH = 5;

        // Object to track key state.
        const keys = {};

        // For enemy formation: number of rows and columns.
        const enemyRows = 6;
        const enemyCols = 6;

        /***** Effective Rock Hitbox (and Drawing) *****/
        // Compute the effective rock hitbox based on its remaining health.
        // Uses a simple ratio so that when health is low, the hitbox shrinks.
        function effectiveRock(rock) {
            let ratio = rock.health / MAX_ROCK_HEALTH;
            let effW = Math.floor(rock.width * ratio);
            let effH = Math.floor(rock.height * ratio);
            // Ensure minimum hitbox dimensions of 1 if the rock still has health.
            if (effW < 1 && rock.health > 0) effW = 1;
            if (effH < 1 && rock.health > 0) effH = 1;
            return {
                x: rock.x + Math.floor((rock.width - effW) / 2),
                y: rock.y + Math.floor((rock.height - effH) / 2),
                width: effW,
                height: effH
            };
        }

        /***** Initialize / Restart Game *****/
        function initGame() {
            gameState = "playing";
            score = 0;
            respawnTimer = 0;
            enemyMoveTimer = ENEMY_MOVE_DELAY;
            frameCount = 0;

            // Setup the player using the sprite's dimensions.
            player = {
                width: playerSprite[0].length,      // 8 game units wide
                height: playerSprite.length,          // 5 game units tall
                x: Math.floor(GAME_WIDTH / 2 - playerSprite[0].length / 2),
                y: GAME_HEIGHT - playerSprite.length - 1,
                speed: 2,    // in game units per frame
                lives: 3
            };

            playerBullets = [];
            enemyBullets = [];

            // Create enemy formation.
            enemies = [];
            const enemyW = enemySprites[0][0][0].length;  // should be 6 game units
            const enemyH = enemySprites[0][0].length;       // should be 5 game units
            const gapX = 8;  // Increased horizontal gap between enemies.
            const gapY = 2;
            // Start the enemy formation below the HUD (e.g. starting Y = 10)
            const startX = Math.floor((GAME_WIDTH - (enemyCols * enemyW + (enemyCols - 1) * gapX)) / 2);
            const startY = 10;
            for (let row = 0; row < enemyRows; row++) {
                for (let col = 0; col < enemyCols; col++) {
                    enemies.push({
                        x: startX + col * (enemyW + gapX),
                        y: startY + row * (enemyH + gapY),
                        width: enemyW,
                        height: enemyH,
                        col: col,
                        row: row
                    });
                }
            }
            enemyDirection = 1;  // start moving to the right

            // Create rocks (shields) as smaller pixelated rectangles.
            rocks = [];
            const rockCount = 3;
            const rockW = 12;   // in game units
            const rockH = 6;    // in game units
            // Position rocks evenly (placed near the bottom)
            for (let i = 0; i < rockCount; i++) {
                rocks.push({
                    x: Math.floor((GAME_WIDTH / (rockCount + 1)) * (i + 1) - rockW / 2),
                    y: GAME_HEIGHT - 30,
                    width: rockW,
                    height: rockH,
                    health: MAX_ROCK_HEALTH
                });
            }

            // Allow immediate firing.
            fireCooldown = 0;
        }

        /***** Collision Detection *****/
        function collides(a, b) {
            return a.x < b.x + b.width &&
                a.x + a.width > b.x &&
                a.y < b.y + b.height &&
                a.y + a.height > b.y;
        }

        /***** Key Listeners *****/
        document.addEventListener("keydown", (e) => {
            keys[e.key] = true;
            if (gameState !== "playing" && e.key === "Enter") {
                initGame();
            }
        });
        document.addEventListener("keyup", (e) => {
            keys[e.key] = false;
        });

        /***** Main Game Loop *****/
        function update() {
            frameCount++;
            if (gameState === "playing") {
                // Count down respawn timer.
                if (respawnTimer > 0) respawnTimer--;

                // Process player input when not in respawn delay.
                if (respawnTimer <= 0) {
                    // --- Player Movement ---
                    // Use a margin for the HUD texts.
                    const leftLimit = Math.floor(GAME_WIDTH * 0.125);
                    const rightLimit = Math.floor(GAME_WIDTH * 0.875) - player.width;
                    if (keys["ArrowLeft"]) {
                        player.x -= player.speed;
                        if (player.x < leftLimit) player.x = leftLimit;
                    }
                    if (keys["ArrowRight"]) {
                        player.x += player.speed;
                        if (player.x > rightLimit) player.x = rightLimit;
                    }
                    // --- Player Firing ---
                    if (keys[" "] && fireCooldown <= 0) {
                        playerBullets.push({
                            x: player.x + Math.floor(player.width / 2),
                            y: player.y - 3,   // start just above the player
                            width: 1,
                            height: 3,
                            speed: 2
                        });
                        fireCooldown = 35; // Longer cooldown for reduced fire rate.
                    }
                }
                if (fireCooldown > 0) fireCooldown--;

                // --- Update Bullets ---
                for (let i = 0; i < playerBullets.length; i++) {
                    let bullet = playerBullets[i];
                    bullet.y -= bullet.speed;
                    if (bullet.y + bullet.height < 0) {
                        playerBullets.splice(i, 1);
                        i--;
                    }
                }
                for (let i = 0; i < enemyBullets.length; i++) {
                    let bullet = enemyBullets[i];
                    bullet.y += bullet.speed;
                    if (bullet.y > GAME_HEIGHT) {
                        enemyBullets.splice(i, 1);
                        i--;
                    }
                }

                // --- Update Enemies ---
                if (enemyMoveTimer <= 0) {
                    if (enemies.length > 0) {
                        let minX = Math.min(...enemies.map(e => e.x));
                        let maxX = Math.max(...enemies.map(e => e.x + e.width));
                        const enemySpeed = 1;   // Move 1 game unit horizontally.
                        const enemyStep = 5;    // Drop exactly one enemy row (5 game units).
                        if ((enemyDirection > 0 && maxX >= GAME_WIDTH) ||
                            (enemyDirection < 0 && minX <= 0)) {
                            let formationBottom = Math.max(...enemies.map(e => e.y + e.height));
                            let rockLimit = rocks.length > 0 ? Math.min(...rocks.map(r => r.y)) : GAME_HEIGHT;
                            if (formationBottom + enemyStep < rockLimit - safeMargin) {
                                enemies.forEach(e => e.y += enemyStep);
                            }
                            enemyDirection *= -1;
                        } else {
                            enemies.forEach(e => e.x += enemySpeed * enemyDirection);
                        }
                    }
                    enemyMoveTimer = ENEMY_MOVE_DELAY;
                } else {
                    enemyMoveTimer--;
                }

                // --- Enemy Firing ---
                const enemyFireProbability = 0.004;
                for (let col = 0; col < enemyCols; col++) {
                    let colEnemies = enemies.filter(e => e.col === col);
                    if (colEnemies.length) {
                        let bottomEnemy = colEnemies.reduce((a, b) => (b.y > a.y ? b : a));
                        if (Math.random() < enemyFireProbability) {
                            enemyBullets.push({
                                x: bottomEnemy.x + Math.floor(bottomEnemy.width / 2),
                                y: bottomEnemy.y + bottomEnemy.height,
                                width: 1,
                                height: 3,
                                speed: 1
                            });
                        }
                    }
                }

                // --- Collisions ---
                // Player bullets vs. enemies.
                for (let i = 0; i < playerBullets.length; i++) {
                    let bullet = playerBullets[i];
                    for (let j = 0; j < enemies.length; j++) {
                        let enemy = enemies[j];
                        if (collides(bullet, enemy)) {
                            score += (enemyRows - enemy.row) * 10;
                            enemies.splice(j, 1);
                            playerBullets.splice(i, 1);
                            i--;
                            break;
                        }
                    }
                }
                // Player bullets vs. rocks (using effective hitbox).
                for (let i = 0; i < playerBullets.length; i++) {
                    let bullet = playerBullets[i];
                    for (let j = 0; j < rocks.length; j++) {
                        let rock = rocks[j];
                        if (collides(bullet, effectiveRock(rock))) {
                            rock.health--;
                            playerBullets.splice(i, 1);
                            i--;
                            if (rock.health <= 0) {
                                rocks.splice(j, 1);
                                j--;
                            }
                            break;
                        }
                    }
                }
                // Enemy bullets vs. rocks (using effective hitbox).
                for (let i = 0; i < enemyBullets.length; i++) {
                    let bullet = enemyBullets[i];
                    for (let j = 0; j < rocks.length; j++) {
                        let rock = rocks[j];
                        if (collides(bullet, effectiveRock(rock))) {
                            rock.health--;
                            enemyBullets.splice(i, 1);
                            i--;
                            if (rock.health <= 0) {
                                rocks.splice(j, 1);
                                j--;
                            }
                            break;
                        }
                    }
                }
                // Enemy bullets vs. player.
                for (let i = 0; i < enemyBullets.length; i++) {
                    let bullet = enemyBullets[i];
                    if (respawnTimer <= 0 && collides(bullet, player)) {
                        enemyBullets.splice(i, 1);
                        i--;
                        player.lives--;
                        if (player.lives > 0) {
                            respawnTimer = 60;  // ~1 second delay
                            player.x = Math.floor(GAME_WIDTH / 2 - player.width / 2);
                        } else {
                            gameState = "lose";
                        }
                    }
                }
                // End game if any enemy reaches the player's row.
                for (let e of enemies) {
                    if (e.y + e.height >= player.y) {
                        gameState = "lose";
                    }
                }
                if (enemies.length === 0) {
                    gameState = "win";
                }
            } // end if playing

            draw();
            requestAnimationFrame(update);
        }

        /***** Drawing Routine *****/
        function draw() {
            // Clear the internal game area.
            ctx.fillStyle = "black";
            ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

            // Draw the player (blinking during respawn).
            if (respawnTimer > 0) {
                if (Math.floor(respawnTimer / 5) % 2 === 0) {
                    drawSprite(ctx, playerSprite, player.x, player.y, "#A8E6CF");
                }
            } else {
                drawSprite(ctx, playerSprite, player.x, player.y, "#A8E6CF");
            }

            // Draw enemies using animated sprites.
            // Enemy animation now updates every 20 frames.
            const frameIndex = Math.floor(((frameCount / ENEMY_MOVE_DELAY) / 2) % 2);
            enemies.forEach(e => {
                drawSprite(ctx, enemySprites[e.row][frameIndex], e.x, e.y, enemyColors[e.row]);
            });

            // Draw player bullets using a pastel yellow.
            ctx.fillStyle = "#FFF9C4";
            playerBullets.forEach(b => {
                ctx.fillRect(b.x, b.y, b.width, b.height);
            });

            // Draw enemy bullets using a pastel red.
            ctx.fillStyle = "#FF8A80";
            enemyBullets.forEach(b => {
                ctx.fillRect(b.x, b.y, b.width, b.height);
            });

            // Draw rocks (shields) using their effective (shrinking) hitbox.
            rocks.forEach(r => {
                let eff = effectiveRock(r);
                ctx.fillStyle = "#CFD8DC";
                ctx.fillRect(eff.x, eff.y, eff.width, eff.height);
            });

            // Draw HUD text with spacing.
            ctx.fillStyle = "#FFFFFF";
            ctx.font = "4px 'Press Start 2P'";
            // HUD: Lives (top-left) and Score (top-right)
            ctx.textAlign = "left";
            ctx.fillText("Lives: " + player.lives, TEXT_MARGIN, TEXT_MARGIN + 2);
            ctx.textAlign = "right";
            ctx.fillText("Score: " + score, GAME_WIDTH - TEXT_MARGIN, TEXT_MARGIN + 2);
            
            // Draw overlay text if game over or win.
            if (gameState !== "playing") {
                ctx.fillStyle = "black";
                ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
                ctx.fillStyle = "#FFFFFF";
                ctx.font = "6px 'Press Start 2P'";
                ctx.textAlign = "center";
                let message = gameState === "win" ? "You Win!" : "Game Over";
                ctx.fillText(message, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 6);
                ctx.font = "4px 'Press Start 2P'";
                ctx.fillText("Final Score: " + score, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 2);
                ctx.fillText("Press Enter to Restart", GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10);
            }
        }

        /***** Start the Game *****/
        window.onload = function () {
            canvas = document.getElementById("gameCanvas");
            canvas.width = PHYSICAL_WIDTH;
            canvas.height = PHYSICAL_HEIGHT;
            ctx = canvas.getContext("2d");
            ctx.imageSmoothingEnabled = false;
            ctx.scale(GAME_PIXEL, GAME_PIXEL);
            initGame();
            requestAnimationFrame(update);
        };
    