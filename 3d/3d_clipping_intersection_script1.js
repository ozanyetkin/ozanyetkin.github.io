
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
        });

        // Mouse‐move camera rotation (center‐based)
        const spherical = new THREE.Spherical().setFromVector3(camera.position);
        const BASE_THETA = spherical.theta;
        const BASE_PHI = spherical.phi;
        const H_SPEED = 0.0004;  // very slow horizontal
        const V_SPEED = 0.0010;  // slow vertical

        window.addEventListener('mousemove', e => {
            const dx = e.clientX - window.innerWidth / 2;
            const dy = e.clientY - window.innerHeight / 2;

            // compute new spherical angles relative to center
            spherical.theta = BASE_THETA - dx * H_SPEED;
            spherical.phi = BASE_PHI - dy * V_SPEED;

            // clamp phi to avoid flipping
            const EPS = 0.01;
            spherical.phi = Math.max(EPS, Math.min(Math.PI - EPS, spherical.phi));

            camera.position.setFromSpherical(spherical);
            camera.lookAt(0, 0, 0);
        });

        // Render loop
        (function animate() {
            requestAnimationFrame(animate);
            renderer.render(scene, camera);
        })();
    