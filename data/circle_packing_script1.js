
        // Global SVG dimensions.
        let svg = d3.select("svg");
        let width = svg.node().clientWidth;
        let height = svg.node().clientHeight;

        // Circle parameters.
        const numCircles = 100;
        const minRadius = 5;
        const maxRadius = 50;
        const padding = 2;  // extra space for collisions
        const minAllowedRadius = 5;
        const maxAllowedRadius = 50;

        // Color scale: maps circle radius to a warm color.
        const color = d3.scaleSequential(d3.interpolateWarm)
            .domain([minAllowedRadius, maxAllowedRadius]);

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
                handleMouseEnter(d);
            })
            .on("mouseleave", function (event, d) {
                handleMouseLeave(d);
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
            width = svg.node().clientWidth;
            height = svg.node().clientHeight;
            simulation.force("x", d3.forceX(width / 2).strength(0.05));
            simulation.force("y", d3.forceY(height / 2).strength(0.05));
            simulation.alpha(0.3).restart();
        });
    