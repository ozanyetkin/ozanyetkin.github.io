document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("grid");
  const cells = [];
  const rows = 15,
    cols = 15;

  // Mobile detection and responsive variables
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // Responsive sizing based on screen size
  let cellSize = 30; // Increased from 20
  let offsetFactorBase = 7; // Increased from 5

  function updateResponsiveValues() {
    const viewportMin = Math.min(window.innerWidth, window.innerHeight);

    if (viewportMin < 480) {
      // Extra small screens
      cellSize = Math.max(20, viewportMin * 0.05); // Increased
      offsetFactorBase = 5; // Increased from 3
    } else if (viewportMin < 768) {
      // Mobile screens
      cellSize = Math.max(22, viewportMin * 0.055); // Increased
      offsetFactorBase = 6; // Increased from 4
    } else {
      // Desktop screens
      cellSize = 30; // Increased from 20
      offsetFactorBase = 7; // Increased from 5
    }
  }

  updateResponsiveValues();

  // Determine the center cell (for computing delays)
  const center = {
    r: Math.floor(rows / 2),
    c: Math.floor(cols / 2)
  };

  // ----- Timing Configuration (in seconds) -----
  const T_anim = 1.0; // Duration of the active transformation in a phase
  const T_wait = 1.0; // Waiting period after the active transformation
  const T_phase = T_anim + T_wait; // Total time per phase (now 2.0 seconds)
  const numPhases = 4;
  const T_total = T_phase * numPhases; // Total cycle duration (8.0 seconds)

  // ----- Wave Delay Configuration -----
  const maxDelay = 1.0; // Maximum delay in seconds
  const maxDist = Math.sqrt(center.r * center.r + center.c * center.c);

  // ----- Effect Configuration for Horizontal Motion -----
  let offsetFactor = offsetFactorBase; // Will be updated based on screen size

  // ----- Colors -----
  // Starting color (tomato) and an in‑between mix (a blend of indigo and turquoise)
  const tomato = {
    r: 236,
    g: 78,
    b: 74
  };
  const mixColor = {
    r: 76,
    g: 126,
    b: 167
  };

  // Animation control variables
  let animationId;
  let isAnimating = true;
  let animationSpeed = 1.0;
  let lastFrameTime = 0;
  let frameCount = 0;

  // Performance optimization for mobile
  const targetFPS = isMobile ? 30 : 60;
  const frameInterval = 1000 / targetFPS;

  // Create the grid of cells and compute per‑cell properties.
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      grid.appendChild(cell);
      // Compute Euclidean distance from the center (for the wave delay)
      const dx = c - center.c;
      const dy = r - center.r;
      const dist = Math.sqrt(dx * dx + dy * dy);
      // Store base values for responsive updates
      cells.push({
        cell,
        dist,
        dx,
        dy,
        targetX: dx * offsetFactorBase
      });
    }
  }

  // Update offset factor for responsive design
  function updateCellTargets() {
    offsetFactor = offsetFactorBase * (cellSize / 30); // Updated base from 20 to 30
    cells.forEach(cellData => {
      cellData.targetX = cellData.dx * offsetFactor;
    });
  }

  updateCellTargets();

  // ----- Easing Functions -----
  // easeInOutBack provides symmetric easing with an overshoot effect.
  // Its parameter (s) controls the overshoot; here we use s = 2.0.
  function easeInOutBack(x, s = 2.0) {
    const c2 = s * 1.525;
    if (x < 0.5) {
      return (Math.pow(2 * x, 2) * ((c2 + 1) * 2 * x - c2)) / 2;
    } else {
      return (Math.pow(2 * x - 2, 2) * ((c2 + 1) * (2 * x - 2) + c2) + 2) / 2;
    }
  }

  // Linear interpolation between two numbers.
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  // Interpolate between two colors (given as {r,g,b} objects) and return an "rgb(...)" string.
  function interpolateColor(colorA, colorB, t) {
    const r = Math.round(lerp(colorA.r, colorB.r, t));
    const g = Math.round(lerp(colorA.g, colorB.g, t));
    const b = Math.round(lerp(colorA.b, colorB.b, t));
    return `rgb(${r}, ${g}, ${b})`;
  }

  // For color interpolation in each phase:
  // At progress = 0 → tomato, at 0.5 → mixColor, and at 1 → tomato.
  function colorForProgress(p) {
    if (p < 0.5) {
      return interpolateColor(tomato, mixColor, p * 2);
    } else {
      return interpolateColor(mixColor, tomato, (p - 0.5) * 2);
    }
  }

  // Touch interaction handlers
  let touchStartTime = 0;
  let touchStartX = 0;
  let touchStartY = 0;

  function handleTouchStart(event) {
    event.preventDefault();
    touchStartTime = Date.now();
    const touch = event.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
  }

  function handleTouchMove(event) {
    event.preventDefault();
  }

  function handleTouchEnd(event) {
    event.preventDefault();
    const touchEndTime = Date.now();
    const touchDuration = touchEndTime - touchStartTime;

    if (touchDuration < 300) { // Quick tap
      // Toggle animation speed or pause
      if (isAnimating) {
        animationSpeed = animationSpeed === 1.0 ? 0.5 : (animationSpeed === 0.5 ? 2.0 : 1.0);
      } else {
        isAnimating = true;
        animate();
      }
    } else { // Long press
      // Pause/resume animation
      isAnimating = !isAnimating;
      if (isAnimating) {
        animate();
      }
    }
  }

  // Add touch event listeners
  if (isTouch) {
    grid.addEventListener('touchstart', handleTouchStart, { passive: false });
    grid.addEventListener('touchmove', handleTouchMove, { passive: false });
    grid.addEventListener('touchend', handleTouchEnd, { passive: false });
  }

  // Add click handler for desktop
  grid.addEventListener('click', () => {
    if (!isTouch) {
      animationSpeed = animationSpeed === 1.0 ? 0.5 : (animationSpeed === 0.5 ? 2.0 : 1.0);
    }
  });

  // Handle orientation changes and window resize
  function handleResize() {
    updateResponsiveValues();
    updateCellTargets();
  }

  window.addEventListener('resize', handleResize);
  window.addEventListener('orientationchange', () => {
    setTimeout(handleResize, 100); // Delay to ensure proper viewport dimensions
  });

  // Visibility API for performance optimization
  function handleVisibilityChange() {
    if (document.hidden) {
      isAnimating = false;
    } else {
      isAnimating = true;
      animate();
    }
  }

  document.addEventListener('visibilitychange', handleVisibilityChange);

  // ----- Animation Loop -----
  function animate(currentTime = performance.now()) {
    if (!isAnimating) return;

    // Frame rate limiting for mobile devices
    if (currentTime - lastFrameTime < frameInterval) {
      animationId = requestAnimationFrame(animate);
      return;
    }

    lastFrameTime = currentTime;
    frameCount++;

    const now = currentTime / 1000; // Current time in seconds
    const globalTime = (now * animationSpeed) % T_total; // Wrap time into one full cycle

    cells.forEach(({ cell, dist, targetX }) => {
      // Compute a sine‑shaped delay based on distance.
      // Cells at the center (dist = 0) have no delay;
      // cells at the maximum distance are delayed by maxDelay.
      const cellDelay = maxDelay * Math.sin((dist / maxDist) * (Math.PI / 2));
      // Back‑shift the time by subtracting cellDelay (wrapped into the cycle)
      let t = (globalTime + T_total - cellDelay) % T_total;

      // Determine which phase (0,1,2,3) the cell is in and the time within that phase.
      const phaseIndex = Math.floor(t / T_phase);
      const phaseTime = t % T_phase;

      // Compute progress uniformly:
      // During the active portion (first T_anim seconds) progress goes from 0 to 1,
      // and during the waiting portion (remaining T_wait seconds) progress holds at 1.
      const progress = phaseTime < T_anim ? phaseTime / T_anim : 1;
      const easedProgress = easeInOutBack(progress, 2.0);
      // Clamp eased progress to ensure it stays between 0 and 1 for color interpolation.
      const clampedProgress = Math.min(Math.max(easedProgress, 0), 1);
      const color = colorForProgress(clampedProgress);

      // Compute transformation values based on the current phase.
      let scale, tx;
      switch (phaseIndex) {
        case 0:
          // Phase 0: Shrink the rectangle.
          // Scale: 1 → 0.5; no horizontal translation.
          scale = lerp(1, 0.5, easedProgress);
          tx = 0;
          break;
        case 1:
          // Phase 1: Move horizontally outward.
          // Scale remains fixed at 0.5; translation: 0 → targetX.
          scale = 0.5;
          tx = lerp(0, targetX, easedProgress);
          break;
        case 2:
          // Phase 2: Grow the rectangle.
          // Scale: 0.5 → 1; translation remains at targetX.
          scale = lerp(0.5, 1, easedProgress);
          tx = targetX;
          break;
        case 3:
          // Phase 3: Move horizontally inward.
          // Scale remains at 1; translation: targetX → 0.
          scale = 1;
          tx = lerp(targetX, 0, easedProgress);
          break;
        default:
          scale = 1;
          tx = 0;
      }

      // Apply the computed transformation and background color.
      cell.style.transform = `translateX(${tx}px) scale(${scale})`;
      cell.style.backgroundColor = color;
    });

    animationId = requestAnimationFrame(animate);
  }

  // Start the animation
  animate();

  // Add a simple UI indicator for mobile users (optional)
  if (isMobile) {
    const indicator = document.createElement('div');
    indicator.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      color: rgba(255, 255, 255, 0.7);
      font-family: Arial, sans-serif;
      font-size: 12px;
      text-align: center;
      pointer-events: none;
      z-index: 1000;
    `;
    indicator.innerHTML = 'Tap: Change Speed | Long Press: Pause/Resume';
    document.body.appendChild(indicator);

    // Hide indicator after 5 seconds
    setTimeout(() => {
      indicator.style.opacity = '0';
      indicator.style.transition = 'opacity 1s ease-out';
      setTimeout(() => indicator.remove(), 1000);
    }, 5000);
  }
});
