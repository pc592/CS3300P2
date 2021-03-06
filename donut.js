// Init tooltip and state name placeholder
var div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

/* https://bl.ocks.org/mbostock/3887193: donut chart reference */
d3.select("#a_tab").attr("class", "tab-pane active");
d3.select("#b_tab").attr("class", "tab-pane");
var data;
var year;
// var race;
// var gender;
var returnedData;

d3.csv("data/RaceByYear.csv", parseRow, callback);

function parseRow(row) {
  var newRow = {};

  newRow["Gender"] = row["Gender"]
  newRow["Year"] = Number(row["Year"])

  var splitStr = " ("
  newRow["RaceName"] = row["Race"].split(splitStr)[0];

  newRow["Race"] = row["Race"].split('(')[0] + "["+newRow["Year"]+"]";

  newRow["Brown"] = Number(row["Brown University"])
  newRow["Columbia"] = Number(row["Columbia University in the City of New York"])
  newRow["Cornell"] = Number(row["Cornell University"])
  newRow["Dartmouth"] = Number(row["Dartmouth College"])
  newRow["Harvard"] = Number(row["Harvard University"])
  newRow["Princeton"] = Number(row["Princeton University"])
  newRow["UPenn"] = Number(row["University of Pennsylvania"])
  newRow["Yale"] = Number(row["Yale University"])

  return newRow;
}

function callback(error, rawData) {
  data = rawData;

  year = d3.nest()
  .key(function (d) { return d.Year; })
  .entries(data);

  // race = d3.nest()
  // .key(function (d) { return d.Race; })
  // .entries(data);

  // gender = d3.nest()
  // .key(function (d) { return d.Gender; })
  // .entries(data);

  createVisualization("1");
  createVisualization("2");
}


/* Helper functions for translating and rotating with inputs */
function translate (x,y) { return "translate(" + x + "," + y + ")"; };
function rotate (a,x,y) { return "rotate(" + a + " " + x + "," + y + ")"};

//don't think we need school_list or school_maps anymore
var school_list= ["Columbia", "Dartmouth", "Brown", "Cornell",
                  "Harvard", "Princeton", "UPenn", "Yale"]
// var school_maps = [];

