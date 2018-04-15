var margin = {top: 20, right: 20, bottom: 30, left: 50},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;


var school_list_line= ["Brown University", "Columbia University in the City of New York", "Cornell University", "Dartmouth College",
"Harvard University", "Princeton University", "University of Pennsylvania", "Yale University"];

var school_colors= ["#4E3629","#9bddff", "B31B1B", "#00693e", "#c90016", "#ff8f00", "000f3A", "#0f4d92"]

var year_line;
var data_line;
var x = d3.scaleLinear()
    .range([0, width])
var y = d3.scaleLinear()
    .range([height, 0]);
var xAxis = d3.axisBottom(x)
.tickFormat(d3.format("d"))
var yAxis = d3.axisLeft(y)

/* for each school, have a line that has a value of its diversity index? */
/* on hover it shows a breakdown of the percent distribution of demographics */

function diversityIndex(yearInput,schoolInput){
        var total= 0;
        numWhite= 0;
        year_inf= year_line[yearInput]
        var races= Object.values(year_line[yearInput])[1];
        //console.log("races are: ");
        //console.log(races);
        returnedData = d3.range(races.length).map(function(item) {
          var rac = races[item];
          var num_people= rac[schoolInput];
          if (rac.Race.indexOf("White") != -1) {
            numWhite += Number(num_people)
          }
          total += Number(num_people)
        });
        //console.log("total is " + total);
        //sonsole.log("numWhite is " + numWhite);
        return 100 - numWhite / total * 100;
};

function make_line(school) {
  return d3.line()
    .x(function(d) {return x(Number(d.Year)); })
    .y(function(d) {return y(Number(diversityIndex(Number(d.Year)-1994,school))); });
}

var svg_line = d3.select("acontent").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + 100 + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

d3.csv("data/temp.csv", function(error, data_l) {
  data_line= data_l;
  year_line = d3.nest()
        .key(function (d) {return d.Year; })
        .entries(data_line);
  x.domain(d3.extent(data_line, function(d) { return Number(d.Year); }));
  y.domain([0, 100]);

  svg_line.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

  svg_line.append("g")
      .attr("class", "y axis")
      .call(yAxis)

  for (var i= 0; i < school_list_line.length; i++) {
    svg_line.append("path")
    .datum(data_line)
      .attr("id", "line" + i)
      .attr("class", "line")
      .style("fill", "none")
      .style("opacity", 0.3)
      .style("stroke", school_colors[i])
      .style("stroke-width", "4px")
      .attr("d", make_line(school_list_line[i]))
      .on("mouseover", function(d) {
        d3.select(this)
          .style("opacity", 1)
      })
      .on("mouseleave", function(d) {
        d3.select(this)
          .style("opacity", 0.3)
      })
  }

  // text label for the y axis
  svg_line.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x",0 - (height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text("Diversity Index");

     // text label for the x axis
  svg_line.append("text")
      .attr("transform",
            "translate(" + (width/2) + " ," +
                           (height + margin.top + 20) + ")")
      .text("Year");
});