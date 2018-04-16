function setTimes(var_min, var_max, step) {
    var times = []
    for (var i = var_min; i <= var_max; i += step) {
        times.push(i); 
    }
    return times
} 
function setWorkload(var_min, var_max) {
    var workloads = []
    for (var i = var_max; i >= var_min; i -= 1000) {
        workloads.push(i); 
    }
    iterator = workloads_set.values()
    temp = []
    for (var i = 0; i < workloads_set.size; i++) {
        temp.push(iterator.next().value) 
    }
    temp.sort(function(a, b){return b - a})
    for (var i = 0; i < temp.length; i++) {
        workloads_map.set(workloads[i], temp[i])
    }
    return workloads
}


var margin = { top: 100, right: 0, bottom: 500, left: 70 },
    width = 1100 - margin.left - margin.right, 
    height = 600 - margin.top - margin.bottom, 
    gridSize = Math.ceil(width/28), 
    legendElementWidth = Math.floor(width/15), 
    colors = ["#eef3f8","#ccdcea","#aac6dc","#89afcf","#6798c1","#4682b4","#3f76a3","#325e82","#264662"], 
    datasets = ["pointtime_RO.tsv", "pointtime_RW.tsv"], 
    current = "pointtime_RO.tsv"
    workloads = [], 
    workload_min = Number.MAX_VALUE,
    workload_max = Number.MIN_VALUE,
    selectedWorkload = Number.MAX_VALUE
    time_min = 0, 
    time_max = 180000,
    timestampInterval = 150,
    start = time_min, 
    end = time_max, 
    timestampList = []
    shift = 0
    first = true
    factors = [50, 25, 5, 1, 0.1]
    recs = [12, 6, 6, 8, 0]
    //time_max += timestampInterval * factors[0]
    factorsCount = 0
    timestampInterval *= factors[factorsCount++]
    times = setTimes(time_min, time_max, timestampInterval)
    workloads_set = new Set();
    workloads_map = new Map(); 


