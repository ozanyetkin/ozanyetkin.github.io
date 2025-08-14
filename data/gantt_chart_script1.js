/*
  We assume a single-year range internally: Jan 1 to Dec 31 (year 2023),
  but we only display month/day in the UI.
*/
const chartStart = new Date(2023, 0, 1); // Jan 1
const chartEnd = new Date(2023, 11, 31); // Dec 31
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const totalDays = Math.round((chartEnd - chartStart) / MS_PER_DAY) + 1;

/* We'll render the chart in a 900px wide region, offset 50px from the left
   so January's boundary is clearly visible. */
const chartLeftOffset = 50;
let chartInnerWidth = 900;

// Function to get current chart dimensions based on screen size
function getChartDimensions() {
  const container = document.getElementById("chartContainer");
  const containerWidth = container.clientWidth;
  
  // Adjust chart dimensions for mobile
  if (window.innerWidth <= 480) {
    chartInnerWidth = Math.max(800, containerWidth - 100);
  } else if (window.innerWidth <= 768) {
    chartInnerWidth = Math.max(850, containerWidth - 100);
  } else {
    // Desktop: make chart content exactly 950px to align with 1000px total including offset
    chartInnerWidth = 950;
  }
  
  return chartInnerWidth;
}

/* 6 tasks total:
   - The first 3 appear in the first table (#taskTable1).
   - The next 3 appear in the second table (#taskTable2).
   All 6 tasks appear on the Gantt chart. */
let tasks = [
  // Table 1 tasks
  {
    name: "Design Phase",
    start: new Date(2023, 0, 15),
    end: new Date(2023, 2, 10)
  }, // Jan 15 - Mar 10
  {
    name: "Development",
    start: new Date(2023, 1, 1),
    end: new Date(2023, 5, 30)
  }, // Feb 1 - Jun 30
  {
    name: "Testing & QA",
    start: new Date(2023, 4, 15),
    end: new Date(2023, 8, 20)
  }, // May 15 - Sep 20

  // Table 2 tasks
  {
    name: "Deployment",
    start: new Date(2023, 5, 1),
    end: new Date(2023, 6, 15)
  }, // Jun 1 - Jul 15
  {
    name: "Documentation",
    start: new Date(2023, 6, 1),
    end: new Date(2023, 7, 15)
  }, // Jul 1 - Aug 15
  {
    name: "Maintenance",
    start: new Date(2023, 7, 1),
    end: new Date(2023, 11, 31)
  } // Aug 1 - Dec 31
];

/*
  Generate random "in-between" colors within the given palette:
    - Space Cadet (#2B2D42) => [43, 45, 66]
    - Cardinal (#C41E3A)    => [196, 30, 58]
    - Coral Red (#FF7F51)   => [255, 127, 81]
    
  We'll pick two distinct anchors, then pick a random alpha
  to blend between them for each task, so each task has a unique color.
*/
const colorAnchors = [
  [43, 45, 66], // Space Cadet
  [196, 30, 58], // Cardinal
  [255, 127, 81] // Coral Red
];

function getRandomColorInPalette() {
  // Pick two distinct anchors
  let idx1 = Math.floor(Math.random() * colorAnchors.length);
  let idx2;
  do {
    idx2 = Math.floor(Math.random() * colorAnchors.length);
  } while (idx2 === idx1);

  const c1 = colorAnchors[idx1];
  const c2 = colorAnchors[idx2];
  // alpha in [0..1]
  const alpha = Math.random();

  // Interpolate each component
  const r = Math.round(c1[0] * (1 - alpha) + c2[0] * alpha);
  const g = Math.round(c1[1] * (1 - alpha) + c2[1] * alpha);
  const b = Math.round(c1[2] * (1 - alpha) + c2[2] * alpha);

  // Convert to hex string
  return "#" + [r, g, b].map(x => x.toString(16).padStart(2, "0")).join("");
}

/* Pre-generate random colors for each task (so they remain consistent) */
const taskColors = tasks.map(() => getRandomColorInPalette());

/* Returns the number of days in a given month/year (non-leap for 2023) */
function getDaysInMonth(month, year) {
  // For 2023 (non-leap year):
  // Jan=31, Feb=28, Mar=31, Apr=30, May=31, Jun=30,
  // Jul=31, Aug=31, Sep=30, Oct=31, Nov=30, Dec=31
  const thirty = [3, 5, 8, 10]; // Apr(3), Jun(5), Sep(8), Nov(10) zero-based
  if (month === 1) { // February
    return 28;
  } else if (thirty.includes(month)) {
    return 30;
  } else {
    return 31;
  }
}

