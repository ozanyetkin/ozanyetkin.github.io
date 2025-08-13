
// A color scale for the groups.
const color = d3.scaleOrdinal(d3.schemeCategory10);

// Define 6 groups with names.
const numGroups = 6;
const groupNames = ["Group A", "Group B", "Group C", "Group D", "Group E", "Group F"];
const groupNamesShort = ["A", "B", "C", "D", "E", "F"]; // Shorter names for mobile

// Global variable for the connection matrix.
let matrixData = [];

// Mobile detection
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

// Touch event handling variables
let touchTimeout;
let lastTouchEnd = 0;

// Function: generate a random symmetric matrix.
// For off-diagonals, we randomly decide if a connection exists (50% chance).
// Self connections (diagonals) are always present.
function generateData() {
    matrixData = [];
    for (let i = 0; i < numGroups; i++) {
        matrixData[i] = [];
        for (let j = 0; j < numGroups; j++) {
            if (j < i) {
                // Mirror lower triangle.
                matrixData[i][j] = matrixData[j][i];
            } else if (i === j) {
                // Self connection always exists.
                matrixData[i][j] = Math.floor(Math.random() * 80 + 20);
            } else {
                // For off-diagonals, randomly decide if a connection exists.
                if (Math.random() < 0.5) {
                    matrixData[i][j] = Math.floor(Math.random() * 90 + 10);
                } else {
                    matrixData[i][j] = 0;
                }
            }
        }
    }
}
generateData();

// Function: randomize numbers in the current matrix while preserving connectivity.
// For every connection that exists (non-zero), assign a new random number.
function randomizeNumbers() {
    for (let i = 0; i < numGroups; i++) {
        for (let j = i; j < numGroups; j++) {
            if (i === j) {
                // Update self connection.
                matrixData[i][j] = Math.floor(Math.random() * 80 + 20);
            } else {
                // Only update if there is an existing connection.
                if (matrixData[i][j] !== 0) {
                    let newVal = Math.floor(Math.random() * 90 + 10);
                    matrixData[i][j] = newVal;
                    matrixData[j][i] = newVal; // preserve symmetry
                }
            }
        }
    }
}

// Helper: compute tick marks for a group.
function groupTicks(d, numTicks) {
    const k = (d.endAngle - d.startAngle) / d.value;
    const ticks = [];
    for (let i = 0; i <= d.value; i += d.value / numTicks) {
        ticks.push({ value: Math.round(i), angle: d.startAngle + i * k });
    }
    return ticks;
}

// Helper: compute a unique ID for a chord (ribbon).
function getChordId(d) {
    let i = d.source.index, j = d.target.index;
    if (i > j) { [i, j] = [j, i]; }
    return i === j ? `chord-${i}` : `chord-${i}-${j}`;
}

// Functions to highlight/unhighlight a group (both in the diagram and data display).
function highlightGroup(groupIndex) {
    // Clear any existing highlights first
    clearAllHighlights();

    // Highlight all chords connected to the group.
    svg.selectAll(".chord")
        .filter(d => d.source.index === groupIndex || d.target.index === groupIndex)
        .interrupt()
        .transition().duration(isMobile ? 200 : 100)
        .style("fill-opacity", 1)
        .style("stroke-width", "2px")
        .style("stroke", d3.rgb(color(groupIndex)).darker(2));
    // Emphasize the group arc.
    svg.selectAll("g.groupArc")
        .filter(d => d.index === groupIndex)
        .select("path")
        .interrupt()
        .transition().duration(isMobile ? 200 : 100)
        .style("stroke-width", "2px");
    // Highlight the corresponding group container using a brighter variant of the group color.
    d3.select("#group-container-" + groupIndex)
        .interrupt()
        .transition().duration(isMobile ? 200 : 100)
        .style("background-color", function () {
            const bg = d3.rgb(color(groupIndex)).brighter(1);
            bg.opacity = 0.5;
            return bg.toString();
        })
}

function unhighlightGroup(groupIndex) {
    svg.selectAll(".chord")
        .filter(d => d.source.index === groupIndex || d.target.index === groupIndex)
        .interrupt()
        .transition().duration(isMobile ? 200 : 100)
        .style("fill-opacity", 0.7)
        .style("stroke-width", "0.5px")
        .style("stroke", d3.rgb(color(groupIndex)).darker());
    svg.selectAll("g.groupArc")
        .filter(d => d.index === groupIndex)
        .select("path")
        .interrupt()
        .transition().duration(isMobile ? 200 : 100)
        .style("stroke-width", "0.5px");
    d3.select("#group-container-" + groupIndex)
        .interrupt()
        .transition().duration(isMobile ? 200 : 100)
        .style("background-color", null);
}

