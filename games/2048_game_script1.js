/*
  Two-phase move for each direction:
    1) Slide all tiles together (no merging). Animate -> "slide"
    2) Merge adjacent tiles, then slide again to remove gaps. Animate -> "merge"
    3) Spawn a new tile. Animate -> "spawn"
        
  Each tile object has:
    {
      id: number,
      value: number,
      row: number,
      col: number,
      previousPosition: { row, col } or null,
      isNew: boolean,
      isMerged: boolean
    }
        
  We'll keep track of 'previousPosition' for animation from old -> new.
  We'll mark newly spawned tiles with 'isNew' to trigger the spawn animation.
  We'll mark merged tiles with 'isMerged' to trigger the merge "pop" animation.
        
  We also track the current score and best score. Each merge adds the merged
  tile's new value to the score. We store bestScore in localStorage so it persists.
*/

const SIZE = 4;
let board = [];
let nextTileId = 1;
let isAnimating = false;
let score = 0;
let bestScore = 0;

// Load best score from localStorage if available
if (localStorage.getItem("bestScore")) {
  bestScore = parseInt(localStorage.getItem("bestScore"), 10);
}

// Initialize the game
function initGame() {
  // Hide game-over overlay
  document.getElementById("game-over").style.display = "none";

  // Reset board
  board = [];
  for (let r = 0; r < SIZE; r++) {
    board[r] = [];
    for (let c = 0; c < SIZE; c++) {
      board[r][c] = null;
    }
  }
  nextTileId = 1;

  // Reset score
  score = 0;
  updateScoreDisplay();

  // Spawn two tiles initially
  spawnRandomTile();
  spawnRandomTile();

  // Render the initial board (shows spawn animations for these tiles)
  renderBoard();
  // Reset new flag so the spawn animation won't replay on the first move
  resetNewFlag();
}

// Update the score panel
function updateScoreDisplay() {
  document.getElementById("score").textContent = score;
  document.getElementById("best").textContent = bestScore;
}

// Add points to score
function addScore(points) {
  score += points;
  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem("bestScore", bestScore.toString());
  }
  updateScoreDisplay();
}

// Spawn a tile with value=2 at a random empty position
function spawnRandomTile() {
  let empty = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (!board[r][c]) {
        empty.push({
          r,
          c
        });
      }
    }
  }
  if (empty.length === 0) return;

  let chosen = empty[Math.floor(Math.random() * empty.length)];
  board[chosen.r][chosen.c] = {
    id: nextTileId++,
    value: 2,
    row: chosen.r,
    col: chosen.c,
    // Set previousPosition to the same spot to avoid blinking
    previousPosition: {
      row: chosen.r,
      col: chosen.c
    },
    isNew: true,
    isMerged: false
  };
}

// Check if game is over
function checkGameOver() {
  // If there's an empty cell, not over
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (!board[r][c]) return false;
    }
  }
  // Check any merges possible
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      let tile = board[r][c];
      if (!tile) continue;
      // check right
      if (c < SIZE - 1 && board[r][c + 1] && board[r][c + 1].value === tile.value) return false;
      // check down
      if (r < SIZE - 1 && board[r + 1][c] && board[r + 1][c].value === tile.value) return false;
    }
  }
  return true;
}

// Show game over
function showGameOver() {
  document.getElementById("game-over").style.display = "flex";
}

// Keydown listener for moves
document.addEventListener("keydown", (e) => {
  if (isAnimating) return;

  switch (e.key) {
    case "ArrowLeft":
      moveLeft();
      break;
    case "ArrowRight":
      moveRight();
      break;
    case "ArrowUp":
      moveUp();
      break;
    case "ArrowDown":
      moveDown();
      break;
    default:
      return;
  }
});

/**
 * Each direction's move has 3 steps, each followed by an animation:
 *  1) Slide (no merge)
 *  2) Merge, then slide
 *  3) Spawn new tile
 * 
 * We only do these steps if the move is actually possible (canMoveX() returns true).
 * 
 * Between steps, we call storePreviousPositions() to record old positions
 * for animation, then call animateStep() to re-render and wait for 150ms.
 * Then we reset merges if needed, and proceed.
 */

// -- Move Left --
async function moveLeft() {
  if (!canMoveLeft()) return;
  isAnimating = true;

  // Step 1: Slide no merge
  storePreviousPositions();
  slideLeftNoMerge();
  await animateStep();
  resetMergedFlag();

  // Step 2: Merge + slide
  storePreviousPositions();
  mergeLeft();
  slideLeftNoMerge();
  await animateStep();
  resetMergedFlag();

  // Step 3: Spawn tile
  spawnRandomTile();
  storePreviousPositions();
  await animateStep();
  resetMergedFlag();
  resetNewFlag();

  isAnimating = false;
  if (checkGameOver()) showGameOver();
}

// -- Move Right --
async function moveRight() {
  if (!canMoveRight()) return;
  isAnimating = true;

  storePreviousPositions();
  slideRightNoMerge();
  await animateStep();
  resetMergedFlag();

  storePreviousPositions();
  mergeRight();
  slideRightNoMerge();
  await animateStep();
  resetMergedFlag();

  spawnRandomTile();
  storePreviousPositions();
  await animateStep();
  resetMergedFlag();
  resetNewFlag();

  isAnimating = false;
  if (checkGameOver()) showGameOver();
}

