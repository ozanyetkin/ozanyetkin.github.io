
import * as THREE from 'three';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';

let scene, camera, renderer, city;
let mouseX = 0, mouseY = 0;
const buildings = [], beams = [];
let snowGeo, snowVel = [];

init();
animate();

function init() {
    // SCENE & FOG
    const pinkRed = 0xff0735;
    scene = new THREE.Scene();
    scene.background = new THREE.Color(pinkRed);
    scene.fog = new THREE.Fog(pinkRed, 10, 200);
    scene.fog.color.convertSRGBToLinear();

    // CAMERA
    camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 1, 500);
    camera.position.set(0, 25, 200);
    camera.lookAt(0, 10, 0);

    // RENDERER
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(innerWidth, innerHeight);
    document.body.appendChild(renderer.domElement);

    // LIGHTS
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const dir = new THREE.DirectionalLight(0xffffff, 0.6);
    dir.position.set(10, 20, 10);
    scene.add(dir);

    // CITY GROUP
    city = new THREE.Group();
    scene.add(city);

    const cityArea = 300, half = cityArea / 2;
    const styles = ['vertical', 'horizontal', 'square'];

    // REFLECTIVE GROUND
    const groundGeo = new THREE.PlaneGeometry(cityArea * 10, cityArea * 10);
    // Create reflector with blur options (requires a Reflector implementation that supports blur)
    const reflector = new Reflector(groundGeo, {
        clipBias: 0.003,
        textureWidth: innerWidth * devicePixelRatio,
        textureHeight: innerHeight * devicePixelRatio,
        color: 0x999999,
    });
    reflector.rotation.x = -Math.PI / 2;
    city.add(reflector);

    // BLACK SURFACE ABOVE REFLECTIVE GROUND
    const blackSurface = new THREE.Mesh(
        groundGeo,
        new THREE.MeshStandardMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.9
        })
    );
    blackSurface.rotation.x = -Math.PI / 2;
    blackSurface.position.y = 0.1; // Slight offset above the reflective ground
    city.add(blackSurface);

    // BUILDINGS
    for (let i = 0; i < 300; i++) {
        const w = THREE.MathUtils.randFloat(5, 10),
            d = THREE.MathUtils.randFloat(5, 10),
            h = THREE.MathUtils.randFloat(12, 45),
            style = styles[Math.floor(Math.random() * styles.length)];
        const geometry = new THREE.BoxGeometry(w, h, d);
        const mesh = new THREE.Mesh(
            geometry,
            new THREE.MeshStandardMaterial({ color: 0x000000 })
        );
        mesh.position.set(
            THREE.MathUtils.randFloatSpread(cityArea),
            h / 2,
            THREE.MathUtils.randFloatSpread(cityArea)
        );
        city.add(mesh);
        buildings.push({ mesh, w, d, h, style });

        // Add visible edges
        const edges = new THREE.EdgesGeometry(geometry);
        const line = new THREE.LineSegments(
            edges,
            new THREE.LineBasicMaterial({ color: 0x333333 })
        );
        line.position.copy(mesh.position);
        city.add(line);
    }

    // WINDOW INSTANCES (two random faces, minus one column to avoid overflow)
    const windowTransforms = [];
    buildings.forEach(({ mesh, w, d, h, style }) => {
        // define face descriptors
        const faces = [
            // left & right faces have width = depth (d)
            { faceW: d, faceH: h, base: new THREE.Vector3(w / 2, 0, 0), rotY: -Math.PI / 2 },
            { faceW: d, faceH: h, base: new THREE.Vector3(-w / 2, 0, 0), rotY: Math.PI / 2 },
            // front & back faces have width = width (w)
            { faceW: w, faceH: h, base: new THREE.Vector3(0, 0, d / 2), rotY: 0 },
            { faceW: w, faceH: h, base: new THREE.Vector3(0, 0, -d / 2), rotY: Math.PI }
        ];

        // shuffle & pick first three
        for (let i = faces.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [faces[i], faces[j]] = [faces[j], faces[i]];
        }
        faces.slice(0, 3).forEach(({ faceW, faceH, base, rotY }) => {
            const mW = faceW * 0.1, mH = faceH * 0.1;
            const usableW = faceW - 2 * mW, usableH = faceH - 2 * mH;
            let cols = Math.floor(usableW / 2) - 1;
            let rows = Math.floor(usableH / 2);
            cols = Math.max(1, cols);
            rows = Math.max(1, rows);
            const cellW = usableW / cols, cellH = usableH / rows;

            // window size
            let winW, winH;
            if (style === 'vertical') { winW = cellW * 0.3; winH = cellH * 0.9; }
            else if (style === 'horizontal') { winW = cellW * 0.9; winH = cellH * 0.3; }
            else { winW = cellW * 0.5; winH = cellH * 0.5; }

            const quat = new THREE.Quaternion().setFromEuler(
                new THREE.Euler(0, rotY, 0)
            );

            for (let col = 0; col < cols; col++) {
                for (let row = 0; row < rows; row++) {
                    const u = -faceW / 2 + mW + cellW * (col + 0.5);
                    const v = -faceH / 2 + mH + cellH * (row + 0.5);
                    // cull if any corner would exit the face
                    if (
                        u - winW / 2 < -faceW / 2 || u + winW / 2 > faceW / 2 ||
                        v - winH / 2 < -faceH / 2 || v + winH / 2 > faceH / 2
                    ) continue;

                    // local face position
                    const local = new THREE.Vector3();
                    if (Math.abs(Math.abs(rotY) - Math.PI / 2) < 0.001) {
                        local.set(base.x + Math.sign(base.x) * 0.01, v, u);
                    } else {
                        local.set(u, v, base.z + Math.sign(base.z) * 0.01);
                    }
                    const worldPos = local.add(mesh.position);
                    windowTransforms.push({
                        pos: worldPos,
                        quat,
                        scale: new THREE.Vector3(winW, winH, 1)
                    });
                }
            }
        });
    });

    // build InstancedMesh for windows (yellow, emissive)
    const winGeo = new THREE.PlaneGeometry(1, 1);
    const winMat = new THREE.MeshLambertMaterial({
        color: 0x000000,
        emissive: 0xfdd835,
        emissiveIntensity: 1,
        side: THREE.DoubleSide      // double sided
    });

    const winInst = new THREE.InstancedMesh(winGeo, winMat, windowTransforms.length);
    const mat4 = new THREE.Matrix4();
    windowTransforms.forEach((t, i) => {
        mat4.compose(t.pos, t.quat, t.scale);
        winInst.setMatrixAt(i, mat4);
    });
    city.add(winInst);
    winInst.instanceMatrix.needsUpdate = true;   // ← so Three.js actually pushes your matrices up to the GPU

    // LIGHT BEAMS
    const beamMat = new THREE.MeshBasicMaterial({ color: 0xfdd835, transparent: true, opacity: 0.8 });
    for (let i = 0; i < 40; i++) {
        const horizontal = Math.random() < 0.5;
        const len = THREE.MathUtils.randFloat(5, 15);
        const t = 0.1, y = THREE.MathUtils.randFloat(5, 35);
        let geo, m, speed;
        if (horizontal) {
            geo = new THREE.BoxGeometry(len, t, t);
            m = new THREE.Mesh(geo, beamMat);
            m.position.set(-half, y, THREE.MathUtils.randFloatSpread(cityArea));
            speed = THREE.MathUtils.randFloat(1, 3);
        } else {
            geo = new THREE.BoxGeometry(t, t, len);
            m = new THREE.Mesh(geo, beamMat);
            m.position.set(THREE.MathUtils.randFloatSpread(cityArea), y, -half);
            speed = THREE.MathUtils.randFloat(1, 3);
        }
        m.userData = { horizontal, speed, half };
        city.add(m);
        beams.push(m);
    }

    // SNOW PARTICLES (tiny, yellow, slow & random)
    const count = 500;
    snowGeo = new THREE.BufferGeometry();
    const posArr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        posArr[3 * i] = THREE.MathUtils.randFloatSpread(cityArea);
        posArr[3 * i + 1] = THREE.MathUtils.randFloat(0, 60);
        posArr[3 * i + 2] = THREE.MathUtils.randFloatSpread(cityArea);
        snowVel[i] = new THREE.Vector3(
            THREE.MathUtils.randFloat(-0.05, 0.05),
            THREE.MathUtils.randFloat(-0.02, -0.1),
            THREE.MathUtils.randFloat(-0.05, 0.05)
        );
    }
    snowGeo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
    const snowMat = new THREE.PointsMaterial({
        color: 0xfdd835, size: 0.2, sizeAttenuation: true
    });
    city.add(new THREE.Points(snowGeo, snowMat));

    // EVENTS
    window.addEventListener('resize', onResize);
    document.addEventListener('mousemove', e => {
        mouseX = (e.clientX / innerWidth) - 0.5;
        mouseY = (e.clientY / innerHeight) - 0.5;
    });
}