var svg = d3.select("#heat").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var heatmapChart = function(tsvFile) {
    current = tsvFile
    times = setTimes(time_min, time_max, timestampInterval)
    d3.tsv(tsvFile, 
        function(d, i) {
            w = +d.workload
            t = +d.timestamp
            v = +d.pit
            if (w < workload_min) {
                workload_min = w; 
            } else if (w > workload_max) {
                workload_max = w; 
            }
            workloads_set.add(w)
            if (t >= time_min && t <= time_max) {
                for (var j = 0; j < times.length; j++) {
                    if (times[j] == t) {
                        return {
                            workload: +d.workload, 
                            timestamp: +d.timestamp, 
                            value: +d.pit
                        };
                    }
                }
            }
        },
    function (error, data) {
        workloads = setWorkload(workload_min, workload_max)
        workload_int = workload_max/1000; 
        var workloadLabels = svg.selectAll(".colLabelg")
            .data(workloads)
            .enter().append("text")
            .text(function(d) {return workloads_map.get(d);})
            .attr("x", 0)
            .attr("y", function(d, i) {return (i * gridSize) - (gridSize/2);})
            //.attr("dy", "0.75em")
            .style("text-anchor", "end")
            .attr("transform", "translate(-6," + gridSize / 1.5 + ")")
            .attr("class",  function (d,i) { return "colLabel mono c"+i;} )
            .on("mouseover", function(d) {d3.select(this).classed("text-hover",true);})
            .on("mouseout" , function(d) {d3.select(this).classed("text-hover",false);});
        var timeLabels = svg.selectAll(".rowLabelg")
            .data(times)
            .enter().append("text")
            .text(function(d) {if (d >= time_min && d <= time_max) {return d;}})
            .attr("x",  -1 * gridSize * (workloads.length + 2))
            .attr("y", function(d, i) {return i * gridSize + (gridSize/2)})
            .style("text-anchor", "middle")
            //.attr("dy", "0.72em")
            .attr("transform", "translate(" + gridSize / 2 + ", -6)")
            .attr("transform", "rotate(-90)")
            //.attr("class", "timeLabel mono axis axis-worktime")
            .attr("class", function (d,i) { return "rowLabel mono r"+i;} ) 
            .on("mouseover", function(d) {d3.select(this).classed("text-hover",true);})
            .on("mouseout" , function(d) {d3.select(this).classed("text-hover",false);});
        var colorScale = d3.scale.quantile()
            .domain([d3.min(data, function(d) {return d.value}), d3.max(data, function (d) {return d.value})])
            .range(colors); 
        var cards = svg.append("g").attr("id", "cards").attr("class", "g3").selectAll(".cellg")
            .data(data, function(d) {return d.workload+ ":"+d.timestamp})
        .enter().append("rect")
            .attr("x", function(d, i) {return ((d.timestamp/timestampInterval) * gridSize)})
            .attr("y", function(d, i) {return (d.workload/1000 - workload_int) * -1 * gridSize - (d.workload/1000 - workload_int) - (gridSize/2)}) 
            .attr("workload", function(d, i) {return d.workload})
            .attr("timestamp", function(d, i) {return d.timestamp})
            .attr("rx", 4)
            .attr("yx", 4)
            .attr("class", function(d){return "cell cell-border cr"+(d.timestamp/timestampInterval)+" cc"+(-1 * d.workload/1000 - workload_int);})
            .attr("width", gridSize)
            .attr("height", gridSize)
            .style("fill", "#ffffd9")
            .on("mouseover", function(d){
                d3.select(this).classed("cell-hover",true);
                d3.selectAll(".rowLabel").classed("text-highlight",function(r,ri){ return ri==(d.timestamp - time_min)/timestampInterval;});
                d3.selectAll(".colLabel").classed("text-highlight",function(c,ci){ return ci==(d.workload/1000 - workload_int) * -1;});
                d3.select("#tooltip")
                 .style("left", (d3.event.pageX+10) + "px")
                 .style("top", (d3.event.pageY-10) + "px")
                 .select("#value")
                 .text("Workload: "+d.workload+"\n Timestamp: "+d.timestamp+"\nData: "+d.value+"\ncell-xy "+this.x.baseVal.value+", "+this.y.baseVal.value);  
               //Show the tooltip
                d3.select("#tooltip").classed("hidden", false);
            })
            .on("mouseout", function(){
                d3.select(this).classed("cell-hover",false);
                d3.selectAll(".rowLabel").classed("text-highlight",false);
                d3.selectAll(".colLabel").classed("text-highlight",false);
                d3.select("#tooltip").classed("hidden", true);
            });
        cards.transition().duration(1000)
            .style("fill", function(d) {return colorScale(d.value)})
        if (!first) {
            var rects = document.getElementsByClassName("cell")
            if (rects[0].x.baseVal.value != 0) {
                var bringLeft = rects[0].x.baseVal.value
                for (var i = 0; i < rects.length; i++) {
                    rects[i].attributes["0"].value -= bringLeft 
                }
            }
        }
        first = false; 
        var legend = svg.selectAll(".legend")
            .data([0].concat(colorScale.quantiles()), function(d) { return d; });
        svg.append("g")
              .attr("class", "y axis")
              .append("text")
              .attr("class", "label mono")
              .attr("y", -70)
              .attr("dy", ".71em")
              .attr("text-anchor", "end")
              .attr("transform", "rotate(-90)")
              .text("Workload Level");
        svg.append("g")
            .attr("id", "x-axis-label")
              .attr("class", "x axis")
              //.attr("transform", "translate(0," + height/2 + ")")
              .append("text")
              .attr("class", "label mono")
              .attr("x", width/2)
              .attr("y", gridSize * (workloads.length + 3.5))
              .attr("text-anchor", "end")
              .text("Time (" + timestampInterval +" ms)" + "\tMax Zoom Width: " + recs[factorsCount - 1]);
        legend.enter().append("g")
          .attr("class", "legend");
        legend.append("rect")
        .attr("x", function(d, i) { return legendElementWidth * i; })
        .attr("y", gridSize * (workloads.length + 4))
        .attr("width", legendElementWidth)
        .attr("height", gridSize / 2)
        .attr("class", "legend-rect")
        .style("fill", function(d, i) { return colors[i]; })
       legend.append("text")
        .attr("class", "mono")
        .text(function(d) { return "≥ " + Math.round(d); })
        .attr("x", function(d, i) { return legendElementWidth * i; })
        .attr("y", gridSize * (workloads.length + 4))
       legend.exit().remove();
        var sa=d3.select(".g3")
          .on("mousedown", function() {
              if( !d3.event.altKey) {
                 d3.selectAll(".cell-selected").classed("cell-selected",false);
                 d3.selectAll(".rowLabel").classed("text-selected",false);
                 d3.selectAll(".colLabel").classed("text-selected",false);
              }
             var p = d3.mouse(this);
             sa.append("rect")
             .attr({
                 rx      : 0,
                 ry      : 0,
                 class   : "selection",
                 x       : p[0],
                 y       : p[1],
                 width   : 1,
                 height  : 1
             })
          })
          .on("mousemove", function() {
             var s = sa.select("rect.selection");
             if(!s.empty()) {
                 var p = d3.mouse(this),
                     d = {
                         x       : parseInt(s.attr("x"), 10),
                         y       : parseInt(s.attr("y"), 10),
                         width   : parseInt(s.attr("width"), 10),
                         height  : parseInt(s.attr("height"), 10)
                     },
                     move = {
                         x : p[0] - d.x,
                         y : p[1] - d.y
                     }
                 ;
          
                 if(move.x < 1 || (move.x*2<d.width)) {
                     d.x = p[0];
                     d.width -= move.x;
                 } else {
                     d.width = move.x;       
                 }
          
                 if(move.y < 1 || (move.y*2<d.height)) {
                     d.y = p[1];
                     d.height -= move.y;
                 } else {
                     d.height = move.y;       
                 }
                 s.attr(d);
          
                     // deselect all temporary selected state objects
                 d3.selectAll('.cell-selection.cell-selected').classed("cell-selected", false);
                 d3.selectAll(".text-selection.text-selected").classed("text-selected",false);
                 d3.selectAll('.cell').filter(function(cell_d, i) {
                     if(
                         !d3.select(this).classed("cell-selected") && 
                             // inner circle inside selection frame
                         (this.x.baseVal.value)+gridSize >= d.x && (this.x.baseVal.value)<=d.x+d.width && 
                         (this.y.baseVal.value)+gridSize >= d.y && (this.y.baseVal.value)<=d.y+d.height
                     ) {
                         d3.select(this)
                         .classed("cell-selection", true)
                         .classed("cell-selected", true);
                         d3.select(".r"+(cell_d.row-1))
                         .classed("text-selection",true)
                         .classed("text-selected",true);
                         d3.select(".c"+(cell_d.col-1))
                         .classed("text-selection",true)
                         .classed("text-selected",true);
                     }
                 });
             }
          })
          .on("mouseup", function() {
                // remove selection frame
             var selectedRectangles = document.getElementsByClassName("cell-selected")
             start = time_min
             end = time_max
             for (var i = 0; i < selectedRectangles.length; i++) {
                timestampList.push(selectedRectangles[i].__data__.timestamp)
                selectedWorkload = Math.min(selectedWorkload, selectedRectangles[i].__data__.workload)
             }
             selectedWorkload = workloads_map.get(selectedWorkload)
             timestampList.sort(function(a, b){return a - b})
             if (timestampList.length >= 2 && timestampInterval != 50) {
                 time_min = timestampList[0]
                 time_max = timestampList[timestampList.length - 1]
                 //timestampInterval = Math.round((time_max - time_min) / (150 * 15))
                 timestampInterval = Math.round((timestampInterval/factors[factorsCount - 1]) * factors[factorsCount++])
                 if (timestampInterval == 15) {
                    timestampInterval = 50;
                 }
                 document.getElementById("cards").remove()
                 //document.getElementById("x-axis-label").remove()
                 d3.selectAll("#x-axis-label").remove()
                 //d3.selectAll(".cards").remove()
                 d3.selectAll(".colLabel").remove()
                 d3.selectAll(".rowLabel").remove()
                 /*var elements = document.getElementsByClassName("rowLabel")
                 while(elements.length > 0){
                    elements[0].parentNode.removeChild(elements[0]);
                 }*/
                 heatmapChart(current)
                 lines(selectedWorkload, timestampList, test_type)
                 timestampList = []
             }
             sa.selectAll("rect.selection").remove();
          
                 // remove temporary selection marker class
             d3.selectAll('.cell-selection').classed("cell-selection", false);
             d3.selectAll(".text-selection").classed("text-selection",false);
          })
          .on("mouseout", function() {
             if(d3.event.relatedTarget.tagName=='html') {
                     // remove selection frame
                 sa.selectAll("rect.selection").remove();
                     // remove temporary selection marker class
                 d3.selectAll('.cell-selection').classed("cell-selection", false);
                 d3.selectAll(".rowLabel").classed("text-selected",false);
                 d3.selectAll(".colLabel").classed("text-selected",false);
             }
          });
    }); 
}; 
test_type = datasets[0].slice(10, 12)
heatmapChart(datasets[0]);

var datasetpicker = d3.select("#dataset-picker").selectAll(".dataset-button")
    .data(datasets);
datasetpicker.enter()
    .append("input")
    .attr("value", function(d){ return "Dataset " + d })
    .attr("type", "button")
    .attr("class", "dataset-button")
    .on("click", function(d) {
        if (factorsCount == 1) {
            first = true; 
        } else {
            first = false; 
        }
        test_type = d.slice(10, 12)
        d3.selectAll(".colLabel").remove()
        d3.selectAll(".rowLabel").remove()
        d3.selectAll("#x-axis-label").remove()
        document.getElementById("cards").remove()
        heatmapChart(d);
        if (factorsCount == 1) {
            lines(10000, [time_min, 180000], test_type);                            
        } else {
            lines(selectedWorkload, [time_min, time_max], test_type);
        }
});

