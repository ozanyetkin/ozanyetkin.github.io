
        // A color scale for the groups.
        const color = d3.scaleOrdinal(d3.schemeCategory10);

        // Define 5 groups with names.
        const numGroups = 5;
        const groupNames = ["Group A", "Group B", "Group C", "Group D", "Group E"];

        // Global variable for the connection matrix.
        let matrixData = [];

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
            // Highlight all chords connected to the group.
            svg.selectAll(".chord")
                .filter(d => d.source.index === groupIndex || d.target.index === groupIndex)
                .interrupt()
                .transition().duration(100)
                .style("fill-opacity", 1)
                .style("stroke-width", "2px")
                .style("stroke", d3.rgb(color(groupIndex)).darker(2));
            // Emphasize the group arc.
            svg.selectAll("g.groupArc")
                .filter(d => d.index === groupIndex)
                .select("path")
                .interrupt()
                .transition().duration(100)
                .style("stroke-width", "2px");
            // Highlight the corresponding group container using a brighter variant of the group color.
            d3.select("#group-container-" + groupIndex)
                .interrupt()
                .transition().duration(100)
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
                .transition().duration(100)
                .style("fill-opacity", 0.7)
                .style("stroke-width", "0.5px")
                .style("stroke", d3.rgb(color(groupIndex)).darker());
            svg.selectAll("g.groupArc")
                .filter(d => d.index === groupIndex)
                .select("path")
                .interrupt()
                .transition().duration(100)
                .style("stroke-width", "0.5px");
            d3.select("#group-container-" + groupIndex)
                .interrupt()
                .transition().duration(100)
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
            // Use 90% of the smaller dimension.
            const size = Math.min(availableWidth, availableHeight) * 0.9;

            // Clear previous SVG content and set its dimensions.
            svg.selectAll("*").remove();
            svg.style("overflow", "visible");
            svg.attr("width", size)
                .attr("height", size)
                .attr("viewBox", "0 0 " + size + " " + size)
                .attr("preserveAspectRatio", "xMidYMid meet");

            const center = size / 2;
            const outerRadius = center - 40;
            const innerRadius = outerRadius - 30;

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

            group.append("path")
                .attr("d", arc)
                .attr("fill", d => color(d.index))
                .attr("stroke", d => d3.rgb(color(d.index)).darker())
                .style("stroke-width", "0.5px")
                .on("mouseover", function (event, d) {
                    highlightGroup(d.index);
                })
                .on("mouseout", function (event, d) {
                    unhighlightGroup(d.index);
                });

            // Add group labels.
            group.append("text")
                .each(d => { d.angle = (d.startAngle + d.endAngle) / 2; })
                .attr("dy", ".35em")
                .attr("transform", d => `
              rotate(${(d.angle * 180 / Math.PI - 90)})
              translate(${outerRadius + 5})
              ${d.angle > Math.PI ? "rotate(180)" : ""}
           `)
                .attr("text-anchor", d => d.angle > Math.PI ? "end" : null)
                .text(d => groupNames[d.index]);

            // Add tick marks.
            group.each(function (d) {
                const ticks = groupTicks(d, 5);
                d3.select(this).selectAll("g.tick")
                    .data(ticks)
                    .join("g")
                    .attr("class", "tick")
                    .attr("transform", tick => `
             rotate(${(tick.angle * 180 / Math.PI - 90)})
             translate(${outerRadius},0)
          `)
                    .call(g => g.append("line")
                        .attr("x2", 6)
                        .attr("stroke", "#000"));
                d3.select(this).selectAll("g.tick")
                    .append("text")
                    .attr("x", 8)
                    .attr("dy", "0.35em")
                    .attr("transform", tick => tick.angle > Math.PI ? "rotate(180)translate(-16)" : null)
                    .attr("text-anchor", tick => tick.angle > Math.PI ? "end" : null)
                    .text(tick => tick.value);
            });

            // Draw chord ribbons.
            const ribbon = d3.ribbon().radius(innerRadius);
            g.append("g")
                .selectAll("path")
                .data(chords)
                .join("path")
                .attr("class", "chord")
                .attr("d", ribbon)
                .attr("fill", d => color(d.source.index))
                .attr("stroke", d => d3.rgb(color(d.source.index)).darker())
                .style("fill-opacity", 0.7)
                .style("stroke-width", "0.5px")
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

            // Build the grouped data display.
            const groupConnections = d3.select("#groupConnections");
            groupConnections.selectAll("*").remove();

            // Create a container for each group.
            for (let i = 0; i < numGroups; i++) {
                const container = groupConnections.append("div")
                    .attr("class", "group-container")
                    .attr("id", "group-container-" + i)
                    .style("border-left", "5px solid " + color(i));
                container.append("h3")
                    .text(groupNames[i])
                    .on("mouseover", function () { highlightGroup(i); })
                    .on("mouseout", function () { unhighlightGroup(i); });
                container.append("ul");
            }

            // Append chord connection entries to the appropriate group container.
            chords.forEach(d => {
                const chordId = getChordId(d);
                const groupIndex = d.source.index;
                const gIndex = groupIndex;
                let text;
                if (d.source.index === d.target.index) {
                    text = `${groupNames[d.source.index]} (self): ${d.source.value}`;
                } else {
                    text = `${groupNames[d.source.index]} ↔ ${groupNames[d.target.index]}: ${d.source.value}`;
                }
                d3.select("#group-container-" + groupIndex).select("ul")
                    .append("li")
                    .attr("id", chordId)
                    .attr("data-group", groupIndex)
                    .text(text)
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
            });
        }

        // Initially draw the diagram.
        updateChart();

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
    