// -- Move Up --
async function moveUp() {
  if (!canMoveUp()) return;
  isAnimating = true;

  storePreviousPositions();
  slideUpNoMerge();
  await animateStep();
  resetMergedFlag();

  storePreviousPositions();
  mergeUp();
  slideUpNoMerge();
  await animateStep();
  resetMergedFlag();

  spawnRandomTile();
  storePreviousPositions();
  await animateStep();
  resetMergedFlag();
  resetNewFlag();

  isAnimating = false;
  if (checkGameOver()) showGameOver();
}

// -- Move Down --
async function moveDown() {
  if (!canMoveDown()) return;
  isAnimating = true;

  storePreviousPositions();
  slideDownNoMerge();
  await animateStep();
  resetMergedFlag();

  storePreviousPositions();
  mergeDown();
  slideDownNoMerge();
  await animateStep();
  resetMergedFlag();

  spawnRandomTile();
  storePreviousPositions();
  await animateStep();
  resetMergedFlag();
  resetNewFlag();

  isAnimating = false;
  if (checkGameOver()) showGameOver();
}

// ----------------------
// Sliding without merging
// ----------------------
function slideLeftNoMerge() {
  for (let r = 0; r < SIZE; r++) {
    let row = getRow(r);
    let compressed = compressLine(row);
    setRow(r, compressed);
  }
}

function slideRightNoMerge() {
  for (let r = 0; r < SIZE; r++) {
    let row = getRow(r).reverse();
    let compressed = compressLine(row);
    compressed.reverse();
    setRow(r, compressed);
  }
}

function slideUpNoMerge() {
  for (let c = 0; c < SIZE; c++) {
    let col = getColumn(c);
    let compressed = compressLine(col);
    setColumn(c, compressed);
  }
}

function slideDownNoMerge() {
  for (let c = 0; c < SIZE; c++) {
    let col = getColumn(c).reverse();
    let compressed = compressLine(col);
    compressed.reverse();
    setColumn(c, compressed);
  }
}

// Compress out nulls (just move tiles forward, no merging)
function compressLine(tiles) {
  let filtered = tiles.filter(t => t !== null);
  while (filtered.length < SIZE) {
    filtered.push(null);
  }
  return filtered;
}

// ----------------------
// Merging (adding score for each merge)
// ----------------------
function mergeLeft() {
  for (let r = 0; r < SIZE; r++) {
    let row = getRow(r);
    for (let i = 0; i < SIZE - 1; i++) {
      let t1 = row[i];
      let t2 = row[i + 1];
      if (t1 && t2 && t1.value === t2.value) {
        t1.value *= 2;
        t1.isMerged = true;
        addScore(t1.value); // add merged value to score
        row[i + 1] = null;
      }
    }
    setRow(r, row);
  }
}

function mergeRight() {
  for (let r = 0; r < SIZE; r++) {
    let row = getRow(r);
    for (let i = SIZE - 1; i > 0; i--) {
      let t1 = row[i];
      let t2 = row[i - 1];
      if (t1 && t2 && t1.value === t2.value) {
        t1.value *= 2;
        t1.isMerged = true;
        addScore(t1.value);
        row[i - 1] = null;
      }
    }
    setRow(r, row);
  }
}

function mergeUp() {
  for (let c = 0; c < SIZE; c++) {
    let col = getColumn(c);
    for (let i = 0; i < SIZE - 1; i++) {
      let t1 = col[i];
      let t2 = col[i + 1];
      if (t1 && t2 && t1.value === t2.value) {
        t1.value *= 2;
        t1.isMerged = true;
        addScore(t1.value);
        col[i + 1] = null;
      }
    }
    setColumn(c, col);
  }
}

function mergeDown() {
  for (let c = 0; c < SIZE; c++) {
    let col = getColumn(c);
    for (let i = SIZE - 1; i > 0; i--) {
      let t1 = col[i];
      let t2 = col[i - 1];
      if (t1 && t2 && t1.value === t2.value) {
        t1.value *= 2;
        t1.isMerged = true;
        addScore(t1.value);
        col[i - 1] = null;
      }
    }
    setColumn(c, col);
  }
}

// ----------------------
// Checking if a move is possible
// ----------------------
function canMoveLeft() {
  let copy = copyBoard();
  slideLeftNoMerge();
  mergeLeft();
  slideLeftNoMerge();
  let changed = !boardsEqual(copy, board);
  board = copy;
  return changed;
}

function canMoveRight() {
  let copy = copyBoard();
  slideRightNoMerge();
  mergeRight();
  slideRightNoMerge();
  let changed = !boardsEqual(copy, board);
  board = copy;
  return changed;
}

function canMoveUp() {
  let copy = copyBoard();
  slideUpNoMerge();
  mergeUp();
  slideUpNoMerge();
  let changed = !boardsEqual(copy, board);
  board = copy;
  return changed;
}

