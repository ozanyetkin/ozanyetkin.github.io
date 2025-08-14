/*
  Three-stop gradient:
    0%   -> Space Cadet (#1D2951)
    50%  -> Coral (#FF7F50)
    100% -> Cardinal (#C41E3A)
*/

const spaceCadet = {
  r: 29,
  g: 41,
  b: 81
};
const coral = {
  r: 255,
  g: 127,
  b: 80
};
const cardinal = {
  r: 196,
  g: 30,
  b: 58
};

/** Linear interpolation for colors */
function lerpColor(colorA, colorB, fraction) {
  const r = Math.round(colorA.r + fraction * (colorB.r - colorA.r));
  const g = Math.round(colorA.g + fraction * (colorB.g - colorA.g));
  const b = Math.round(colorA.b + fraction * (colorB.b - colorA.b));
  return `rgb(${r}, ${g}, ${b})`;
}

/** Computes interpolated color for a given value (0..100) */
function interpolateColor(value) {
  return value <= 50 ?
    lerpColor(spaceCadet, coral, value / 50) :
    lerpColor(coral, cardinal, (value - 50) / 50);
}

// Mobile detection
function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0;
}

/** Creates a heatmap table */
function createTable(numRows, numCols) {
  const table = document.getElementById("heatmap");

  // Header row
  const headerRow = table.insertRow();
  // Top-left corner cell
  const cornerCell = headerRow.insertCell();
  cornerCell.classList.add('corner-cell', 'header-cell');

  // Column headers: A, B, C, etc.
  for (let c = 1; c <= numCols; c++) {
    const cell = headerRow.insertCell();
    cell.textContent = String.fromCharCode(64 + c); // 'A' = 65 in ASCII
    cell.classList.add('header-cell');
  }

  // Data rows
  for (let r = 1; r <= numRows; r++) {
    const row = table.insertRow();

    // Left column header (row number)
    const rowHeaderCell = row.insertCell();
    rowHeaderCell.textContent = r;
    rowHeaderCell.classList.add('header-cell', 'row-number-cell');

    // Data cells
    for (let c = 1; c <= numCols; c++) {
      const cell = row.insertCell();

      // Initialize random value [0..100]
      let value = Math.floor(Math.random() * 101);
      cell.dataset.value = value;
      cell.textContent = value;
      cell.style.backgroundColor = interpolateColor(value);

      // Handle mouse wheel event for desktop
      if (!isMobile()) {
        cell.addEventListener("wheel", function (e) {
          e.preventDefault(); // Prevent page scrolling
          let currentValue = parseInt(cell.dataset.value, 10);
          currentValue = Math.max(0, Math.min(100, currentValue + (e.deltaY < 0 ? 1 : -1)));
          cell.dataset.value = currentValue;
          cell.textContent = currentValue;
          cell.style.backgroundColor = interpolateColor(currentValue);
        });
      }

      // Desktop mouse events
      if (!isMobile()) {
        cell.addEventListener("mousedown", function (e) {
          e.preventDefault(); // Prevent text selection
          if (!cell.classList.contains('header-cell')) {
            activeCell = cell;
            startY = e.clientY;
            startVal = parseInt(cell.dataset.value, 10);
            dragging = false;
          }
        });
      }

      // Touch events for mobile
      if (isMobile()) {
        let touchStartTime = 0;
        let touchStartY = 0;
        let longPressTimer = null;

        cell.addEventListener("touchstart", function (e) {
          if (cell.classList.contains('header-cell')) return;

          e.preventDefault();
          touchStartTime = Date.now();
          touchStartY = e.touches[0].clientY;
          activeCell = cell;
          startY = e.touches[0].clientY;
          startVal = parseInt(cell.dataset.value, 10);
          dragging = false;

          // Set up long press timer for editing
          longPressTimer = setTimeout(() => {
            if (!dragging) {
              enableEditing(cell);
            }
          }, 500); // 500ms long press
        });

        cell.addEventListener("touchmove", function (e) {
          if (!activeCell || cell.classList.contains('header-cell')) return;

          e.preventDefault();
          clearTimeout(longPressTimer);

          const diff = e.touches[0].clientY - startY;
          if (Math.abs(diff) > 10) { // Increased threshold for touch
            dragging = true;
            // For every ~15px dragged, adjust the value by 1 (more forgiving for touch)
            let offset = Math.floor((startY - e.touches[0].clientY) / 15);
            let newVal = Math.max(0, Math.min(100, startVal + offset));
            activeCell.dataset.value = newVal;
            activeCell.textContent = newVal;
            activeCell.style.backgroundColor = interpolateColor(newVal);
          }
        });

        cell.addEventListener("touchend", function (e) {
          clearTimeout(longPressTimer);

          if (activeCell && !dragging) {
            const touchDuration = Date.now() - touchStartTime;
            if (touchDuration < 200) { // Quick tap - increment value
              let currentValue = parseInt(cell.dataset.value, 10);
              currentValue = Math.min(100, currentValue + 5); // Increment by 5 on tap
              cell.dataset.value = currentValue;
              cell.textContent = currentValue;
              cell.style.backgroundColor = interpolateColor(currentValue);
            }
          }

          activeCell = null;
          dragging = false;
        });

        // Double tap to edit
        let lastTap = 0;
        cell.addEventListener("touchend", function (e) {
          if (cell.classList.contains('header-cell')) return;

          const currentTime = new Date().getTime();
          const tapLength = currentTime - lastTap;
          if (tapLength < 500 && tapLength > 0) {
            enableEditing(cell);
          }
          lastTap = currentTime;
        });
      }

      // Finish typing a value on blur
      cell.addEventListener("blur", function () {
        cell.contentEditable = false;
        let typedValue = parseInt(cell.textContent, 10) || 0;
        typedValue = Math.max(0, Math.min(100, typedValue));
        cell.dataset.value = typedValue;
        cell.textContent = typedValue;
        cell.style.backgroundColor = interpolateColor(typedValue);
      });

      // Pressing Enter finishes editing
      cell.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          cell.blur();
        }
      });
    }
  }
}

// Function to enable editing mode
function enableEditing(cell) {
  cell.contentEditable = true;
  cell.focus();
  // Place cursor at the end of the cell
  const range = document.createRange();
  range.selectNodeContents(cell);
  range.collapse(false);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

// Drag interaction logic
let activeCell = null;
let startY = 0;
let startVal = 0;
let dragging = false;
const threshold = 5;

// Mouse move: if we are dragging a cell, update its value based on vertical movement (desktop only)
if (!isMobile()) {
  document.addEventListener("mousemove", function (e) {
    if (activeCell) {
      const diff = e.clientY - startY;
      if (Math.abs(diff) > threshold) {
        dragging = true;
        // For every ~10px dragged, adjust the value by 1
        let offset = Math.floor((startY - e.clientY) / 10);
        let newVal = Math.max(0, Math.min(100, startVal + offset));
        activeCell.dataset.value = newVal;
        activeCell.textContent = newVal;
        activeCell.style.backgroundColor = interpolateColor(newVal);
      }
      e.preventDefault();
    }
  });

  // Mouse up: if it was not a drag, treat it as a click => make cell editable
  document.addEventListener("mouseup", function () {
    if (activeCell) {
      if (!dragging) {
        enableEditing(activeCell);
      }
      // Reset
      activeCell = null;
      dragging = false;
    }
  });
}

// Prevent context menu on long press for mobile
document.addEventListener("contextmenu", function (e) {
  if (isMobile()) {
    e.preventDefault();
  }
});

// Create a table with better spacing
createTable(10, 5);