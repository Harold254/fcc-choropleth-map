const width = 960; // Width of the SVG
const height = 600; // Height of the SVG

// Colors for the choropleth
const colors = [
  "#f7fbff",
  "#deebf7",
  "#c6dbef",
  "#9ecae1",
  "#6baed6",
  "#3182bd",
  "#08519c",
];

// Create the SVG element and set its width and height
const svg = d3
  .select("#choropleth")
  .attr("width", width)
  .attr("height", height);

// Select the tooltip element
const tooltip = d3.select("#tooltip");

// Create a geographic path generator
const path = d3.geoPath();

// Create a linear scale for the x-axis of the legend
const x = d3.scaleLinear().domain([2.6, 75.1]).rangeRound([600, 860]);

// Create a threshold scale for the fill colors
const color = d3
  .scaleThreshold()
  .domain(d3.range(2.6, 75.1, (75.1 - 2.6) / 8))
  .range(colors);

// Append a group element for the legend
const g = svg
  .append("g")
  .attr("class", "key")
  .attr("id", "legend")
  .attr("transform", "translate(0,40)");

// Append rectangles for the legend color scale
g.selectAll("rect")
  .data(
    color.range().map((d) => {
      d = color.invertExtent(d);
      if (d[0] == null) d[0] = x.domain()[0];
      if (d[1] == null) d[1] = x.domain()[1];
      return d;
    })
  )
  .enter()
  .append("rect")
  .attr("height", 8)
  .attr("x", (d) => x(d[0]))
  .attr("width", (d) => x(d[1]) - x(d[0]))
  .attr("fill", (d) => color(d[0]));

// Add text label for the legend
g.append("text")
  .attr("class", "caption")
  .attr("x", x.range()[0])
  .attr("y", -6)
  .attr("fill", "#000")
  .attr("text-anchor", "start")
  .attr("font-weight", "bold")
  .text("Education level (%)");

// Add the x-axis to the legend
g.call(
  d3
    .axisBottom(x)
    .tickSize(13)
    .tickFormat((d) => Math.round(d) + "%")
    .tickValues(color.domain())
)
  .select(".domain")
  .remove();

// Load the data
Promise.all([
  d3.json(
    "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json"
  ),
  d3.json(
    "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json"
  ),
])
  .then(([us, education]) => {
    const educationData = {};
    education.forEach((d) => {
      educationData[d.fips] = d; // Store education data by FIPS code
    });

    // Append paths for each county
    svg
      .append("g")
      .selectAll("path")
      .data(topojson.feature(us, us.objects.counties).features) // Convert TopoJSON to GeoJSON
      .enter()
      .append("path")
      .attr("class", "county")
      .attr("data-fips", (d) => d.id)
      .attr("data-education", (d) =>
        educationData[d.id] ? educationData[d.id].bachelorsOrHigher : 0
      )
      .attr("fill", (d) => {
        const education = educationData[d.id];
        return education ? color(education.bachelorsOrHigher) : "#ccc"; // Color based on education level
      })
      .attr("d", path) // Define the path for each county
      .on("mouseover", function (event, d) {
        const education = educationData[d.id];
        tooltip
          .style("display", "block")
          .html(
            `
                    <strong>${education.area_name}, ${education.state}</strong><br>
                    ${education.bachelorsOrHigher}% with Bachelor's degree or higher
                `
          )
          .attr("data-education", education.bachelorsOrHigher)
          .style("left", event.pageX + 10 + "px") // Position tooltip near the mouse
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", function () {
        tooltip.style("display", "none"); // Hide tooltip on mouseout
      });
  })
  .catch((error) => {
    console.error("Error loading or processing data:", error);
  });
