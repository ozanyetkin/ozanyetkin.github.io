
// Global variables
let svg = d3.select("svg");
let width = svg.node().clientWidth;
let height = svg.node().clientHeight;
let isMobile = window.innerWidth <= 768;
let isDataPanelVisible = false;

// Circle parameters.
const numCircles = 100;

// Responsive circle sizes based on screen size
function getCircleParams() {
    if (isMobile) {
        return {
            minRadius: 3,
            maxRadius: 25,
            minAllowedRadius: 3,
            maxAllowedRadius: 25,
            padding: 1.5
        };
    } else {
        return {
            minRadius: 5,
            maxRadius: 50,
            minAllowedRadius: 5,
            maxAllowedRadius: 50,
            padding: 2
        };
    }
}

let circleParams = getCircleParams();
let minRadius = circleParams.minRadius;
let maxRadius = circleParams.maxRadius;
let padding = circleParams.padding;
let minAllowedRadius = circleParams.minAllowedRadius;
let maxAllowedRadius = circleParams.maxAllowedRadius;

// Color scale: maps circle radius to a warm color.
let color = d3.scaleSequential(d3.interpolateWarm)
    .domain([minAllowedRadius, maxAllowedRadius]);

// Function to update circle parameters and rescale existing circles
function updateCircleParameters() {
    const oldParams = {
        minAllowedRadius: minAllowedRadius,
        maxAllowedRadius: maxAllowedRadius
    };

    circleParams = getCircleParams();
    minRadius = circleParams.minRadius;
    maxRadius = circleParams.maxRadius;
    padding = circleParams.padding;
    minAllowedRadius = circleParams.minAllowedRadius;
    maxAllowedRadius = circleParams.maxAllowedRadius;

    // Update color scale
    color.domain([minAllowedRadius, maxAllowedRadius]);

    // Rescale existing circles proportionally
    const scaleFactor = maxAllowedRadius / oldParams.maxAllowedRadius;
    circlesData.forEach(d => {
        d.r = Math.max(minAllowedRadius, Math.min(maxAllowedRadius, d.r * scaleFactor));
    });

    // Update visual appearance
    circles.attr("r", d => d.r)
        .attr("fill", d => color(d.r))
        .attr("stroke", d => d3.color(color(d.r)).darker(0.7));

    // Update collision force
    simulation.force("collide", d3.forceCollide(d => d.r + padding).iterations(5));
}

// For each circle we will store previous values for speed calculation.
// Generate circle data.
const circlesData = d3.range(numCircles).map(i => {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const r = Math.random() * (maxRadius - minRadius) + minRadius;
    return {
        id: i,
        x: x,
        y: y,
        r: r,
        prevX: x,
        prevY: y,
        prevR: r
    };
});

// Global variable to track currently hovered element.
// Only one circle (and its corresponding data line) is highlighted at a time.
let currentHoveredId = null;
let clearHoverTimer = null;

// Update highlight for a datum based on currentHoveredId.
function updateHighlight(d) {
    // Clear all highlights first.
    d3.selectAll("circle").attr("stroke-width", d => d3.color(color(d.r)).darker(0.7) ? 0 : 1);
    d3.selectAll(".circle-data-line").classed("highlight", false);
    if (currentHoveredId !== null) {
        d3.select("#circle-" + currentHoveredId).attr("stroke-width", 6);
        d3.select("#data-" + currentHoveredId).classed("highlight", true);
    }
}

function handleMouseEnter(d) {
    if (clearHoverTimer) {
        clearTimeout(clearHoverTimer);
        clearHoverTimer = null;
    }
    currentHoveredId = d.id;
    updateHighlight(d);
}

function handleMouseLeave(d) {
    clearHoverTimer = setTimeout(() => {
        currentHoveredId = null;
        updateHighlight(d);
    }, 50);
}

// Scroll to highlighted data element
function scrollToData(circleId) {
    const dataElement = document.getElementById("data-" + circleId);
    const dataContainer = document.getElementById("dataContainer");

    if (dataElement && dataContainer) {
        // Calculate the position of the data element relative to the container
        const containerRect = dataContainer.getBoundingClientRect();
        const elementRect = dataElement.getBoundingClientRect();

        // Calculate scroll position to center the element
        const elementTop = dataElement.offsetTop;
        const containerHeight = dataContainer.clientHeight;
        const elementHeight = dataElement.offsetHeight;

        const scrollTop = elementTop - (containerHeight / 2) + (elementHeight / 2);

        // Smooth scroll to the element
        dataContainer.scrollTo({
            top: Math.max(0, scrollTop),
            behavior: 'smooth'
        });
    }
}

