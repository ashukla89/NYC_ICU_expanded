import * as d3 from 'd3'
import * as geojson from 'geojson'

const margin = { top: 25, left: 0, right: 0, bottom: 0 }

const height = 500 - margin.top - margin.bottom

const width = 600 - margin.left - margin.right

const svg = d3
  .select('#chart-a')
  .append('svg')
  .attr('height', height + margin.top + margin.bottom)
  .attr('width', width + margin.left + margin.right)
  .append('g')
  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

// center the map projection on NYC as per: http://bl.ocks.org/phil-pedruco/6646844
const projection = d3.geoMercator().center([-73.94, 40.70])
  .scale(45000)
  .translate([(width) / 2, (height)/2])
const path = d3.geoPath().projection(projection)

const colorScale = d3.scaleSequential(d3.interpolateRdYlBu)//.clamp(true)
const radiusScale = d3.scaleSqrt().range([0, 1])

Promise.all([
  d3.json(require('/data/nyc.geojson')),
  d3.csv(require('/data/nyc_icu.csv'))
])
  .then(ready)
  .catch(err => console.log('Failed on', err))

function ready([json, datapoints]) {
  console.log('What is our data for chart a?')
  console.log(json)
  // console.log(datapoints)
  const boroughs = json.features
  const latestData = datapoints.filter(function(d){
    if (d['collection_week']=='2021/03/12')
    {
      return d
    }
  })

  // const popExtent = d3.extent(datapoints, d => +d.population)
  // colorScale.domain([1, 500000]) // arbitrary because too many were dark

  svg
    .selectAll('path')
    .data(boroughs)
    .enter()
    .append('path')
    .attr('class', 'borough')
    .attr('d', path)
    .attr('fill', 'lightgrey')
    .attr('stroke', 'grey')

  svg
    .append('text')
    .text('NYC Hospitals by Percent of ICU Beds Filled')
    .attr('x', width/2)
    .attr('y', 0)
    .attr('text-anchor', 'middle')
    .attr('font-size', 18)
    .attr('font-weight', 'bold')

  // add one circle for every hospital
  svg
    .selectAll('circle')
    .data(latestData)
    .enter()
    .append('circle')
    .attr('r', d => radiusScale(+d.total_icu_beds_7_day_avg))
    .attr('opacity', 0.7)
    .attr('fill', d => colorScale(1-d.icu_beds_used_pct_7_day_avg)) // invert the color scheme by subtracting
    .attr('transform', function(d) {
      const coords = [d.longitude, d.latitude]
      // console.log(projection(coords))
      return `translate(${projection(coords)})`
    })
    .on('mouseover', function(d, i) {
      console.log('mouseover on', this)
      d3.select(this).attr('stroke', 'black')
      d3.select('#hosp-head')
        .text('Hospital Name')
        .style('text-anchor', 'left')
        .style('font-size', 12)
        .style('font-weight', 'bold')
      d3.select('#hosp')
        .text(d.hospital_name)
        .style('text-anchor', 'left')
        .style('font-size', 12)
      d3.select('#totalbeds-head')
        .text('Avg. Total ICU Beds During Week')
        .style('text-anchor', 'left')
        .style('font-size', 12)
        .style('font-weight', 'bold')
      d3.select('#totalbeds')
        .text(d.total_icu_beds_7_day_avg)
        .style('text-anchor', 'left')
        .style('font-size', 12)
      d3.select('#occupied-head')
        .text('Avg. ICU Beds Occupied During Week')
        .style('text-anchor', 'left')
        .style('font-size', 12)
        .style('font-weight', 'bold')
      d3.select('#occupied')
        .text(d.icu_beds_used_7_day_avg)
        .style('text-anchor', 'left')
        .style('font-size', 12)
      d3.select('#percent-head')
        .text('Percent of ICU Beds Occupied')
        .style('text-anchor', 'left')
        .style('font-size', 12)
        .style('font-weight', 'bold')
      d3.select('#percent')
        .text(d3.format(".0%")(+d.icu_beds_used_pct_7_day_avg))
        .style('text-anchor', 'left')
        .style('font-size', 12)
    })
    .on('mouseout', function(d, i) {
      console.log('mouseout', this)
      d3.select(this).attr('stroke', 'none')
      d3.select('#hosp-head').text('')
      d3.select('#hosp').text('')
      d3.select('#totalbeds-head').text('')
      d3.select('#totalbeds').text('')
      d3.select('#occupied-head').text('')
      d3.select('#occupied').text('')
      d3.select('#percent-head').text('')
      d3.select('#percent').text('')
    })
}
