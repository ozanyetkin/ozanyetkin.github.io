
// Constants derived from CSS variables
const COLS = 10, ROWS = 20, BLOCK_SIZE = 30, GAP = 2;
const CANVAS_WIDTH = COLS * BLOCK_SIZE + 2 * GAP;  // 10*30 + 4 = 304
const CANVAS_HEIGHT = ROWS * BLOCK_SIZE + 2 * GAP; // 20*30 + 4 = 604

const canvas = document.getElementById("game");
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;
const ctx = canvas.getContext("2d");

const nextCanvas = document.getElementById("nextCanvas");
const nextCtx = nextCanvas.getContext("2d");

// Create empty board array
let board = [];
function initBoard() {
    board = [];
    for (let y = 0; y < ROWS; y++) {
        board[y] = new Array(COLS).fill(0);
    }
}
initBoard();

// Tetromino shapes (4x4 matrices)
const tetrominoes = {
    I: [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ],
    O: [
        [0, 0, 0, 0],
        [0, 2, 2, 0],
        [0, 2, 2, 0],
        [0, 0, 0, 0]
    ],
    T: [
        [0, 3, 0, 0],
        [3, 3, 3, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ],
    J: [
        [4, 0, 0, 0],
        [4, 4, 4, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ],
    L: [
        [0, 0, 5, 0],
        [5, 5, 5, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ],
    S: [
        [0, 6, 6, 0],
        [6, 6, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ],
    Z: [
        [7, 7, 0, 0],
        [0, 7, 7, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ]
};

// Darker pastel colors for tetrominoes (indices 1-7)
const colors = [
    null,
    "#48C9B0",
    "#F7DC6F",
    "#AF7AC5",
    "#5DADE2",
    "#E59866",
    "#58D68D",
    "#EC7063"
];

// Game Variables
let currentPiece, nextPiece;
let score = 0, linesCleared = 0, level = 0;
let dropInterval = 500; // ms; decreases with level
let highScore = parseInt(localStorage.getItem("high")) || 0;
let isPaused = false, isAnimating = false, blinkOn = false;
let blinkingRows = [];
let gameOverFlag = false;
let lastDropTime = 0;

// Spawn a random tetromino piece
function spawnPiece() {
    const keys = Object.keys(tetrominoes);
    const randKey = keys[Math.floor(Math.random() * keys.length)];
    const matrix = tetrominoes[randKey].map(row => row.slice());
    return {
        matrix: matrix,
        x: Math.floor(COLS / 2) - 2,
        y: -1 // start above board
    };
}

// Check if moving the piece is valid
function isValidMove(piece, offsetX, offsetY, newMatrix) {
    for (let y = 0; y < newMatrix.length; y++) {
        for (let x = 0; x < newMatrix[y].length; x++) {
            if (newMatrix[y][x] !== 0) {
                const newX = piece.x + x + offsetX;
                const newY = piece.y + y + offsetY;
                if (newX < 0 || newX >= COLS || newY >= ROWS) return false;
                if (newY >= 0 && board[newY][newX] !== 0) return false;
            }
        }
    }
    return true;
}

// Merge current piece into board
function mergePieceToBoard() {
    for (let y = 0; y < currentPiece.matrix.length; y++) {
        for (let x = 0; x < currentPiece.matrix[y].length; x++) {
            if (currentPiece.matrix[y][x] !== 0) {
                const boardY = currentPiece.y + y;
                const boardX = currentPiece.x + x;
                if (boardY >= 0) {
                    board[boardY][boardX] = currentPiece.matrix[y][x];
                }
            }
        }
    }
}

// Rotate a matrix clockwise
function rotate(matrix) {
    const N = matrix.length;
    const result = [];
    for (let y = 0; y < N; y++) {
        result[y] = [];
        for (let x = 0; x < N; x++) {
            result[y][x] = matrix[N - x - 1][y];
        }
    }
    return result;
}

// Rotate the current piece if possible
function rotatePiece() {
    const rotated = rotate(currentPiece.matrix);
    if (isValidMove(currentPiece, 0, 0, rotated)) {
        currentPiece.matrix = rotated;
        draw();
    }
}

// Move the current piece by given offsets
function movePiece(offsetX, offsetY) {
    if (isValidMove(currentPiece, offsetX, offsetY, currentPiece.matrix)) {
        currentPiece.x += offsetX;
        currentPiece.y += offsetY;
        draw();
        return true;
    }
    return false;
}

// Soft drop: move piece down one cell or merge if not possible
function dropOne() {
    if (!movePiece(0, 1)) {
        mergePieceToBoard();
        if (!checkFullLines()) {
            newPiece();
        }
    }
}

// Hard drop: drop the piece instantly
function hardDrop() {
    while (movePiece(0, 1)) { }
    dropOne();
}

// Check for full lines; if found, animate blink and clear them.
function checkFullLines() {
    let fullRows = [];
    for (let y = 0; y < ROWS; y++) {
        if (board[y].every(cell => cell !== 0)) {
            fullRows.push(y);
        }
    }
    if (fullRows.length > 0) {
        blinkAndClear(fullRows);
        return true;
    }
    return false;
}

// Blink animation for line deletion then clear them.
function blinkAndClear(rows) {
    isAnimating = true;
    blinkingRows = rows;
    let blinkCount = 0;
    const maxBlinks = 6;
    const blinkInterval = setInterval(() => {
        blinkOn = !blinkOn;
        draw();
        blinkCount++;
        if (blinkCount >= maxBlinks) {
            clearInterval(blinkInterval);
            rows.sort((a, b) => a - b);
            rows.forEach(rowIndex => {
                board.splice(rowIndex, 1);
                board.unshift(new Array(COLS).fill(0));
            });
            let linesRemoved = rows.length;
            linesCleared += linesRemoved;
            let points = 0;
            if (linesRemoved === 1) points = 40 * (level + 1);
            else if (linesRemoved === 2) points = 100 * (level + 1);
            else if (linesRemoved === 3) points = 300 * (level + 1);
            else if (linesRemoved === 4) points = 1200 * (level + 1);
            score += points;
            let newLevel = Math.floor(linesCleared / 10);
            if (newLevel > level) {
                level = newLevel;
                dropInterval = Math.max(100, 500 - level * 50);
            }
            if (score > highScore) {
                highScore = score;
                localStorage.setItem("high", highScore);
            }
            blinkingRows = [];
            isAnimating = false;
            newPiece();
            updateSidebar();
        }
    }, 150);
}

// Spawn the next piece; currentPiece becomes nextPiece and a new nextPiece is generated.
function newPiece() {
    currentPiece = nextPiece;
    nextPiece = spawnPiece();
    drawNextPiece();
    if (!isValidMove(currentPiece, 0, 0, currentPiece.matrix)) {
        gameOver();
    }
}

// Draw the main game board, current piece, and overlay blinking rows.
// The drawing is offset by GAP so that the grid is inset inside the frame.
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 3;

    // Draw board cells with inner gap offset.
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            let posX = x * BLOCK_SIZE + GAP;
            let posY = y * BLOCK_SIZE + GAP;
            ctx.fillStyle = "black";
            ctx.fillRect(posX, posY, BLOCK_SIZE, BLOCK_SIZE);
            if (board[y][x] !== 0) {
                ctx.fillStyle = colors[board[y][x]];
                ctx.fillRect(posX, posY, BLOCK_SIZE, BLOCK_SIZE);
            }
            // Draw cell border (grid) in black.
            ctx.strokeStyle = "black";
            ctx.strokeRect(posX, posY, BLOCK_SIZE, BLOCK_SIZE);
        }
    }

    // Draw current falling piece.
    for (let y = 0; y < currentPiece.matrix.length; y++) {
        for (let x = 0; x < currentPiece.matrix[y].length; x++) {
            if (currentPiece.matrix[y][x] !== 0) {
                let posX = (currentPiece.x + x) * BLOCK_SIZE + GAP;
                let posY = (currentPiece.y + y) * BLOCK_SIZE + GAP;
                if (currentPiece.y + y >= 0) {
                    ctx.fillStyle = colors[currentPiece.matrix[y][x]];
                    ctx.fillRect(posX, posY, BLOCK_SIZE, BLOCK_SIZE);
                    ctx.strokeStyle = "black";
                    ctx.strokeRect(posX, posY, BLOCK_SIZE, BLOCK_SIZE);
                }
            }
        }
    }

    // Overlay blinking full rows (highlight entire row).
    if (blinkOn) {
        ctx.fillStyle = "white";
        blinkingRows.forEach(row => {
            let rowY = row * BLOCK_SIZE + GAP;
            ctx.fillRect(GAP, rowY, COLS * BLOCK_SIZE, BLOCK_SIZE);
            for (let x = 0; x < COLS; x++) {
                ctx.strokeStyle = "black";
                ctx.strokeRect(x * BLOCK_SIZE + GAP, rowY, BLOCK_SIZE, BLOCK_SIZE);
            }
        });
    }

    // Display overlay if paused or game over.
    const overlay = document.getElementById("overlay");
    if (isPaused || gameOverFlag) {
        overlay.style.display = "flex";
    } else {
        overlay.style.display = "none";
    }
}

// Draw the next tetromino in its preview canvas, centered evenly.
function drawNextPiece() {
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    const previewGap = 10;
    let availableWidth = nextCanvas.width - 2 * previewGap;
    let availableHeight = nextCanvas.height - 2 * previewGap;
    const matrix = nextPiece.matrix;
    let minX = 4, maxX = -1, minY = 4, maxY = -1;
    for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
            if (matrix[y][x] !== 0) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }
        }
    }
    let pieceWidth = maxX - minX + 1;
    let pieceHeight = maxY - minY + 1;
    // Use a desired preview block size that ensures the tetromino fits inside the available area.
    let desiredPreviewBlockSize = 24;
    let previewBlockSize = Math.min(desiredPreviewBlockSize,
        Math.floor(availableWidth / pieceWidth),
        Math.floor(availableHeight / pieceHeight));
    let offsetX = previewGap + (availableWidth - pieceWidth * previewBlockSize) / 2;
    let offsetY = previewGap + (availableHeight - pieceHeight * previewBlockSize) / 2;
    nextCtx.lineWidth = 3;
    for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
            if (matrix[y][x] !== 0) {
                let drawX = (x - minX) * previewBlockSize + offsetX;
                let drawY = (y - minY) * previewBlockSize + offsetY;
                nextCtx.fillStyle = colors[matrix[y][x]];
                nextCtx.fillRect(drawX, drawY, previewBlockSize, previewBlockSize);
                nextCtx.strokeStyle = "black";
                nextCtx.strokeRect(drawX, drawY, previewBlockSize, previewBlockSize);
            }
        }
    }
}

