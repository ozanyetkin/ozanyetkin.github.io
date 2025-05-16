
        import * as THREE from 'three';
        import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

        // ---- Curves ----
        class GrannyKnotCurve extends THREE.Curve {
            constructor(scale = 1) { super(); this.scale = scale; }
            getPoint(t, d = new THREE.Vector3()) {
                const u = 2 * Math.PI * t;
                const x = -22 * Math.cos(u) - 128 * Math.sin(u)
                    - 44 * Math.cos(3 * u) - 78 * Math.sin(3 * u);
                const y = -10 * Math.cos(2 * u) - 27 * Math.sin(2 * u)
                    + 38 * Math.cos(4 * u) + 46 * Math.sin(4 * u);
                const z = 70 * Math.cos(3 * u) - 40 * Math.sin(3 * u);
                return d.set(x, y, z).multiplyScalar(this.scale / 300);
            }
        }
        class TorusKnotCurve extends THREE.Curve {
            constructor(scale = 1, p = 2, q = 3) { super(); this.scale = scale; this.p = p; this.q = q; }
            getPoint(t, d = new THREE.Vector3()) {
                const u = t * Math.PI * 2 * this.p;
                const cu = Math.cos(u), su = Math.sin(u);
                const quOverP = u * (this.q / this.p);
                const cs = Math.cos(quOverP), sn = Math.sin(quOverP);
                const r = (2 + cs) * 0.5 * this.scale;
                return d.set(r * cu, r * su, sn * 0.5 * this.scale);
            }
        }

        // ---- Scene Setup ----
        let scene, camera, renderer, controls;
        let knotMesh, wireframe, curve, frames;
        let tPos = 0;

        const params = {
            knot: 'Granny Knot',
            scale: 1,
            thickness: 0.2,
            extrusionSegments: 200,
            radiusSegments: 12,
            showSurface: true,
            showEdges: true,
            firstPerson: false,
            centerCamera: false
        };

        const CAMERA_SPEED = 0.025;  // slower
        const clock = new THREE.Clock();
        let pauseMovement = false;

        init();
        animate();

        function init() {
            scene = new THREE.Scene();
            camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 1000);
            resetCamera();
            renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setSize(innerWidth, innerHeight);
            document.body.appendChild(renderer.domElement);

            scene.add(new THREE.AmbientLight(0xffffff, 0.2));
            const dl = new THREE.DirectionalLight(0xffffff, 1);
            dl.position.set(5, 10, 7.5);
            scene.add(dl);

            controls = new OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;

            const UI = {
                knot: document.getElementById('knot'),
                scale: document.getElementById('scale'),
                thickness: document.getElementById('thickness'),
                extrude: document.getElementById('extrusionSegments'),
                radius: document.getElementById('radiusSegments'),
                showSurface: document.getElementById('showSurface'),
                showEdges: document.getElementById('showEdges'),
                firstPerson: document.getElementById('firstPerson'),
                centerCamera: document.getElementById('centerCamera'),
                scaleVal: document.getElementById('scaleVal'),
                thicknessVal: document.getElementById('thicknessVal'),
                extrudeVal: document.getElementById('extrudeVal'),
                radiusVal: document.getElementById('radiusVal')
            };

            Object.values(UI).forEach(el => {
                if (el.tagName !== 'SPAN') {
                    el.addEventListener('pointerdown', () => pauseMovement = true);
                    el.addEventListener('pointerup', () => pauseMovement = false);
                }
            });

            UI.knot.value = params.knot;
            UI.knot.onchange = () => { params.knot = UI.knot.value; rebuild(); };

            UI.scale.oninput = () => {
                params.scale = +UI.scale.value;
                UI.scaleVal.textContent = params.scale.toFixed(2);
                rebuild();
            };
            UI.thickness.oninput = () => {
                params.thickness = +UI.thickness.value;
                UI.thicknessVal.textContent = params.thickness.toFixed(2);
                rebuild();
            };
            UI.extrude.oninput = () => {
                params.extrusionSegments = +UI.extrude.value;
                UI.extrudeVal.textContent = params.extrusionSegments;
                rebuild();
            };
            UI.radius.oninput = () => {
                params.radiusSegments = +UI.radius.value;
                UI.radiusVal.textContent = params.radiusSegments;
                rebuild();
            };

            UI.showSurface.onchange = () => {
                params.showSurface = UI.showSurface.checked;
                if (knotMesh) knotMesh.visible = params.showSurface;
            };
            UI.showEdges.onchange = () => {
                params.showEdges = UI.showEdges.checked;
                if (wireframe) wireframe.visible = params.showEdges;
            };
            UI.firstPerson.onchange = () => {
                params.firstPerson = UI.firstPerson.checked;
                controls.enabled = !params.firstPerson;
                if (!params.firstPerson) resetCamera();
            };
            UI.centerCamera.onchange = () => {
                params.centerCamera = UI.centerCamera.checked;
            };

            rebuild();
            window.addEventListener('resize', onResize);
        }

        function resetCamera() {
            camera.position.set(0, 0, 10);
            camera.up.set(0, 1, 0);
            if (controls) {
                controls.target.set(0, 0, 0);
                controls.update();
            }
        }

        function rebuild() {
            if (knotMesh) {
                scene.remove(knotMesh);
                knotMesh.geometry.dispose(); knotMesh.material.dispose();
            }
            if (wireframe) {
                scene.remove(wireframe);
                wireframe.geometry.dispose(); wireframe.material.dispose();
            }

            let p = 1;
            switch (params.knot) {
                case 'Granny Knot':
                    curve = new GrannyKnotCurve(params.scale * 6); p = 1; break;
                case 'Trefoil Knot':
                    curve = new TorusKnotCurve(params.scale * 2, 2, 3); p = 2; break;
                case 'Torus Knot':
                    curve = new TorusKnotCurve(params.scale * 2, 3, 4); p = 3; break;
                case 'Cinquefoil Knot':
                    curve = new TorusKnotCurve(params.scale * 2, 2, 5); p = 2; break;
            }

            let segs = Math.floor(params.extrusionSegments);
            if (segs % p !== 0) segs += p - (segs % p);

            frames = curve.computeFrenetFrames(segs, true);

            const geo = new THREE.TubeGeometry(curve, segs, params.thickness, Math.floor(params.radiusSegments), true);
            const mat = new THREE.MeshPhongMaterial({
                color: 0x80bbff, emissive: 0x80bbff, shininess: 10,
                side: THREE.DoubleSide,
                polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1
            });
            knotMesh = new THREE.Mesh(geo, mat);
            knotMesh.visible = params.showSurface;
            scene.add(knotMesh);

            const wf = new THREE.WireframeGeometry(geo);
            wireframe = new THREE.LineSegments(wf, new THREE.LineBasicMaterial({ color: 0x0075ff }));
            wireframe.visible = params.showEdges;
            wireframe.renderOrder = 1;
            scene.add(wireframe);

            tPos = 0;
            clock.start();
        }

        function onResize() {
            camera.aspect = innerWidth / innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(innerWidth, innerHeight);
        }

        function animate() {
            requestAnimationFrame(animate);

            if (params.firstPerson && frames) {
                const dt = clock.getDelta();
                if (!pauseMovement) {
                    tPos = (tPos + CAMERA_SPEED * dt) % 1;
                }
                const pos = curve.getPoint(tPos);
                const len = frames.tangents.length;
                const ft = tPos * len;
                const i0 = Math.floor(ft) % len, i1 = (i0 + 1) % len;
                const alpha = ft - Math.floor(ft);

                const T = frames.tangents[i0].clone().lerp(frames.tangents[i1], alpha).normalize();
                const N = frames.normals[i0].clone().lerp(frames.normals[i1], alpha).normalize();
                const B = frames.binormals[i0].clone().lerp(frames.binormals[i1], alpha).normalize();

                const offset = params.centerCamera ? 0 : params.thickness * 2.2;
                camera.position.copy(pos).add(B.clone().multiplyScalar(offset));
                camera.up.copy(B);

                const look = pos.clone()
                    .add(T.clone().multiplyScalar(0.5))
                    .add(B.clone().multiplyScalar(offset));
                camera.lookAt(look);

            } else {
                controls.update();
            }

            renderer.render(scene, camera);
        }
    