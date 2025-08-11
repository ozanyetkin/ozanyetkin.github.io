
        // --- Scene Setup ---
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000000);

        const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
        camera.position.z = 3;
        
        // Adjust camera position for mobile to center sphere above controls
        function updateCameraPosition() {
            const isMobile = window.innerWidth <= 768;
            if (isMobile) {
                // Move camera up to center sphere in available space above controls
                camera.position.y = -0.3;
            } else {
                camera.position.y = 0;
            }
        }
        
        updateCameraPosition();

        const renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: false,
            powerPreference: "high-performance"
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
        document.body.appendChild(renderer.domElement);

        // --- Lights ---
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 3, 5);
        scene.add(directionalLight);
        scene.add(new THREE.AmbientLight(0x404040, 0.8));

        // --- Create Sphere Geometry ---
        const radius = 0.5;  // Smaller sphere
        
        // Adaptive geometry resolution based on screen size
        const isMobile = window.innerWidth <= 768;
        const widthSegments = isMobile ? 128 : 256;
        const heightSegments = isMobile ? 128 : 256;
        
        const geometry = new THREE.SphereBufferGeometry(radius, widthSegments, heightSegments);

        // Material that uses vertex colors
        const material = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: false });
        const sphere = new THREE.Mesh(geometry, material);
        scene.add(sphere);

        // --- Store Base Vertex Positions ---
        const positions = geometry.attributes.position.array;
        const vertexCount = positions.length;
        const basePositions = new Float32Array(vertexCount);
        for (let i = 0; i < vertexCount; i++) {
            basePositions[i] = positions[i];
        }

        // --- Set Up Vertex Colors ---
        let colors = new Float32Array(vertexCount);
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        // --- Noise Setup ---
        const simplex = new SimplexNoise();

        // --- Slider Parameters ---
        let noiseScale = parseFloat(document.getElementById("noiseSlider").value);
        let heightCoefficient = parseFloat(document.getElementById("heightSlider").value);
        const maxCoefficient = 0.5;  // Matches slider max

        // Function to update slider progress visualization
        function updateSliderProgress(slider) {
            const value = (slider.value - slider.min) / (slider.max - slider.min) * 100;
            const wrapper = slider.parentElement;
            const progressColor = '#666';
            const trackColor = '#333';
            wrapper.style.setProperty('--slider-progress', `${value}%`);
            
            // Update the pseudo-element background
            const style = `linear-gradient(to right, ${progressColor} 0%, ${progressColor} ${value}%, ${trackColor} ${value}%, ${trackColor} 100%)`;
            wrapper.setAttribute('data-progress', value);
        }

        const noiseSlider = document.getElementById("noiseSlider");
        const heightSlider = document.getElementById("heightSlider");

        // Initialize progress visualization
        updateSliderProgress(noiseSlider);
        updateSliderProgress(heightSlider);

        noiseSlider.addEventListener("input", function (e) {
            noiseScale = parseFloat(e.target.value);
            updateSliderProgress(e.target);
        });
        heightSlider.addEventListener("input", function (e) {
            heightCoefficient = parseFloat(e.target.value);
            updateSliderProgress(e.target);
        });

        // --- Mouse Variables for Dynamic Noise & Rotation ---
        let mouseX = 0, mouseY = 0;
        let windowHalfX = window.innerWidth / 2;
        let windowHalfY = window.innerHeight / 2;
        let isInteracting = false;

        // Mouse events
        document.addEventListener('mousemove', onDocumentMouseMove, false);
        function onDocumentMouseMove(event) {
            if (!isInteracting) {
                mouseX = (event.clientX - windowHalfX) / windowHalfX;
                mouseY = (event.clientY - windowHalfY) / windowHalfY;
            }
        }

        // Touch events for mobile devices
        document.addEventListener('touchstart', onTouchStart, { passive: false });
        document.addEventListener('touchmove', onTouchMove, { passive: false });
        document.addEventListener('touchend', onTouchEnd, false);

        let lastTouchX = 0, lastTouchY = 0;
        let touchStartTime = 0;

        function onTouchStart(event) {
            // Don't prevent default if touching a slider or its container
            const target = event.target;
            if (target.type === 'range' || target.closest('#sliderContainer')) {
                return; // Let the browser handle slider interaction
            }
            
            event.preventDefault();
            isInteracting = true;
            touchStartTime = Date.now();
            
            if (event.touches.length === 1) {
                lastTouchX = event.touches[0].clientX;
                lastTouchY = event.touches[0].clientY;
            }
        }

        function onTouchMove(event) {
            // Don't prevent default if touching a slider or its container
            const target = event.target;
            if (target.type === 'range' || target.closest('#sliderContainer')) {
                return; // Let the browser handle slider interaction
            }
            
            event.preventDefault();
            
            if (event.touches.length === 1) {
                const touch = event.touches[0];
                const deltaX = touch.clientX - lastTouchX;
                const deltaY = touch.clientY - lastTouchY;
                
                // Update mouse position for sphere rotation
                mouseX += deltaX * 0.005;
                mouseY += deltaY * 0.005;
                
                // Clamp values to prevent extreme rotations
                mouseX = Math.max(-1, Math.min(1, mouseX));
                mouseY = Math.max(-1, Math.min(1, mouseY));
                
                lastTouchX = touch.clientX;
                lastTouchY = touch.clientY;
            }
        }

        function onTouchEnd(event) {
            // Don't prevent default if touching a slider or its container
            const target = event.target;
            if (target.type === 'range' || target.closest('#sliderContainer')) {
                return; // Let the browser handle slider interaction
            }
            
            event.preventDefault();
            isInteracting = false;
            
            // Check if it was a tap (short touch duration and minimal movement)
            const touchDuration = Date.now() - touchStartTime;
            if (touchDuration < 200) {
                // Trigger pulse animation on tap
                startPulse();
            }
        }

        // --- Handle Window Resize ---
        window.addEventListener('resize', onWindowResize, false);
        function onWindowResize() {
            windowHalfX = window.innerWidth / 2;
            windowHalfY = window.innerHeight / 2;
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            updateCameraPosition(); // Update camera position on resize
        }

        // --- Colors ---
        // Base color: Pastel blue, Target color: Pastel pink
        const baseColor = { r: 0.6, g: 0.7, b: 0.9 };      // Darkened pastel blue
        const targetColor = { r: 0.9, g: 0.6, b: 0.7 };    // Darkened pastel pink

        // --- Raycaster for Detecting Clicks on the Sphere ---
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        
        // Mouse click events
        window.addEventListener('click', onClick, false);
        
        function onClick(event) {
            // Convert mouse click to normalized device coordinates (-1 to +1)
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObject(sphere);
            if (intersects.length > 0) {
                // Start pulse animation if the sphere was clicked
                startPulse();
            }
        }

        // --- Pulse Animation Variables ---
        let pulseActive = false;
        let pulseStartTime = 0;
        const pulseDuration = 400; // duration in milliseconds

        // We'll use a piecewise interpolation with overshooting:
        //   - 0%   of the animation: scale = 1.0
        //   - 40%  of the animation: scale = 0.7 (shrink)
        //   - 70%  of the animation: scale = 1.2 (overshoot)
        //   - 100% of the animation: scale = 1.0 (settle)
        function getPulseScale(progress) {
            if (progress < 0.4) {
                // Interpolate from 1.0 to 0.7
                return 1.0 + (0.7 - 1.0) * (progress / 0.4);
            } else if (progress < 0.7) {
                // Interpolate from 0.7 to 1.2
                return 0.7 + (1.2 - 0.7) * ((progress - 0.4) / 0.3);
            } else {
                // Interpolate from 1.2 back to 1.0
                return 1.2 + (1.0 - 1.2) * ((progress - 0.7) / 0.3);
            }
        }

        function startPulse() {
            pulseActive = true;
            pulseStartTime = performance.now();
        }

        function updatePulse(currentTime) {
            if (!pulseActive) return;
            const t = (currentTime - pulseStartTime) / pulseDuration;
            if (t >= 1) {
                pulseActive = false;
                sphere.scale.set(1, 1, 1);
            } else {
                const scale = getPulseScale(t);
                sphere.scale.set(scale, scale, scale);
            }
        }

        // --- Update Sphere Geometry with Noise and Color ---
        function updateSphere() {
            // Determine a blend factor based on heightCoefficient
            const blendFactor = Math.min(heightCoefficient / maxCoefficient, 1);
            for (let i = 0; i < vertexCount; i += 3) {
                const ox = basePositions[i];
                const oy = basePositions[i + 1];
                const oz = basePositions[i + 2];

                // Compute the normal for this vertex (for a sphere the vertex is along the normal)
                const len = Math.sqrt(ox * ox + oy * oy + oz * oz);
                const nx = ox / len;
                const ny = oy / len;
                const nz = oz / len;

                // Use dynamic noise incorporating mouse offsets.
                const noiseVal = simplex.noise3D(
                    ox * noiseScale + mouseX,
                    oy * noiseScale + mouseY,
                    oz * noiseScale
                );
                // Map noise from (-1, 1) to (0, 1)
                const noiseMapped = (noiseVal + 1) / 2;

                // Compute displacement (with reduced heightCoefficient to avoid self-intersections)
                const displacement = noiseVal * heightCoefficient;
                const newRadius = len + displacement;

                // Update the vertex position along its normal.
                positions[i] = nx * newRadius;
                positions[i + 1] = ny * newRadius;
                positions[i + 2] = nz * newRadius;

                // Enhance the color difference: multiply the blend by a factor to boost contrast.
                const dynamicFactor = Math.min(1, 5 * blendFactor * noiseMapped);
                colors[i] = baseColor.r + (targetColor.r - baseColor.r) * dynamicFactor;
                colors[i + 1] = baseColor.g + (targetColor.g - baseColor.g) * dynamicFactor;
                colors[i + 2] = baseColor.b + (targetColor.b - baseColor.b) * dynamicFactor;
            }
            geometry.attributes.position.needsUpdate = true;
            geometry.attributes.color.needsUpdate = true;
            geometry.computeVertexNormals();
        }

        // --- Animation Loop ---
        function animate() {
            requestAnimationFrame(animate);
            const currentTime = performance.now();

            updateSphere();

            // Rotate the sphere based on the mouse position.
            sphere.rotation.y = mouseX * 0.5;
            sphere.rotation.x = mouseY * 0.5;

            // Update pulse animation if active.
            updatePulse(currentTime);

            renderer.render(scene, camera);
        }
        animate();
    