// Update the sidebar with score, level, lines, and high score.
function updateSidebar() {
    document.getElementById("scoreDisplay").innerText = "Score: " + score;
    document.getElementById("levelDisplay").innerText = "Level: " + level;
    document.getElementById("linesDisplay").innerText = "Lines: " + linesCleared;
    document.getElementById("highScoreDisplay").innerText = "High: " + highScore;
}

// Show overlay with specific text.
function showOverlay(text) {
    const overlay = document.getElementById("overlay");
    overlay.innerHTML = text;
    overlay.style.display = "flex";
}

function hideOverlay() {
    const overlay = document.getElementById("overlay");
    overlay.style.display = "none";
}

// Handle Game Over: show overlay with restart instruction formatted appropriately.
function gameOver() {
    gameOverFlag = true;
    isPaused = true;
    showOverlay("<div style='text-align:center;'><div>GAME OVER</div><div style='font-size:14px; margin-top:10px;'>Press R to Restart<br/>or tap Pause button</div></div>");
    updatePauseButton();
}

// Update pause button text based on game state
function updatePauseButton() {
    const pauseBtn = document.getElementById("pauseBtn");
    if (pauseBtn) {
        if (gameOverFlag) {
            pauseBtn.textContent = "RESTART";
        } else if (isPaused) {
            pauseBtn.textContent = "PLAY";
        } else {
            pauseBtn.textContent = "PAUSE";
        }
    }
}

