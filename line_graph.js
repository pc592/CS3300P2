/* https://bl.ocks.org/d3noob/4db972df5d7efc7d611255d1cc6f3c4f: useful base
for creating multi=line graph */

/* http://bl.ocks.org/d3noob/a22c42db65eb00d4e369: tooltip reference */
d3.select("#b_tab").attr("class", "tab-pane active");
d3.select("#a_tab").attr("class", "tab-pane");
var diversityIdxObj = {};
var diversityIdxYrs = {};

// Define margin and dimensions of web page
var margin = {top: 20, right: 20, bottom: 30, left: 80},
    width = 900 - margin.left - margin.right,
    height = 450 - margin.top - margin.bottom;

// list of all ivy league school names
var school_list_line= ["Brown University", "Columbia University in the City of New York",
"Cornell University", "Dartmouth College","Harvard University", "Princeton University",
"University of Pennsylvania", "Yale University"];

// list of all ivy leage school colors
var school_colors= ["#4E3629","#9bddff", "#B31B1B", "#00693e", "#c90016",
"#ff8f00", "#000f3A", "#0f4d92"]

// data organized by year
var year_line;
// raw data
var data_line;
// scale for x axis
var x = d3.scaleLinear()
    .range([0, width])
// scale for y axis
var y = d3.scaleLinear()
    .range([height, 0]);
// Define axes
var xAxis = d3.axisBottom(x)
    .tickFormat(d3.format("d"))
var yAxis = d3.axisLeft(y)

/* Return the percentage of non-white students during
 * year @yearInput and school @schoolInput */
function diversityIndex(yearInput,schoolInput){
  var total= 0;
  numWhite= 0;
  year_inf= year_line[yearInput]
  var races= Object.values(year_line[yearInput])[1];
  returnedData = d3.range(races.length).map(function(item) {
    var rac = races[item];
    var num_people= rac[schoolInput];
    if (rac.Race.indexOf("White") != -1) {
      numWhite += Number(num_people)
    }
    total += Number(num_people)
  });
  var divIndexVal = 100 - (numWhite / total) * 100;

  // populate diversityIdxObj with diversity indexes by school and year
  if (diversityIdxObj[schoolInput] == undefined) {
    diversityIdxObj[schoolInput] = [divIndexVal];
    diversityIdxYrs[schoolInput] = [yearInput];
  } else if (diversityIdxYrs[schoolInput][diversityIdxYrs[schoolInput].length-1] != yearInput){
    diversityIdxObj[schoolInput].push(divIndexVal);
    diversityIdxYrs[schoolInput].push(yearInput);
  }
  return divIndexVal;
};

/* Return a line function for ivy league @school */
function make_line(school) {
  return d3.line()
    .x(function(d) {return x(Number(d.Year)); })
    .y(function(d) {return y(Number(diversityIndex(Number(d.Year)-1994,school))); });
}
//Define the svg for the multi-line graph
var svg_line = d3.select("bcontent").select("#line_svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + 100 + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

//Add the text label for when hovering over the line
svg_line.append("text")
  .attr("id", "IvyName")
  .attr("x", 30)
  .attr("y", 50)
  .style("font-size", "24pt");

//Process the data
d3.csv("data/RaceByYear.csv", function(error, data_l) {
  data_line= data_l;
  //Map the data by year
  year_line = d3.nest()
        .key(function (d) {return d.Year; })
        .entries(data_line);
  //Define the values of the x and y scales
  x.domain(d3.extent(data_line, function(d) { return Number(d.Year); }));
  y.domain([0, 100]);
  // Add the axes to the svg
  svg_line.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);
  svg_line.append("g")
    .attr("class", "y axis")
    .call(yAxis)
  // Add a line for each of the ivy league schools,
  // plotting diversity index vs year
  for (var i= 0; i < school_list_line.length; i++) {
    svg_line.append("path")
      .datum(data_line)
        .attr("id", school_list_line[i]+" Line")
        .attr("class", "line")
        .style("fill", "none")
        .style("opacity", 0.3)
        .style("stroke", school_colors[i])
        .style("stroke-width", "4px")
        .attr("d", make_line(school_list_line[i]))
        .on("mouseover", function(d) {
          d3.select(this)
            .style("opacity", 0.9);
          svg_line.select("#IvyName").text((this.id).split(" Line")[0]);
        })
        .on("mouseleave", function(d) {
          d3.select(this)
            .style("opacity", 0.3);
          svg_line.select("#IvyName").text("");
        })
  }

  // create tooltip div
  var div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  // get all circles
  var circles = svg_line.selectAll("circle")

  // for each school, add points at each year
  for (var i= 0; i < school_list_line.length; i++) {
    circles.data(Object.values(diversityIdxObj)[i])
      .enter().append("circle")
        .attr("r",3)
        .attr("id", school_list_line[i]+" Dot " + (1994+i))
        .attr("cx",function(d,i){ return x(1994+i); })
        .attr("cy",function(d,i){ return y(d); })
        .attr("fill",school_colors[i])
        .attr("z-index",-10)
        .style("opacity",0.8)
        // set hover events
        .on("mouseover", function(d) {
          d3.select(this)
            .style("opacity", 1.0);
          svg_line.select("#IvyName").text((this.id).split(" Dot")[0]);
          svg_line.select("path[id='"+(this.id).split(" Dot")[0]+" Line']")
            .style("opacity",0.9);

          // https://en.wikipedia.org/wiki/Web_colors#X11_color_names <-- pick colors by name!

          // show tooltip
          div.transition().duration(200)
            .style("opacity", 0.9);
          div.html(d.toFixed(2)+"%")
            .style("width","60px")
            .style("height","20px")
            .style("left", d3.event.pageX-60-10+"px")
            .style("top", d3.event.pageY-20-10+"px");
        })
        .on("mouseleave", function(d) {
          d3.select(this)
            .style("opacity", 0.8);
          svg_line.select("#IvyName").text("");
          svg_line.select("path[id='"+(this.id).split(" Dot")[0]+" Line']")
            .style("opacity",0.3);

          // hide tooltip
          div.transition().duration(500)
            .style("opacity", 0);
        })
  }

  // text label for the y axis
  svg_line.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left/3*2)
    .attr("x",0 - (height / 2))
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text("Diversity Index*");

  // text label for the x axis
  svg_line.append("text")
    .attr("transform",
          "translate(" + (width/2) + " ," + (height + margin.top + 20) + ")")
    .text("Year");
});

//annotation
svg_line.append("text")
  .attr("y",height+margin.bottom+40+"px")
  .attr("font-size","0.75em")
  .text("*Diversity Index is the percentage of non-white students enrolled out of total students enrolled")