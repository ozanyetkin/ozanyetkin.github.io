const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Resize the canvas to fill the window.
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// Easing functions.
// For movement: exponential ease-out.
function easeOutExpo(t) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}
// For size shrink: we force the progress to double (up to 1) so that
// the circles start shrinking earlier.
function easeOutSize(t) {
  // Multiply progress by 2 (capped at 1) before applying the power.
  let adjusted = Math.min(1, 2 * t);
  return 1 - Math.pow(adjusted, 0.7);
}
// White circle easing (reverted to original easeOutCubic).
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

// Arrays to hold our particles and white hollow circles.
let particles = [];
let whiteCircles = [];

// Colors as in the original code.
const colors = ['#FF1461', '#18FF92', '#5A87FF', '#FBF38C'];

// Variables to track mouse clicks for "charging" the explosion.
let isMouseDown = false,
  pressStartTime = 0,
  clickX = 0,
  clickY = 0;

canvas.addEventListener("mousedown", (e) => {
  isMouseDown = true;
  pressStartTime = Date.now();
  clickX = e.clientX;
  clickY = e.clientY;
});

canvas.addEventListener("mouseup", (e) => {
  if (isMouseDown) {
    let holdDuration = Date.now() - pressStartTime;
    spawnFireworks(clickX, clickY, holdDuration);
    isMouseDown = false;
  }
});

// Also trigger an explosion if the mouse leaves the canvas while pressed.
canvas.addEventListener("mouseleave", (e) => {
  if (isMouseDown) {
    let holdDuration = Date.now() - pressStartTime;
    spawnFireworks(clickX, clickY, holdDuration);
    isMouseDown = false;
  }
});

// Spawns a white hollow circle and colorful particles.
function spawnFireworks(x, y, holdDuration) {
  // "Charge" factor: holding longer (up to 2 seconds) boosts the effect.
  let charge = Math.min(holdDuration / 1000, 2);

  // White hollow circle (stays smaller than the particles' spread).
  whiteCircles.push({
    x: x,
    y: y,
    life: 0,
    maxLife: 0.8 + 0.4 * charge, // Duration in seconds.
    maxRadius: 100 + 150 * charge // A bit smaller than the particles' full spread.
  });

  // Create colorful particles.
  let numParticles = 30 + Math.floor(Math.random() * 10); // 30 to 39 particles.
  for (let i = 0; i < numParticles; i++) {
    let angle = Math.random() * Math.PI * 2;
    // Speed is high enough to allow a larger spread, but the final displacement is halved.
    let speed = (150 + Math.random() * 150) * (1 + charge);
    particles.push({
      // Store the starting position.
      x0: x,
      y0: y,
      vx: speed * Math.cos(angle),
      vy: speed * Math.sin(angle),
      radius: 15 + Math.random() * 10, // Original: 20 to 30.
      life: 0,
      maxLife: 1.0 + Math.random() * 0.2, // Faster particle animation.
      color: colors[Math.floor(Math.random() * colors.length)]
    });
  }
}

// The animation loop.
let lastTimestamp = 0;

function animate(timestamp) {
  if (!lastTimestamp) lastTimestamp = timestamp;
  let dt = (timestamp - lastTimestamp) / 1000; // Convert ms to seconds.
  lastTimestamp = timestamp;

  // Clear the canvas.
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Update and draw white hollow circles.
  for (let i = whiteCircles.length - 1; i >= 0; i--) {
    let circle = whiteCircles[i];
    circle.life += dt;
    let progress = circle.life / circle.maxLife;
    if (progress >= 1) {
      whiteCircles.splice(i, 1);
      continue;
    }
    let easedProgress = easeOutCubic(progress);
    let currentRadius = easedProgress * circle.maxRadius;
    let alpha = 1 - easedProgress; // Fade out with easing.
    ctx.beginPath();
    ctx.arc(circle.x, circle.y, currentRadius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }

  // Update and draw colorful particles.
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.life += dt;
    let progress = p.life / p.maxLife;
    if (progress >= 1) {
      particles.splice(i, 1);
      continue;
    }
    // Compute movement: using easeOutExpo so particles slow down as they approach the end.
    let moveFactor = easeOutExpo(progress);
    // Revert displacement multiplier to original 0.5.
    let currentX = p.x0 + (p.vx * p.maxLife * moveFactor * 0.5);
    let currentY = p.y0 + (p.vy * p.maxLife * moveFactor * 0.5);

    // Compute size: use the new easing so that shrinkage starts earlier.
    let scale = easeOutSize(progress);
    let currentRadius = p.radius * scale;

    ctx.beginPath();
    ctx.arc(currentX, currentY, currentRadius, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
  }

  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);