function clearAllHighlights() {
    svg.selectAll(".chord")
        .interrupt()
        .transition().duration(50)
        .style("fill-opacity", 0.7)
        .style("stroke-width", "0.5px")
        .style("stroke", d => d3.rgb(color(d.source.index)).darker());
    svg.selectAll("g.groupArc")
        .select("path")
        .interrupt()
        .transition().duration(50)
        .style("stroke-width", "0.5px");
    d3.selectAll(".group-container")
        .interrupt()
        .transition().duration(50)
        .style("background-color", null);
    d3.selectAll("li")
        .style("background-color", null);
}

// Select the SVG element (declared globally so highlight functions can use it)
const svg = d3.select("#chordDiagram");

// Function: update (or redraw) the chord diagram and grouped data display.
function updateChart() {
    // Compute available size from the #chart container.
    const chartDiv = document.getElementById("chart");
    const rect = chartDiv.getBoundingClientRect();
    const availableWidth = rect.width;
    const availableHeight = rect.height;
    // Use 90% of the smaller dimension, with better mobile sizing
    const sizeMultiplier = isMobile ? 0.95 : 0.9;
    const size = Math.min(availableWidth, availableHeight) * sizeMultiplier;

    // Clear previous SVG content and set its dimensions.
    svg.selectAll("*").remove();
    svg.style("overflow", "visible");
    svg.attr("width", size)
        .attr("height", size)
        .attr("viewBox", "0 0 " + size + " " + size)
        .attr("preserveAspectRatio", "xMidYMid meet");

    const center = size / 2;
    const outerRadius = center - (isMobile ? 30 : 40);
    const innerRadius = outerRadius - (isMobile ? 20 : 30);

    // Append a group element centered in the SVG.
    const g = svg.append("g")
        .attr("transform", `translate(${center},${center})`);

    // Create the chord layout.
    const chordGenerator = d3.chord()
        .padAngle(0.05)
        .sortSubgroups(d3.descending);
    const chords = chordGenerator(matrixData);

    // Draw group arcs.
    const group = g.append("g")
        .selectAll("g")
        .data(chords.groups)
        .join("g")
        .attr("class", "groupArc");

    const arc = d3.arc()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius);

    const groupPaths = group.append("path")
        .attr("d", arc)
        .attr("fill", d => color(d.index))
        .attr("stroke", d => d3.rgb(color(d.index)).darker())
        .style("stroke-width", "0.5px");

    // Enhanced touch/mouse event handling for group arcs
    if (isMobile) {
        let arcTouchStartTime = 0;
        let arcTouchMoved = false;
        
        groupPaths
            .on("touchstart", function (event, d) {
                arcTouchStartTime = Date.now();
                arcTouchMoved = false;
            })
            .on("touchmove", function (event, d) {
                arcTouchMoved = true;
            })
            .on("touchend", function (event, d) {
                const arcTouchDuration = Date.now() - arcTouchStartTime;
                if (!arcTouchMoved && arcTouchDuration < 300) {
                    event.preventDefault();
                    clearTimeout(touchTimeout);
                    highlightGroup(d.index);
                    touchTimeout = setTimeout(() => unhighlightGroup(d.index), 2000);
                }
                lastTouchEnd = Date.now();
            });
    } else {
        groupPaths
            .on("mouseover", function (event, d) {
                highlightGroup(d.index);
            })
            .on("mouseout", function (event, d) {
                unhighlightGroup(d.index);
            });
    }

    // Add group labels with better mobile sizing
    const labelOffset = isMobile ? 3 : 5;
    group.append("text")
        .each(d => { d.angle = (d.startAngle + d.endAngle) / 2; })
        .attr("dy", ".35em")
        .attr("transform", d => `
              rotate(${(d.angle * 180 / Math.PI - 90)})
              translate(${outerRadius + labelOffset})
              ${d.angle > Math.PI ? "rotate(180)" : ""}
           `)
        .attr("text-anchor", d => d.angle > Math.PI ? "end" : null)
        .style("font-size", isMobile ? "0.8rem" : "0.7rem")
        .text(d => groupNames[d.index]);

    // Add tick marks with mobile-friendly sizing
    const tickLength = isMobile ? 4 : 6;
    const tickTextOffset = isMobile ? 6 : 8;
    group.each(function (d) {
        const ticks = groupTicks(d, isMobile ? 3 : 5);
        d3.select(this).selectAll("g.tick")
            .data(ticks)
            .join("g")
            .attr("class", "tick")
            .attr("transform", tick => `
             rotate(${(tick.angle * 180 / Math.PI - 90)})
             translate(${outerRadius},0)
          `)
            .call(g => g.append("line")
                .attr("x2", tickLength)
                .attr("stroke", "#000"));
        d3.select(this).selectAll("g.tick")
            .append("text")
            .attr("x", tickTextOffset)
            .attr("dy", "0.35em")
            .attr("transform", tick => tick.angle > Math.PI ? `rotate(180)translate(-${tickTextOffset * 2})` : null)
            .attr("text-anchor", tick => tick.angle > Math.PI ? "end" : null)
            .style("font-size", isMobile ? "0.6rem" : "0.7rem")
            .text(tick => tick.value);
    });

    // Draw chord ribbons with enhanced touch handling
    const ribbon = d3.ribbon().radius(innerRadius);
    const chordPaths = g.append("g")
        .selectAll("path")
        .data(chords)
        .join("path")
        .attr("class", "chord")
        .attr("d", ribbon)
        .attr("fill", d => color(d.source.index))
        .attr("stroke", d => d3.rgb(color(d.source.index)).darker())
        .style("fill-opacity", 0.7)
        .style("stroke-width", "0.5px");

    if (isMobile) {
        let chordTouchStartTime = 0;
        let chordTouchMoved = false;
        
        chordPaths
            .on("touchstart", function (event, d) {
                chordTouchStartTime = Date.now();
                chordTouchMoved = false;
            })
            .on("touchmove", function (event, d) {
                chordTouchMoved = true;
            })
            .on("touchend", function (event, d) {
                const chordTouchDuration = Date.now() - chordTouchStartTime;
                if (!chordTouchMoved && chordTouchDuration < 300) {
                    event.preventDefault();
                    clearTimeout(touchTimeout);
                    d3.select(this)
                        .interrupt()
                        .transition().duration(200)
                        .style("fill-opacity", 1)
                        .style("stroke-width", "2px")
                        .style("stroke", d3.rgb(color(d.source.index)).darker(2));
                    const chordId = getChordId(d);
                    const tempColor = d3.rgb(color(d.source.index)).brighter(1);
                    tempColor.opacity = 0.5;
                    d3.select("#" + chordId)
                        .style("background-color", tempColor.toString());

                    touchTimeout = setTimeout(() => {
                        d3.select(this)
                            .interrupt()
                            .transition().duration(200)
                            .style("fill-opacity", 0.7)
                            .style("stroke-width", "0.5px")
                            .style("stroke", d3.rgb(color(d.source.index)).darker());
                        d3.select("#" + chordId)
                            .style("background-color", null);
                    }, 2000);
                }
                lastTouchEnd = Date.now();
            });
    } else {
        chordPaths
            .on("mouseover", function (event, d) {
                d3.select(this)
                    .interrupt()
                    .transition().duration(100)
                    .style("fill-opacity", 1)
                    .style("stroke-width", "2px")
                    .style("stroke", d3.rgb(color(d.source.index)).darker(2));
                const chordId = getChordId(d);
                const tempColor = d3.rgb(color(d.source.index)).brighter(1);
                tempColor.opacity = 0.5;
                d3.select("#" + chordId)
                    .style("background-color", tempColor.toString());
            })
            .on("mouseout", function (event, d) {
                d3.select(this)
                    .interrupt()
                    .transition().duration(100)
                    .style("fill-opacity", 0.7)
                    .style("stroke-width", "0.5px")
                    .style("stroke", d3.rgb(color(d.source.index)).darker());
                const chordId = getChordId(d);
                d3.select("#" + chordId)
                    .style("background-color", null);
            });
    }

    // Build the grouped data display.
    const groupConnections = d3.select("#groupConnections");
    groupConnections.selectAll("*").remove();

    // Create a container for each group.
    for (let i = 0; i < numGroups; i++) {
        const container = groupConnections.append("div")
            .attr("class", "group-container")
            .attr("id", "group-container-" + i)
            .style("border-left", "5px solid " + color(i));

        const header = container.append("h3")
            .text(isMobile ? groupNamesShort[i] : groupNames[i]);

        // Enhanced touch/mouse event handling for group headers
        if (isMobile) {
            let touchStartTime = 0;
            let touchMoved = false;
            
            header
                .on("touchstart", function (event) {
                    touchStartTime = Date.now();
                    touchMoved = false;
                })
                .on("touchmove", function (event) {
                    touchMoved = true;
                })
                .on("touchend", function (event) {
                    const touchDuration = Date.now() - touchStartTime;
                    if (!touchMoved && touchDuration < 300) {
                        // Only highlight if it was a tap, not a scroll
                        event.preventDefault();
                        clearTimeout(touchTimeout);
                        highlightGroup(i);
                        touchTimeout = setTimeout(() => unhighlightGroup(i), 2000);
                    }
                    lastTouchEnd = Date.now();
                });
        } else {
            header
                .on("mouseover", function () { highlightGroup(i); })
                .on("mouseout", function () { unhighlightGroup(i); });
        }

        container.append("ul");
    }

    // Append chord connection entries to the appropriate group container.
    chords.forEach(d => {
        const chordId = getChordId(d);
        const groupIndex = d.source.index;
        const gIndex = groupIndex;
        let text;
        if (d.source.index === d.target.index) {
            if (isMobile) {
                text = `${groupNamesShort[d.source.index]} (self): ${d.source.value}`;
            } else {
                text = `${groupNames[d.source.index]} (self): ${d.source.value}`;
            }
        } else {
            if (isMobile) {
                text = `${groupNamesShort[d.source.index]} ↔ ${groupNamesShort[d.target.index]}: ${d.source.value}`;
            } else {
                text = `${groupNames[d.source.index]} ↔ ${groupNames[d.target.index]}: ${d.source.value}`;
            }
        }

        const listItem = d3.select("#group-container-" + groupIndex).select("ul")
            .append("li")
            .attr("id", chordId)
            .attr("data-group", groupIndex)
            .text(text);

        // Enhanced touch/mouse event handling for list items
        if (isMobile) {
            let itemTouchStartTime = 0;
            let itemTouchMoved = false;
            
            listItem
                .on("touchstart", function (event) {
                    itemTouchStartTime = Date.now();
                    itemTouchMoved = false;
                })
                .on("touchmove", function (event) {
                    itemTouchMoved = true;
                })
                .on("touchend", function (event) {
                    const itemTouchDuration = Date.now() - itemTouchStartTime;
                    if (!itemTouchMoved && itemTouchDuration < 300) {
                        // Only highlight if it was a tap, not a scroll
                        event.preventDefault();
                        clearTimeout(touchTimeout);
                        let bg = d3.rgb(color(gIndex)).brighter(1);
                        bg.opacity = 0.5;
                        d3.select(this).style("background-color", bg.toString());
                        svg.selectAll(".chord")
                            .filter(ch => getChordId(ch) === chordId)
                            .interrupt()
                            .transition().duration(200)
                            .style("fill-opacity", 1)
                            .style("stroke-width", "2px")
                            .style("stroke", d3.rgb(color(gIndex)).darker(2));

                        touchTimeout = setTimeout(() => {
                            d3.select(this).style("background-color", null);
                            svg.selectAll(".chord")
                                .filter(ch => getChordId(ch) === chordId)
                                .interrupt()
                                .transition().duration(200)
                                .style("fill-opacity", 0.7)
                                .style("stroke-width", "0.5px")
                                .style("stroke", d3.rgb(color(gIndex)).darker());
                        }, 2000);
                    }
                    lastTouchEnd = Date.now();
                });
        } else {
            listItem
                .on("mouseover", function () {
                    let bg = d3.rgb(color(gIndex)).brighter(1);
                    bg.opacity = 0.5;
                    d3.select(this).style("background-color", bg.toString());
                    svg.selectAll(".chord")
                        .filter(ch => getChordId(ch) === chordId)
                        .interrupt()
                        .transition().duration(100)
                        .style("fill-opacity", 1)
                        .style("stroke-width", "2px")
                        .style("stroke", d3.rgb(color(gIndex)).darker(2));
                })
                .on("mouseout", function () {
                    d3.select(this)
                        .style("background-color", null);
                    svg.selectAll(".chord")
                        .filter(ch => getChordId(ch) === chordId)
                        .interrupt()
                        .transition().duration(100)
                        .style("fill-opacity", 0.7)
                        .style("stroke-width", "0.5px")
                        .style("stroke", d3.rgb(color(gIndex)).darker());
                });
        }
    });
}

