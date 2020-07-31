function agg_val(tsv, k) {
  return tsv.reduce(function(a, c) {
    a[c.id] = c[k];
    return a
  }, {});
}

function show_tooltip(tooltip, that, d, names, populations) {
  d3.select(that).style('opacity', 0.8);
  d3.select(that).style('cursor', 'pointer');
  tooltip.transition()
    .duration(200)    
    .style('opacity', 1);
  tooltip.html(names[d.id] + "<br>pop: " + populations[d.id])
    .style('left', d3.mouse(that)[0] + 'px')
    .style('top', d3.mouse(that)[1] + 'px');
}

function hide_tooltip(tooltip, that) {
  d3.select(that).style('opacity', 1);
  d3.select(that).style('cursor', 'inherit');
  tooltip.transition()
    .duration(500)
    .style('opacity', 0);
}

function plot_map(count_data) {
var width = 800, height = 400;

var tooltip = d3.select('body').append('div')
    .attr('class', 'map-tooltip')
    .style('opacity', 0);

var projection = d3.geo.albersUsa()
    .scale(800)
    .translate([380, height / 2]);

var path = d3.geo.path()
    .projection(projection);

var svg = d3.select('#us_map').append('svg')
    .style('width', width)
    .style('height', height)
    .attr('class', 'graph-svg-component');

var g = svg.append('g');

function cal_score(pop, count) {
  pop = parseInt(pop.replace(/,/g, ""), 10)
  return (((1.0  * count)/pop) * 100000).toFixed(2);
}

d3.json('map/us.json', function(unitedState) {
  var data = topojson.feature(unitedState, unitedState.objects.states).features;
  d3.tsv('map/us-state-names.tsv', function(tsv){
    var codes = agg_val(tsv, "code");
    var counts = tsv.reduce(function(a, c) {
      a[c.id] = count_data[c.code];
      return a;
    }, {});
    var names = agg_val(tsv, "name");
    var populations = agg_val(tsv, "population");

    g.append('g')
      .attr('class', 'states-bundle')
      .selectAll('path')
      .data(data)
      .enter()
      .append('path')
      .attr('d', path)
      .attr('stroke', '#EFF4F9')
      .attr('fill', '#427CAC')
      .attr('class', 'states')
      .on('mouseover', function(d) {
        show_tooltip(tooltip, this, d, names, populations)
      })
      .on('mouseout', function() {
        hide_tooltip(tooltip, this);
      })
      .on('click', function(d) {
        alert(codes[d.id]);
      })
      
    g.append('g')
      .selectAll('text')
      .data(data)
      .enter()
      .append('circle')
      .attr('cx', function(d){
          return path.centroid(d)[0];
      })
      .attr('cy', function(d){
          return path.centroid(d)[1];
      })
      .attr('r', function(d){
          return cal_score(populations[d.id], counts[d.id]) * 25;
      })
      .attr('fill', '#C00')
      .style('opacity', 0.6)

    g.append('g')
      .attr('class', 'states-names')
      .selectAll('text')
      .data(data)
      .enter()
      .append('svg:text')
      .text(function(d) {
        return cal_score(populations[d.id], counts[d.id]);
      })
      .attr('x', function(d) {
          return path.centroid(d)[0];
      })
      .attr('y', function(d) {
          return path.centroid(d)[1];
      })
      .attr('text-anchor', 'middle')
      .attr('fill', '#FFF');
  });
});
}

var xhr = new XMLHttpRequest();
xhr.open('GET', 'map/per-year-data.json');
xhr.onload = function() {
    if (xhr.status === 200) {
        var data = JSON.parse(xhr.response);
        var counts = {};
        data.forEach(d => {
          counts[d.state_death] = d.count;
        });
        plot_map(counts);
    } else {
        alert('Request failed.  Returned status of ' + xhr.status);
    }
};
xhr.send(null);