/* Clamps a date to the chart range (Jan 1 - Dec 31, 2023) */
function clampDate(d) {
  if (d < chartStart) return new Date(chartStart);
  if (d > chartEnd) return new Date(chartEnd);
  return d;
}

/* Convert a date to an x-position in the chart (range 50..950) */
function dateToX(date) {
  const currentChartWidth = getChartDimensions();
  const diffDays = (date - chartStart) / MS_PER_DAY;
  const ratio = diffDays / totalDays;
  return Math.round(ratio * currentChartWidth) + chartLeftOffset;
}

/* Convert an x-position in the chart back to a date */
function xToDate(x) {
  const currentChartWidth = getChartDimensions();
  let localX = x - chartLeftOffset;
  if (localX < 0) localX = 0;
  if (localX > currentChartWidth) localX = currentChartWidth;

  const ratio = localX / currentChartWidth;
  const diff = ratio * totalDays;
  const newDate = new Date(chartStart.getTime() + diff * MS_PER_DAY);
  newDate.setHours(0, 0, 0, 0);
  return clampDate(newDate);
}

/* Render month lines (Jan..Dec) and labels */
function renderMonthLines() {
  const container = document.getElementById("chartContainer");
  // Remove existing lines/labels except #barsContainer
  [...container.querySelectorAll(".month-line, .month-label")].forEach(el => el.remove());

  // Update chart dimensions
  getChartDimensions();

  for (let m = 0; m <= 12; m++) {
    const monthDate = new Date(2023, m, 1);
    const x = dateToX(monthDate);

    // Vertical line
    const line = document.createElement("div");
    line.className = "month-line";
    line.style.left = x + "px";
    container.appendChild(line);

    // Label for months 0..11
    if (m < 12) {
      const label = document.createElement("div");
      label.className = "month-label";
      label.style.left = x + "px";
      label.textContent = monthDate.toLocaleString('default', {
        month: 'short'
      });
      container.appendChild(label);
    }
  }
}

/* Render the task bars */
function renderBars() {
  const barsContainer = document.getElementById("barsContainer");
  barsContainer.innerHTML = ""; // clear old bars

  tasks.forEach((task, i) => {
    const startX = dateToX(task.start);
    const endX = dateToX(task.end);
    const barWidth = Math.max(10, endX - startX); // ensure min width

    const bar = document.createElement("div");
    bar.className = "bar";
    bar.dataset.taskIndex = i; // so we can detect bar drags
    bar.style.left = startX + "px";
    bar.style.width = barWidth + "px";
    // Place each bar in its own row: rowHeight=40, top offset=30
    bar.style.top = (30 + i * 40) + "px";
    // Use the pre-generated random color
    bar.style.backgroundColor = taskColors[i];

    // Add task name label inside bar
    const label = document.createElement("span");
    label.className = "label";
    label.style.paddingLeft = "5px";
    label.textContent = task.name;
    bar.appendChild(label);

    // Draggable handles
    const handleStart = document.createElement("div");
    handleStart.className = "bar-handle bar-handle-start";
    handleStart.dataset.taskIndex = i;
    handleStart.dataset.edge = "start";
    bar.appendChild(handleStart);

    const handleEnd = document.createElement("div");
    handleEnd.className = "bar-handle bar-handle-end";
    handleEnd.dataset.taskIndex = i;
    handleEnd.dataset.edge = "end";
    bar.appendChild(handleEnd);

    barsContainer.appendChild(bar);
  });
}

/* Render tasks into two tables:
   - First table (#taskTableBody1) for tasks[0..2]
   - Second table (#taskTableBody2) for tasks[3..5]
*/
function renderTaskTables() {
  const tableBody1 = document.getElementById("taskTableBody1");
  tableBody1.innerHTML = "";
  for (let i = 0; i < 3; i++) {
    const tr = document.createElement("tr");
    tr.appendChild(createNameCell(tasks[i].name, i));
    tr.appendChild(createMonthDayCells(i, "start", tasks[i].start));
    tr.appendChild(createMonthDayCells(i, "end", tasks[i].end));
    tableBody1.appendChild(tr);
  }

  const tableBody2 = document.getElementById("taskTableBody2");
  tableBody2.innerHTML = "";
  for (let i = 3; i < 6; i++) {
    const tr = document.createElement("tr");
    tr.appendChild(createNameCell(tasks[i].name, i));
    tr.appendChild(createMonthDayCells(i, "start", tasks[i].start));
    tr.appendChild(createMonthDayCells(i, "end", tasks[i].end));
    tableBody2.appendChild(tr);
  }
}

