(function (leaflet) {

'use strict';

var MAP_ID = 'map';
var START_COORDINATES = [53.3498, -6.2603];
var START_ZOOM_LEVEL = 10;
var countyNormalizeMap = {
    'Dublin City': 'DUBLIN CITY COUNCIL',
    'Galway City': 'GALWAY CITY COUNCIL',
    'Cork City': 'CORK CITY COUNCIL',
    'Laois': 'LAOIS COUNTY COUNCIL',
    'Roscommon': 'ROSCOMMON COUNTY COUNCIL',
    'Waterford City and County': 'WATERFORD CITY AND COUNTY COUNCIL',
    'South Dublin': 'SOUTH DUBLIN COUNTY COUNCIL',
    'Louth': 'LOUTH COUNTY COUNCIL',
    'Monaghan': 'MONAGHAN COUNTY COUNCIL',
    'Meath': 'MEATH COUNTY COUNCIL',
    'Fingal': 'FINGAL COUNTY COUNCIL',
    'Leitrim': 'LEITRIM COUNTY COUNCIL',
    'Westmeath': 'WESTMEATH COUNTY COUNCIL',
    'Cork County': 'CORK COUNTY COUNCIL',
    'Donegal': 'DONEGAL COUNTY COUNCIL',
    'D�n Laoghaire-Rathdown': 'DUN LAOGHAIRE-RATHDOWN COUNTY COUNCIL',
    'Longford': 'LONGFORD COUNTY COUNCIL',
    'Galway County': 'GALWAY COUNTY COUNCIL',
    'Kilkenny': 'KILKENNY COUNTY COUNCIL',
    'Sligo': 'SLIGO COUNTY COUNCIL',
    'Offaly': 'OFFALY COUNTY COUNCIL',
    'Wicklow': 'WICKLOW COUNTY COUNCIL',
    'Wexford': 'WEXFORD COUNTY COUNCIL',
    'Kildare': 'KILDARE COUNTY COUNCIL',
    'Kerry': 'KERRY COUNTY COUNCIL',
    'Tipperary': 'TIPPERARY COUNTY COUNCIL',
    'Limerick City and County': 'LIMERICK CITY AND COUNTY COUNCIL',
    'Cavan': 'CAVAN COUNTY COUNCIL',
    'Mayo': 'MAYO COUNTY COUNCIL',
    'Clare': 'CLARE COUNTY COUNCIL',
    'Carlow': 'CARLOW COUNTY COUNCIL'
};

var countyBoundaries = {};
var countyIds = [];
var immigrationByCounty = [];
var immigrationPercentiles = [];

var layer = new leaflet.StamenTileLayer('terrain');
var map = leaflet.map(MAP_ID).setView(START_COORDINATES, START_ZOOM_LEVEL);

map.addLayer(layer);

Promise.all([
    fetchCountyBoundaries(),
    fetchImmigrationByCounty()
]).then(function (datasets) {
    countyBoundaries = datasets[0];
    countyIds = countyBoundaries.features.map(function (countyFeature) {
        return countyFeature.properties.ENGLISH;
    });

    immigrationByCounty = consolidateCounties(datasets[1]);
    immigrationPercentiles = calculateImmigrationPercentile();

    leaflet.geoJson(countyBoundaries, {
        style: styleCountyFeature,
        onEachFeature: onEachCountyFeature
    }).addTo(map);
});

function fetchCountyBoundaries() {
    return fetch('county-boundaries.geojson').then(function (response) {
        return response.json();
    });
}

function fetchImmigrationByCounty() {
    return fetch('immigration-by-county.json').then(function (response) {
        return response.json();
    });
}

function normalizeNumber(stringNumber) {
    return parseInt(stringNumber.replace(',', ''), 10);
}

function consolidateCounties(rawImmigrationByCounty) {
    return rawImmigrationByCounty.reduce(function (results, rawImmigrationData) {
        var resultKey = countyNormalizeMap[rawImmigrationData.description];
        results[resultKey] = {
            fromAbroad: normalizeNumber(rawImmigrationData.fromAbroad),
            total: normalizeNumber(rawImmigrationData.total)
        };

        results[resultKey].percentageFromAbroad = results[resultKey].fromAbroad * 100 / results[resultKey].total;
        
        return results;
    }, {});
}

function calculateImmigrationPercentile() {
    var results = [];
    var dataCount = Object.keys(immigrationByCounty).length;

    var sortedImmigrationByCounty = Object.keys(immigrationByCounty)
        .reduce(function (acc, countyId) {
            return acc.concat(immigrationByCounty[countyId]);
        }, [])
        .sort(function (a, b) {
            if (a.percentageFromAbroad < b.percentageFromAbroad) { return -1; }
            else { return 1; }
        });

    for (var i = 1; i <= 100; i++) {
        var percentileIndex = Math.ceil(i / 100 * dataCount) - 1;
        results[i - 1] = sortedImmigrationByCounty[percentileIndex].percentageFromAbroad;
    }

    return results;
}

function styleCountyFeature(countyFeature) {
    var countyImmigrationData = immigrationByCounty[countyFeature.properties.ENGLISH];
    return {
        fillColor: getColor(countyImmigrationData.percentageFromAbroad),
        fillOpacity: 0.7
    };
}

function getColor(percentageFromAbroad) {
    return percentageFromAbroad > immigrationPercentiles[90] ? '#08306b' :
           percentageFromAbroad > immigrationPercentiles[80] ? '#08519c' :
           percentageFromAbroad > immigrationPercentiles[70] ? '#2171b5' :
           percentageFromAbroad > immigrationPercentiles[60] ? '#4292c6' :
           percentageFromAbroad > immigrationPercentiles[50] ? '#6baed6' :
           percentageFromAbroad > immigrationPercentiles[40] ? '#9ecae1' :
           percentageFromAbroad > immigrationPercentiles[30] ? '#c6dbef' :
           percentageFromAbroad > immigrationPercentiles[20] ? '#deebf7' :
                                                               '#f7fbff';
}

function onEachCountyFeature(countyFeature, layer) {
    var fromAbroad = immigrationByCounty[countyFeature.properties.ENGLISH].fromAbroad;
    var total = immigrationByCounty[countyFeature.properties.ENGLISH].total;
    var percentageFromAbroad = immigrationByCounty[countyFeature.properties.ENGLISH].percentageFromAbroad;
    layer.bindPopup('<div>' +
        '<strong>' + countyFeature.properties.ENGLISH + '</strong>' +
        '<p>Previously abroad: ' + fromAbroad + ' (' + percentageFromAbroad.toFixed(2) + '%)</p>' +
        '<p>Total: ' + total + '</p>' +
    '</div>');
}

})(L);
