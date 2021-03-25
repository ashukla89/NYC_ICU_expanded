import * as d3 from 'd3'

const margin = { top: 100, left: 50, right: 150, bottom: 30 }

const height = 500 - margin.top - margin.bottom

const width = 700 - margin.left - margin.right

const svg = d3
  .select('#chart-c')
  .append('svg')
  .attr('height', height + margin.top + margin.bottom)
  .attr('width', width + margin.left + margin.right)
  .append('g')
  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

const parseTime = d3.timeParse('%Y-%m-%d')

const xPositionScale = d3.scaleLinear().range([0, width])
const yPositionScale = d3.scaleLinear().range([height, 0])

const colorScale = d3
  .scaleOrdinal(d3.schemeCategory10) // nabbed a nice one from: https://github.com/d3/d3-scale-chromatic

const line = d3
  .line()
  .x(function(d) {
    return xPositionScale(d.datetime)
  })
  .y(function(d) {
    return yPositionScale(+d.icu_beds_used_pct_7_day_avg)
  })

d3.csv(require('/data/by_borough.csv'))
  .then(ready)
  .catch(err => {
    console.log(err)
  })

function ready(datapoints) {
  datapoints.forEach(d => {
    d.datetime = parseTime(d.collection_week)
  })
  const dates = datapoints.map(d => d.datetime)
  const capacity = datapoints.map(d => +d.icu_beds_used_pct_7_day_avg)

  xPositionScale.domain(d3.extent(dates))
  yPositionScale.domain([0,1])

  const nested = d3
    .nest()
    .key(function(d) {
      return d.Borough
    })
    .entries(datapoints)

  // nested.push(nested[0])
  // nested.push(nested[1])

  svg
    .append('text')
    .attr('font-size', '24')
    .attr('text-anchor', 'middle')
    .text('Percent of Beds Filled, by Borough')
    .attr('x', width / 2)
    .attr('y', -40)
    .attr('dx', 40)
    .attr('class', 'title')

  svg
    .selectAll('.lines')
    .data(nested)
    .enter()
    .append('path')
    .attr('class', function(d) {
      // console.log('hey!', d.key.toLowerCase().replace(/[^a-z]/g, ''))
      return 'lines ' + d.key.toLowerCase().replace(/[^a-z]/g, '')
    })
    .attr('d', function(d) {
      console.log(d.values)
      return line(d.values)
    })
    .attr('stroke', function(d) {
      return colorScale(d.key.toLowerCase().replace(/[^a-z]/g, ''))
    })
    .attr('stroke-width', 2)
    .attr('fill', 'none')

  svg
    .selectAll('circle')
    .data(nested)
    .enter()
    .append('circle')
    .attr('class', function(d) {
      return 'circles ' + d.key.toLowerCase().replace(/[^a-z]/g, '')
    })
    .attr('fill', function(d) {
      return colorScale(d.key.toLowerCase().replace(/[^a-z]/g, ''))
    })
    .attr('r', 4)
    .attr('cx', width)
    .attr('cy', function(d) {
      const datapoints = d.values
      // Find the last datapoint, as per https://flaviocopes.com/how-to-get-last-item-array-javascript/
      const lastWeek = datapoints[datapoints.length - 1]
      return yPositionScale(lastWeek.icu_beds_used_pct_7_day_avg)
    })

  svg
    .selectAll('.labels')
    .data(nested)
    .enter()
    .append('text')
    .attr('class', function(d) {
      // console.log(d.key)
      return d.key.toLowerCase().replace(/[^a-z]/g, '')
    })
    .classed('labels', true)
    .attr('y', function(d) {
      // again, return y pos of last item 
      return yPositionScale(d.values[d.values.length - 1].icu_beds_used_pct_7_day_avg)
    })
    .attr('x', width)
    .text(function(d) {
      return d.key
    })
    .attr('dx', 6)
    .attr('dy', 4)
    .attr('font-size', '12')

  // here are the axes

  const xAxis = d3
    .axisBottom(xPositionScale)
    .tickFormat(d3.timeFormat('%b %d, %Y'))
    .ticks(9)
  svg
    .append('g')
    .attr('class', 'axis x-axis')
    .attr('transform', 'translate(0,' + height + ')')
    .call(xAxis)

  const yAxis = d3.axisLeft(yPositionScale)
    .tickFormat(d3.format(".0%"))
  svg
    .append('g')
    .attr('class', 'axis y-axis')
    .call(yAxis)
}