/* Create the Task Name cell with a colored circle before the text */
function createNameCell(name, taskIndex) {
  const td = document.createElement("td");
  // Create circle element
  const circle = document.createElement("span");
  circle.style.display = "inline-block";
  circle.style.width = "10px";
  circle.style.height = "10px";
  circle.style.borderRadius = "50%";
  circle.style.backgroundColor = taskColors[taskIndex];
  circle.style.marginRight = "8px";
  // Create text element
  const text = document.createElement("span");
  text.textContent = name;
  td.appendChild(circle);
  td.appendChild(text);
  return td;
}

/* Create the Month/Day cells for start/end columns */
function createMonthDayCells(taskIndex, edge, dateObj) {
  const td = document.createElement("td");
  td.classList.add("monthDayCell");
  td.appendChild(createMonthSelect(taskIndex, edge, dateObj.getMonth()));
  td.appendChild(createDaySelect(taskIndex, edge, dateObj.getDate(), dateObj.getMonth()));
  return td;
}

/* Create a <select> for months (0..11) */
function createMonthSelect(taskIndex, edge, currentMonth) {
  const select = document.createElement("select");
  select.dataset.taskIndex = taskIndex;
  select.dataset.edge = edge;
  select.classList.add(edge + "-month");

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  months.forEach((mName, mIndex) => {
    const opt = document.createElement("option");
    opt.value = mIndex;
    opt.textContent = mName;
    if (mIndex === currentMonth) opt.selected = true;
    select.appendChild(opt);
  });

  // Update date on change
  select.addEventListener("change", () => updateTaskDate(taskIndex, edge));

  // Scroll to change month (scroll up => increase)
  select.addEventListener("wheel", (e) => {
    e.preventDefault(); // prevent page scroll
    let direction = e.deltaY < 0 ? 1 : -1;
    let newIndex = select.selectedIndex + direction;
    if (newIndex < 0) newIndex = 0;
    if (newIndex >= select.options.length) newIndex = select.options.length - 1;
    select.selectedIndex = newIndex;
    updateTaskDate(taskIndex, edge);
  });

  return select;
}

/* Create a <select> for valid days in the given month */
function createDaySelect(taskIndex, edge, currentDay, currentMonth) {
  const select = document.createElement("select");
  select.dataset.taskIndex = taskIndex;
  select.dataset.edge = edge;
  select.classList.add(edge + "-day");

  const maxDays = getDaysInMonth(currentMonth, 2023);

  for (let d = 1; d <= maxDays; d++) {
    const opt = document.createElement("option");
    opt.value = d;
    opt.textContent = d;
    if (d === currentDay) opt.selected = true;
    select.appendChild(opt);
  }

  // Update date on change
  select.addEventListener("change", () => updateTaskDate(taskIndex, edge));

  // Scroll to change day (scroll up => increase)
  select.addEventListener("wheel", (e) => {
    e.preventDefault();
    let direction = e.deltaY < 0 ? 1 : -1;
    let newIndex = select.selectedIndex + direction;
    if (newIndex < 0) newIndex = 0;
    if (newIndex >= select.options.length) newIndex = select.options.length - 1;
    select.selectedIndex = newIndex;
    updateTaskDate(taskIndex, edge);
  });

  return select;
}

/* Ensure day is valid for the chosen month, then clamp within chart range */
function makeValidDate(monthVal, dayVal) {
  const maxDays = getDaysInMonth(monthVal, 2023);
  if (dayVal > maxDays) dayVal = maxDays;
  let newDate = new Date(2023, monthVal, dayVal);
  newDate = clampDate(newDate);
  return newDate;
}

/* Update the specified task's start/end date based on the month/day selects */
function updateTaskDate(i, edge) {
  const monthSelect = document.querySelector(`select[data-task-index="${i}"][data-edge="${edge}"].${edge}-month`);
  const daySelect = document.querySelector(`select[data-task-index="${i}"][data-edge="${edge}"].${edge}-day`);

  const monthVal = parseInt(monthSelect.value, 10);
  let dayVal = parseInt(daySelect.value, 10);

  const newDate = makeValidDate(monthVal, dayVal);

  tasks[i][edge] = newDate;

  // Ensure start <= end
  if (tasks[i].start > tasks[i].end) {
    if (edge === "start") tasks[i].end = new Date(tasks[i].start);
    else tasks[i].start = new Date(tasks[i].end);
  }

  renderBars();
  renderTaskTables();
}

