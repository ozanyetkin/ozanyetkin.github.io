window.onload = function () {
  // --- Responsive Canvas Setup ---
  function getResponsiveDimensions() {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    // Determine grid size based on screen dimensions
    let gridCols, gridRows, cell;

    if (screenWidth < 768) {
      // Mobile devices - make vertical grid to fill window better
      if (screenHeight > screenWidth) {
        // Portrait mode
        gridCols = 8;
        gridRows = 14;
        cell = Math.min(screenWidth / 10, screenHeight / 16, 35);
      } else {
        // Landscape mode
        gridCols = 12;
        gridRows = 8;
        cell = Math.min(screenWidth / 14, screenHeight / 10, 35);
      }
    } else if (screenWidth < 1024) {
      // Tablets
      gridCols = 16;
      gridRows = 10;
      cell = Math.min(screenWidth / 18, screenHeight / 12, 40);
    } else {
      // Desktop (original size)
      gridCols = 20;
      gridRows = 10;
      cell = 40;
    }

    return { gridCols, gridRows, cell };
  }

  // Get responsive dimensions
  const dimensions = getResponsiveDimensions();
  const cell = dimensions.cell;
  const gridCols = dimensions.gridCols;
  const gridRows = dimensions.gridRows;

  // Scale other elements proportionally
  const scaleFactor = cell / 40; // 40 was the original cell size

  // Extra margin to account for displacement and scaling.
  const gridCircleRadius = Math.max(4, 8 * scaleFactor);
  const gridPulseAmplitude = 1.2; // max scale = 1 + 1.2 = 2.2
  const gridShiftDistance = Math.max(20, 40 * scaleFactor);
  const extraMargin = gridShiftDistance + gridCircleRadius * (1 + gridPulseAmplitude);

  const canvasWidth = gridCols * cell + 2 * extraMargin;
  const canvasHeight = gridRows * cell + 2 * extraMargin;

  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");

  // Set high DPI resolution for crisp display
  const dpr = window.devicePixelRatio || 1;
  const displayWidth = Math.min(canvasWidth, window.innerWidth);
  const displayHeight = Math.min(canvasHeight, window.innerHeight);

  // Set actual canvas size (high resolution)
  canvas.width = canvasWidth * dpr;
  canvas.height = canvasHeight * dpr;

  // Set display size (CSS pixels)
  canvas.style.width = displayWidth + 'px';
  canvas.style.height = displayHeight + 'px';

  // Scale context to ensure correct drawing operations
  ctx.scale(dpr, dpr);

  // --- Grid Parameters ---
  // No extra margins inside the grid; we use extraMargin as offset.
  const marginX = extraMargin,
    marginY = extraMargin;
  const cellW = cell,
    cellH = cell;

  // Build grid: each circle is centered in its cell.
  let gridCircles = [];
  for (let row = 0; row < gridRows; row++) {
    for (let col = 0; col < gridCols; col++) {
      let x = marginX + col * cellW + cellW / 2;
      let y = marginY + row * cellH + cellH / 2;
      gridCircles.push({
        x,
        y
      });
    }
  }

  // --- Pulse–Dot (Red Circle) Parameters ---
  const coloredColor = "#ff4b4b";
  const baseColoredRadius = Math.max(6, 12 * scaleFactor);
  const redPulseAmplitude = 0.8;
  const pulseDuration = 1.6; // seconds

  // --- Grid Pulse Additional Parameters ---
  const brightnessAdd = 60; // additional brightness (base gray is 136)

  // --- Movement & Cycle Timing ---
  const movementDuration = 0.3; // seconds to move the red circle between grid centers
  const waitDuration = 0; // no extra pause between cycles
  const waveSpeed = 687.5 * scaleFactor;

  // --- Displacement Threshold ---
  // Grid circles very near the pulse center (within this threshold) are not shifted.
  const displacementThreshold = Math.max(10, 20 * scaleFactor);

  // --- Global State ---
  // States: "moving" → "pulsing" → "waiting" → repeat.
  let state = "waiting";
  // Start red circle from the center of grid (taking margin into account)
  let currentPos = {
    x: canvasWidth / 2,
    y: canvasHeight / 2
  };
  let targetPos = getRandomGridPosition();
  let oldPos = {
    x: currentPos.x,
    y: currentPos.y
  };
  let moveStartTime = 0,
    pulseStartTime = 0,
    pulseTotalDuration = 0,
    waitStartTime = 0;
  let maxPulseDistance = 0;

  // Touch interaction queue
  let touchQueue = [];
  let isRandomMode = true; // Start with random mode

  startNewCycle();

  // --- Utility Functions ---

  // Returns a random grid circle center.
  function getRandomGridPosition() {
    const index = Math.floor(Math.random() * gridCircles.length);
    return {
      x: gridCircles[index].x,
      y: gridCircles[index].y
    };
  }

  // Easing: easeInOutQuad.
  function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  /* Unified pulse factor function.
     This function runs over the interval [0, pulseDuration] and returns a pulse factor based on eased timing:
       - For t in [0, T1] (T1 = 0.15 * duration): the factor decreases from 0 down to -1 (causing the red circle to shrink).
       - For t in [T1, T2] (T2 = 0.40 * duration): the factor transitions from -1 up to +1 (causing the red circle to grow).
       - For t in [T2, duration]: the factor decays from +1 back to 0 (with easing).
     (Note: For grid circles, Math.max(0, factor) is used so that they only exhibit growth.)
  */
  function unifiedPulseFactor(t, duration) {
    const T1 = 0.15 * duration;
    const T2 = 0.40 * duration;
    if (t < 0) return 0;
    if (t <= T1) {
      return -easeInOutQuad(t / T1);
    } else if (t <= T2) {
      return -1 + 2 * easeInOutQuad((t - T1) / (T2 - T1));
    } else if (t <= duration) {
      return 1 - easeInOutQuad((t - T2) / (duration - T2));
    } else {
      return 0;
    }
  }

  // --- Cycle Control ---
  function startNewCycle() {
    oldPos = {
      x: currentPos.x,
      y: currentPos.y
    };

    // Check if there are queued touch targets
    if (touchQueue.length > 0) {
      targetPos = touchQueue.shift();
      isRandomMode = false;
    } else {
      // Return to random mode if no queued touches
      targetPos = getRandomGridPosition();
      isRandomMode = true;
    }

    moveStartTime = performance.now() / 1000;
    state = "moving";
  }

  // --- Main Draw Loop ---
  function draw() {
    const now = performance.now() / 1000;
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // --- State Machine ---
    if (state === "moving") {
      let elapsed = now - moveStartTime;
      let progress = Math.min(elapsed / movementDuration, 1);
      let easedProgress = easeInOutQuad(progress);
      currentPos = {
        x: oldPos.x + (targetPos.x - oldPos.x) * easedProgress,
        y: oldPos.y + (targetPos.y - oldPos.y) * easedProgress
      };
      if (progress >= 1) {
        pulseStartTime = now;
        // Determine maximum distance from pulse center to any grid circle.
        let maxDistance = 0;
        gridCircles.forEach(circle => {
          let dx = circle.x - currentPos.x,
            dy = circle.y - currentPos.y;
          let d = Math.hypot(dx, dy);
          if (d > maxDistance) maxDistance = d;
        });
        maxPulseDistance = maxDistance;
        // To ensure even the farthest circle gets a full pulse, we add the propagation delay.
        let maxDelay = maxDistance / waveSpeed;
        pulseTotalDuration = Math.max(pulseDuration, maxDelay + pulseDuration);
        state = "pulsing";
      }
    } else if (state === "pulsing") {
      if (now - pulseStartTime > pulseTotalDuration) {
        waitStartTime = now;
        state = "waiting";
      }
    } else if (state === "waiting") {
      if (now - waitStartTime > waitDuration) {
        startNewCycle();
      }
    }

    // --- Compute Global Pulse Time ---
    let tPulse = now - pulseStartTime;

    // --- Draw the Red (Pulse–Dot) Circle ---
    // (No delay for the red circle.)
    let redFactor = tPulse < pulseDuration ? unifiedPulseFactor(tPulse, pulseDuration) : 0;
    let redScale = 1.5 * (1 + redPulseAmplitude * redFactor);
    ctx.beginPath();
    ctx.arc(currentPos.x, currentPos.y, baseColoredRadius * redScale, 0, Math.PI * 2);
    ctx.fillStyle = coloredColor;
    ctx.fill();

    // --- Draw the Grid Circles ---
    gridCircles.forEach(circle => {
      let gridScale = 1;
      let gridFill = "rgb(100,100,100)";
      let drawX = circle.x;
      let drawY = circle.y;

      // Each grid circle’s pulse is delayed by its distance from the red circle.
      let dx = circle.x - currentPos.x,
        dy = circle.y - currentPos.y;
      let delay = Math.hypot(dx, dy) / waveSpeed;
      let localTime = tPulse - delay;
      if (localTime >= 0 && localTime <= pulseDuration) {
        // For grid circles, we use only the positive portion (they never shrink).
        let factor = Math.max(0, unifiedPulseFactor(localTime, pulseDuration));
        // Attenuate growth based on distance (closer circles grow more).
        let d = Math.hypot(dx, dy);
        let distanceFactor = maxPulseDistance > 0 ?
          0.2 + 0.8 * ((maxPulseDistance - d) / maxPulseDistance) :
          1;
        gridScale = 1 + gridPulseAmplitude * factor * distanceFactor;
        // Brighten the circle.
        let brightness = Math.floor(100 + brightnessAdd * factor * distanceFactor);
        gridFill = `rgb(${brightness}, ${brightness}, ${brightness})`;
        // Compute displacement: only circles beyond a threshold are shifted,
        // and farther circles are shifted more.
        let effectiveDisplacementFactor = (d > displacementThreshold && maxPulseDistance > displacementThreshold) ?
          (d - displacementThreshold) / (maxPulseDistance - displacementThreshold) :
          0;
        const shift = gridShiftDistance * factor * effectiveDisplacementFactor;
        if (d !== 0) {
          drawX = circle.x + (dx / d) * shift;
          drawY = circle.y + (dy / d) * shift;
        }
      }

      ctx.beginPath();
      ctx.arc(drawX, drawY, gridCircleRadius * gridScale, 0, Math.PI * 2);
      ctx.fillStyle = gridFill;
      ctx.fill();
    });

    requestAnimationFrame(draw);
  }

  draw();

  // --- Touch and Click Interaction ---
  function handleInteraction(event) {
    event.preventDefault();

    let clientX, clientY;
    if (event.type.startsWith('touch')) {
      if (event.touches.length === 0) return;
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }

    // Get canvas bounds
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvasWidth / rect.width;
    const scaleY = canvasHeight / rect.height;

    // Convert to canvas coordinates
    const canvasX = (clientX - rect.left) * scaleX;
    const canvasY = (clientY - rect.top) * scaleY;

    // Find the nearest grid position
    let nearestGrid = null;
    let minDistance = Infinity;

    gridCircles.forEach(circle => {
      const distance = Math.hypot(circle.x - canvasX, circle.y - canvasY);
      if (distance < minDistance) {
        minDistance = distance;
        nearestGrid = { x: circle.x, y: circle.y };
      }
    });

    if (nearestGrid) {
      // Add to queue instead of interrupting current animation
      // Limit queue size to prevent too many queued touches
      if (touchQueue.length < 3) {
        touchQueue.push(nearestGrid);
      }

      // If we're in waiting state, start the cycle immediately
      if (state === "waiting") {
        startNewCycle();
      }
    }
  }

  // Add event listeners for both mouse and touch
  canvas.addEventListener('click', handleInteraction);
  canvas.addEventListener('touchstart', handleInteraction);
  canvas.addEventListener('touchmove', function (e) { e.preventDefault(); }); // Prevent scrolling
  canvas.addEventListener('touchend', function (e) { e.preventDefault(); });

  // --- Resize Handler ---
  function handleResize() {
    // Debounce resize events
    clearTimeout(window.resizeTimeout);
    window.resizeTimeout = setTimeout(() => {
      // Maintain high DPI resolution
      const dpr = window.devicePixelRatio || 1;
      const displayWidth = Math.min(canvasWidth, window.innerWidth);
      const displayHeight = Math.min(canvasHeight, window.innerHeight);

      // Update canvas resolution
      canvas.width = canvasWidth * dpr;
      canvas.height = canvasHeight * dpr;

      // Update display size
      canvas.style.width = displayWidth + 'px';
      canvas.style.height = displayHeight + 'px';

      // Rescale context
      ctx.scale(dpr, dpr);
    }, 100);
  }

  window.addEventListener('resize', handleResize);
  window.addEventListener('orientationchange', handleResize);
};