function canMoveDown() {
  let copy = copyBoard();
  slideDownNoMerge();
  mergeDown();
  slideDownNoMerge();
  let changed = !boardsEqual(copy, board);
  board = copy;
  return changed;
}

// ----------------------
// Board access helpers
// ----------------------
function getRow(r) {
  return board[r].slice();
}

function setRow(r, newRow) {
  for (let c = 0; c < SIZE; c++) {
    board[r][c] = newRow[c];
    if (board[r][c]) {
      board[r][c].row = r;
      board[r][c].col = c;
    }
  }
}

function getColumn(c) {
  let col = [];
  for (let r = 0; r < SIZE; r++) {
    col.push(board[r][c]);
  }
  return col;
}

function setColumn(c, newCol) {
  for (let r = 0; r < SIZE; r++) {
    board[r][c] = newCol[r];
    if (board[r][c]) {
      board[r][c].row = r;
      board[r][c].col = c;
    }
  }
}

// ----------------------
// Copy & compare boards
// ----------------------
function copyBoard() {
  let newBoard = [];
  for (let r = 0; r < SIZE; r++) {
    newBoard[r] = [];
    for (let c = 0; c < SIZE; c++) {
      let t = board[r][c];
      if (t) {
        // clone tile
        newBoard[r][c] = {
          id: t.id,
          value: t.value,
          row: t.row,
          col: t.col,
          previousPosition: t.previousPosition ? {
            ...t.previousPosition
          } : null,
          isNew: t.isNew,
          isMerged: t.isMerged
        };
      } else {
        newBoard[r][c] = null;
      }
    }
  }
  return newBoard;
}

function boardsEqual(b1, b2) {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      let t1 = b1[r][c];
      let t2 = b2[r][c];
      if ((t1 === null) !== (t2 === null)) return false;
      if (t1 && t2) {
        if (t1.value !== t2.value) return false;
        if (t1.row !== t2.row || t1.col !== t2.col) return false;
      }
    }
  }
  return true;
}

// ----------------------
// Animation control
// ----------------------
function storePreviousPositions() {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      let tile = board[r][c];
      if (tile) {
        tile.previousPosition = {
          row: tile.row,
          col: tile.col
        };
      }
    }
  }
}

function resetMergedFlag() {
  // After each animation step, reset isMerged so the next step won't
  // keep the merge animation on the same tile.
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      let tile = board[r][c];
      if (tile) {
        tile.isMerged = false;
      }
    }
  }
}

function resetNewFlag() {
  // After the final step, new tiles are no longer new.
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      let tile = board[r][c];
      if (tile) {
        tile.isNew = false;
      }
    }
  }
}

/**
 * animateStep():
 *   1) renderBoard() to show transitions from tile.previousPosition to tile.row/col
 *   2) wait ~150ms for the slide/merge animations
 */
function animateStep() {
  renderBoard();
  return new Promise(resolve => {
    setTimeout(resolve, 150);
  });
}

// ----------------------
// Rendering the board
// ----------------------
function renderBoard() {
  const container = document.getElementById("tile-container");
  container.innerHTML = "";

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      let tile = board[r][c];
      if (tile) {
        const tileDiv = document.createElement("div");
        tileDiv.classList.add("tile");
        // Mark classes for spawn/merge animations
        if (tile.isNew) tileDiv.classList.add("tile-new");
        if (tile.isMerged) tileDiv.classList.add("tile-merged");

        // old position -> for sliding
        let oldPos = tile.previousPosition || {
          row: tile.row,
          col: tile.col
        };
        tileDiv.style.transform = `translate(${oldPos.col * 90 + 10}px, ${oldPos.row * 90 + 10}px)`;

        const inner = document.createElement("div");
        inner.classList.add("tile-inner");
        inner.textContent = tile.value;

        // background color
        inner.style.background = getTileColor(tile.value);
        // text color
        if (tile.value === 2 || tile.value === 4) {
          inner.style.color = "#776e65";
        } else {
          inner.style.color = "#fff";
        }

        tileDiv.appendChild(inner);
        container.appendChild(tileDiv);

        // Force reflow so the browser applies the initial transform
        tileDiv.offsetWidth;

        // Then set final position
        tileDiv.style.transform = `translate(${tile.col * 90 + 10}px, ${tile.row * 90 + 10}px)`;
      }
    }
  }
}

// Tile color
function getTileColor(value) {
  switch (value) {
    case 2:
      return "#EEE4DA";
    case 4:
      return "#EDE0C8";
    case 8:
      return "#F2B179";
    case 16:
      return "#F59563";
    case 32:
      return "#F67C5F";
    case 64:
      return "#F65E3B";
    case 128:
      return "#EDCF72";
    case 256:
      return "#EDCC61";
    case 512:
      return "#EDC850";
    case 1024:
      return "#EDC53F";
    case 2048:
      return "#EDC22E";
    default:
      return "#3C3A32"; // for > 2048
  }
}

// Restart button
document.getElementById("restart-btn").addEventListener("click", initGame);

// ----------------------
// On page load
// ----------------------
window.onload = initGame;