/* 
  Mouse interactions for dragging:
    1) Dragging endpoints (handles) changes start or end date.
    2) Dragging the bar (not on handles) shifts the entire date range.
*/
let isDragging = false;
let dragMode = null; // "handle" or "bar"
let dragTaskIndex = null;
let dragEdge = null;

// For bar dragging
let barOriginalMouseX = 0;
let barOriginalStart = null;
let barOriginalEnd = null;

const barsContainer = document.getElementById("barsContainer");
barsContainer.addEventListener("mousedown", (e) => {
  const target = e.target;

  // 1) Endpoint handle drag
  if (target.classList.contains("bar-handle")) {
    isDragging = true;
    dragMode = "handle";
    dragTaskIndex = parseInt(target.dataset.taskIndex, 10);
    dragEdge = target.dataset.edge;
  }
  // 2) Bar drag
  else if (target.classList.contains("bar")) {
    isDragging = true;
    dragMode = "bar";
    dragTaskIndex = parseInt(target.dataset.taskIndex, 10);

    // Store original mouse position and the original start/end
    const rect = document.getElementById("chartContainer").getBoundingClientRect();
    barOriginalMouseX = e.clientX - rect.left;

    barOriginalStart = new Date(tasks[dragTaskIndex].start);
    barOriginalEnd = new Date(tasks[dragTaskIndex].end);
  }
});

document.addEventListener("mousemove", (e) => {
  if (!isDragging) return;

  const rect = document.getElementById("chartContainer").getBoundingClientRect();
  const offsetX = e.clientX - rect.left;

  // Dragging endpoints
  if (dragMode === "handle") {
    const newDate = xToDate(offsetX);

    if (dragEdge === "start") {
      tasks[dragTaskIndex].start = newDate;
      // Ensure start <= end
      if (tasks[dragTaskIndex].start > tasks[dragTaskIndex].end) {
        tasks[dragTaskIndex].end = new Date(newDate);
      }
    } else {
      tasks[dragTaskIndex].end = newDate;
      // Ensure start <= end
      if (tasks[dragTaskIndex].end < tasks[dragTaskIndex].start) {
        tasks[dragTaskIndex].start = new Date(newDate);
      }
    }
  }
  // Dragging the entire bar
  else if (dragMode === "bar") {
    const deltaX = offsetX - barOriginalMouseX;
    // Convert deltaX to days
    const currentChartWidth = getChartDimensions();
    const deltaDays = (deltaX / currentChartWidth) * totalDays;

    // Shift the original start/end by deltaDays
    let newStart = new Date(barOriginalStart.getTime() + deltaDays * MS_PER_DAY);
    let newEnd = new Date(barOriginalEnd.getTime() + deltaDays * MS_PER_DAY);

    // Keep the bar fully within chart range:
    // If it extends before chartStart or beyond chartEnd, shift accordingly.
    if (newStart < chartStart) {
      const shift = chartStart - newStart;
      newStart = new Date(newStart.getTime() + shift);
      newEnd = new Date(newEnd.getTime() + shift);
    }
    if (newEnd > chartEnd) {
      const shift = chartEnd - newEnd;
      newStart = new Date(newStart.getTime() + shift);
      newEnd = new Date(newEnd.getTime() + shift);
    }

    tasks[dragTaskIndex].start = newStart;
    tasks[dragTaskIndex].end = newEnd;
  }

  renderBars();
  renderTaskTables();
});

document.addEventListener("mouseup", () => {
  isDragging = false;
  dragMode = null;
  dragTaskIndex = null;
  dragEdge = null;
});

/* Touch event support for mobile devices */
// Helper function to get touch position
function getTouchPos(e) {
  const rect = document.getElementById("chartContainer").getBoundingClientRect();
  const touch = e.touches[0] || e.changedTouches[0];
  return touch.clientX - rect.left;
}

// Track touch state
let touchStartX = 0;
let touchMoved = false;
let touchThreshold = 5; // pixels to distinguish between tap and drag
let initialTouchPos = 0; // Store initial touch position for handles