// Initially draw the diagram.
updateChart();

// Handle window resize for responsive behavior
let resizeTimeout;
window.addEventListener('resize', function () {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function () {
        updateChart();
    }, 250);
});

// Prevent double-tap zoom on mobile
if (isMobile) {
    document.addEventListener('touchend', function (event) {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);

    // Add touch event to clear highlights when touching empty areas
    document.addEventListener('touchstart', function (event) {
        if (event.target.tagName === 'BODY' || event.target.id === 'container') {
            clearAllHighlights();
        }
    });
}

// Button event listeners.
d3.select("#newData").on("click", function () {
    generateData();
    updateChart();
});

d3.select("#shuffle").on("click", function () {
    let values = [];
    // Extract the upper-triangle (including diagonal) values.
    for (let i = 0; i < numGroups; i++) {
        for (let j = i; j < numGroups; j++) {
            values.push(matrixData[i][j]);
        }
    }
    // Shuffle the values.
    values = d3.shuffle(values);
    let index = 0;
    // Reassign shuffled values (and mirror for symmetry).
    for (let i = 0; i < numGroups; i++) {
        for (let j = i; j < numGroups; j++) {
            matrixData[i][j] = values[index];
            if (i !== j) {
                matrixData[j][i] = values[index];
            }
            index++;
        }
    }
    updateChart();
});

d3.select("#randomize").on("click", function () {
    randomizeNumbers();
    updateChart();
});
