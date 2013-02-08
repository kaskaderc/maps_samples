/**
 * The MarkerClusterer object.
 * @type {MarkerCluster}
 */
var mc = null;

/**
 * The Map object.
 * @type {google.maps.Map}
 */
var map = null;

/**
 * The MarkerManager object.
 * @type {MarkerManager}
 */
var mgr = null;

/**
 * The KmlLayer object.
 * @type {google.maps.KmlLayer}
 */
var kmlLayer = null;


/**
 * KML layer display/hide flag.
 * @type {boolean}
 */
var showKmlLayer = false;

/**
 * Fusion Tables layer display/hide flag.
 * @type {boolean}
 */
var showCustomIconLayer = false;


/**
 * Marker Clusterer display/hide flag.
 * @type {boolean}
 */
var showMarketClusterer = false;

/**
 * Marker Manager display/hide flag.
 * @type {boolean}
 */
var showMarketManager = false;

var custom_markers = {};
/**
 * Toggles CustomIcon layer visibility.
 */

function toggleCustomIconLayer() {
  showCustomIconLayer = !showCustomIconLayer;
  var m = null;
  if (showCustomIconLayer) {
     m = map;
  }
  if (custom_markers) {
    for (var level in custom_markers) {
      for (var i = 0; i < custom_markers[level].length; i++) {
          custom_markers[level][i].setMap(m);
      }
    }
  }
}

/**
 * Toggles KML layer visibility.
 */
function toggleKmlLayer() {
  if (!kmlLayer) {
    var kmlUrl = 'http://gmaps-samples-v3.googlecode.com/svn/trunk/toomanymarkers/markers.kml';
    kmlLayer = new google.maps.KmlLayer(kmlUrl, {
      preserveViewport: true,
      suppressInfoWindows: false
    });
  }
  showKmlLayer = !showKmlLayer;
  if (showKmlLayer) {
    kmlLayer.setMap(map);
  } else {
    kmlLayer.setMap(null);
  }
}


/**
 * Toggles Marker Manager visibility.
 */
function toggleMarkerManager() {
  showMarketManager = !showMarketManager;
  if (mgr) {
    if (showMarketManager) {
      mgr.addMarkers(markers.countries, 0, 5);
      mgr.addMarkers(markers.places, 6, 11);
      mgr.addMarkers(markers.locations, 12);
      mgr.refresh();
    } else {
      mgr.clearMarkers();
      mgr.refresh();
    }
  } else {
    mgr = new MarkerManager(map, {trackMarkers: true, maxZoom: 15});
    google.maps.event.addListener(mgr, 'loaded', function() {
      mgr.addMarkers(markers.countries, 0, 5);
      mgr.addMarkers(markers.places, 6, 11);
      mgr.addMarkers(markers.locations, 12);
      mgr.refresh();
    });
  }
}


/**
 * Toggles Marker Clusterer visibility.
 */
function toggleMarkerClusterer() {
  showMarketClusterer = !showMarketClusterer;
  if (showMarketClusterer) {
    if (mc) {
      mc.addMarkers(markers.locations);
    } else {
      mc = new MarkerClusterer(map, markers.locations, {maxZoom: 19});
    }
  } else {
    mc.clearMarkers();
  }
}


/**
 * Initializes the map and listeners.
 */
function initialize() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: new google.maps.LatLng(47.23449,5.75354),
    zoom: 7,
    mapTypeId: 'roadmap',
    styles: [
      {
        "featureType": "administrative",
        "stylers": [
          { "lightness": -20 }
        ]
      },{
        "featureType": "landscape",
        "stylers": [
          { "visibility": "off" }
        ]
      },{
        "featureType": "transit",
        "stylers": [
          { "visibility": "off" }
        ]
      },{
        "featureType": "road",
        "stylers": [
          { "visibility": "off" }
        ]
      },{
        "featureType": "administrative.province",
        "stylers": [
          { "visibility": "off" }
        ]
      },{
        "stylers": [
          { "lightness": -2 }
        ]
      }
    ]
  });

  google.maps.event.addDomListener(document.getElementById('ci-cb'),
      'click', toggleCustomIconLayer);
  google.maps.event.addDomListener(document.getElementById('kml-cb'),
      'click', toggleKmlLayer);
  google.maps.event.addDomListener(document.getElementById('mc-cb'),
      'click', toggleMarkerClusterer);
  google.maps.event.addDomListener(document.getElementById('mgr-cb'),
      'click', toggleMarkerManager);

  // Prepares the marker object, creating a google.maps.Marker object for each
  // location, place and country
  if (markers) {
    for (var level in markers) {
      custom_markers[level] = [];
      for (var i = 0; i < markers[level].length; i++) {
        var details = markers[level][i];
        markers[level][i] = new google.maps.Marker({
          title: details.level,
          position: new google.maps.LatLng(
              details.location[0], details.location[1]),
          clickable: false,
          draggable: true,
          flat: true
        });
        custom_markers[level][i] = new google.maps.Marker({
            position: new google.maps.LatLng(
              details.location[0], details.location[1]),
            map: map,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 3,
              fillColor: 'red',
              fillOpacity: .5,
              strokeColor: 'white',
              strokeWeight: .5
            }
        });
      }
    }
  }
}

google.maps.event.addDomListener(window, 'load', initialize);
