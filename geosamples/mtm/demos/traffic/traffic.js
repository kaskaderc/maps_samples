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
    center: new google.maps.LatLng(52.229,21.012),
    zoom: 14,
    styles: mapStyle,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  });
  var controls = document.getElementById('controls');
  map.controls[google.maps.ControlPosition.TOP_CENTER].push(controls);


  var trafficLayer = new google.maps.TrafficLayer();
  trafficLayer.setMap(map);

}

