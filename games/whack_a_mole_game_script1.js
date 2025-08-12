// Game variables initialization
let score = 0;
let timeLeft = 30;
let holes = new Array(9).fill(null);
let bestScore = localStorage.getItem('bestScore') ? parseInt(localStorage.getItem('bestScore')) : 0;

// Timer variables for spawning occupants and countdown
let spawnTimeout = null;
let gameInterval = null;

// Mobile detection and touch support
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 'ontouchstart' in window;

// Define mole types with responsive sizing
const moleTypes = [{
  color: "#77dd77",
  points: 10,
  isBomb: false,
  width: 50,
  height: 100
}, {
  color: "#aec6cf",
  points: 20,
  isBomb: false,
  width: 50,
  height: 100
}, {
  color: "#ffb347",
  points: 30,
  isBomb: false,
  width: 50,
  height: 100
}, {
  color: "#cdb4db",
  points: 40,
  isBomb: false,
  width: 50,
  height: 100
}];
// Define bomb type with negative points
const bombType = {
  color: "#ff6961",
  points: -100,
  isBomb: true,
  width: 50,
  height: 50
};

// Function to get responsive sizing based on screen width
function getResponsiveSize() {
  const width = window.innerWidth;
  if (width <= 480) {
    return {
      moleWidth: 30,
      moleHeight: 50,
      bombWidth: 30,
      bombHeight: 30,
      moleBottom: -10,
      bombBottom: 5
    };
  } else if (width <= 768) {
    return {
      moleWidth: 35,
      moleHeight: 60,
      bombWidth: 35,
      bombHeight: 35,
      moleBottom: -15,
      bombBottom: 8
    };
  } else {
    return {
      moleWidth: 50,
      moleHeight: 80,
      bombWidth: 50,
      bombHeight: 50,
      moleBottom: -20,
      bombBottom: 15
    };
  }
}

// Enhanced click/touch handler for better mobile support
function addClickHandler(element, callback) {
  if (isMobile) {
    let touchStarted = false;

    element.addEventListener('touchstart', function (e) {
      e.preventDefault();
      e.stopPropagation();
      touchStarted = true;
      // Remove the scaling effect that was causing sliding
    }, { passive: false });

    element.addEventListener('touchend', function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (touchStarted) {
        callback();
        touchStarted = false;
      }
    }, { passive: false });

    element.addEventListener('touchcancel', function (e) {
      e.preventDefault();
      e.stopPropagation();
      touchStarted = false;
    }, { passive: false });
  } else {
    element.addEventListener('click', callback);
  }
}

// Show start overlay (intro screen)
function showStartOverlay() {
  document.getElementById("startOverlay").style.display = "block";
  document.getElementById("endOverlay").style.display = "none";
  document.getElementById("overlay").classList.remove("hidden");
}
// Show end overlay (game over screen)
function showEndOverlay() {
  document.getElementById("startOverlay").style.display = "none";
  document.getElementById("endOverlay").style.display = "block";
  document.getElementById("overlay").classList.remove("hidden");
}
// Hide overlay to reveal the game area
function hideOverlay() {
  document.getElementById("overlay").classList.add("hidden");
}

// Spawn an occupant (mole or bomb) in a random empty hole
function spawnOccupant() {
  // Collect indices of empty holes
  const emptyHoles = [];
  holes.forEach((val, idx) => {
    if (!val) emptyHoles.push(idx);
  });
  // Do nothing if there are no empty holes
  if (emptyHoles.length === 0) return;

  // Select a random empty hole
  const holeIndex = emptyHoles[Math.floor(Math.random() * emptyHoles.length)];
  const holeElem = document.querySelector(`.hole[data-index='${holeIndex}']`);

  // Randomly decide between bomb (20% chance) and mole (80% chance)
  let occupant;
  if (Math.random() < 0.2) {
    occupant = bombType;
  } else {
    occupant = moleTypes[Math.floor(Math.random() * moleTypes.length)];
  }

  // Get responsive sizing
  const sizes = getResponsiveSize();

  // Create the occupant element and set its appearance
  const occupantElem = document.createElement("div");
  occupantElem.classList.add("occupant");
  occupantElem.style.backgroundColor = occupant.color;

  // Apply responsive sizing
  if (occupant.isBomb) {
    occupantElem.style.width = sizes.bombWidth + "px";
    occupantElem.style.height = sizes.bombHeight + "px";
    occupantElem.style.borderRadius = "50%";
    occupantElem.style.bottom = sizes.bombBottom + "px";
  } else {
    occupantElem.style.width = sizes.moleWidth + "px";
    occupantElem.style.height = sizes.moleHeight + "px";
    occupantElem.style.borderRadius = sizes.moleHeight / 2 + "px";
    occupantElem.style.bottom = sizes.moleBottom + "px";
  }

  // Add enhanced click/touch handler
  addClickHandler(occupantElem, () => {
    score += occupant.points;
    document.getElementById("score").textContent = score;
    removeOccupant(holeIndex, occupantElem);
  });

  // Append occupant to the chosen hole and mark it as occupied
  holeElem.appendChild(occupantElem);
  holes[holeIndex] = occupantElem;
  occupantElem.offsetWidth; // Force reflow for animation
  occupantElem.classList.add("appear");

  // Randomize occupant duration (700ms to ~1500ms) then remove if still present
  const occupantDuration = 700 + Math.random() * 800;
  setTimeout(() => {
    if (holes[holeIndex] === occupantElem) {
      removeOccupant(holeIndex, occupantElem);
    }
  }, occupantDuration);
}

