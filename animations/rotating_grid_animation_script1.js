
const grid = document.getElementById('grid');

// Responsive grid sizing based on screen width
function getGridSize() {
    const width = window.innerWidth;
    if (width <= 480) return 17;      // Very small screens - larger than before
    if (width <= 768) return 19;      // Mobile screens - larger than before
    return 21;                        // Desktop screens - larger than before
}

const rows = getGridSize();
const cols = getGridSize();
const center = (rows - 1) / 2;
const maxDistance = Math.sqrt(center * center + center * center);
const maxDelay = 0.5; // Maximum stagger delay in seconds

for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');

        // Outer wrapper for rotation.
        const rotateWrapper = document.createElement('div');
        rotateWrapper.classList.add('rotate-wrapper');

        // Inner element for scaling and color.
        const scaleBox = document.createElement('div');
        scaleBox.classList.add('scale-box');

        // Nest the elements.
        rotateWrapper.appendChild(scaleBox);
        cell.appendChild(rotateWrapper);
        grid.appendChild(cell);

        // Compute Euclidean distance from the grid's center.
        const dx = row - center;
        const dy = col - center;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Apply a staggered animation delay based on distance.
        const delay = (distance / maxDistance) * maxDelay;
        rotateWrapper.style.animationDelay = delay + 's';
        scaleBox.style.animationDelay = delay + 's';

        // Rotation logic: cells nearer the center have a higher target angle (up to 90°)
        const initRot = (1 - (distance / maxDistance)) * 90;
        rotateWrapper.style.setProperty('--init-rot', initRot + 'deg');
    }
}

// Handle window resize and orientation changes for mobile
function handleResize() {
    // Clear existing grid
    grid.innerHTML = '';

    // Recreate grid with new dimensions
    const newRows = getGridSize();
    const newCols = getGridSize();
    const newCenter = (newRows - 1) / 2;
    const newMaxDistance = Math.sqrt(newCenter * newCenter + newCenter * newCenter);

    // Update CSS custom property for grid columns
    document.documentElement.style.setProperty('--grid-cols', newCols);

    // Regenerate grid cells
    for (let row = 0; row < newRows; row++) {
        for (let col = 0; col < newCols; col++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');

            const rotateWrapper = document.createElement('div');
            rotateWrapper.classList.add('rotate-wrapper');

            const scaleBox = document.createElement('div');
            scaleBox.classList.add('scale-box');

            rotateWrapper.appendChild(scaleBox);
            cell.appendChild(rotateWrapper);
            grid.appendChild(cell);

            const dx = row - newCenter;
            const dy = col - newCenter;
            const distance = Math.sqrt(dx * dx + dy * dy);

            const delay = (distance / newMaxDistance) * maxDelay;
            rotateWrapper.style.animationDelay = delay + 's';
            scaleBox.style.animationDelay = delay + 's';

            const initRot = (1 - (distance / newMaxDistance)) * 90;
            rotateWrapper.style.setProperty('--init-rot', initRot + 'deg');
        }
    }
}

// Debounce resize events to avoid excessive recalculations
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(handleResize, 150);
});

// Handle orientation change on mobile devices
window.addEventListener('orientationchange', () => {
    setTimeout(handleResize, 200); // Small delay to ensure proper dimensions
});
