// Dimensions for the treemap SVG
let svgWidth = 600;
let svgHeight = 400;

// Function to calculate responsive dimensions
function getResponsiveDimensions() {
  const container = document.getElementById('chart-container');
  let containerPadding;
  
  // Account for different padding on different screen sizes
  if (window.innerWidth <= 480) {
    containerPadding = 16; // Mobile padding from CSS
  } else if (window.innerWidth <= 768) {
    containerPadding = 20; // Tablet padding from CSS
  } else {
    containerPadding = 60; // Desktop padding (30px * 2 sides)
  }
  
  const containerWidth = container.clientWidth - containerPadding;
  const aspectRatio = 600 / 400; // Original aspect ratio
  
  // For mobile, use the full container width but maintain aspect ratio
  if (window.innerWidth <= 768) {
    const availableWidth = Math.max(280, containerWidth); // Minimum width for mobile
    svgWidth = availableWidth;
    svgHeight = svgWidth / aspectRatio;
  } else {
    // Desktop: use original dimensions or scale down if needed
    if (containerWidth < 600) {
      svgWidth = containerWidth;
      svgHeight = containerWidth / aspectRatio;
    } else {
      svgWidth = 600;
      svgHeight = 400;
    }
  }
  
  return { width: svgWidth, height: svgHeight };
}

// Select the SVG and make it responsive
const svg = d3.select("#treemap-svg");

// Function to update SVG dimensions
function updateSVGDimensions() {
  const dimensions = getResponsiveDimensions();
  svg.attr("width", dimensions.width)
     .attr("height", dimensions.height)
     .attr("viewBox", `0 0 ${dimensions.width} ${dimensions.height}`)
     .attr("preserveAspectRatio", "xMidYMid meet");
  
  return dimensions;
}

// Initialize SVG dimensions
updateSVGDimensions();

// Treemap layout
let treemapLayout = d3.treemap()
  .size([svgWidth, svgHeight])
  .padding(2);

// Update treemap layout dimensions
function updateTreemapLayout() {
  const dimensions = updateSVGDimensions();
  treemapLayout = d3.treemap()
    .size([dimensions.width, dimensions.height])
    .padding(2);
}

// On page load, set random values (10..100) and update the treemap
window.addEventListener("DOMContentLoaded", () => {
  randomizeInputs();
  updateTreemap();
});

// Handle window resize for responsive behavior
window.addEventListener("resize", () => {
  updateTreemapLayout();
  updateTreemap();
});

