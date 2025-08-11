// Mobile detection
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

let scene, camera, renderer;
let group;
let cubes = [];
const GRID_SIZE = 10;
const TOTAL_CUBES = GRID_SIZE * GRID_SIZE * GRID_SIZE;

// Adjust spacing and cube size based on device type
const SPACING = isMobile ? 8 : 10; // Smaller spacing on mobile
const CUBE_SIZE = isMobile ? 5 : 6; // Smaller cubes on mobile

const positions = [];

// Group rotation speeds (moderate so it's visible but not too fast).
const groupSpeed = {
  x: 0.001,
  y: 0.002,
  z: 0.001
};

// Touch interaction variables
let isTouch = false;
let touchStartX = 0;
let touchStartY = 0;
let rotationVelocityX = 0;
let rotationVelocityY = 0;
let autoRotate = true;

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
  
  // Adjust camera position based on device type
  if (isMobile) {
    camera.position.set(0, 0, 200); // Move camera further back on mobile
  } else {
    camera.position.set(0, 0, 150);
  }

  renderer = new THREE.WebGLRenderer({
    antialias: !isMobile, // Disable antialiasing on mobile for better performance
    powerPreference: "high-performance"
  });
  
  // Set pixel ratio for high DPI displays but limit on mobile
  const pixelRatio = isMobile ? Math.min(window.devicePixelRatio, 2) : window.devicePixelRatio;
  renderer.setPixelRatio(pixelRatio);
  
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

  setupControls();
  window.addEventListener('resize', onWindowResize, false);
  animate();
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function setupControls() {
  const canvas = renderer.domElement;

  // Touch events for mobile
  canvas.addEventListener('touchstart', onTouchStart, { passive: false });
  canvas.addEventListener('touchmove', onTouchMove, { passive: false });
  canvas.addEventListener('touchend', onTouchEnd, { passive: false });

  // Mouse events for desktop
  canvas.addEventListener('mousedown', onMouseDown, false);
  canvas.addEventListener('mousemove', onMouseMove, false);
  canvas.addEventListener('mouseup', onMouseUp, false);
}

function onTouchStart(event) {
  event.preventDefault();
  isTouch = true;
  autoRotate = false;
  
  if (event.touches.length === 1) {
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
  }
}

function onTouchMove(event) {
  event.preventDefault();
  
  if (isTouch && event.touches.length === 1) {
    const deltaX = event.touches[0].clientX - touchStartX;
    const deltaY = event.touches[0].clientY - touchStartY;
    
    rotationVelocityY = deltaX * 0.01;
    rotationVelocityX = deltaY * 0.01;
    
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
  }
}

function onTouchEnd(event) {
  event.preventDefault();
  isTouch = false;
  
  // Resume auto rotation after a delay
  setTimeout(() => {
    autoRotate = true;
  }, 2000);
}

function onMouseDown(event) {
  isTouch = true;
  autoRotate = false;
  touchStartX = event.clientX;
  touchStartY = event.clientY;
}

function onMouseMove(event) {
  if (isTouch) {
    const deltaX = event.clientX - touchStartX;
    const deltaY = event.clientY - touchStartY;
    
    rotationVelocityY = deltaX * 0.01;
    rotationVelocityX = deltaY * 0.01;
    
    touchStartX = event.clientX;
    touchStartY = event.clientY;
  }
}

function onMouseUp(event) {
  isTouch = false;
  
  // Resume auto rotation after a delay
  setTimeout(() => {
    autoRotate = true;
  }, 2000);
}

function animate() {
  requestAnimationFrame(animate);

  const time = clock.getElapsedTime();

  // Apply touch/mouse rotation or auto rotation
  if (autoRotate) {
    // Rotate the entire group slightly (auto rotation)
    group.rotation.x += groupSpeed.x;
    group.rotation.y += groupSpeed.y;
    group.rotation.z += groupSpeed.z;
  } else {
    // Apply user interaction rotation
    group.rotation.x += rotationVelocityX * 0.1;
    group.rotation.y += rotationVelocityY * 0.1;
    
    // Apply damping to the rotation velocity
    rotationVelocityX *= 0.95;
    rotationVelocityY *= 0.95;
  }

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