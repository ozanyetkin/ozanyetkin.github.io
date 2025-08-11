
        // Scene, camera, renderer
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(innerWidth, innerHeight);
        renderer.setPixelRatio(devicePixelRatio);
        renderer.localClippingEnabled = true;
        document.body.appendChild(renderer.domElement);

        // Place camera ABOVE so you look down at the equator slice
        camera.position.set(-10, 10, -10);
        camera.lookAt(0, 0, 0);

        // Lights
        scene.add(new THREE.AmbientLight(0xffffff, 0.7));
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
        dirLight.position.set(10, 10, 10);
        scene.add(dirLight);

        // Clipping planes: X, inverted Y (clips upper half), Z
        const planeX = new THREE.Plane(new THREE.Vector3(1, 0, 0), 0);
        const planeY = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
        const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
        const clippingPlanes = [planeX, planeY, planeZ];

        // Group for spheres
        const group = new THREE.Group();
        scene.add(group);

        // Detect if device is mobile
        const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
        
        // Adjust size based on device
        const scaleFactor = isMobile ? 0.7 : 1.0; // Make object smaller on mobile
        group.scale.setScalar(scaleFactor);

        // Create 15 concentric, more vivid spheres
        const sphereMats = [];
        const maxR = 5, count = 15;
        for (let i = 0; i < count; i++) {
            const radius = maxR * (1 - i / count);
            const hue = i * 360 / count;
            const col = new THREE.Color(`hsl(${hue},60%,50%)`);

            const mat = new THREE.MeshLambertMaterial({
                color: col,
                side: THREE.DoubleSide,
                clippingPlanes,
                clipIntersection: true
            });
            sphereMats.push(mat);

            const geo = new THREE.SphereGeometry(radius, 64, 64);
            const mesh = new THREE.Mesh(geo, mat);
            group.add(mesh);
        }

        // UI hooks
        const slider = document.getElementById('slider');
        const checkbox = document.getElementById('intersection');
        const modeLabel = document.getElementById('modeLabel');

        slider.addEventListener('input', () => {
            const v = parseFloat(slider.value);
            planeX.constant = v;
            planeY.constant = v;
            planeZ.constant = v;
        });

        checkbox.addEventListener('change', () => {
            const andMode = checkbox.checked;
            sphereMats.forEach(m => m.clipIntersection = andMode);
            modeLabel.textContent = andMode ? '(AND)' : '(OR)';
        });

        window.addEventListener('resize', () => {
            camera.aspect = innerWidth / innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(innerWidth, innerHeight);
            
            // Update mobile scaling on resize
            const newIsMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
            const newScaleFactor = newIsMobile ? 0.7 : 1.0;
            group.scale.setScalar(newScaleFactor);
        });

        // Mouse‐move camera rotation (center‐based)
        const spherical = new THREE.Spherical().setFromVector3(camera.position);
        let BASE_THETA = spherical.theta;
        let BASE_PHI = spherical.phi;
        const H_SPEED = 0.0004;  // very slow horizontal
        const V_SPEED = 0.0010;  // slow vertical

        // Track interaction state
        let isInteracting = false;

        function updateCameraFromMouse(clientX, clientY) {
            const dx = clientX - window.innerWidth / 2;
            const dy = clientY - window.innerHeight / 2;

            // compute new spherical angles relative to center
            spherical.theta = BASE_THETA - dx * H_SPEED;
            spherical.phi = BASE_PHI - dy * V_SPEED;

            // clamp phi to avoid flipping
            const EPS = 0.01;
            spherical.phi = Math.max(EPS, Math.min(Math.PI - EPS, spherical.phi));

            camera.position.setFromSpherical(spherical);
            camera.lookAt(0, 0, 0);
        }

        // Desktop mouse events
        window.addEventListener('mousemove', e => {
            updateCameraFromMouse(e.clientX, e.clientY);
        });

        // Function to update base rotation when needed (e.g., after touch interaction)
        function updateBaseRotation() {
            const currentSpherical = new THREE.Spherical().setFromVector3(camera.position);
            BASE_THETA = currentSpherical.theta;
            BASE_PHI = currentSpherical.phi;
        }

        // Mobile touch events for camera control
        let lastTouchX = 0;
        let lastTouchY = 0;
        
        // Only handle touch events on the canvas, not on UI elements
        renderer.domElement.addEventListener('touchstart', e => {
            if (e.touches.length === 1) {
                isInteracting = true;
                lastTouchX = e.touches[0].clientX;
                lastTouchY = e.touches[0].clientY;
                e.preventDefault();
            }
        }, { passive: false });

        renderer.domElement.addEventListener('touchmove', e => {
            if (isInteracting && e.touches.length === 1) {
                const touch = e.touches[0];
                const deltaX = touch.clientX - lastTouchX;
                const deltaY = touch.clientY - lastTouchY;
                
                // Update spherical coordinates based on touch movement
                const touchSensitivity = 0.005;
                spherical.theta -= deltaX * touchSensitivity;
                spherical.phi -= deltaY * touchSensitivity; // Reversed: drag up to look up, drag down to look down

                // clamp phi to avoid flipping
                const EPS = 0.01;
                spherical.phi = Math.max(EPS, Math.min(Math.PI - EPS, spherical.phi));

                camera.position.setFromSpherical(spherical);
                camera.lookAt(0, 0, 0);
                
                lastTouchX = touch.clientX;
                lastTouchY = touch.clientY;
                e.preventDefault();
            }
        }, { passive: false });

        renderer.domElement.addEventListener('touchend', e => {
            if (e.touches.length === 0) {
                isInteracting = false;
                // Update base rotation after touch interaction ends
                updateBaseRotation();
            }
            e.preventDefault();
        }, { passive: false });

        // Render loop
        (function animate() {
            requestAnimationFrame(animate);
            renderer.render(scene, camera);
        })();
    