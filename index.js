var queryBegin = "https://suggestqueries.google.com/complete/search?client=chrome&q=";
var queryEnd = "&callback=?";

var allSuggestionsRaw = [];

d3.select('#go').on('click', function () {
  d3.event.preventDefault();
  allSuggestionsRaw = [];
  var query = d3.select('#query').property("value");
  var ageMin = parseInt(d3.select('#xFrom').property("value"));
  var ageMax = parseInt(d3.select('#xTo').property("value"));
  console.log("query", query);
  fetchForAge(query, ageMin, ageMin, ageMax);
});

function fetchForAge (query, age, ageMin, ageMax) {

  var queryFilled = query.replace("X", age);

  d3.select('#progress').html("Quering for: " + queryFilled);

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
      fetchForAge (query, age + 1, ageMin, ageMax);
    } else {
      d3.select('#progress').html("Done!");
      draw(processData(allSuggestionsRaw), ageMin, ageMax);  // later it will be updated with each step
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


  var categoryKeywords = {
    "relationships": ["boyfriend", "girlfriend", "single", "virgin", "married", "crush", "friends"],
    "fertility": ["period", "pregnant", "pregnancy"],
    "employment": ["job", "unemployed", "money", "career", "school", "broke", "homeless"],
    "apeparance_acne": ["acne", "face"],
    "appearance_weight": ["weight", "weigh", "fat"],
    "appearance_hair": ["hair", "beard"],
    "appearance": [ "height", "stretch mark", "tall"],
    "health": ["tired", "depressed", "hurt", "health", "blood pressure", "energy"],
    "": []
  };
  var categoryList = Object.keys(categoryKeywords);
  var colorScale = d3.scale.category10();


  suggestionArray = suggestionArray.map(function (d) {

      d.category = ""
      for (cat in categoryKeywords){
        for (i in categoryKeywords[cat]){
          var keyword = categoryKeywords[cat][i];
          if (d.suggestion.includes(keyword)){
            d.category = cat;
          }
        }
      }

      d.categoryIndex = categoryList.indexOf(d.category);
      return d;
    });


  suggestionArray = suggestionArray.sort(function (a, b) {
    return (a.categoryIndex == b.categoryIndex) ? (b.ages.length - a.ages.length) : (b.categoryIndex - a.categoryIndex);
  });



  return suggestionArray;

}

function draw (allSuggestions, ageMin, ageMax) {

  d3.select('#plot svg').remove();

  allSuggestions = allSuggestions.filter(function (d) {
    return d.ages.length > 1;
  });

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

  var colorScale = d3.scale.category10();

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

  svg.append('g').selectAll('.guide')
    .data(allSuggestions)
    .enter()
      .append('line')
        .attr('class', 'guide')
        .attr('transform', function (d, i) {
          return 'translate(' + 0 + ',' + scaleY(i) + ')';
        })
        .attr('x1', function (d) { return scaleX(d3.min(d.ages) - 0.5); })
        .attr('x2', function (d) { return scaleX(d3.max(d.ages)+ 0.5); });

  var labels = svg.append('g')
    .attr('class', 'labels')
    .attr('transform', 'translate(' + (scaleX(ageMax + 0.5) + 5) + ',' + 0 + ')');

  labels.selectAll('text')
    .data(allSuggestions)
    .enter()
      .append('text')
        .attr('y', function (d, i) { return scaleY(i); })
        .text(function (d) { return d.suggestion; })
        .style("fill", function(d){ return colorScale(d.categoryIndex);  });

}
