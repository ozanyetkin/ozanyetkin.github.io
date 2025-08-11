const SEPARATION = 100,
  AMOUNTX = 50,
  AMOUNTY = 50;
let container, camera, scene, renderer;
let particles, count = 0;
let mouseX = 0,
  mouseY = 0;
let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;

// Mobile-specific variables
let isMobile = false;
let deviceOrientationSupported = false;
let initialOrientation = { alpha: 0, beta: 0, gamma: 0 };
let lastTouchTime = 0;
let touchSensitivity = 1.5;

// Detect mobile device
function detectMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         ('ontouchstart' in window) ||
         (navigator.maxTouchPoints > 0);
}

// Initialize device orientation if available
function initDeviceOrientation() {
  if (typeof DeviceOrientationEvent !== 'undefined') {
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      // iOS 13+ permission request
      DeviceOrientationEvent.requestPermission()
        .then(response => {
          if (response === 'granted') {
            setupDeviceOrientation();
          }
        })
        .catch(console.error);
    } else {
      // Android and older iOS
      setupDeviceOrientation();
    }
  }
}

function setupDeviceOrientation() {
  deviceOrientationSupported = true;
  window.addEventListener('deviceorientation', onDeviceOrientation, false);
  
  // Store initial orientation as reference
  setTimeout(() => {
    window.addEventListener('deviceorientation', function(event) {
      if (initialOrientation.alpha === 0) {
        initialOrientation.alpha = event.alpha || 0;
        initialOrientation.beta = event.beta || 0;
        initialOrientation.gamma = event.gamma || 0;
      }
    }, { once: true });
  }, 1000);
}

function onDeviceOrientation(event) {
  if (!deviceOrientationSupported || !isMobile) return;
  
  const alpha = event.alpha || 0;
  const beta = event.beta || 0;
  const gamma = event.gamma || 0;
  
  // Calculate relative movement from initial position
  const deltaGamma = (gamma - initialOrientation.gamma) * 10;
  const deltaBeta = (beta - initialOrientation.beta) * 10;
  
  // Apply orientation to camera movement
  mouseX = Math.max(-windowHalfX, Math.min(windowHalfX, deltaGamma));
  mouseY = Math.max(-windowHalfY, Math.min(windowHalfY, deltaBeta));
}

init();