// Restart the game completely.
function restartGame() {
    initBoard();
    score = 0;
    linesCleared = 0;
    level = 0;
    dropInterval = 500;
    gameOverFlag = false;
    isPaused = false;
    isAnimating = false;
    blinkOn = false;
    blinkingRows = [];
    nextPiece = spawnPiece();
    currentPiece = spawnPiece();
    newPiece();
    updateSidebar();
    updatePauseButton();
    hideOverlay();
}

// Main game loop using requestAnimationFrame.
function update(time) {
    if (!gameOverFlag && !isPaused && !isAnimating) {
        if (time - lastDropTime > dropInterval) {
            dropOne();
            lastDropTime = time;
        }
    }
    draw();
    requestAnimationFrame(update);
}

// Keyboard controls.
document.addEventListener("keydown", function (e) {
    // If game over and "r" is pressed, restart the game.
    if (gameOverFlag && e.key.toLowerCase() === "r") {
        restartGame();
        return;
    }
    // Toggle pause with "p" (if game not over)
    if (!gameOverFlag && e.key.toLowerCase() === "p") {
        isPaused = !isPaused;
        if (isPaused) {
            showOverlay("PAUSED");
        } else {
            hideOverlay();
        }
        updatePauseButton();
        e.preventDefault();
        return;
    }
    if (isPaused || isAnimating) return;
    switch (e.keyCode) {
        case 37: // Left arrow
            movePiece(-1, 0);
            break;
        case 39: // Right arrow
            movePiece(1, 0);
            break;
        case 40: // Down arrow (soft drop)
            dropOne();
            break;
        case 38: // Up arrow (rotate)
            rotatePiece();
            break;
        case 32: // Space (hard drop)
            hardDrop();
            break;
    }
    e.preventDefault();
});

