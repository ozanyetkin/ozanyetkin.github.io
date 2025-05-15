// ASCII art states for hangman (0 to 6 wrong guesses)
const hangmanPics = [
  `  +---+
      |
      |
      |
     ===`,
  `  +---+
  o   |
      |
      |
     ===`,
  `  +---+
  o   |
  |   |
      |
     ===`,
  `  +---+
  o   |
 /|   |
      |
     ===`,
  `  +---+
  o   |
 /|\\  |
      |
     ===`,
  `  +---+
  o   |
 /|\\  |
 /    |
     ===`,
  `  +---+
  o   |
 /|\\  |
 / \\  |
     ===`
];

// Word bank of 50 different inanimate objects (all lowercase)
const wordBank = [
  "chair", "table", "pencil", "bottle", "keyboard",
  "pillow", "blanket", "mirror", "camera", "television",
  "remote", "speaker", "microphone", "window", "door",
  "lamp", "phone", "cup", "spoon", "fork",
  "knife", "plate", "fridge", "cabinet", "closet",
  "desk", "clock", "carpet", "shoes", "socks",
  "basket", "scissors", "envelope", "package", "toothbrush",
  "toothpaste", "toilet", "towel", "soap", "shampoo",
  "conditioner", "hanger", "puzzle", "board", "book",
  "newspaper", "magazine", "candle", "matches", "notebook"
];

let chosenWord = "";
let revealedLetters = [];
let wrongGuesses = 0;

// Initialize the game
function initGame() {
  // Pick a random word
  chosenWord = wordBank[Math.floor(Math.random() * wordBank.length)];
  revealedLetters = Array(chosenWord.length).fill("_");
  wrongGuesses = 0;

  // Show initial ASCII
  document.getElementById("hangmanState").textContent = hangmanPics[0];
  // Show initial underscores
  document.getElementById("wordDisplay").textContent = revealedLetters.join(" ");
  // Clear message
  document.getElementById("message").textContent = "";

  // Create letter buttons (kept in same order and spacing as original)
  const lettersContainer = document.getElementById("lettersContainer");
  lettersContainer.innerHTML = "";
  for (let i = 97; i <= 122; i++) {
    const letter = String.fromCharCode(i);
    const btn = document.createElement("button");
    btn.textContent = letter;
    btn.className = "letter-btn";
    btn.onclick = () => guessLetter(letter, btn);
    lettersContainer.appendChild(btn);
  }
}

// Handle guessing a letter
function guessLetter(letter, button) {
  button.disabled = true; // Disable the button once clicked
  let correct = false;

  for (let i = 0; i < chosenWord.length; i++) {
    if (chosenWord[i] === letter) {
      revealedLetters[i] = letter;
      correct = true;
    }
  }

  if (!correct) {
    wrongGuesses++;
  }

  updateGameState();
}

// Update the ASCII art, revealed letters, and check win/loss
function updateGameState() {
  document.getElementById("hangmanState").textContent = hangmanPics[wrongGuesses];
  document.getElementById("wordDisplay").textContent = revealedLetters.join(" ");

  if (wrongGuesses === 6) {
    document.getElementById("message").textContent = `you lost! the word was: ${chosenWord}`;
    disableAllButtons();
    return;
  }

  if (!revealedLetters.includes("_")) {
    document.getElementById("message").textContent = "you win!";
    disableAllButtons();
    return;
  }
}

// Disable all letter buttons
function disableAllButtons() {
  const buttons = document.querySelectorAll(".letter-btn");
  buttons.forEach(btn => {
    btn.disabled = true;
  });
}

// Start a new game
function resetGame() {
  initGame();
}

// Automatically start on load
window.onload = initGame;