// 1) Generate random data for 5 entities, from 1970 to 2020
const entities = ["Entity A", "Entity B", "Entity C", "Entity D", "Entity E"];
const years = d3.range(1970, 2021); // [1970..2020]

let data = years.map(y => {
  let row = {
    year: y
  };
  entities.forEach(e => {
    row[e] = Math.floor(Math.random() * 101);
  });
  return row;
});

// 2) Compute rank for each entity per year
let ranks = {};
data.forEach(d => {
  const y = d.year;
  // sort entities by descending value
  let sorted = [...entities].sort((a, b) => d[b] - d[a]);
  let rankMap = {};
  sorted.forEach((ent, i) => {
    rankMap[ent] = i + 1;
  });
  ranks[y] = rankMap;
});

// For each entity, create an array of {year, rank}
let ranksByEntity = {};
entities.forEach(e => {
  ranksByEntity[e] = years.map(y => ({
    year: y,
    rank: ranks[y][e]
  }));
});

// 3) Create 5 distinct colors
const colorStops = [
  "#2A2550", // space cadet
  "#4B2248",
  "#7A1F40",
  "#C41E3A", // cardinal
  "#FF4040" // coral red
];
const colorOrdinal = d3.scaleOrdinal()
  .domain(entities)
  .range(colorStops);

let entityColors = {};
entities.forEach(e => {
  entityColors[e] = colorOrdinal(e);
});

// 4) Setup the SVG chart
const margin = {
    top: 20,
    right: 20,
    bottom: 40,
    left: 40
  },
  width = 800 - margin.left - margin.right,
  height = 400 - margin.top - margin.bottom;

const svg = d3.select("#chart-svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom);

const chartG = svg.append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

const xScale = d3.scaleLinear().range([0, width]);
const yScale = d3.scaleLinear().domain([1, 5]).range([0, height]);

const xAxis = d3.axisBottom(xScale).tickFormat(d3.format("d"));
const yAxis = d3.axisLeft(yScale).ticks(5);

const xAxisG = chartG.append("g")
  .attr("class", "x axis")
  .attr("transform", `translate(0,${height})`);

const yAxisG = chartG.append("g")
  .attr("class", "y axis");

// line generator
const lineGen = d3.line()
  .x(d => xScale(d.year))
  .y(d => yScale(d.rank))
  .curve(d3.curveMonotoneX);

// Create a group for each entity and attach the entity name as datum
let entityGroups = chartG.selectAll(".entityGroup")
  .data(entities)
  .enter()
  .append("g")
  .attr("class", "entityGroup");

// Append the path for each entity and fix the click event
entityGroups.append("path")
  .attr("class", "line")
  .attr("fill", "none")
  .attr("stroke", d => entityColors[d])
  .on("click", function(event) {
    event.stopPropagation();
    // Use the parent group’s datum (the entity name)
    const entity = d3.select(this.parentNode).datum();
    toggleHighlight(entity);
  });

// Highlight handling
let highlightedEntity = null;

function toggleHighlight(entity) {
  highlightedEntity = (highlightedEntity === entity) ? null : entity;
  updateVisibility();
}

function updateVisibility() {
  // Update chart lines based on the parent's datum (entity name)
  chartG.selectAll(".entityGroup").each(function(entity) {
    d3.select(this).select(".line")
      .transition()
      .duration(300)
      .style("opacity", () => {
        return (!highlightedEntity || entity === highlightedEntity) ? 1 : 0.2;
      });
  });

  // Update table rows
  d3.select("#data-table")
    .selectAll("tbody tr")
    .transition()
    .duration(300)
    .style("opacity", rowData => {
      if (!highlightedEntity) return 1;
      return (rowData.entity === highlightedEntity) ? 1 : 0.5;
    });
}

// Clicking outside chart/table -> deselect
document.addEventListener("click", (event) => {
  const chartContainer = document.getElementById("chart-container");
  const tableContainer = document.getElementById("table-container");
  if (!chartContainer.contains(event.target) && !tableContainer.contains(event.target)) {
    if (highlightedEntity !== null) {
      highlightedEntity = null;
      updateVisibility();
    }
  }
});

// 5) Update function for chart and table
const table = d3.select("#data-table");

function updateChart(startYear) {
  let endYear = startYear + 5;
  if (endYear > 2020) endYear = 2020;

  // Filter the rank data
  const filteredRanksByEntity = {};
  entities.forEach(e => {
    filteredRanksByEntity[e] = ranksByEntity[e].filter(d => d.year >= startYear && d.year <= endYear);
  });

  // Update xScale domain
  xScale.domain([startYear, endYear]);
  // Force integer ticks
  xAxis.tickValues(d3.range(startYear, endYear + 1));

  // Update lines
  entityGroups.each(function(entity) {
    d3.select(this).select("path.line")
      .datum(filteredRanksByEntity[entity])
      .transition()
      .duration(500)
      .attr("d", lineGen)
      .attr("stroke", entityColors[entity]);
  });

  // Update axes
  xAxisG.transition().duration(500).call(xAxis);
  yAxisG.transition().duration(500).call(yAxis);

  updateVisibility();

  // Update table
  table.selectAll("thead").remove();
  table.selectAll("tbody").remove();

  let entityRanks = entities.map(e => {
    let ranksSpan = filteredRanksByEntity[e];
    let finalRank = ranksSpan.length > 0 ? ranksSpan[ranksSpan.length - 1].rank : 0;
    return {
      entity: e,
      finalRank,
      ranksSpan
    };
  });

  // Sort by final rank ascending (0 => put last)
  entityRanks.sort((a, b) => {
    if (a.finalRank === 0 && b.finalRank === 0) return 0;
    if (a.finalRank === 0) return 1;
    if (b.finalRank === 0) return -1;
    return a.finalRank - b.finalRank;
  });

  let spanYears = d3.range(startYear, endYear + 1);

  let thead = table.append("thead");
  let headerRow = thead.append("tr");
  headerRow.append("th").text("Rank");
  headerRow.append("th").text("Entity");
  spanYears.forEach(y => headerRow.append("th").text(y));

  let tbody = table.append("tbody");
  entityRanks.forEach(obj => {
    let tr = tbody.append("tr").datum(obj);

    // If finalRank=0 => blank
    let rankDisplay = (obj.finalRank > 0) ? obj.finalRank : "";

    // First column: rank
    tr.append("td").text(rankDisplay);

    // Second column: entity (with color circle)
    const c = entityColors[obj.entity];
    tr.append("td").html(`
          <svg width="10" height="10" style="vertical-align: middle;">
            <circle cx="5" cy="5" r="5" fill="${c}" />
          </svg>
          &nbsp;${obj.entity}
        `);

    // Next columns: rank for each year in the timespan
    spanYears.forEach(y => {
      let yrData = obj.ranksSpan.find(d => d.year === y);
      let rankVal = yrData ? yrData.rank : "";
      tr.append("td").text(rankVal);
    });
    // Clicking a table row toggles highlight
    tr.on("click", (event, rowData) => {
      // Stop from bubbling to document
      event.stopPropagation();
      toggleHighlight(rowData.entity);
    });
  });
}

// Initialize
updateChart(1970);

// Slider listener
const slider = document.getElementById("year-range");
slider.addEventListener("input", function() {
  const startYear = +this.value;
  updateChart(startYear);
});