// Mobile touch controls
function setupMobileControls() {
    const leftBtn = document.getElementById("leftBtn");
    const rightBtn = document.getElementById("rightBtn");
    const downBtn = document.getElementById("downBtn");
    const rotateBtn = document.getElementById("rotateBtn");
    const pauseBtn = document.getElementById("pauseBtn");
    const hardDropBtn = document.getElementById("hardDropBtn");

    // Prevent context menu on long press
    document.addEventListener("contextmenu", function (e) {
        e.preventDefault();
    });

    // Touch event helpers
    function addTouchEvents(element, onPress) {
        let isPressed = false;
        let intervalId = null;

        function startPress() {
            if (isPaused || isAnimating || gameOverFlag) return;
            isPressed = true;
            onPress();
            // For movement buttons, repeat while held
            if (element === leftBtn || element === rightBtn || element === downBtn) {
                intervalId = setInterval(() => {
                    if (isPressed && !isPaused && !isAnimating && !gameOverFlag) {
                        onPress();
                    }
                }, 150);
            }
        }

        function endPress() {
            isPressed = false;
            if (intervalId) {
                clearInterval(intervalId);
                intervalId = null;
            }
        }

        element.addEventListener("touchstart", function (e) {
            e.preventDefault();
            startPress();
        });

        element.addEventListener("touchend", function (e) {
            e.preventDefault();
            endPress();
        });

        element.addEventListener("touchcancel", function (e) {
            e.preventDefault();
            endPress();
        });

        // Also support mouse events for testing on desktop
        element.addEventListener("mousedown", function (e) {
            e.preventDefault();
            startPress();
        });

        element.addEventListener("mouseup", function (e) {
            e.preventDefault();
            endPress();
        });

        element.addEventListener("mouseleave", function (e) {
            e.preventDefault();
            endPress();
        });
    }

    // Setup each button
    addTouchEvents(leftBtn, () => movePiece(-1, 0));
    addTouchEvents(rightBtn, () => movePiece(1, 0));
    addTouchEvents(downBtn, () => dropOne());
    addTouchEvents(rotateBtn, () => rotatePiece());
    addTouchEvents(hardDropBtn, () => hardDrop());

    // Pause button has special logic
    pauseBtn.addEventListener("touchstart", function (e) {
        e.preventDefault();
        if (gameOverFlag) {
            restartGame();
        } else {
            isPaused = !isPaused;
            if (isPaused) {
                showOverlay("PAUSED");
            } else {
                hideOverlay();
            }
            updatePauseButton();
        }
    });

    pauseBtn.addEventListener("mousedown", function (e) {
        e.preventDefault();
        if (gameOverFlag) {
            restartGame();
        } else {
            isPaused = !isPaused;
            if (isPaused) {
                showOverlay("PAUSED");
            } else {
                hideOverlay();
            }
            updatePauseButton();
        }
    });
}

// Swipe detection for mobile
function setupSwipeControls() {
    let startX = 0;
    let startY = 0;
    let startTime = 0;

    canvas.addEventListener("touchstart", function (e) {
        if (isPaused || isAnimating || gameOverFlag) return;
        e.preventDefault();
        const touch = e.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;
        startTime = Date.now();
    });

    canvas.addEventListener("touchend", function (e) {
        if (isPaused || isAnimating || gameOverFlag) return;
        e.preventDefault();
        const touch = e.changedTouches[0];
        const endX = touch.clientX;
        const endY = touch.clientY;
        const endTime = Date.now();

        const deltaX = endX - startX;
        const deltaY = endY - startY;
        const deltaTime = endTime - startTime;

        // Only register swipes that are quick enough and long enough
        if (deltaTime < 300 && (Math.abs(deltaX) > 30 || Math.abs(deltaY) > 30)) {
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Horizontal swipe
                if (deltaX > 0) {
                    movePiece(1, 0); // Right
                } else {
                    movePiece(-1, 0); // Left
                }
            } else {
                // Vertical swipe
                if (deltaY > 0) {
                    dropOne(); // Down
                }
            }
        } else if (deltaTime < 200 && Math.abs(deltaX) < 20 && Math.abs(deltaY) < 20) {
            // Tap to rotate
            rotatePiece();
        }
    });

    canvas.addEventListener("touchmove", function (e) {
        e.preventDefault();
    });
}

function init() {
    nextPiece = spawnPiece();
    currentPiece = spawnPiece();
    newPiece();
    updateSidebar();
    setupMobileControls();
    setupSwipeControls();
    requestAnimationFrame(update);
}
init();