function onResize() {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    // rotate city, clamp pitch to never see under ground
    city.rotation.y += (mouseX * Math.PI * 0.5 - city.rotation.y) * 0.05;
    city.rotation.x += (-mouseY * Math.PI * 0.2 - city.rotation.x) * 0.05;
    city.rotation.x = THREE.MathUtils.clamp(city.rotation.x, 0, 0.2);

    // move & wrap beams
    beams.forEach(b => {
        const { horizontal, speed, half } = b.userData;
        if (horizontal) {
            b.position.x += speed;
            if (b.position.x > half) b.position.x = -half;
        } else {
            b.position.z += speed;
            if (b.position.z > half) b.position.z = -half;
        }
    });

    // snow drift & wrap
    const pos = snowGeo.attributes.position.array;
    const area = 200, hmax = 60;
    for (let i = 0; i < snowVel.length; i++) {
        pos[3 * i] += snowVel[i].x;
        pos[3 * i + 1] += snowVel[i].y;
        pos[3 * i + 2] += snowVel[i].z;
        if (pos[3 * i + 1] < 0) pos[3 * i + 1] = hmax;
        if (pos[3 * i] < -area / 2) pos[3 * i] = area / 2;
        if (pos[3 * i] > area / 2) pos[3 * i] = -area / 2;
        if (pos[3 * i + 2] < -area / 2) pos[3 * i + 2] = area / 2;
        if (pos[3 * i + 2] > area / 2) pos[3 * i + 2] = -area / 2;
    }
    snowGeo.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
}
