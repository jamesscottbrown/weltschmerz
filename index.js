
// I will change to input
var ageMin = 12;
var ageMax = 50;

var queryBegin = "https://suggestqueries.google.com/complete/search?client=chrome&q=";
var queryEnd = "&callback=?";

var allSuggestionsRaw = [];

d3.select('#go').on('click', function () {
  d3.event.preventDefault();
  allSuggestionsRaw = [];
  var query = d3.select('#query').property("value");
  console.log("query", query);
  fetchForAge(query, ageMin, ageMax);
});

function fetchForAge (query, age, ageMax) {

  var queryFilled = query.replace("X", age);
  console.log("Quering for: ", queryFilled);

  $.getJSON(queryBegin + queryFilled + queryEnd, function (data) {

    var suggestions = data[1]
      .filter(function (d) {
        return d.toLowerCase().indexOf(queryFilled.toLowerCase()) > -1;
      })
      .map(function (d) {
        return d.slice(queryFilled.length);
      });

    allSuggestionsRaw.push({
      age:         age,
      suggestions: suggestions
    });

    if (age < ageMax) {
      fetchForAge (query, age + 1, ageMax);
    } else {
      draw(processData(allSuggestionsRaw));  // later it will be updated with each step
    }

  });

}

function processData (allSuggestionsRaw) {
  var suggestionDict = {};

  allSuggestionsRaw.forEach(function (byAge) {
    byAge.suggestions.forEach(function (suggestion) {
      if (suggestion in suggestionDict) {
        suggestionDict[suggestion].push(byAge.age);
      } else {
        suggestionDict[suggestion] = [byAge.age];
      }
    });
  });

  var suggestionArray = [];
  var k;

  for (k in suggestionDict) {
    suggestionArray.push({
      suggestion: k,
      ages:       suggestionDict[k],
    })
  }

  suggestionArray = suggestionArray.sort(function (a, b) {
    return b.ages.length - a.ages.length;
  });

  return suggestionArray;

}

function draw (allSuggestions) {


  d3.select('#plot svg').remove();

  allSuggestions = allSuggestions.filter(function (d) {
    return d.ages.length > 1;
  });

  console.log(allSuggestions);

  var svg = d3.select('#plot').append('svg')
    .attr('width', 900)
    .attr('height', 600);


  var scaleX = d3.scale.linear()
    .domain([ageMin - 0.5, ageMax + 0.5])
    .range([50, 650]);

  var scaleY = d3.scale.linear()
    .domain([0, 1])
    .range([70, 90]);

  var xAxis = d3.svg.axis()
    .scale(scaleX)
    .orient('top')
    .tickSize(6);

  svg.append('g')
    .attr('class', 'x-axis')
    .attr('transform', 'translate(' + 0 + ',' + 50 + ')')
    .call(xAxis);

  var lines = svg.append('g').selectAll('.lines')
    .data(allSuggestions)
    .enter()
      .append('g')
        .attr('class', 'lines')
        .attr('transform', function (d, i) {
          return 'translate(' + 0 + ',' + scaleY(i) + ')';
        });

  lines.selectAll('line')
    .data(function (d) { return d.ages; })
    .enter()
      .append('line')
        .attr('x1', function (d) { return scaleX(d - 0.5); })
        .attr('x2', function (d) { return scaleX(d + 0.5); });

  var labels = svg.append('g')
    .attr('class', 'labels')
    .attr('transform', 'translate(' + (scaleX(ageMax + 0.5) + 5) + ',' + 0 + ')');

  labels.selectAll('text')
    .data(allSuggestions)
    .enter()
      .append('text')
        .attr('y', function (d, i) { return scaleY(i); })
        .text(function (d) { return d.suggestion; });

}
