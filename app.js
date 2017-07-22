(function (leaflet) {

'use strict';

var MAP_ID = 'map';
var START_COORDINATES = [53.3498, -6.2603];
var START_ZOOM_LEVEL = 10;

var layer = new leaflet.StamenTileLayer('terrain');
var map = leaflet.map(MAP_ID).setView(START_COORDINATES, START_ZOOM_LEVEL);

map.addLayer(layer);

fetch('county-boundaries.geojson').then(function (response) {
    return response.json();
}).then(function (countyBoundaries) {
    leaflet.geoJson(countyBoundaries).addTo(map);
});

})(L);
