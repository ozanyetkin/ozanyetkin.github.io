// Responsive dimensions
function getResponsiveDimensions() {
  const container = document.querySelector('.container');
  const containerWidth = container.clientWidth;
  const viewportHeight = window.innerHeight;
  const size = Math.min(containerWidth - 20, viewportHeight - 100, 800);
  return {
    width: size,
    height: size,
    radius: size / 2
  };
}

let { width, height, radius } = getResponsiveDimensions();

// Slower animation timing constants (in ms)
const innerDelay = 40,
  outerDelay = 40,
  animationDuration = 300;
// Threshold (in radians) below which arcs are considered too small for animation/labels.
const minAngle = 0.1;

// Create SVG with responsive sizing
const svg = d3.select("#sunburst-chart")
  .attr("viewBox", `0 0 ${width} ${height}`)
  .attr("preserveAspectRatio", "xMidYMid meet")
  .append("g")
  .attr("transform", `translate(${width / 2}, ${height / 2})`);

// Global color scale for top-level categories.
const color = d3.scaleOrdinal(d3.schemeTableau10);

let root, currentFocus;

// Handle window resize
function handleResize() {
  const newDimensions = getResponsiveDimensions();
  width = newDimensions.width;
  height = newDimensions.height;
  radius = newDimensions.radius;

  d3.select("#sunburst-chart")
    .attr("viewBox", `0 0 ${width} ${height}`);

  svg.attr("transform", `translate(${width / 2}, ${height / 2})`);

  if (root) {
    updateVisualization();
  }
}

// Debounced resize handler
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(handleResize, 150);
});

// Enhanced event handler for both mouse and touch
function addClickHandler(element, callback) {
  let touchStarted = false;

  element
    .on("touchstart", function (event) {
      touchStarted = true;
      event.preventDefault(); // Prevent mouse events from firing
    })
    .on("touchend", function (event) {
      if (touchStarted) {
        touchStarted = false;
        event.preventDefault();
        callback.call(this, event, event.target.__data__);
      }
    })
    .on("click", function (event, d) {
      if (!touchStarted) { // Only handle click if not a touch event
        callback.call(this, event, d);
      }
    });
}

// For sub-categories, derive a slight variation from the parent's color.
// This function only adjusts the lightness slightly so the hue and saturation remain the same.
function deriveChildColor(parentColor, index, total) {
  const base = d3.hsl(parentColor);
  // Apply a small variation in lightness distributed among siblings.
  const variation = ((index - (total - 1) / 2) * 0.02);
  base.l = Math.min(0.95, Math.max(0.05, base.l + variation));
  return base.toString();
}

// Assign each node a base color once.
function assignColors(node) {
  if (!node.parent) {
    // For root, assign its children a color from the global scale.
    if (node.children) {
      node.children.forEach((child, i) => {
        child.baseColor = color(child.data.name);
        assignColors(child);
      });
    }
  } else {
    if (node.children) {
      node.children.forEach((child, i) => {
        child.baseColor = deriveChildColor(node.baseColor, i, node.children.length);
        assignColors(child);
      });
    }
  }
}

// Load hierarchical data and assign colors.
d3.json("https://gist.githubusercontent.com/alexramo/9500294/raw/98a57d80f8bf306893f9a09364891aa500d3cec6/flare2.json")
  .then(data => {
    root = d3.hierarchy(data)
      .sum(d => d.size ? d.size : 1)
      .sort((a, b) => b.value - a.value);
    assignColors(root);
    currentFocus = root;
    updateVisualization();
  })
  .catch(error => console.error("Error loading data:", error));

// Helper function for radial wipe (arc tween)
function arcTween(arcGen, d) {
  const i = d3.interpolate({
    startAngle: d.startAngle,
    endAngle: d.startAngle
  },
    d
  );
  return function (t) {
    return arcGen(i(t));
  };
}