function createVisualization(num) {

  var winHeight = window.innerHeight-10;
  var winWidth = window.innerWidth-10;
  var side = Math.min(winHeight,winWidth);

  // year from slider
  // default is 2005, corresponds with 11
  var yearInput= 11;

  var slideInput = d3.select("#slider"+num)
    .on("input", function(){
      //Corresponds with a value 0-22 (this value goes in the x for year[x] in the comment above)
      yearInput = this.value - 1994;
      d3.select("#sliderCur"+num).text(this.value);
      d3.select("#sliderCur"+num).style("left",76*(this.value-1994)/(2016-1994)+10 + "%");
      render();
    });

  // school name from radio buttons
  // var schoolInput = "Cornell";
  var schoolInput = school_list[Math.floor(Math.random()*8)];
  d3.select("#"+schoolInput+num)._groups[0][0].checked=true;
  var radioInput = d3.selectAll("#buttons"+num).selectAll(".but")
    .on("change", function(){
      schoolInput = this.value;
      render();
    });

  var color = d3.scaleOrdinal(d3.schemeCategory20);

  // draw and append the container
  // **must be percentages to work with viewBox;
  var svg = d3.select("#donut"+num)
    .attr("width", "75%")   // each svg takes up 50% of the window
    .attr("height", "75%")  // each svg takes up 75% of the window
    .attr("viewBox", "0 0 "+side+" "+side)   // allows for relative resizing
    .append("g");

  // set the thickness of the inner and outer radii
  var oRadius = side / 2;
  var iRadius = side / 2.75;

  // construct arc generator
  var arc = d3.arc()
    .outerRadius(oRadius)
    .innerRadius(iRadius);

  var arcOver = d3.arc()
  .outerRadius(oRadius + 10)
  .innerRadius(iRadius);

  // creates the pie chart container
  var g = svg.append("g")
    .attr("transform", translate(side/2,side/2));

  // construct default pie laoyut
  var pie = d3.pie().value(function(d){ return d; }).sort(null);

  render();

  // Store the displayed angles in _current.
  // Then, interpolate from _current to the new angles.
  // During the transition, _current is updated in-place by d3.interpolate.
  function arcTween(a) {
    var i = d3.interpolate(this._current, a);
    this._current = i(0);
    return function(t) {
      return arc(i(t));
    };
  }

  var indexesSelected = [];
  function render() {

    var partialStats=0;
    var totalStats;

    //the circle should be the diversity distribution from the school
    //selected, during the selected year
    function makeDataSchool(num,racedic){
      totalStats = 0;
      //will use yearInput in place of the 0 in all of the following
      var races= Object.values(year[yearInput])[1];
      returnedData = d3.range(races.length).map(function(item) {
        var rac = Object.values(year[yearInput])[1][item];
        var abvName = rac.RaceName;
        racedic.set(item, abvName);
        totalStats += Object.values(year[yearInput])[1][item][schoolInput];
        return Object.values(year[yearInput])[1][item][schoolInput];
      });
      d3.select("#total_stats"+num).text("Number of enrolled students total: " + totalStats);
      return returnedData;
    };

    d3.select("#current_demograhic" + num).text("Hovered Demographic: ")
    var racedic = d3.map();

    // generate new random data
    //donut_data = makeData(+document.getElementById("datacount").value);
    var donut_data = makeDataSchool(num, racedic);

    // add transition to new path
    g.datum(donut_data).selectAll("path")
      .data(pie)
      .transition().duration(1000)
      .attrTween("d", arcTween);

    g.datum(donut_data).selectAll("g").remove();

    // add any new paths
    var paths = g.datum(donut_data).selectAll("path")
      .data(pie(donut_data));

    indexesSelected = [];
    // create/update pie chart groups
    var pathG = paths.enter().append("g")
      .attr("id",function(d,i){return "pathG"+i});

    pathG.append("path")
        .attr("class","pieChartArcs")
      .merge(pathG)
        .attr("fill", function(d,i){ return color(i); })
        .attr("d", arc)
        .on("mouseover", function(d) {
          div.transition().duration(200)
            .style("opacity", 1);
            div.html("Hovered Demographic: " + racedic.get(d.index) + " - " + donut_data[d.index]
            + ", " + (100*(donut_data[d.index]/totalStats)).toFixed(2) + "%")
            .style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY-28) + "px");
          d3.select("#current_demograhic" + num).text("Hovered Demographic: " + racedic.get(d.index) + " - " + donut_data[d.index]
            + ", " + (100*(donut_data[d.index]/totalStats)).toFixed(2) + "%");
          d3.select(this.parentNode).select('text')
            .style("font-size", "7vh")
            .style("opacity", "1")
          d3.select(this)
            .transition()
            .attr("d", arcOver);
        })
        .on("mouseout", function(d) {
          d3.select("#current_demograhic" + num).text("Hovered Demographic: ");
          if(indexesSelected.indexOf(d.index) == -1){
            div.transition().duration(500)
            .style("opacity", 0);
            d3.select(this.parentNode).select('text')
              .style("font-size", "5vh")
              .style("opacity", "0.6")
            d3.select(this)
              .transition()
              .attr("d", arc);
          }
        })
        .on("click", function(d){
          if(indexesSelected.indexOf(d.index) == -1){
            indexesSelected.push(d.index);
            partialStats += donut_data[d.index];
            var changeStat = d3.select("#total_stats"+num).text("Number of enrolled students of selected race(s): " + partialStats
            + ", " + (100*(partialStats/totalStats)).toFixed(2) + "%");
          }
        });

    pathG.append("text")
        .attr("class","pieChartLabels")
        .attr("dy", ".35em")
      .merge(pathG)
        .attr("transform", function(d) {
          var pos = arc.centroid(d);
          return "translate(" + pos + ")";
        })
        .style("text-anchor", "middle")
        .text(function(d) {
          if (d.data != 0) {
            return race_shortened(racedic.get(d.index));
          }
        })
        .on("mouseenter", function(d,i) {
          div.transition().duration(200)
            .style("opacity", 1);
            div.html("Hovered Demographic: " + racedic.get(d.index) + " - " + donut_data[d.index]
            + ", " + (100*(donut_data[d.index]/totalStats)).toFixed(2) + "%")
            .style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY-28) + "px");
          d3.select(this)
              .style("font-size", "7vh")
              .style("opacity", "1")
          d3.select(this.parentNode).select('path')
            .transition()
            .attr("d", arcOver);
          d3.select("#current_demograhic" + num).text("Hovered Demographic: " + racedic.get(d.index) + " - " + donut_data[d.index]
            + ", " + (100*(donut_data[d.index]/totalStats)).toFixed(2) + "%");
        })
        .on("mouseout", function(d) {
          div.transition().duration(500)
            .style("opacity", 0);
          d3.select("#current_demograhic" + num).text("Hovered Demographic: ");
          if(indexesSelected.indexOf(d.index) == -1){
            d3.select(this)
              .style("font-size", "5vh")
              .style("opacity", "0.6")
            d3.select(this.parentNode).select('path')
              .transition()
              .attr("d", arc);
          }
        })
        .on("click", function(d){
          if(indexesSelected.indexOf(d.index) == -1){
            indexesSelected.push(d.index);
            partialStats += donut_data[d.index];
            var changeStat = d3.select("#total_stats"+num).text("Number of enrolled students of selected race(s): " + partialStats
              + ", " + (100*(partialStats/totalStats)).toFixed(2) + "%");
          };
        });

    svg.selectAll("image").remove();
    var image = svg.selectAll("image")
      .data([schoolInput]);
    image.enter()
      .append("image")
        .attr("class","image")
        .attr("width","50%")
        .attr("height","50%")
        .attr("x","25%")
        .attr("y","25%")
      .merge(image)
        .attr("xlink:href", "images/"+schoolInput+".png")
      .on("click", function(d){
        render();
      });
  }

}

function race_shortened(race) {
  var split_race= race.split(/[\/\s\-]+/)
  var shortened= ""
  for (var i = 0; i < split_race.length-1; i++) {
    if ((split_race[i].toUpperCase() != "RACE")
                && (split_race[i].toUpperCase() != "ETHNICITY")) {
      var add = split_race[i][0].toUpperCase();
    } else {
      var add = ""
    }
    if (split_race[i].toUpperCase() == "NON") {
      add += "-";
    } else if (add == "") {
      add += "";
    } else {
      add += ".";
    }
    shortened += add;
  }
  shortened = shortened + split_race[split_race.length-1][0]
  return shortened
}
