paths_graph = d3.select('#visualization').append('svg')
                .attr("viewBox", [0,0, 800, 600])
                .attr('width', '800')
                .attr('height', '600')

projection = d3.geoMercator()
  .center([-73.98, 40.741510])
  .scale(Math.pow(2,22) / (2*Math.PI))
  .translate([800/2, 600/2])

tile = d3.tile()
  .size([800,600])
  .scale(projection.scale() * 2 * Math.PI)
  .translate(projection([0,0]))

tiles = tile()

url = (x, y, z) => `https://maps.nyc.gov/xyz/1.0.0/carto/basemap/${z}/${x}/${y}.jpg`
    

let tooltipOffset = 8; //px

d3.csv('counts.csv').then( counts => {
  let routes;

  // counts = counts.slice(0, 2000)
  counts = counts.filter(path => withinBounds(path.start_lng, path.start_lat) && withinBounds(path.end_lng, path.end_lat))
  console.log(counts.slice(0,100))
  stations = getStations(counts)
  console.log(stations)
  
  paths_graph.selectAll('image')
    .data(tiles, d => d)
    .join("image")
      .attr("xlink:href", d=> url(...d))
      .attr("x", ([x]) => (x + tiles.translate[0]) * tiles.scale)
      .attr("y", ([, y]) => (y + tiles.translate[1]) * tiles.scale)
      .attr("width", tiles.scale)
      .attr("height", tiles.scale)

  routes = paths_graph.selectAll("line")
    .data(counts)
    .join("line")
      .attr("x1", d => projection([d.start_lng, d.start_lat])[0])
      .attr("y1", d => projection([d.start_lng, d.start_lat])[1])
      .attr("x2", d => projection([d.end_lng, d.end_lat])[0])
      .attr("y2", d => projection([d.end_lng, d.end_lat])[1])
      .style("stroke-width", d => Math.ceil(d.count / 5)+1)

  paths_graph.selectAll('circle')
    .data(stations)
    .join('circle')
      .attr('cx', d => projection([d.lng, d.lat])[0])
      .attr('cy', d => projection([d.lng, d.lat])[1])
      .attr('r', 5)
      .style('fill', 'red')
    .on('mouseover', (event, d) => {
      routes.classed("origined", route => route.start_station_name === d.name)
      routes.classed("destinationed", route => route.end_station_name === d.name)
      console.log(routes)

      text = paths_graph.append('text')
        .attr('class', 'tooltip')
        .attr('x', projection([d.lng, d.lat])[0] + tooltipOffset)
        .attr('y', projection([d.lng, d.lat])[1] - tooltipOffset)
        .text(d.name)
      let textDim = text.node().getBBox()
      paths_graph.insert('rect', '.tooltip')
        .attr('x', textDim.x)
        .attr('y', textDim.y)
        .attr('width', textDim.width)
        .attr('height', textDim.height)
        .attr('class', 'tooltip')
        .attr('fill', 'gainsboro')
        .attr('fill-opacity', '75%')
    })
    .on('mouseout', (event,d) => {
      routes.classed("origined", false)
      routes.classed("destinationed", false)
      paths_graph.selectAll('.tooltip').remove()

    })

})



function withinBounds(lng, lat) {
  pixels = projection([lng, lat])
  return pixels[0] > 0 && pixels[0] < 800 && pixels[1] > 0 && pixels[1] < 600
}

function getStations(counts) {
  let stations = {}
  let result = []
  for(let count of counts) {
    if (!stations[count.start_station_name]) {
      stations[count.start_station_name] = [[parseFloat(count.start_lng), parseFloat(count.start_lat)]]
    } else {
      stations[count.start_station_name].push([parseFloat(count.start_lng), parseFloat(count.start_lat)])
    }

    if (!stations[count.end_station_name]) {
      stations[count.end_station_name] = [[parseFloat(count.end_lng), parseFloat(count.end_lat)]]
    } else {
      stations[count.end_station_name].push([parseFloat(count.end_lng), parseFloat(count.end_lat)])
    }
  }

  for (const [station_name, coords] of Object.entries(stations)) {
    sum = coords.reduce((accum, curr) => {
      return [accum[0] + curr[0], accum[1] + curr[1]]
    })
    avg = [sum[0] / coords.length, sum[1] / coords.length]

    result.push({name: station_name, lng: avg[0], lat: avg[1]})
  }
  return result
}




