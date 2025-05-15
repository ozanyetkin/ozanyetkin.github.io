// Game variables initialization
let score = 0;
let timeLeft = 30;
let holes = new Array(9).fill(null);
let bestScore = localStorage.getItem('bestScore') ? parseInt(localStorage.getItem('bestScore')) : 0;

// Timer variables for spawning occupants and countdown
let spawnTimeout = null;
let gameInterval = null;

// Define mole types with increased height; these are the moles (non-bomb occupants)
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

  // Create the occupant element and set its appearance
  const occupantElem = document.createElement("div");
  occupantElem.classList.add("occupant");
  occupantElem.style.backgroundColor = occupant.color;
  occupantElem.style.width = occupant.width + "px";
  occupantElem.style.height = occupant.height + "px";

  // Adjust styling for bomb or mole: bomb is circular; mole is pill-shaped
  if (occupant.isBomb) {
    occupantElem.style.borderRadius = "50%";
    occupantElem.style.bottom = "20px";
  } else {
    occupantElem.style.borderRadius = occupant.height / 2 + "px";
    occupantElem.style.bottom = "-20px";
  }

  // Add click event: update score based on occupant and remove it when hit
  occupantElem.addEventListener("click", () => {
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
  document.getElementById("startBtn").addEventListener("click", startGame);
  document.getElementById("playAgainBtn").addEventListener("click", startGame);
};