// updateVisualization() redraws the chart based on currentFocus.
function updateVisualization() {
  svg.selectAll("*").remove(); // Clear previous drawing.

  // Define radii for rings.
  const innerRingInner = radius * 0.30,
    innerRingOuter = radius * 0.55,
    outerRingInner = radius * 0.55,
    outerRingOuter = radius * 0.80,
    backButtonRadius = currentFocus === root ? 0 : radius * 0.20;

  // Add a center (back) button if not at the root.
  if (currentFocus !== root) {
    const backButton = svg.append("circle")
      .attr("r", 0)
      .attr("fill", currentFocus.baseColor)
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      .style("cursor", "pointer");

    addClickHandler(backButton, () => {
      currentFocus = currentFocus.parent;
      updateVisualization();
    });

    backButton.transition()
      .duration(animationDuration)
      .attr("r", backButtonRadius);

    svg.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .style("opacity", 0)
      .style("pointer-events", "none") // Prevent text from blocking clicks
      .text(currentFocus.data.name)
      .transition()
      .duration(animationDuration)
      .style("opacity", 1);
  } else {
    // At the root, simply display its name in the center.
    svg.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .style("opacity", 0)
      .text(root.data.name)
      .transition()
      .duration(animationDuration)
      .style("opacity", 1);
  }

  // The inner ring represents the children of the current focus.
  if (currentFocus.children && currentFocus.children.length > 0) {
    const pieInner = d3.pie()
      .sort(null)
      .value(d => d.value);
    const innerArcs = pieInner(currentFocus.children);
    const innerArcGen = d3.arc()
      .innerRadius(innerRingInner)
      .outerRadius(innerRingOuter);

    const innerGroup = svg.append("g").attr("class", "innerRing");
    const innerSelection = innerGroup.selectAll("g.innerArc")
      .data(innerArcs)
      .enter()
      .append("g")
      .attr("class", "arc");

    addClickHandler(innerSelection, (event, d) => {
      currentFocus = d.data;
      updateVisualization();
      event.stopPropagation();
    });

    innerSelection
      .each(function (d, i) {
        const g = d3.select(this);
        const angle = d.endAngle - d.startAngle;
        // Use the assigned base color for consistency.
        let fillColor = d.data.baseColor;

        if (angle < minAngle) {
          g.append("path")
            .transition()
            .delay(i * innerDelay)
            .duration(0)
            .attr("d", innerArcGen(d))
            .attr("fill", fillColor)
            .attr("stroke", "#fff")
            .attr("stroke-width", 1);
        } else {
          g.append("path")
            .attr("fill", fillColor)
            .attr("stroke", "#fff")
            .attr("stroke-width", 1)
            .transition()
            .delay(i * innerDelay)
            .duration(animationDuration)
            .attrTween("d", function (d) {
              return arcTween(innerArcGen, d);
            });
          g.append("text")
            .attr("transform", "translate(" + innerArcGen.centroid(d) + ")")
            .attr("dy", "0.35em")
            .attr("class", "label")
            .style("opacity", 0)
            .text(d.data.data.name)
            .transition()
            .delay(i * innerDelay)
            .duration(animationDuration)
            .style("opacity", 1);
        }

        // For inner arcs with children, add outer arcs.
        if (d.data.children && d.data.children.length > 0) {
          const outerPie = d3.pie()
            .sort(null)
            .value(d => d.value)
            .startAngle(d.startAngle)
            .endAngle(d.endAngle);
          const outerArcs = outerPie(d.data.children);
          const outerArcGen = d3.arc()
            .innerRadius(outerRingInner)
            .outerRadius(outerRingOuter);
          // Animate outer arcs relative to the inner arc.
          const outerGroup = svg.append("g").attr("class", "outerRing");
          const outerSelection = outerGroup.selectAll(null)
            .data(outerArcs)
            .enter()
            .append("g")
            .attr("class", "arc");

          addClickHandler(outerSelection, (event, d) => {
            currentFocus = d.data;
            updateVisualization();
            event.stopPropagation();
          });

          outerSelection
            .each(function (d, j) {
              const delay = i * innerDelay + j * outerDelay;
              const gOuter = d3.select(this);
              const angle = d.endAngle - d.startAngle;
              // Use the already assigned base color for each sub-category.
              const outerFill = d.data.baseColor;
              if (angle < minAngle) {
                gOuter.append("path")
                  .transition()
                  .delay(delay)
                  .duration(0)
                  .attr("d", outerArcGen(d))
                  .attr("fill", outerFill)
                  .attr("stroke", "#fff")
                  .attr("stroke-width", 1);
              } else {
                gOuter.append("path")
                  .attr("fill", outerFill)
                  .attr("stroke", "#fff")
                  .attr("stroke-width", 1)
                  .transition()
                  .delay(delay)
                  .duration(animationDuration)
                  .attrTween("d", function (d) {
                    return arcTween(outerArcGen, d);
                  });
                gOuter.append("text")
                  .attr("transform", "translate(" + outerArcGen.centroid(d) + ")")
                  .attr("dy", "0.35em")
                  .attr("class", "label")
                  .style("opacity", 0)
                  .text(d.data.data.name)
                  .transition()
                  .delay(delay)
                  .duration(animationDuration)
                  .style("opacity", 1);
              }
            });
        }
      });
  }
}