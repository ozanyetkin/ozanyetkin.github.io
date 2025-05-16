window.onload = function() {
  // --- Canvas Setup ---
  // Use a fixed cell size so that the grid is 20x10 with each cell 40px:
  const cell = 40;
  const gridCols = 20,
    gridRows = 10;
  // Extra margin to account for displacement and scaling.
  // Margin = gridShiftDistance + maximum radius of grid circles.
  const gridCircleRadius = 8;
  const gridPulseAmplitude = 1.2; // max scale = 1 + 1.2 = 2.2
  const gridShiftDistance = 40;
  const extraMargin = gridShiftDistance + gridCircleRadius * (1 + gridPulseAmplitude);

  const canvasWidth = gridCols * cell + 2 * extraMargin;
  const canvasHeight = gridRows * cell + 2 * extraMargin;

  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

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
  const baseColoredRadius = 12;
  const redPulseAmplitude = 0.8;
  const pulseDuration = 1.6; // seconds

  // --- Grid Pulse Additional Parameters ---
  const brightnessAdd = 60; // additional brightness (base gray is 136)

  // --- Movement & Cycle Timing ---
  const movementDuration = 0.3; // seconds to move the red circle between grid centers
  const waitDuration = 0; // no extra pause between cycles
  const waveSpeed = 687.5;

  // --- Displacement Threshold ---
  // Grid circles very near the pulse center (within this threshold) are not shifted.
  const displacementThreshold = 20;

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
    targetPos = getRandomGridPosition();
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
};