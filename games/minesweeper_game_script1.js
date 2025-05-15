(function() {
  // Board size and mine count settings
  const boardSize = 9;
  const totalMines = 10;
  let board = [];
  let gameOver = false;
  let revealedCount = 0;
  let started = false;
  let timer = 0;
  let timerInterval = null;

  // DOM elements
  const boardElement = document.getElementById('board');
  const mineCountElement = document.getElementById('mineCount');
  const timeElement = document.getElementById('time');
  const titleElement = document.getElementById('title');
  const faceElement = document.getElementById('face');

  // Click on face resets the game
  faceElement.addEventListener('click', initGame);

  // Initialize game on page load
  initGame();

  // Update the displayed mine count (remaining mines = total mines - flagged count)
  function updateMineCount() {
    let flaggedCount = 0;
    for (let r = 0; r < boardSize; r++) {
      for (let c = 0; c < boardSize; c++) {
        if (board[r][c].flagged) flaggedCount++;
      }
    }
    mineCountElement.textContent = totalMines - flaggedCount;
  }

  // Initialize the game state
  function initGame() {
    stopTimer();
    titleElement.textContent = "minesweeper";
    faceElement.textContent = ":)";
    board = [];
    gameOver = false;
    revealedCount = 0;
    started = false;
    timer = 0;

    // Reset scoreboard
    timeElement.textContent = "0";
    mineCountElement.textContent = totalMines;

    // Clear board UI
    boardElement.innerHTML = "";
    boardElement.classList.remove('game-over');

    // Build empty board data
    for (let r = 0; r < boardSize; r++) {
      board[r] = [];
      for (let c = 0; c < boardSize; c++) {
        board[r][c] = {
          mine: false,
          adjacent: 0,
          revealed: false,
          flagged: false,
          lastClickedMine: false, // track if this cell was the last clicked mine
          row: r,
          col: c
        };
      }
    }

    // Randomly place mines
    let positions = [];
    for (let i = 0; i < boardSize * boardSize; i++) {
      positions.push(i);
    }
    shuffleArray(positions);
    for (let i = 0; i < totalMines; i++) {
      let pos = positions[i];
      let r = Math.floor(pos / boardSize);
      let c = pos % boardSize;
      board[r][c].mine = true;
    }

    // Calculate adjacency counts
    for (let r = 0; r < boardSize; r++) {
      for (let c = 0; c < boardSize; c++) {
        if (!board[r][c].mine) {
          board[r][c].adjacent = countMinesAround(r, c);
        }
      }
    }

    // Create cells in the UI
    for (let r = 0; r < boardSize; r++) {
      for (let c = 0; c < boardSize; c++) {
        const cellDiv = document.createElement('div');
        cellDiv.classList.add('cell');
        cellDiv.setAttribute('data-row', r);
        cellDiv.setAttribute('data-col', c);

        // Left-click (mouse down/up/click)
        cellDiv.addEventListener('mousedown', onCellMouseDown);
        cellDiv.addEventListener('mouseup', onCellMouseUp);
        cellDiv.addEventListener('click', onCellLeftClick);

        // Right-click for flag
        cellDiv.addEventListener('contextmenu', onCellRightClick);

        boardElement.appendChild(cellDiv);
      }
    }
  }

  // Show surprised face when left mouse is pressed (but not if game is over)
  function onCellMouseDown(e) {
    if (!gameOver && e.button === 0) {
      const row = parseInt(e.target.getAttribute('data-row'));
      const col = parseInt(e.target.getAttribute('data-col'));
      const cell = board[row][col];
      // Only if not revealed or flagged
      if (!cell.revealed && !cell.flagged) {
        faceElement.textContent = ":o";
      }
    }
  }

  // Return to smiling if user releases mouse without hitting a mine
  function onCellMouseUp(e) {
    if (!gameOver && e.button === 0) {
      const row = parseInt(e.target.getAttribute('data-row'));
      const col = parseInt(e.target.getAttribute('data-col'));
      const cell = board[row][col];
      // Only if not revealed or flagged
      if (!cell.revealed && !cell.flagged) {
        faceElement.textContent = ":)";
      }
    }
  }

  // Handle left click on a cell
  function onCellLeftClick(e) {
    if (gameOver) return;
    const row = parseInt(e.target.getAttribute('data-row'));
    const col = parseInt(e.target.getAttribute('data-col'));

    if (!started) {
      started = true;
      startTimer();
    }
    revealCell(row, col);
  }

  // Handle right click on a cell (flagging)
  function onCellRightClick(e) {
    e.preventDefault();
    if (gameOver) return;
    const row = parseInt(e.target.getAttribute('data-row'));
    const col = parseInt(e.target.getAttribute('data-col'));

    const cellData = board[row][col];
    if (!cellData.revealed) {
      cellData.flagged = !cellData.flagged;
      updateCellUI(row, col);
      updateMineCount();
    }
  }

  // Reveal a cell (and its neighbors if no adjacent mines)
  function revealCell(r, c) {
    const cell = board[r][c];
    if (cell.revealed || cell.flagged) return;

    cell.revealed = true;
    updateCellUI(r, c);
    revealedCount++;

    if (cell.mine) {
      // Game over when a mine is revealed
      gameOver = true;
      cell.lastClickedMine = true; // mark as last clicked mine
      updateCellUI(r, c); // apply the red highlight
      stopTimer();
      titleElement.textContent = "game over!";
      faceElement.textContent = "x(";
      revealAllMines();
      return;
    }

    // Auto-reveal neighbors if there are no adjacent mines
    if (cell.adjacent === 0) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          let nr = r + dr;
          let nc = c + dc;
          if (isValid(nr, nc)) {
            revealCell(nr, nc);
          }
        }
      }
    }

    // Check if all safe cells have been revealed
    if (revealedCount === boardSize * boardSize - totalMines) {
      gameOver = true;
      stopTimer();
      titleElement.textContent = "you win!";
    }
  }

  // Reveal all mines and mark wrong flags on game over
  function revealAllMines() {
    for (let r = 0; r < boardSize; r++) {
      for (let c = 0; c < boardSize; c++) {
        const cellData = board[r][c];
        const cellDiv = boardElement.children[r * boardSize + c];
        // For mines: reveal only if not flagged so flagged mines remain as flag
        if (cellData.mine) {
          if (!cellData.flagged) {
            cellData.revealed = true;
            updateCellUI(r, c);
          }
        } else {
          // For non-mine cells, if flagged then mark as wrong flag
          if (cellData.flagged) {
            cellDiv.classList.add('wrongFlag');
          }
        }
      }
    }
    // Disable hover/pushdown for all cells after game over
    boardElement.classList.add('game-over');
  }

  // Update cell appearance based on state
  function updateCellUI(r, c) {
    const cellDiv = boardElement.children[r * boardSize + c];
    const cellData = board[r][c];

    // Remove all dynamic classes
    for (let i = 1; i <= 8; i++) {
      cellDiv.classList.remove('num' + i);
    }
    cellDiv.classList.remove('flagged', 'revealed', 'wrongFlag', 'lastClickedMine');
    cellDiv.textContent = "";

    if (cellData.revealed) {
      cellDiv.classList.add('revealed');
      if (cellData.mine) {
        // Display mine icon and enlarge it
        cellDiv.textContent = "⬤";
        cellDiv.style.fontSize = "24px";
      } else if (cellData.adjacent > 0) {
        // Show number with bigger, bolder font
        cellDiv.textContent = cellData.adjacent;
        cellDiv.classList.add('num' + cellData.adjacent);
        cellDiv.style.fontSize = "var(--number-font-size)";
        cellDiv.style.fontWeight = "var(--number-font-weight)";
      } else {
        cellDiv.style.fontSize = "var(--number-font-size)";
      }
    } else {
      // For unrevealed cells, set default number font size
      cellDiv.style.fontSize = "var(--number-font-size)";
      if (cellData.flagged) {
        cellDiv.classList.add('flagged');
      }
    }

    // If this cell was the last clicked mine, highlight it in red
    if (cellData.lastClickedMine) {
      cellDiv.classList.add('lastClickedMine');
    }
  }

  // Count mines around a cell
  function countMinesAround(r, c) {
    let count = 0;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        let nr = r + dr;
        let nc = c + dc;
        if (isValid(nr, nc) && board[nr][nc].mine) {
          count++;
        }
      }
    }
    return count;
  }

  // Check board bounds
  function isValid(r, c) {
    return r >= 0 && r < boardSize && c >= 0 && c < boardSize;
  }

  // Shuffle array in-place using Fisher-Yates shuffle
  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  // Start the game timer
  function startTimer() {
    timerInterval = setInterval(() => {
      timer++;
      timeElement.textContent = timer;
    }, 1000);
  }

  // Stop the game timer
  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }
})();