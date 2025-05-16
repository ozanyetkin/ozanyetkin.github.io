let scene, camera, renderer;
let group;
let cubes = [];
const GRID_SIZE = 10;
const TOTAL_CUBES = GRID_SIZE * GRID_SIZE * GRID_SIZE;
const SPACING = 10;
const CUBE_SIZE = 6;
const positions = [];

// Group rotation speeds (moderate so it's visible but not too fast).
const groupSpeed = {
  x: 0.001,
  y: 0.002,
  z: 0.001
};

// A clock to measure time
const clock = new THREE.Clock();

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
  );
  camera.position.set(0, 0, 150);

  renderer = new THREE.WebGLRenderer({
    antialias: true
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  group = new THREE.Group();
  scene.add(group);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(0, 1, 1);
  scene.add(directionalLight);

  const geometry = new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE);

  for (let x = 0; x < GRID_SIZE; x++) {
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let z = 0; z < GRID_SIZE; z++) {
        const idx = x + GRID_SIZE * y + GRID_SIZE * GRID_SIZE * z;
        const hue = (idx / (TOTAL_CUBES - 1)) * 360;
        const color = new THREE.Color(`hsl(${hue}, 100%, 50%)`);
        const material = new THREE.MeshStandardMaterial({
          color: color
        });

        const cube = new THREE.Mesh(geometry, material);
        cube.position.set(
          SPACING * (x - (GRID_SIZE - 1) / 2),
          SPACING * (y - (GRID_SIZE - 1) / 2),
          SPACING * (z - (GRID_SIZE - 1) / 2)
        );

        group.add(cube);
        cubes.push(cube);
        positions.push({
          xIndex: x,
          yIndex: y,
          zIndex: z
        });
      }
    }
  }

  window.addEventListener('resize', onWindowResize, false);
  animate();
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);

  const time = clock.getElapsedTime();

  // Rotate the entire group slightly
  group.rotation.x += groupSpeed.x;
  group.rotation.y += groupSpeed.y;
  group.rotation.z += groupSpeed.z;

  // Update each cube's rotation using the simpler wave method:
  for (let i = 0; i < TOTAL_CUBES; i++) {
    const {
      xIndex,
      yIndex,
      zIndex
    } = positions[i];
    // Compute the wave based on grid index and time
    const wave = Math.sin(xIndex / 4 + time) +
      Math.sin(yIndex / 4 + time) +
      Math.sin(zIndex / 4 + time);

    cubes[i].rotation.y = wave;
    cubes[i].rotation.z = wave * 2;
  }

  renderer.render(scene, camera);
}

init();