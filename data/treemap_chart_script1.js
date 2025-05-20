// Dimensions for the treemap SVG
const svgWidth = 600;
const svgHeight = 400;

// Select the SVG
const svg = d3.select("#treemap-svg")
  .attr("width", svgWidth)
  .attr("height", svgHeight);

// Treemap layout
const treemapLayout = d3.treemap()
  .size([svgWidth, svgHeight])
  .padding(2);

// On page load, set random values (10..100) and update the treemap
window.addEventListener("DOMContentLoaded", () => {
  randomizeInputs();
  updateTreemap();
});

// Assign random values between 10 and 100 to all inputs
function randomizeInputs() {
  const allInputs = document.querySelectorAll("#data-table1 input, #data-table2 input");
  allInputs.forEach(input => {
    input.value = Math.floor(Math.random() * 91) + 10;
  });
}

// Helper to determine displayed text based on rectangle dimensions
function getDisplayText(d, width, height) {
  // Adjust these thresholds if needed
  if (width > 50 && height > 20) {
    return d.data.name;
  } else {
    // For example, if the name is "Category A", remove "Category " to show "A"
    return d.data.name.replace("Category ", "");
  }
}

// Main update function for the treemap
function updateTreemap() {
  // Gather data from both tables
  const rows1 = document.querySelectorAll("#data-table1 tbody tr");
  const rows2 = document.querySelectorAll("#data-table2 tbody tr");
  let children = [];

  // Process rows in table1
  rows1.forEach(row => {
    const catCell = row.querySelector("td");
    const inputCell = row.querySelector("td:nth-child(2)");
    if (!catCell || !inputCell) return;

    const catNameEl = catCell.querySelector(".category-name");
    const inputEl = inputCell.querySelector("input");
    let val = parseFloat(inputEl.value);
    if (isNaN(val) || val < 0) {
      val = 0;
      inputEl.value = 0;
    }
    children.push({
      name: catNameEl.innerText.trim(),
      value: val
    });
  });

  // Process rows in table2
  rows2.forEach(row => {
    const catCell = row.querySelector("td");
    const inputCell = row.querySelector("td:nth-child(2)");
    if (!catCell || !inputCell) return;

    const catNameEl = catCell.querySelector(".category-name");
    const inputEl = inputCell.querySelector("input");
    let val = parseFloat(inputEl.value);
    if (isNaN(val) || val < 0) {
      val = 0;
      inputEl.value = 0;
    }
    children.push({
      name: catNameEl.innerText.trim(),
      value: val
    });
  });

  // Determine max for color scale
  const values = children.map(d => d.value);
  let maxVal = d3.max(values);
  if (!maxVal || maxVal < 1) {
    maxVal = 1;
  }

  // Create color scale from coral (#FF7F50) to space cadet (#1D2951)
  const colorScale = d3.scaleLinear()
    .domain([0, maxVal])
    .range(["#FF7F50", "#1D2951"]);

  // Update circle colors in both tables
  [rows1, rows2].forEach(rows => {
    rows.forEach(row => {
      const catCell = row.querySelector("td");
      const inputCell = row.querySelector("td:nth-child(2)");
      const circle = catCell ? catCell.querySelector(".color-circle") : null;
      const inputEl = inputCell ? inputCell.querySelector("input") : null;
      if (!circle || !inputEl) return;

      let val = parseFloat(inputEl.value);
      if (isNaN(val) || val < 0) val = 0;
      circle.style.backgroundColor = colorScale(val);
    });
  });

  // Build hierarchical data
  const data = {
    name: "root",
    children: children
  };

  // Create a root node and sum values
  const root = d3.hierarchy(data).sum(d => d.value);

  // Compute treemap layout
  treemapLayout(root);

  // Bind data to groups
  const nodes = svg.selectAll("g")
    .data(root.leaves(), d => d.data.name);

  // Remove any exiting nodes
  nodes.exit().remove();

  // Enter selection: create groups with rect and text
  const enterNodes = nodes.enter()
    .append("g")
    .attr("transform", d => `translate(${d.x0},${d.y0})`);

  enterNodes.append("rect")
    .attr("width", d => d.x1 - d.x0)
    .attr("height", d => d.y1 - d.y0)
    .attr("fill", d => colorScale(d.data.value));

  enterNodes.append("text")
    .attr("class", "treemap-rect-text")
    .attr("x", d => (d.x1 - d.x0) / 2)
    .attr("y", d => (d.y1 - d.y0) / 2)
    .text(d => {
      const width = d.x1 - d.x0;
      const height = d.y1 - d.y0;
      return getDisplayText(d, width, height);
    });

  // Merge enter and update selections
  const mergedNodes = nodes.merge(enterNodes);

  // Transition for group positions
  mergedNodes.transition().duration(300)
    .attr("transform", d => `translate(${d.x0},${d.y0})`);

  // Transition for rectangle attributes
  mergedNodes.select("rect").transition().duration(300)
    .attr("width", d => d.x1 - d.x0)
    .attr("height", d => d.y1 - d.y0)
    .attr("fill", d => colorScale(d.data.value));

  // Transition for text attributes and update content at the end of transition
  mergedNodes.select("text").transition().duration(300)
    .attr("x", d => (d.x1 - d.x0) / 2)
    .attr("y", d => (d.y1 - d.y0) / 2)
    .on("end", function(d) {
      const width = d.x1 - d.x0;
      const height = d.y1 - d.y0;
      d3.select(this).text(getDisplayText(d, width, height));
    });
}

// Listen for changes on each input (both tables)
const allInputs = document.querySelectorAll("#data-table1 input, #data-table2 input");
allInputs.forEach(input => {
  // On typing
  input.addEventListener("input", updateTreemap);

  // On scrolling (wheel) over the input
  input.addEventListener("wheel", function(e) {
    e.preventDefault(); // prevent page scroll
    let val = parseInt(this.value) || 0;
    if (e.deltaY < 0) {
      // scroll up => increment
      val += 1;
    } else {
      // scroll down => decrement
      val -= 1;
    }
    if (val < 0) val = 0;
    this.value = val;
    updateTreemap();
  }, {
    passive: false
  });
});