function init() {
  // Detect if we're on mobile
  isMobile = detectMobile();
  
  container = document.createElement('div');
  document.body.appendChild(container);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
  camera.position.z = isMobile ? 1200 : 1000; // Slightly further back on mobile

  scene = new THREE.Scene();

  // Adjust particle count for mobile performance
  const amountX = isMobile ? Math.min(AMOUNTX, 30) : AMOUNTX;
  const amountY = isMobile ? Math.min(AMOUNTY, 30) : AMOUNTY;
  
  // Create particles
  const numParticles = amountX * amountY;
  const positions = new Float32Array(numParticles * 3);
  const scales = new Float32Array(numParticles);

  let i = 0,
    j = 0;
  for (let ix = 0; ix < amountX; ix++) {
    for (let iy = 0; iy < amountY; iy++) {
      positions[i] = ix * SEPARATION - ((amountX * SEPARATION) / 2);
      positions[i + 1] = 0;
      positions[i + 2] = iy * SEPARATION - ((amountY * SEPARATION) / 2);
      scales[j] = 1;
      i += 3;
      j++;
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('scale', new THREE.BufferAttribute(scales, 1));

  const material = new THREE.ShaderMaterial({
    uniforms: {
      color: {
        value: new THREE.Color(0xffffff)
      },
    },
    vertexShader: document.getElementById('vertexshader').textContent,
    fragmentShader: document.getElementById('fragmentshader').textContent,
  });

  particles = new THREE.Points(geometry, material);
  scene.add(particles);

  renderer = new THREE.WebGLRenderer({
    antialias: !isMobile, // Disable antialiasing on mobile for better performance
    alpha: true,
    powerPreference: isMobile ? "low-power" : "high-performance"
  });
  
  renderer.setPixelRatio(isMobile ? Math.min(window.devicePixelRatio, 2) : window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  // Enhanced touch handling
  container.style.touchAction = 'none';
  container.addEventListener('pointermove', onPointerMove);
  container.addEventListener('touchstart', onTouchStart, { passive: false });
  container.addEventListener('touchmove', onTouchMove, { passive: false });
  container.addEventListener('touchend', onTouchEnd, { passive: false });
  
  window.addEventListener('resize', onWindowResize);
  window.addEventListener('orientationchange', onOrientationChange);
  
  // Initialize device orientation for mobile
  if (isMobile) {
    initDeviceOrientation();
    touchSensitivity = window.innerWidth < 768 ? 2.0 : 1.5;
  }

  animate();
}

function onWindowResize() {
  windowHalfX = window.innerWidth / 2;
  windowHalfY = window.innerHeight / 2;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  
  // Update touch sensitivity based on screen size
  if (isMobile) {
    touchSensitivity = window.innerWidth < 768 ? 2.0 : 1.5;
  }
}

function onOrientationChange() {
  // Reset orientation reference after orientation change
  setTimeout(() => {
    initialOrientation = { alpha: 0, beta: 0, gamma: 0 };
    onWindowResize();
  }, 500);
}

function onPointerMove(event) {
  if (event.isPrimary === false) return;
  
  const sensitivity = isMobile ? touchSensitivity : 1.0;
  mouseX = (event.clientX - windowHalfX) * sensitivity;
  mouseY = (event.clientY - windowHalfY) * sensitivity;
}

function onTouchStart(event) {
  event.preventDefault();
  lastTouchTime = Date.now();
}

function onTouchMove(event) {
  event.preventDefault();
  
  if (event.touches.length === 1) {
    const touch = event.touches[0];
    mouseX = (touch.clientX - windowHalfX) * touchSensitivity;
    mouseY = (touch.clientY - windowHalfY) * touchSensitivity;
  } else if (event.touches.length === 2) {
    // Handle pinch gesture for zoom (optional enhancement)
    const touch1 = event.touches[0];
    const touch2 = event.touches[1];
    const centerX = (touch1.clientX + touch2.clientX) / 2;
    const centerY = (touch1.clientY + touch2.clientY) / 2;
    
    mouseX = (centerX - windowHalfX) * touchSensitivity;
    mouseY = (centerY - windowHalfY) * touchSensitivity;
  }
}

function onTouchEnd(event) {
  event.preventDefault();
  
  // Smooth return to center if no touches
  if (event.touches.length === 0) {
    const currentTime = Date.now();
    if (currentTime - lastTouchTime < 100) {
      // Quick tap - smooth return to center
      const returnToCenter = () => {
        mouseX *= 0.95;
        mouseY *= 0.95;
        if (Math.abs(mouseX) > 1 || Math.abs(mouseY) > 1) {
          requestAnimationFrame(returnToCenter);
        } else {
          mouseX = 0;
          mouseY = 0;
        }
      };
      setTimeout(returnToCenter, 200);
    }
  }
}

function animate() {
  requestAnimationFrame(animate);
  render();
}

function render() {
  const dampingFactor = isMobile ? 0.03 : 0.05; // Smoother movement on mobile
  camera.position.x += (mouseX - camera.position.x) * dampingFactor;
  camera.position.y += (-mouseY - camera.position.y) * dampingFactor;
  camera.lookAt(scene.position);

  const positions = particles.geometry.attributes.position.array;
  const scales = particles.geometry.attributes.scale.array;
  
  // Use the actual particle counts (may be reduced on mobile)
  const actualAmountX = isMobile ? Math.min(AMOUNTX, 30) : AMOUNTX;
  const actualAmountY = isMobile ? Math.min(AMOUNTY, 30) : AMOUNTY;
  
  let i = 0,
    j = 0;
  for (let ix = 0; ix < actualAmountX; ix++) {
    for (let iy = 0; iy < actualAmountY; iy++) {
      positions[i + 1] = (Math.sin((ix + count) * 0.3) * 50) +
        (Math.sin((iy + count) * 0.5) * 50);
      scales[j] = (Math.sin((ix + count) * 0.3) + 1) * 20 +
        (Math.sin((iy + count) * 0.5) + 1) * 20;
      i += 3;
      j++;
    }
  }

  particles.geometry.attributes.position.needsUpdate = true;
  particles.geometry.attributes.scale.needsUpdate = true;
  renderer.render(scene, camera);
  
  // Slower animation on mobile to preserve battery
  count += isMobile ? 0.08 : 0.1;
}