// Touch event handlers for mobile
function handleTouchStart(event, d) {
    event.preventDefault();
    if (isMobile) {
        currentHoveredId = d.id;
        updateHighlight(d);
        // Show data panel if not visible
        if (!isDataPanelVisible) {
            toggleDataPanel();
        }
        // Scroll to the corresponding data after a short delay
        setTimeout(() => scrollToData(d.id), 300);
    }
}

function handleTouchEnd(event, d) {
    event.preventDefault();
    // Keep highlight for a short time on mobile
    if (isMobile) {
        setTimeout(() => {
            if (currentHoveredId === d.id) {
                currentHoveredId = null;
                updateHighlight(d);
            }
        }, 2000);
    }
}

// Toggle data panel visibility (mobile)
function toggleDataPanel() {
    const dataContainer = d3.select("#dataContainer");
    isDataPanelVisible = !isDataPanelVisible;
    dataContainer.classed("show", isDataPanelVisible);

    // Update button text
    d3.select("#toggleDataButton")
        .text(isDataPanelVisible ? "Hide" : "Data");
}

// Create SVG circles.
const circles = svg.selectAll("circle")
    .data(circlesData)
    .enter()
    .append("circle")
    .attr("id", d => "circle-" + d.id)
    .attr("r", d => d.r)
    .attr("fill", d => color(d.r))
    .attr("stroke", d => d3.color(color(d.r)).darker(0.7))
    .attr("stroke-width", 0)
    .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended))
    .on("wheel", wheeled)
    .on("mouseenter", function (event, d) {
        if (!isMobile) handleMouseEnter(d);
    })
    .on("mouseleave", function (event, d) {
        if (!isMobile) handleMouseLeave(d);
    })
    .on("touchstart", function (event, d) {
        handleTouchStart(event, d);
    })
    .on("touchend", function (event, d) {
        handleTouchEnd(event, d);
    })
    .on("click", function (event, d) {
        if (isMobile) {
            // On mobile, click toggles selection
            if (currentHoveredId === d.id) {
                currentHoveredId = null;
            } else {
                currentHoveredId = d.id;
                if (!isDataPanelVisible) {
                    toggleDataPanel();
                }
                // Scroll to the corresponding data after a short delay to allow panel to open
                setTimeout(() => scrollToData(d.id), 300);
            }
            updateHighlight(d);
        } else {
            // On desktop, also scroll to data when clicking
            currentHoveredId = d.id;
            updateHighlight(d);
            scrollToData(d.id);
        }
    });

// Create D3 force simulation.
const simulation = d3.forceSimulation(circlesData)
    .force("x", d3.forceX(width / 2).strength(0.05))
    .force("y", d3.forceY(height / 2).strength(0.05))
    .force("collide", d3.forceCollide(d => d.r + padding).iterations(5))
    .on("tick", ticked);

// Instant initial pack.
simulation.alpha(1).restart();
setTimeout(() => {
    simulation.alphaTarget(0.01);
}, 1000);

// Update positions and data on each simulation tick.
function ticked() {
    circles.attr("cx", d => d.x)
        .attr("cy", d => d.y);
    updateData();
}

// Drag event handlers.
function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
}
function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
}
function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0.01);
    d.fx = null;
    d.fy = null;
}

// Wheel event handler: adjust the circle's radius.
function wheeled(event, d) {
    event.preventDefault();
    const delta = (event.deltaY < 0) ? 2 : -2;
    d.r = Math.max(minAllowedRadius, Math.min(maxAllowedRadius, d.r + delta));
    d3.select(this)
        .attr("r", d.r)
        .attr("fill", color(d.r))
        .attr("stroke", d3.color(color(d.r)).darker(0.7));
    simulation.force("collide", d3.forceCollide(d => d.r + padding).iterations(5));
    simulation.alphaTarget(0.3).restart();
    setTimeout(() => simulation.alphaTarget(0.01), 100);
}

// Mobile touch gesture support for resizing circles
let touchDistance = 0;
let selectedCircleForResize = null;

function handleTouchMove(event, d) {
    if (event.touches.length === 2 && selectedCircleForResize === d.id) {
        event.preventDefault();
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        const newDistance = Math.sqrt(
            Math.pow(touch2.clientX - touch1.clientX, 2) +
            Math.pow(touch2.clientY - touch1.clientY, 2)
        );

        if (touchDistance > 0) {
            const deltaDistance = newDistance - touchDistance;
            const delta = deltaDistance > 0 ? 1 : -1;
            d.r = Math.max(minAllowedRadius, Math.min(maxAllowedRadius, d.r + delta));

            d3.select("#circle-" + d.id)
                .attr("r", d.r)
                .attr("fill", color(d.r))
                .attr("stroke", d3.color(color(d.r)).darker(0.7));

            simulation.force("collide", d3.forceCollide(d => d.r + padding).iterations(5));
            simulation.alphaTarget(0.3).restart();
            setTimeout(() => simulation.alphaTarget(0.01), 100);
        }
        touchDistance = newDistance;
    }
}

