
        const grid = document.getElementById('grid');
        const rows = 17, cols = 17;
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
    