/**
 * @fileoverview Demonstrates how to use a Google Maps API Radar Search to
 *   generate a heatmap of locations in response to a query.
 * @author saxman@google.com (Paul Saxman)
 */

var map;
var service;
// Constants used for fading in the heatmap.
var MAX_OPACITY = 0.7;
var OPACITY_INCREMENT = 0.05;
var FADE_IN_TIMEOUT = 10;
var opacity;
var heatmap;

/**
 * Creates the map, adds a control, creates the heatmap and adds the Places
 * service.
 */
function initialize() {
  var mapStyle = [
    {
      stylers: [
      {saturation: -100},
      ]
    },{
      featureType: 'water',
      elementType: 'geometry',
      stylers: [
      { lightness: -30 }
      ]
    },{
      featureType: 'water',
      elementType: 'labels',
      stylers: [
      { invert_lightness: true },
      { lightness: 30 }
      ]
    },{
      featureType: 'road',
      stylers: [
      { lightness: 25 }
      ]
    },{
      featureType: 'poi.park',
      elementType: 'geometry',
      stylers: [
      { lightness: 20 }
      ]
    }
  ];

  map = new google.maps.Map(document.getElementById('map_canvas'), {
    center: new google.maps.LatLng(-33.87, 151.205),
    zoom: 14,
    minZoom: 14,
    maxZoom: 14,
    disableDefaultUI: true,
    styles: mapStyle,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  });
  var controls = document.getElementById('controls');
  map.controls[google.maps.ControlPosition.TOP_CENTER].push(controls);

  var gradient = [
  'rgba(127, 127, 255, 0)',
  'rgba(127, 127, 255, 1)',
  'rgba(127, 191, 255, 1)',
  'rgba(127, 255, 255, 1)',
  'rgba(127, 255, 127, 1)',
  'rgba(255, 255, 127, 1)',
  'rgba(255, 191, 127, 1)',
  'rgba(255, 127, 127, 1)'
  ];

  heatmap = new google.maps.visualization.HeatmapLayer({
    map: map,
    gradient: gradient,
    opacity: 0,
    radius: 30
  });

  service = new google.maps.places.PlacesService(map);

  google.maps.event.addListenerOnce(map, 'bounds_changed', updateHeatmap);
  google.maps.event.addDomListener(controls, 'change', updateHeatmap);

}

/**
 * Triggers a new search to update data from the heatmap based on the value in
 * the control.
 */
function updateHeatmap() {
  var select = document.getElementById('query_select');
  var city = select.options[select.selectedIndex].value;
  performSearch(city);
}

/**
 * This function resets the center of the map based on the city and loads search
 * data into the heatmap based on different queries per city.
 * @param {String} city the city selected by the control.
 */
function performSearch(city) {
  // Remove the existing data from the heatmap before repositioning the map.
  heatmap.setData([]);

  var request = {};

  switch (city) {
    case 'Krakow':
      map.setCenter(new google.maps.LatLng(50.0646, 19.94497));
      //request.keyword = 'chinese';
      request.types = ['restaurant'];
      request.keyword = 'polska';
      break;
    case 'Warszawa':
      map.setCenter(new google.maps.LatLng(52.229, 21.0122));
      request.types = ['bank'];
      break;
    case 'Torun':
      map.setCenter(new google.maps.LatLng(53.01, 18.598));
      //request.keyword = 'chinese';
      request.types = ['bar'];
      break;
    case 'Gdansk':
      map.setCenter(new google.maps.LatLng(54.35, 18.646));
      request.types = ['store'];
	  //request.keyword= 'bursztyn';
      break;
  }

  request.bounds = map.getBounds();

  service.radarSearch(request, function callback(results, status) {
    if (status != google.maps.places.PlacesServiceStatus.OK) {
      return;
    }

    var heatmapData = [];
    for (var i = 0, result; result = results[i]; i++) {
      heatmapData.push(result.geometry.location);
    }
    heatmap.setData(heatmapData);

    opacity = 0;
    fadeInHeatmap();
  });
}

/**
 * This function gradually fades in the heatmap by incrementing it's opacity
 * over time.
 */
function fadeInHeatmap() {
  heatmap.setOptions({opacity: opacity})
  opacity += OPACITY_INCREMENT;
  if (opacity <= MAX_OPACITY) {
    setTimeout(fadeInHeatmap, FADE_IN_TIMEOUT);
  }
}
