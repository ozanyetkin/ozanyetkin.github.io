// ----- Setup Canvas -----
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const width = canvas.width,
  height = canvas.height;

// ----- Global Settings -----
// Eight possible unit directions (horizontal, vertical, and diagonals)
const directions = [{
  dx: 1,
  dy: 0
}, {
  dx: -1,
  dy: 0
}, {
  dx: 0,
  dy: 1
}, {
  dx: 0,
  dy: -1
}, {
  dx: 1,
  dy: 1
}, {
  dx: -1,
  dy: -1
}, {
  dx: 1,
  dy: -1
}, {
  dx: -1,
  dy: 1
}];

// Returns a random pastel color (using HSL)
function randomPastelColor() {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 70%, 80%)`;
}

// Utility: In-place array shuffle.
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// ----- Self–Intersection Helpers -----
// Standard helper: check if point q lies on segment pr.
function onSegment(p, q, r) {
  return (q.x <= Math.max(p.x, r.x) + 1e-6 && q.x >= Math.min(p.x, r.x) - 1e-6 &&
    q.y <= Math.max(p.y, r.y) + 1e-6 && q.y >= Math.min(p.y, r.y) - 1e-6);
}

// Compute orientation of triplet (p, q, r):
// Returns 0 if collinear, 1 if clockwise, 2 if counterclockwise.
function orientation(p, q, r) {
  const val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
  if (Math.abs(val) < 1e-6) return 0;
  return (val > 0) ? 1 : 2;
}

// Returns true if segment p1q1 and p2q2 intersect.
// (If they share an endpoint, we consider them non–intersecting.)
function segmentsIntersect(p1, q1, p2, q2) {
  // Check for shared endpoints.
  if ((p1.x === p2.x && p1.y === p2.y) ||
    (p1.x === q2.x && p1.y === q2.y) ||
    (q1.x === p2.x && q1.y === p2.y) ||
    (q1.x === q2.x && q1.y === q2.y)) {
    return false;
  }

  const o1 = orientation(p1, q1, p2);
  const o2 = orientation(p1, q1, q2);
  const o3 = orientation(p2, q2, p1);
  const o4 = orientation(p2, q2, q1);

  // General case.
  if (o1 !== o2 && o3 !== o4) return true;

  // Special Cases.
  if (o1 === 0 && onSegment(p1, p2, q1)) return true;
  if (o2 === 0 && onSegment(p1, q2, q1)) return true;
  if (o3 === 0 && onSegment(p2, p1, q2)) return true;
  if (o4 === 0 && onSegment(p2, q1, q2)) return true;

  return false;
}

// Checks whether adding a segment from the current head to candidate would cause self–intersection.
function causesSelfIntersection(pipe, candidate) {
  const pts = pipe.points;
  // Reject candidate if it matches any earlier point (except the current head).
  for (let i = 0; i < pts.length - 1; i++) {
    if (Math.hypot(candidate.x - pts[i].x, candidate.y - pts[i].y) < 1e-6) {
      return true;
    }
  }
  if (pts.length < 3) return false; // Too few segments to intersect.
  const last = pts[pts.length - 1];
  // Check every segment except the one directly adjacent to the current head.
  for (let i = 0; i < pts.length - 2; i++) {
    const segStart = pts[i];
    const segEnd = pts[i + 1];
    if (segmentsIntersect(segStart, segEnd, last, candidate)) {
      return true;
    }
  }
  return false;
}


// ----- Boundary Adjustment -----
// If candidate goes out of bounds, reflect the direction (simulate a bounce).
function adjustForBounds(pipe, candidate) {
  const last = pipe.points[pipe.points.length - 1];
  if (candidate.x < 0 || candidate.x >= width) {
    pipe.dx = -pipe.dx;
    candidate.x = last.x + pipe.dx * pipe.speed;
  }
  if (candidate.y < 0 || candidate.y >= height) {
    pipe.dy = -pipe.dy;
    candidate.y = last.y + pipe.dy * pipe.speed;
  }
  return candidate;
}

// ----- Pipe Object Creation -----
// Each pipe has a unique id, pastel color, random speed and thickness, and a persistent direction.
// Its body is a continuous polyline (an array of points). Its visible length oscillates.
function createPipe() {
  const thickness = Math.floor(Math.random() * 5) + 2; // 2–6 pixels
  const speed = Math.floor(Math.random() * 5) + 1; // 1–5 pixels per update
  const color = randomPastelColor();
  const r = Math.ceil(thickness / 2); // (not used for collision here)
  const x = Math.random() * width;
  const y = Math.random() * height;
  const initDir = directions[Math.floor(Math.random() * directions.length)];
  return {
    id: Math.floor(Math.random() * 1000000),
    color: color,
    thickness: thickness,
    speed: speed,
    r: r,
    dx: initDir.dx,
    dy: initDir.dy,
    points: [{
      x: x,
      y: y
    }],
    // Oscillation parameters for visible length:
    phaseTime: Math.random() * Math.PI * 2,
    minLength: 300 + Math.random() * 200, // ~300–500 pixels
    maxLength: 1000 + Math.random() * 500 // ~1000–1500 pixels
  };
}

const numPipes = 50;
const pipes = [];
for (let i = 0; i < numPipes; i++) {
  pipes.push(createPipe());
}

// ----- Polyline Length Utilities -----
// Compute total length of a pipe's polyline.
function computeTotalLength(pipe) {
  let total = 0;
  const pts = pipe.points;
  for (let i = 1; i < pts.length; i++) {
    total += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  }
  return total;
}

// Trim the tail (beginning of the array) until total length ≤ targetLength.
function trimPipe(pipe, targetLength) {
  while (pipe.points.length > 1 && computeTotalLength(pipe) > targetLength) {
    pipe.points.shift();
  }
}

// ----- Global Constant for Minimum Distance -----
const MIN_DISTANCE = 10; // pixels – adjust as needed

// ----- Helper: Distance from a Point to a Segment -----
function pointSegmentDistance(p, a, b) {
  const A = p.x - a.x;
  const B = p.y - a.y;
  const C = b.x - a.x;
  const D = b.y - a.y;
  const dot = A * C + B * D;
  const len_sq = C * C + D * D;
  let param = -1;
  if (len_sq !== 0) {
    param = dot / len_sq;
  }
  let xx, yy;
  if (param < 0) {
    xx = a.x;
    yy = a.y;
  } else if (param > 1) {
    xx = b.x;
    yy = b.y;
  } else {
    xx = a.x + param * C;
    yy = a.y + param * D;
  }
  const dx = p.x - xx;
  const dy = p.y - yy;
  return Math.sqrt(dx * dx + dy * dy);
}

// ----- Helper: Check if Candidate is Too Close to Existing Pipe -----
function isTooCloseToSelf(pipe, candidate, margin) {
  const pts = pipe.points;
  // Check candidate against all segments (except the last one where connection is expected).
  for (let i = 0; i < pts.length - 2; i++) {
    if (pointSegmentDistance(candidate, pts[i], pts[i + 1]) < margin) {
      return true;
    }
  }
  // Also check candidate against earlier vertices (except the last one).
  for (let i = 0; i < pts.length - 1; i++) {
    if (Math.hypot(candidate.x - pts[i].x, candidate.y - pts[i].y) < margin) {
      return true;
    }
  }
  return false;
}

// ----- Modified Self–Intersection Check -----
function causesSelfIntersection(pipe, candidate) {
  const pts = pipe.points;
  // Not enough segments to worry about intersections.
  if (pts.length < 3) return false;
  const last = pts[pts.length - 1];
  // Check if the new segment would intersect any earlier segment (except the immediate neighbor).
  for (let i = 0; i < pts.length - 2; i++) {
    if (segmentsIntersect(pts[i], pts[i + 1], last, candidate)) {
      return true;
    }
  }
  // Also, reject if the candidate passes too closely to the existing pipe.
  if (isTooCloseToSelf(pipe, candidate, MIN_DISTANCE)) {
    return true;
  }
  return false;
}

// ----- Updated Main Animation Loop -----
function update() {
  for (let pipe of pipes) {
    // If the pipe is marked as shrinking, remove points from its tail.
    if (pipe.shrinking) {
      if (pipe.points.length > 1) {
        pipe.points.shift();
      } else {
        // Pipe has shrunk completely; spawn a new pipe.
        if (pipe.points.length > 1) {
          pipe.points.shift();
        } else {
          let newPipe = createPipe();
          newPipe.shrinking = false; // explicitly ensure it's not shrinking
          Object.assign(pipe, newPipe);
        }

      }
      continue; // Skip normal extension.
    }

    const pts = pipe.points;
    const last = pts[pts.length - 1];

    // Compute candidate point using the current direction.
    let candidate = {
      x: last.x + pipe.dx * pipe.speed,
      y: last.y + pipe.dy * pipe.speed
    };
    candidate = adjustForBounds(pipe, candidate);

    // Check if candidate either intersects or comes too close to self.
    if (causesSelfIntersection(pipe, candidate)) {
      // Only try allowed directions (within 90° turn).
      const currentDir = {
        dx: pipe.dx,
        dy: pipe.dy
      };
      let allowed = directions.filter(d => (currentDir.dx * d.dx + currentDir.dy * d.dy) >= 0);
      shuffleArray(allowed);
      let found = false;
      for (let d of allowed) {
        let altCandidate = {
          x: last.x + d.dx * pipe.speed,
          y: last.y + d.dy * pipe.speed
        };
        altCandidate = adjustForBounds(pipe, altCandidate);
        if (!causesSelfIntersection(pipe, altCandidate)) {
          // Use this alternative direction.
          pipe.dx = d.dx;
          pipe.dy = d.dy;
          candidate = altCandidate;
          found = true;
          break;
        }
      }
      if (!found) {
        // No valid allowed move found; mark pipe for shrinking.
        pipe.shrinking = true;
        continue;
      }
    }

    // Extend the pipe with the candidate point.
    pts.push(candidate);

    // Occasionally change direction (ensuring turns ≤ 90°).
    if (Math.random() < 0.05) {
      const currentDir = {
        dx: pipe.dx,
        dy: pipe.dy
      };
      let allowed = directions.filter(d => (currentDir.dx * d.dx + currentDir.dy * d.dy) >= 0);
      if (allowed.length > 0) {
        const newDir = allowed[Math.floor(Math.random() * allowed.length)];
        pipe.dx = newDir.dx;
        pipe.dy = newDir.dy;
      }
    }

    // Advance oscillation phase and trim the pipe’s visible length.
    pipe.phaseTime += 0.05;
    const targetLength = pipe.minLength + (pipe.maxLength - pipe.minLength) *
      (0.5 + 0.5 * Math.sin(pipe.phaseTime));
    trimPipe(pipe, targetLength);
  }

  // Clear and redraw the canvas.
  ctx.clearRect(0, 0, width, height);
  const MIN_VISIBLE_LENGTH = 20; // Minimum total length required to render a pipe

  // Draw each pipe.
  for (let pipe of pipes) {
    // Skip if the pipe is too short.
    if (computeTotalLength(pipe) < MIN_VISIBLE_LENGTH) continue;

    const pts = pipe.points;
    if (pts.length < 2) continue;

    // Draw the black outline.
    ctx.strokeStyle = "black";
    const outlineWidth = pipe.thickness + 6;
    ctx.lineWidth = outlineWidth;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.stroke();

    // Draw the colored pipe.
    ctx.strokeStyle = pipe.color;
    ctx.lineWidth = pipe.thickness;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.stroke();
  }


  requestAnimationFrame(update);
}


update();