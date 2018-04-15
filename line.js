lines(10000, [0,180000], test_type)
function lines(workload, timestampList, test_type) {
    table = '<center><h1>1311 QueueLength Graphs</h1></center><table style="width:100%"><tr><td><div id="graph1"></div></td><td><div id="graph2"></div></td></tr><br><tr><td><div id="graph3"></div></td><td><div id="graph4"></div></td></tr></table>'
    document.getElementById("linegraphs").innerHTML = table; 
    //workload = 1000; 
    timestamp_min = timestampList[0]
    timestamp_max = timestampList[timestampList.length - 1]
    types = ["apache", "tomcat","cjdbc", "mysql"]
    for (var i = 1; i <= 4; i++) {
      plotGraph("#graph" + i, workload, timestamp_min, timestamp_max, /*types[i -1] + "_" + "multiplicity_" + test_type + ".csv"*/ "multiplicity_" + test_type + ".csv", types[i - 1])
    }
}
function plotGraph(div_id, workload, timestamp_min, timestamp_max, csv_file, type) {
    function filter(d) {
      d.timestamp = +d.date_time;
      d.value = +d.total_http;
      d.type = d.type; 
      d.workload = +d.workload
      d.epoc_time = format(new Date(+d.epoc_time))
      if (d.timestamp >= timestamp_min && d.timestamp <= timestamp_max && d.workload == workload && d.type == type) {
        return d; 
      }
    }
    var format = d3.time.format("%M-%S-%L")
    var margin = {top: 10, right: 10, bottom: 100, left: 40},
        margin2 = {top: 430, right: 10, bottom: 20, left: 40},
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom,
        height2 = 500 - margin2.top - margin2.bottom;

    var x = d3.time.scale().range([0, width]),
        x2 = d3.time.scale().range([0, width]),
        y = d3.scale.linear().range([height, 0]),
        y2 = d3.scale.linear().range([height2, 0]);

    var xAxis = d3.svg.axis().scale(x).orient("bottom"),
        xAxis2 = d3.svg.axis().scale(x2).orient("bottom"),
        yAxis = d3.svg.axis().scale(y).orient("left");

    var brush = d3.svg.brush()
        .x(x2)
        .on("brush", brushed);

    var area = d3.svg.area()
        .interpolate("cardinal")
        .x(function(d) { return x(d.timestamp); })
        .y0(height)
        .y1(function(d) { return y(d.value); });

    var area2 = d3.svg.area()
        .interpolate("cardinal")
        .x(function(d) { return x2(d.timestamp); })
        .y0(height2)
        .y1(function(d) { return y2(d.value); });
   
    var header = d3.select(div_id).append("h2")
        .append("text")
          .attr("x", (width / 2))             
          .attr("text-anchor", "middle") 
          //.text(type.toUpperCase() + " " + csv_file.split(".")[0].toUpperCase() + " - " + workload + " -  QueueLength" )
          .text(type.toUpperCase() + " " + " - " + workload + " - QueueLength " + timestamp_min + "ms - " + timestamp_max + "ms")

    var svg = d3.select(div_id).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    svg.append("defs").append("clipPath")
        .attr("id", "clip")
      .append("rect")
        .attr("width", width)
        .attr("height", height);

    var focus = svg.append("g")
        .attr("class", "focus")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var context = svg.append("g")
        .attr("class", "context")
        .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

    var zoom = d3.behavior.zoom()
        .on("zoom", draw);

    var rect = svg.append("svg:rect")
        .attr("class", "pane")
        .attr("width", width)
        .attr("height", height)
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .call(zoom);

    d3.csv(csv_file, filter, function(error, data) {
      x.domain(d3.extent(data.map(function(d) { return d.date_time; })));
      y.domain([0, d3.max(data.map(function(d) { return d.value; }))]);
      x2.domain(x.domain());
      y2.domain(y.domain());

      zoom.x(x);
      focus.append("path")
          .datum(data)
          .attr("class", "area")
          .attr("d", area);

      focus.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + height + ")")
          .call(xAxis);

      focus.append("g")
          .attr("class", "y axis")
          .call(yAxis);

      context.append("path")
          .datum(data)
          .attr("class", "area")
          .attr("d", area2);

      context.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + height2 + ")")
          .call(xAxis2);

      context.append("g")
          .attr("class", "x brush")
          .call(brush)
        .selectAll("rect")
          .attr("y", -6)
          .attr("height", height2 + 7);
    });
    function brushed() {
      x.domain(brush.empty() ? x2.domain() : brush.extent());
      focus.select(".area").attr("d", area);
      focus.select(".x.axis").call(xAxis);
      zoom.x(x);
    }

    function draw() {
      focus.select(".area").attr("d", area);
      focus.select(".x.axis").call(xAxis);
      // Force changing brush range
      brush.extent(x.domain());
      svg.select(".brush").call(brush);
    }
}