// Remove occupant from the hole and update the holes array
function removeOccupant(holeIndex, occupantElem) {
  occupantElem.classList.remove("appear");
  setTimeout(() => {
    occupantElem.remove();
  }, 200);
  holes[holeIndex] = null;
}

// Schedule the next occupant spawn after a random delay (between 500ms and 2000ms)
function scheduleNextSpawn() {
  if (timeLeft <= 0) return; // Do not schedule new spawns if time is up
  const randomDelay = 500 + Math.random() * 1500;
  spawnTimeout = setTimeout(() => {
    spawnOccupant();
    scheduleNextSpawn();
  }, randomDelay);
}

// Start the game: reset game state, update display, hide overlay, and begin timer and spawns
function startGame() {
  clearTimeout(spawnTimeout);
  clearInterval(gameInterval);
  score = 0;
  timeLeft = 30;
  holes = new Array(9).fill(null);
  document.getElementById("score").textContent = score;
  document.getElementById("bestScore").textContent = bestScore;
  document.getElementById("time").textContent = timeLeft;

  hideOverlay();
  scheduleNextSpawn();
  // Countdown timer: update every second and check for game end
  gameInterval = setInterval(() => {
    timeLeft--;
    document.getElementById("time").textContent = timeLeft;
    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);
}

// End the game: stop timers, remove any remaining occupants, update best score, and show game over overlay
function endGame() {
  clearTimeout(spawnTimeout);
  clearInterval(gameInterval);
  holes.forEach((occupantElem, idx) => {
    if (occupantElem) occupantElem.remove();
    holes[idx] = null;
  });
  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem('bestScore', bestScore.toString());
  }
  document.getElementById("finalScore").textContent = score;
  showEndOverlay();
}

// On window load, display the start overlay and set up button click event listeners
window.onload = () => {
  showStartOverlay();

  // Add enhanced click handlers for buttons
  addClickHandler(document.getElementById("startBtn"), startGame);
  addClickHandler(document.getElementById("playAgainBtn"), startGame);

  // Prevent default touch behavior on the body to avoid scrolling
  if (isMobile) {
    document.body.addEventListener('touchmove', function (e) {
      e.preventDefault();
    }, { passive: false });

    // Prevent zoom on double tap
    document.body.addEventListener('touchstart', function (e) {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    }, { passive: false });

    let lastTouchEnd = 0;
    document.body.addEventListener('touchend', function (e) {
      const now = (new Date()).getTime();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    }, false);
  }

  // Handle orientation changes
  window.addEventListener('orientationchange', function () {
    setTimeout(function () {
      // Force recalculation of responsive sizes
      if (holes.some(hole => hole !== null)) {
        // If game is running, update existing occupants
        holes.forEach((occupantElem, idx) => {
          if (occupantElem) {
            const sizes = getResponsiveSize();
            const isBomb = occupantElem.style.borderRadius === "50%";
            if (isBomb) {
              occupantElem.style.width = sizes.bombWidth + "px";
              occupantElem.style.height = sizes.bombHeight + "px";
              occupantElem.style.bottom = sizes.bombBottom + "px";
            } else {
              occupantElem.style.width = sizes.moleWidth + "px";
              occupantElem.style.height = sizes.moleHeight + "px";
              occupantElem.style.borderRadius = sizes.moleHeight / 2 + "px";
              occupantElem.style.bottom = sizes.moleBottom + "px";
            }
          }
        });
      }
    }, 100);
  });
};