// Assign random values between 10 and 100 to all inputs
function randomizeInputs() {
  const allInputs = document.querySelectorAll("#data-table1 input, #data-table2 input, #mobile-table input");
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
  // Update layout dimensions first
  updateTreemapLayout();
  
  // Determine which tables to use based on screen size
  let rows1, rows2;
  if (window.innerWidth <= 768) {
    // Mobile: use single table
    const mobileRows = document.querySelectorAll("#mobile-table tbody tr");
    rows1 = Array.from(mobileRows).slice(0, 4); // First 4 rows
    rows2 = Array.from(mobileRows).slice(4, 8); // Last 4 rows
  } else {
    // Desktop: use separate tables
    rows1 = document.querySelectorAll("#data-table1 tbody tr");
    rows2 = document.querySelectorAll("#data-table2 tbody tr");
  }
  
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
  if (window.innerWidth <= 768) {
    // Mobile: update single table
    const mobileRows = document.querySelectorAll("#mobile-table tbody tr");
    mobileRows.forEach(row => {
      const catCell = row.querySelector("td");
      const inputCell = row.querySelector("td:nth-child(2)");
      const circle = catCell ? catCell.querySelector(".color-circle") : null;
      const inputEl = inputCell ? inputCell.querySelector("input") : null;
      if (!circle || !inputEl) return;

      let val = parseFloat(inputEl.value);
      if (isNaN(val) || val < 0) val = 0;
      circle.style.backgroundColor = colorScale(val);
    });
  } else {
    // Desktop: update both tables
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
  }

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
const allInputs = document.querySelectorAll("#data-table1 input, #data-table2 input, #mobile-table input");
allInputs.forEach(input => {
  // On typing
  input.addEventListener("input", updateTreemap);

  // On scrolling (wheel) over the input - desktop only
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

  // Touch-friendly increment/decrement buttons for mobile
  if ('ontouchstart' in window) {
    // Create wrapper for input with buttons
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'display: flex; align-items: center; justify-content: center; gap: 3px;';
    
    const decrementBtn = document.createElement('button');
    decrementBtn.textContent = '−';
    decrementBtn.style.cssText = 'width: 25px; height: 25px; border: 1px solid #ccc; background: #f5f5f5; border-radius: 3px; font-size: 14px; touch-action: manipulation;';
    
    const incrementBtn = document.createElement('button');
    incrementBtn.textContent = '+';
    incrementBtn.style.cssText = 'width: 25px; height: 25px; border: 1px solid #ccc; background: #f5f5f5; border-radius: 3px; font-size: 14px; touch-action: manipulation;';
    
    // Adjust button size for very small screens
    if (window.innerWidth <= 480) {
      decrementBtn.style.cssText = 'width: 22px; height: 22px; border: 1px solid #ccc; background: #f5f5f5; border-radius: 3px; font-size: 12px; touch-action: manipulation;';
      incrementBtn.style.cssText = 'width: 22px; height: 22px; border: 1px solid #ccc; background: #f5f5f5; border-radius: 3px; font-size: 12px; touch-action: manipulation;';
    }
    
    // Insert wrapper and move input into it
    input.parentNode.insertBefore(wrapper, input);
    wrapper.appendChild(decrementBtn);
    wrapper.appendChild(input);
    wrapper.appendChild(incrementBtn);
    
    // Add event listeners for buttons with long-press functionality
    let longPressTimer = null;
    let isLongPressing = false;
    
    // Decrement button event handlers
    const startDecrement = () => {
      let val = parseInt(input.value) || 0;
      val = Math.max(0, val - 1);
      input.value = val;
      updateTreemap();
      
      if (!isLongPressing) {
        isLongPressing = true;
        longPressTimer = setInterval(() => {
          let currentVal = parseInt(input.value) || 0;
          currentVal = Math.max(0, currentVal - 1);
          input.value = currentVal;
          updateTreemap();
        }, 150); // Repeat every 150ms
      }
    };
    
    const stopDecrement = () => {
      if (isLongPressing) {
        clearInterval(longPressTimer);
        isLongPressing = false;
        longPressTimer = null;
      }
    };
    
    decrementBtn.addEventListener('mousedown', startDecrement);
    decrementBtn.addEventListener('touchstart', startDecrement, { passive: true });
    decrementBtn.addEventListener('mouseup', stopDecrement);
    decrementBtn.addEventListener('mouseleave', stopDecrement);
    decrementBtn.addEventListener('touchend', stopDecrement);
    decrementBtn.addEventListener('touchcancel', stopDecrement);
    
    // Increment button event handlers
    const startIncrement = () => {
      let val = parseInt(input.value) || 0;
      val += 1;
      input.value = val;
      updateTreemap();
      
      if (!isLongPressing) {
        isLongPressing = true;
        longPressTimer = setInterval(() => {
          let currentVal = parseInt(input.value) || 0;
          currentVal += 1;
          input.value = currentVal;
          updateTreemap();
        }, 150); // Repeat every 150ms
      }
    };
    
    const stopIncrement = () => {
      if (isLongPressing) {
        clearInterval(longPressTimer);
        isLongPressing = false;
        longPressTimer = null;
      }
    };
    
    incrementBtn.addEventListener('mousedown', startIncrement);
    incrementBtn.addEventListener('touchstart', startIncrement, { passive: true });
    incrementBtn.addEventListener('mouseup', stopIncrement);
    incrementBtn.addEventListener('mouseleave', stopIncrement);
    incrementBtn.addEventListener('touchend', stopIncrement);
    incrementBtn.addEventListener('touchcancel', stopIncrement);
    
    // Prevent default click behavior since we handle mousedown/touchstart
    decrementBtn.addEventListener('click', function(e) {
      e.preventDefault();
    });
    
    incrementBtn.addEventListener('click', function(e) {
      e.preventDefault();
    });
  }
});