// "Shuffle" button: randomly reposition circles.
d3.select("#shuffleButton").on("click", () => {
    circlesData.forEach(d => {
        d.x = Math.random() * width;
        d.y = Math.random() * height;
    });
    simulation.alpha(0.2).restart();
    simulation.alphaTarget(0.01);
});

// "Pack" button: pack circles instantly.
d3.select("#packButton").on("click", () => {
    simulation.alpha(1).restart();
    simulation.alphaTarget(0.3);
    setTimeout(() => simulation.alphaTarget(0.01), 100);
});

// "Data" toggle button (mobile only)
d3.select("#toggleDataButton").on("click", toggleDataPanel);

// Update the circle data panel.
function updateData() {
    const dataSelection = d3.select("#circle-data")
        .selectAll("div.circle-data-line")
        .data(circlesData, d => d.id);

    const dataEnter = dataSelection.enter()
        .append("div")
        .attr("class", "circle-data-line")
        .attr("id", d => "data-" + d.id)
        .on("mouseenter", function (event, d) {
            handleMouseEnter(d);
        })
        .on("mouseleave", function (event, d) {
            handleMouseLeave(d);
        })
        .on("click", function (event, d) {
            // When clicking on data line, highlight the circle and scroll to it
            currentHoveredId = d.id;
            updateHighlight(d);
            scrollToData(d.id);
        });

    // Update content for each data line.
    dataEnter.merge(dataSelection)
        .html(d => `
          <div class="data-col"><span class="label">ID:</span> <span class="value">${d.id.toString().padStart(2, ' ')}</span></div>
          <div class="data-col"><span class="label">X:</span> <span class="value">${d.x.toFixed(1)}</span></div>
          <div class="data-col"><span class="label">Y:</span> <span class="value">${d.y.toFixed(1)}</span></div>
          <div class="data-col"><span class="label">R:</span> <span class="value">${d.r.toFixed(1)}</span></div>
        `)
        .each(function (d) {
            // Calculate change (speed) compared to previous tick.
            const dx = d.x - d.prevX;
            const dy = d.y - d.prevY;
            const dr = Math.abs(d.r - d.prevR);
            const posChange = Math.sqrt(dx * dx + dy * dy);
            // Set thresholds (tune as needed).
            const thresholdPos = 1;
            const thresholdR = 0.5;
            // Compute a normalized speed factor for continuous highlighting.
            let speedFactor = Math.min(1, ((posChange / thresholdPos) + (dr / thresholdR)) / 2);
            // Apply a continuous background effect when not hovered.
            if (currentHoveredId !== d.id) {
                d3.select(this).style("background-color", `rgba(220,220,220, ${speedFactor})`);
            } else {
                d3.select(this).style("background-color", null);
            }
            // Update previous values.
            d.prevX = d.x;
            d.prevY = d.y;
            d.prevR = d.r;
        });

    // Also update highlights (hover state takes precedence over fast change).
    updateHighlight();
}

// Update simulation forces when the window is resized.
window.addEventListener('resize', () => {
    const wasDesktop = !isMobile;
    width = svg.node().clientWidth;
    height = svg.node().clientHeight;
    isMobile = window.innerWidth <= 768;

    // If switching from desktop to mobile or vice versa, reset interactions
    if (wasDesktop !== !isMobile) {
        currentHoveredId = null;
        updateHighlight();

        // Update circle parameters for new screen size
        updateCircleParameters();

        // Reset data panel visibility on desktop
        if (!isMobile && isDataPanelVisible) {
            isDataPanelVisible = true; // Keep it visible on desktop
            d3.select("#dataContainer").classed("show", false);
        }
    }

    simulation.force("x", d3.forceX(width / 2).strength(0.05));
    simulation.force("y", d3.forceY(height / 2).strength(0.05));
    simulation.alpha(0.3).restart();
});

// Add touch event listeners to SVG for multi-touch gestures
svg.on("touchmove", function (event) {
    if (event.touches.length === 2) {
        event.preventDefault();
    }
});

// Prevent default touch behaviors that might interfere
document.addEventListener('touchstart', function (e) {
    if (e.touches.length > 1) {
        e.preventDefault();
    }
}, { passive: false });

document.addEventListener('touchend', function (e) {
    if (e.touches.length > 1) {
        e.preventDefault();
    }
}, { passive: false });

document.addEventListener('touchmove', function (e) {
    if (e.touches.length > 1) {
        e.preventDefault();
    }
}, { passive: false });
