
        document.addEventListener("DOMContentLoaded", function () {
            // ------------------------
            // Configuration Parameters
            // ------------------------
            const gridSize = 17; // Grid is gridSize x gridSize
            const squareSize = 20; // Size in pixels of each square
            const containerSize = gridSize * squareSize;
            // Animation durations in ms for each phase.
            const D = 1500;
            const D1 = D, D2 = D, D3 = D, D4 = D;
            // Gaps (in ms) between phases.
            const gap1 = 300, gap2 = 300, gap3 = 300, pause = 500;
            // Maximum extra delay for ripple effects in Phases 1 & 4.
            const delayMax = 500;
            // For Phase 2, a row–based extra delay (bottom row starts first)
            const rowDelay = 20;
            const maxRowDelay = (gridSize - 1) * rowDelay;
            // Scale factor when shrunk.
            const smallScale = 0.5;

            // Extra displacement (in pixels) applied uniformly based on grid position.
            const extraDispFactor = 10; // Adjust this value as needed

            // Colors: More vivid tomato and brighter indigo.
            const tomato = [255, 85, 0];
            const indigo = [85, 0, 255];

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
            const container = document.getElementById("container");
            container.style.width = containerSize + "px";
            container.style.height = containerSize + "px";

            // The container’s center in pixels.
            const containerCenter = { x: containerSize / 2, y: containerSize / 2 };
            const maxDistOriginal = Math.hypot(containerCenter.x, containerCenter.y);

            // Create a gridSize x gridSize grid of squares.
            const squares = [];

            for (let r = 0; r < gridSize; r++) {
                for (let c = 0; c < gridSize; c++) {
                    const sq = document.createElement("div");
                    sq.className = "square";
                    const origLeft = c * squareSize;
                    const origTop = r * squareSize;
                    sq.style.left = origLeft + "px";
                    sq.style.top = origTop + "px";

                    // Compute the square’s center and its distance from the container center.
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

            // Precompute offset for the double grid.
            const offsetDoubleGrid = {
                x: containerCenter.x - gridSize * squareSize,
                y: containerCenter.y - gridSize * squareSize
            };

            // Remapping parameters for the double grid.
            const indexMinOrig = 8.5;
            const indexMaxOrig = 24.5;
            const indexMinNew = 7.5;
            const indexMaxNew = 25.5;
            const scaleFactor = (indexMaxNew - indexMinNew) / (indexMaxOrig - indexMinOrig); // 1.125

            // Compute grid center in grid–coordinate space.
            const gridCenter = { x: (gridSize - 1) / 2, y: (gridSize - 1) / 2 };

            // ------------------------
            // Animation Cycle
            // ------------------------
            function cycle() {
                // Phase 1: Shrink and displace squares.
                squares.forEach(sq => {
                    const delay = Number(sq.dataset.delay);
                    // Using ease-in-out for a smoother transition.
                    sq.style.transition = `transform ${D1}ms ease-in-out ${delay}ms, background-color ${D1}ms ease-in-out ${delay}ms`;
                    const origLeft = Number(sq.dataset.origLeft);
                    const origTop = Number(sq.dataset.origTop);
                    const c = origLeft / squareSize;
                    const r = origTop / squareSize;
                    const origIndexX = c + 8.5;
                    const origIndexY = r + 8.5;
                    // Remap linearly:
                    const newIndexX = indexMinNew + (origIndexX - indexMinOrig) * scaleFactor;
                    const newIndexY = indexMinNew + (origIndexY - indexMinOrig) * scaleFactor;
                    // New center of the cell in the double grid.
                    const newCenterX = offsetDoubleGrid.x + (newIndexX + 0.5) * squareSize;
                    const newCenterY = offsetDoubleGrid.y + (newIndexY + 0.5) * squareSize;
                    // New top–left from new center.
                    const newTopLeftX = newCenterX - squareSize / 2;
                    const newTopLeftY = newCenterY - squareSize / 2;
                    // Base translation from original to remapped grid.
                    let tx = newTopLeftX - origLeft;
                    let ty = newTopLeftY - origTop;

                    // Add extra uniform displacement based on grid index.
                    // Compute grid-index difference from grid center.
                    const dxIndex = c - gridCenter.x;
                    const dyIndex = r - gridCenter.y;
                    // Normalize by half grid size so the maximum offset is extraDispFactor.
                    tx += (dxIndex / (gridSize / 2)) * extraDispFactor;
                    ty += (dyIndex / (gridSize / 2)) * extraDispFactor;

                    // Apply the computed translation and shrink.
                    sq.style.transform = `translate(${tx}px, ${ty}px) scale(${smallScale})`;
                    // Use the base color.
                    sq.style.backgroundColor = sq.dataset.baseColor;
                });

                // Phase 2: Distribute squares randomly on the double grid.
                setTimeout(() => {
                    const doubleGridCells = 2 * gridSize;
                    const positions = [];
                    // The full double grid: each cell’s top–left is given by:
                    // (offsetDoubleGrid.x + col*squareSize, offsetDoubleGrid.y + row*squareSize)
                    for (let r = 0; r < doubleGridCells; r++) {
                        for (let c = 0; c < doubleGridCells; c++) {
                            const left = offsetDoubleGrid.x + c * squareSize;
                            const top = offsetDoubleGrid.y + r * squareSize;
                            positions.push({ left, top });
                        }
                    }
                    shuffle(positions);
                    const selectedPositions = positions.slice(0, squares.length);

                    // Compute maximum distance among the new grid cells (using their centers).
                    let newMaxDist = 0;
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
                        const extraDelay = ((gridSize - 1) - row) * rowDelay;
                        sq.style.transition = `transform ${D2}ms ease-in-out ${extraDelay}ms, background-color ${D2}ms ease-in-out ${extraDelay}ms`;
                        sq.style.transform = `translate(${tx}px, ${ty}px) scale(${smallScale})`;
                        // Compute a new color based on the new cell’s center.
                        const cellCenter = { x: newPos.left + squareSize / 2, y: newPos.top + squareSize / 2 };
                        const d_new = Math.hypot(cellCenter.x - containerCenter.x, cellCenter.y - containerCenter.y);
                        const ratio_new = d_new / newMaxDist;
                        sq.style.backgroundColor = blendColors(tomato, indigo, ratio_new);
                    });
                }, D1 + delayMax + gap1);

                // Phase 3: Return squares to original grid positions (maintaining the small scale).
                setTimeout(() => {
                    squares.forEach(sq => {
                        sq.style.transition = `transform ${D3}ms ease-in-out, background-color ${D3}ms ease-in-out`;
                        sq.style.transform = `scale(${smallScale})`;
                        // Revert to the base blended color.
                        sq.style.backgroundColor = sq.dataset.baseColor;
                    });
                }, D1 + delayMax + gap1 + D2 + maxRowDelay + gap2);

                // Phase 4: Grow squares back to full size with a ripple delay.
                setTimeout(() => {
                    squares.forEach(sq => {
                        const delay = Number(sq.dataset.delay);
                        sq.style.transition = `transform ${D4}ms ease-in-out ${delay}ms, background-color ${D4}ms ease-in-out ${delay}ms`;
                        sq.style.transform = `scale(1)`;
                        sq.style.backgroundColor = sq.dataset.baseColor;
                    });
                }, D1 + delayMax + gap1 + D2 + maxRowDelay + gap2 + D3 + gap3);

                // Restart the cycle after a full pause.
                const totalCycle = D1 + delayMax + gap1 + D2 + maxRowDelay + gap2 + D3 + gap3 + D4 + delayMax + pause;
                setTimeout(cycle, totalCycle);
            }

            // Start the animation cycle after a short delay.
            setTimeout(cycle, 500);
        });
    