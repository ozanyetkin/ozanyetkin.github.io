document.addEventListener("DOMContentLoaded", function () {
    // ------------------------
    // Configuration Parameters
    // ------------------------
    let gridSize = 17; // Default grid size (will be updated based on screen size)
    let gridCols = 17; // Grid columns
    let gridRows = 17; // Grid rows

    // Get the container to determine actual rendered size
    const container = document.getElementById("container");

    // Function to get current square size and grid dimensions from CSS
    function getCurrentDimensions() {
        const computedStyle = getComputedStyle(document.documentElement);
        const squareSize = parseInt(computedStyle.getPropertyValue('--square-size'));
        const cols = parseInt(computedStyle.getPropertyValue('--grid-cols'));
        const rows = parseInt(computedStyle.getPropertyValue('--grid-rows'));
        return { squareSize, cols, rows };
    }

    // Function to initialize or reinitialize the animation with current dimensions
    function initializeAnimation() {
        const { squareSize, cols, rows } = getCurrentDimensions();
        gridCols = cols;
        gridRows = rows;
        gridSize = Math.max(cols, rows); // Use the larger dimension for calculations

        const containerWidth = cols * squareSize;
        const containerHeight = rows * squareSize;

        // Update container size
        container.style.width = containerWidth + "px";
        container.style.height = containerHeight + "px";

        // Scale container if it's too big for the viewport
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const maxWidth = viewportWidth * 0.98;
        const maxHeight = viewportHeight * 0.98;

        const scaleX = containerWidth > maxWidth ? maxWidth / containerWidth : 1;
        const scaleY = containerHeight > maxHeight ? maxHeight / containerHeight : 1;
        const scale = Math.min(scaleX, scaleY);

        if (scale < 1) {
            container.style.transform = `scale(${scale})`;
        } else {
            container.style.transform = 'scale(1)';
        }

        return { squareSize, containerWidth, containerHeight };
    }

    let { squareSize, containerWidth, containerHeight } = initializeAnimation();

    // Animation durations in ms for each phase.
    const D = 1500;
    const D1 = D, D2 = D, D3 = D, D4 = D;
    // Gaps (in ms) between phases.
    const gap1 = 300, gap2 = 300, gap3 = 300, pause = 500;
    // Maximum extra delay for ripple effects in Phases 1 & 4.
    const delayMax = 500;
    // For Phase 2, a row–based extra delay (bottom row starts first)
    const rowDelay = 20;
    let maxRowDelay = (gridRows - 1) * rowDelay;
    // Scale factor when shrunk.
    const smallScale = 0.5;

    // Extra displacement (in pixels) applied uniformly based on grid position.
    const extraDispFactor = 10; // Adjust this value as needed

    // Colors: More vivid tomato and brighter indigo.
    const tomato = [255, 85, 0];
    const indigo = [85, 0, 255];

    // Handle window resize
    let resizeTimeout;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function () {
            const newDimensions = initializeAnimation();
            squareSize = newDimensions.squareSize;
            containerWidth = newDimensions.containerWidth;
            containerHeight = newDimensions.containerHeight;
            maxRowDelay = (gridRows - 1) * rowDelay;
            // Restart animation with new dimensions
            startAnimation();
        }, 300);
    });

    // Add touch event handling for mobile interaction
    let isAnimationPaused = false;
    container.addEventListener('touchstart', function (e) {
        e.preventDefault();
        isAnimationPaused = !isAnimationPaused;
        if (isAnimationPaused) {
            container.style.animationPlayState = 'paused';
        } else {
            container.style.animationPlayState = 'running';
        }
    });

    container.addEventListener('click', function (e) {
        isAnimationPaused = !isAnimationPaused;
        if (isAnimationPaused) {
            container.style.animationPlayState = 'paused';
        } else {
            container.style.animationPlayState = 'running';
        }
    });

    // ------------------------
    // Helper Functions
    // ------------------------
    // Blend two colors (each given as [r, g, b]). t=0 returns c1, t=1 returns c2.
    function blendColors(c1, c2, t) {
        t = Math.max(0, Math.min(t, 1));
        const r = Math.round(c1[0] * (1 - t) + c2[0] * t);
        const g = Math.round(c1[1] * (1 - t) + c2[1] * t);
        const b = Math.round(c1[2] * (1 - t) + c2[2] * t);
        return `rgb(${r}, ${g}, ${b})`;
    }

    // Fisher–Yates shuffle.
    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // ------------------------
    // Setup Container & Original Grid
    // ------------------------
    let squares = [];
    let animationTimeouts = [];

    function createGrid() {
        // Clear any existing squares and timeouts
        container.innerHTML = '';
        squares = [];
        animationTimeouts.forEach(timeout => clearTimeout(timeout));
        animationTimeouts = [];

        // The container's center in pixels.
        const containerCenter = { x: containerWidth / 2, y: containerHeight / 2 };
        const maxDistOriginal = Math.hypot(containerCenter.x, containerCenter.y);

        // Create a gridRows x gridCols grid of squares.
        for (let r = 0; r < gridRows; r++) {
            for (let c = 0; c < gridCols; c++) {
                const sq = document.createElement("div");
                sq.className = "square";
                const origLeft = c * squareSize;
                const origTop = r * squareSize;
                sq.style.left = origLeft + "px";
                sq.style.top = origTop + "px";

                // Compute the square's center and its distance from the container center.
                const centerX = origLeft + squareSize / 2;
                const centerY = origTop + squareSize / 2;
                const dx = centerX - containerCenter.x;
                const dy = centerY - containerCenter.y;
                const dist = Math.hypot(dx, dy);
                const ratio = dist / maxDistOriginal;  // 0 at center, 1 at farthest corner.
                // Base color: a blend between tomato (at center) and indigo (at edges).
                const baseColor = blendColors(tomato, indigo, ratio);
                sq.style.backgroundColor = baseColor;

                // Save data for later use.
                sq.dataset.origLeft = origLeft;
                sq.dataset.origTop = origTop;
                sq.dataset.baseColor = baseColor;
                // Ripple delay based on distance.
                sq.dataset.delay = ratio * delayMax;

                container.appendChild(sq);
                squares.push(sq);
            }
        }
    }

    // ------------------------
    // Animation Cycle
    // ------------------------
    function cycle() {
        if (isAnimationPaused) {
            animationTimeouts.push(setTimeout(cycle, 100));
            return;
        }

        // Precompute offset for the double grid.
        const offsetDoubleGrid = {
            x: containerWidth / 2 - gridCols * squareSize,
            y: containerHeight / 2 - gridRows * squareSize
        };

        // Remapping parameters for the double grid (simplified for better centering).
        const gridCenterX = (gridCols - 1) / 2;
        const gridCenterY = (gridRows - 1) / 2;

        // Create expansion factor for double grid
        const expansionFactor = 1.125;

        // Compute grid center in grid–coordinate space.
        const gridCenter = { x: gridCenterX, y: gridCenterY };

        // Phase 1: Shrink and displace squares.
        squares.forEach(sq => {
            const delay = Number(sq.dataset.delay);
            // Using ease-in-out for a smoother transition.
            sq.style.transition = `transform ${D1}ms ease-in-out ${delay}ms, background-color ${D1}ms ease-in-out ${delay}ms`;
            const origLeft = Number(sq.dataset.origLeft);
            const origTop = Number(sq.dataset.origTop);
            const c = origLeft / squareSize;
            const r = origTop / squareSize;

            // Calculate displacement from grid center with expansion
            const dxFromCenter = (c - gridCenterX) * expansionFactor;
            const dyFromCenter = (r - gridCenterY) * expansionFactor;

            // New position relative to container center
            const newX = containerWidth / 2 + dxFromCenter * squareSize - squareSize / 2;
            const newY = containerHeight / 2 + dyFromCenter * squareSize - squareSize / 2;

            // Calculate translation
            let tx = newX - origLeft;
            let ty = newY - origTop;

            // Add extra uniform displacement based on grid index.
            // Compute grid-index difference from grid center.
            const dxIndex = c - gridCenter.x;
            const dyIndex = r - gridCenter.y;
            // Normalize by half grid size so the maximum offset is extraDispFactor.
            tx += (dxIndex / (gridCols / 2)) * extraDispFactor;
            ty += (dyIndex / (gridRows / 2)) * extraDispFactor;

            // Apply the computed translation and shrink.
            sq.style.transform = `translate(${tx}px, ${ty}px) scale(${smallScale})`;
            // Use the base color.
            sq.style.backgroundColor = sq.dataset.baseColor;
        });

        // Phase 2: Distribute squares randomly on the double grid.
        animationTimeouts.push(setTimeout(() => {
            const doubleGridCols = 2 * gridCols;
            const doubleGridRows = 2 * gridRows;
            const positions = [];
            // The full double grid: each cell's top–left is given by:
            // (offsetDoubleGrid.x + col*squareSize, offsetDoubleGrid.y + row*squareSize)
            for (let r = 0; r < doubleGridRows; r++) {
                for (let c = 0; c < doubleGridCols; c++) {
                    const left = offsetDoubleGrid.x + c * squareSize;
                    const top = offsetDoubleGrid.y + r * squareSize;
                    positions.push({ left, top });
                }
            }
            shuffle(positions);
            const selectedPositions = positions.slice(0, squares.length);

            // Compute maximum distance among the new grid cells (using their centers).
            let newMaxDist = 0;
            const containerCenter = { x: containerWidth / 2, y: containerHeight / 2 };
            selectedPositions.forEach(pos => {
                const cellCenter = { x: pos.left + squareSize / 2, y: pos.top + squareSize / 2 };
                const d = Math.hypot(cellCenter.x - containerCenter.x, cellCenter.y - containerCenter.y);
                if (d > newMaxDist) newMaxDist = d;
            });
            if (newMaxDist === 0) newMaxDist = 1;

            // Animate each square to its randomly chosen cell.
            squares.forEach((sq, i) => {
                const newPos = selectedPositions[i];
                const origLeft = Number(sq.dataset.origLeft);
                const origTop = Number(sq.dataset.origTop);
                const tx = newPos.left - origLeft;
                const ty = newPos.top - origTop;
                // Compute a row–based extra delay (bottom row starts first).
                const row = Number(sq.dataset.origTop) / squareSize;
                const extraDelay = ((gridRows - 1) - row) * rowDelay;
                sq.style.transition = `transform ${D2}ms ease-in-out ${extraDelay}ms, background-color ${D2}ms ease-in-out ${extraDelay}ms`;
                sq.style.transform = `translate(${tx}px, ${ty}px) scale(${smallScale})`;
                // Compute a new color based on the new cell's center.
                const cellCenter = { x: newPos.left + squareSize / 2, y: newPos.top + squareSize / 2 };
                const d_new = Math.hypot(cellCenter.x - containerCenter.x, cellCenter.y - containerCenter.y);
                const ratio_new = d_new / newMaxDist;
                sq.style.backgroundColor = blendColors(tomato, indigo, ratio_new);
            });
        }, D1 + delayMax + gap1));

        // Phase 3: Return squares to original grid positions (maintaining the small scale).
        animationTimeouts.push(setTimeout(() => {
            squares.forEach(sq => {
                sq.style.transition = `transform ${D3}ms ease-in-out, background-color ${D3}ms ease-in-out`;
                sq.style.transform = `scale(${smallScale})`;
                // Revert to the base blended color.
                sq.style.backgroundColor = sq.dataset.baseColor;
            });
        }, D1 + delayMax + gap1 + D2 + maxRowDelay + gap2));

        // Phase 4: Grow squares back to full size with a ripple delay.
        animationTimeouts.push(setTimeout(() => {
            squares.forEach(sq => {
                const delay = Number(sq.dataset.delay);
                sq.style.transition = `transform ${D4}ms ease-in-out ${delay}ms, background-color ${D4}ms ease-in-out ${delay}ms`;
                sq.style.transform = `scale(1)`;
                sq.style.backgroundColor = sq.dataset.baseColor;
            });
        }, D1 + delayMax + gap1 + D2 + maxRowDelay + gap2 + D3 + gap3));

        // Restart the cycle after a full pause.
        const totalCycle = D1 + delayMax + gap1 + D2 + maxRowDelay + gap2 + D3 + gap3 + D4 + delayMax + pause;
        animationTimeouts.push(setTimeout(cycle, totalCycle));
    }

    // Function to start the animation
    function startAnimation() {
        // Clear any existing animation
        animationTimeouts.forEach(timeout => clearTimeout(timeout));
        animationTimeouts = [];

        // Recreate the grid with current dimensions
        createGrid();

        // Start the animation cycle after a short delay.
        animationTimeouts.push(setTimeout(cycle, 500));
    }

    // Start the initial animation
    startAnimation();
});