// Touch start
barsContainer.addEventListener("touchstart", (e) => {
  const target = e.target;
  const touch = e.touches[0];
  touchStartX = touch.clientX;
  touchMoved = false;
  initialTouchPos = getTouchPos(e);
  
  // 1) Endpoint handle touch
  if (target.classList.contains("bar-handle")) {
    e.preventDefault(); // Prevent scrolling when touching handles
    isDragging = true;
    dragMode = "handle";
    dragTaskIndex = parseInt(target.dataset.taskIndex, 10);
    dragEdge = target.dataset.edge;
    // Don't jump - just start from current position
  }
  // 2) Bar touch
  else if (target.classList.contains("bar")) {
    // Don't prevent default immediately - wait to see if it's a drag
    dragTaskIndex = parseInt(target.dataset.taskIndex, 10);
    barOriginalMouseX = initialTouchPos;
    barOriginalStart = new Date(tasks[dragTaskIndex].start);
    barOriginalEnd = new Date(tasks[dragTaskIndex].end);
  }
}, { passive: false });

// Touch move
document.addEventListener("touchmove", (e) => {
  const touch = e.touches[0];
  const currentX = touch.clientX;
  const moveDistance = Math.abs(currentX - touchStartX);
  
  // Check if this is a significant move (drag vs scroll)
  if (moveDistance > touchThreshold) {
    touchMoved = true;
    
    // If we're touching a bar and haven't started dragging yet, start now
    const target = e.target;
    if (!isDragging && dragTaskIndex !== null && 
        (target.classList.contains("bar") || target.closest('.bar'))) {
      e.preventDefault(); // Now prevent scrolling
      isDragging = true;
      dragMode = "bar";
      // Reset the original position to current touch for smooth dragging
      barOriginalMouseX = initialTouchPos;
    }
  }
  
  if (!isDragging) return;
  e.preventDefault(); // Prevent scrolling only when dragging

  const offsetX = getTouchPos(e);

  // Dragging endpoints
  if (dragMode === "handle") {
    // Use the current touch position directly to avoid jumping
    const newDate = xToDate(offsetX);
    
    if (dragEdge === "start") {
      tasks[dragTaskIndex].start = newDate;
      // Ensure start <= end
      if (tasks[dragTaskIndex].start > tasks[dragTaskIndex].end) {
        tasks[dragTaskIndex].end = new Date(newDate);
      }
    } else {
      tasks[dragTaskIndex].end = newDate;
      // Ensure start <= end
      if (tasks[dragTaskIndex].end < tasks[dragTaskIndex].start) {
        tasks[dragTaskIndex].start = new Date(newDate);
      }
    }
  }
  // Dragging the entire bar
  else if (dragMode === "bar") {
    const deltaX = offsetX - barOriginalMouseX;
    // Convert deltaX to days with better precision
    const currentChartWidth = getChartDimensions();
    const deltaDays = (deltaX / currentChartWidth) * totalDays;

    // Shift the original start/end by deltaDays
    let newStart = new Date(barOriginalStart.getTime() + deltaDays * MS_PER_DAY);
    let newEnd = new Date(barOriginalEnd.getTime() + deltaDays * MS_PER_DAY);

    // Keep the bar fully within chart range
    if (newStart < chartStart) {
      const shift = chartStart - newStart;
      newStart = new Date(newStart.getTime() + shift);
      newEnd = new Date(newEnd.getTime() + shift);
    }
    if (newEnd > chartEnd) {
      const shift = chartEnd - newEnd;
      newStart = new Date(newStart.getTime() + shift);
      newEnd = new Date(newEnd.getTime() + shift);
    }

    tasks[dragTaskIndex].start = newStart;
    tasks[dragTaskIndex].end = newEnd;
  }

  renderBars();
  renderTaskTables();
}, { passive: false });

// Touch end
document.addEventListener("touchend", (e) => {
  // Reset touch state
  touchMoved = false;
  touchStartX = 0;
  initialTouchPos = 0;
  
  isDragging = false;
  dragMode = null;
  dragTaskIndex = null;
  dragEdge = null;
});

/* Handle window resize to update chart dimensions */
window.addEventListener("resize", () => {
  // Debounce the resize event
  clearTimeout(window.resizeTimeout);
  window.resizeTimeout = setTimeout(() => {
    renderMonthLines();
    renderBars();
    renderTaskTables();
  }, 250);
});

/* Initialize the chart and tables */
renderMonthLines();
renderBars();
renderTaskTables();