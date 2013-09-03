/**
 * @fileoverview Demonstrates how to use a Google Maps API and Places API.
 *
 * @author kaskaderc@gmail.com (Kasia Derc-Fenske)
 * @author wolf+grass@bergenheim.net (Wolf Bergenheim)
 */
var markers = [];
var points = [];
var waypoints = [];
var infoWindow;
var anchor;

var gdir;
var walk;
var map;

var directionsRenderer;
var directionsService;

var placesService;
var activemarker;
var idleTimer;
var placeMarkers = {};
var eatoutTypes, walkType = ['restaurant', 'bar', 'cafe', 'meal_takeaway'];
var partyTypes = ['bar', 'nightclub', 'casino'];
var eduTypes = ['aquarium', 'art_gallery', 'book_store', 'library', 'museum', 'university', 'zoo'];
var practical = ['atm', 'bakery', 'bank', 'bicycle_store', 'book_store', 'bus_station', , 'dentist', 'florist', 'laundry', 'laywer'];
var funTypes = ['amusement_park', 'aquarium', 'bowling_alley', 'movie_theater'];
var ablutionTypes = ['beauty_salon', 'dentist', 'hair_care', 'spa'];

var startpoint;
var newzoom;
var label;

var lastWalkType = 'eatout';
var heatmap;
var panorama;

var searchmarker;

// Constants used for fading in the heatmap.
var MAX_OPACITY = 0.6;
var OPACITY_INCREMENT = 0.02;
var FADE_IN_TIMEOUT = 20;

function displayMap() {
  addTypeListeners();
  var mapCenter = new google.maps.LatLng(37.773763, - 122.419227);
  mapOptions = {
    zoom: 17,
    center: mapCenter,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    scaleControl: false,
    panControl: false,
    streetViewControl: true,
    styles: [{
      'stylers': [{
        'saturation': -80
      }]
    }, {
      'featureType': 'poi',
      'stylers': [{
        'visibility': 'off'
      }]
    }]
  };
  map = new google.maps.Map(document.getElementById('map'), mapOptions);
  label = new MapLabel({
    position: mapCenter,
    text: 'Click to walk!',
    fontFamily: '\'Maven Pro\', sans-serif',
    fontSize: 18,
    strokeWeight: 4,
    fontColor: '#E74C4C',
    align: 'center',
    map: map
  });

  infoWindow = new google.maps.InfoWindow();

  directionsService = new google.maps.DirectionsService();
  placesService = new google.maps.places.PlacesService(map);

  var directionsRendererOpts = {
    draggable: true,
    hideRouteList: true,
    map: map,
    suppressInfoWindows: true,
    suppressMarkers: true,
    polylineOptions: {
      strokeOpacity: 0.2,
      strokeColor: '#E74C4C',
      icons: [{
        icon: {
          path: google.maps.SymbolPath.FORWARD_OPEN_ARROW,
          fillColor: '#4486F6',
          strokeColor: '#4486F6',
          strokeOpacity: 1,
          strokeWeight: 1,
          fillOpacity: 0.6,
          scale: 2.5
        },
        offset: '0',
        repeat: '20px'
      }]
    }
  };
  directionsRenderer = new google.maps.DirectionsRenderer(directionsRendererOpts);
  anchor = createMarker();
  google.maps.event.addDomListener(map, 'drag', function() {
    document.getElementById('map').style.height = '600px';
    google.maps.event.trigger(map, 'resize');
  });
  google.maps.event.addListener(map, 'click', function(mouseEvent) {
    clearMap();
    anchor.setMap(map);
    anchor.setPosition(mouseEvent.latLng);
    crateWalkingPath(mouseEvent.latLng);
  });
  google.maps.event.addListener(map, 'rightclick', function(mouseEvent) {
    clearMap();
  });

  var input = document.getElementById('target');
  var autocomplete = new google.maps.places.Autocomplete(input);
  var empty_marker = new google.maps.MarkerImage('icons/marker_copy.png',
  new google.maps.Size(32, 32));
  var searchmarker = new google.maps.Marker({
    icon: empty_marker
  });
  autocomplete.bindTo('bounds', map);
  google.maps.event.addListener(autocomplete, 'place_changed', function() {
    if (searchmarker) {
      searchmarker.setMap(null);
    }
    input.className = '';
    var place = autocomplete.getPlace();
    if (!place.geometry) {
      input.className = 'notfound';
      return;
    }
    searchmarker.setMap(map);
    searchmarker.setPosition(place.geometry.location);
    searchmarker.setVisible(true);
    if (place.geometry.viewport) {
      map.fitBounds(place.geometry.viewport);
    } else {
      map.setCenter(place.geometry.location);
      map.setZoom(17);
    }
    panorama.setPosition(place.geometry.location);
    panorama.setPov({
      heading: 265,
      pitch: 0
    });
  });
  panorama = map.getStreetView();
}

/**
 * Creates the starting point.
 * @return {google.maps.Marker} A start point marker.
 */

function createMarker() {
  var marker_image = new google.maps.MarkerImage('icons/marker_blue.png',
  new google.maps.Size(32, 32));

  var markerOptions = {
    clickable: false,
    draggable: true,
    title: 'Drag to change start point',
    map: map,
    icon: marker_image
  };
  startpoint = new google.maps.Marker(markerOptions);
  google.maps.event.addListener(startpoint, 'dragend', function(mouseEvent) {
    crateWalkingPath(mouseEvent.latLng);
  });
  return startpoint;
}

function clearMap() {
  label.set('text', '');
  document.getElementById('photos').innerHTML = '';
  if (document.getElementById('placeinfo')) {
    document.getElementById('placeinfo').innerHTML = '';
  }
  directionsRenderer.setMap(null);
  anchor.setMap(null);
  label.setMap(null);
  if (markers) {
    for (var i = 0; i < markers.length; i++) {
      markers[i].setMap(null);
    }
    markers = [];
  }
  clearPlaceMarkers();
}

/**
 * Clears all markers and information divs.
 */

function clearPlaceMarkers() {
  removePlaceInfoDiv();
  if (placeMarkers) {
    for (var i in placeMarkers) {
      place = placeMarkers[i][0];
      marker = placeMarkers[i][1];
      marker.setMap(null);
      delete marker;
      delete place;
      delete placeMarkers[i];
    }
    placeMarkers = {};
  }
}

/**
 * Takes a point and rotates it rad degrees using basePoint
 * as center of rotation.
 * @param {google.maps.LatLng} basePoint rotatioal axis.
 * @param {number} latIn lat to rotate.
 * @param {number} lngIn lng to rotate.
 * @param {number} rad degrees to rotate point by.
 * @return {google.maps.LatLng} rotated point.
 */

function rotate(basePoint, latIn, lngIn, rad) {
  lng = lngIn * Math.cos(rad) - latIn * Math.sin(rad);
  lat = lngIn * Math.sin(rad) + latIn * Math.cos(rad);
  return new google.maps.LatLng(basePoint.lat() + lat, basePoint.lng() + lng);
}

/**
 * Creates a walking path on a pentagon arounf a given latlng.
 * @param {google.maps.LatLng} point
 */
function crateWalkingPath(point) {
  document.getElementById('map').style.height = '200px';
  google.maps.event.trigger(map, 'resize');
  d = 0.008;
  rotation = Math.random() * 2 * Math.PI;
  startPoint = new google.maps.LatLng(point.lat(), point.lng());

  waypoints[0] = {
    location: rotate(point, - 1 * d * Math.cos(0.3 * Math.PI), - 1.2 * d * Math.sin(0.3 * Math.PI),
    rotation),
    stopover: false
  };

  waypoints[1] = {
    location: rotate(
    point, - 1 * d * (Math.cos(0.3 * Math.PI) + Math.sin(0.4 * Math.PI)),
    1.2 * d * (Math.cos(0.4 * Math.PI) - Math.sin(0.3 * Math.PI)),
    rotation),
    stopover: false
  };

  waypoints[2] = {
    location: rotate(
    point, - 1 * d * (Math.cos(0.3 * Math.PI) + Math.sin(0.4 * Math.PI)),
    d + (1.2 * d * (Math.cos(0.4 * Math.PI) - Math.sin(0.3 * Math.PI))),
    rotation),
    stopover: false
  };

  waypoints[3] = {
    location: rotate(
    point, - 1 * d * Math.cos(0.3 * Math.PI),
    1.2 * d * Math.sin(0.3 * Math.PI),
    rotation),
    stopover: false
  };

  points.push(startPoint);
  points.push(waypoints[0].location);
  points.push(waypoints[0].location);
  points.push(waypoints[0].location);
  points.push(startPoint);

  request = {
    origin: startPoint,
    destination: startPoint,
    travelMode: google.maps.TravelMode.WALKING,
    unitSystem: google.maps.UnitSystem.METRIC,
    waypoints: waypoints,
    optimizeWaypoints: false,
    provideRouteAlternatives: true,
    avoidHighways: true,
    avoidTolls: true
  };
  directionsService.route(request, function(response, status) {
    if (status == google.maps.DirectionsStatus.OK) {
      directionsRenderer.setMap(map);
      directionsRenderer.setDirections(response);
      idleTimer = google.maps.event.addListener(map, 'idle', function() {
        google.maps.event.removeListener(idleTimer);
        // add a label on the map
        addPathLabel(response);
        setTimeout(getPlaces(response.routes[0].bounds), 1);
      });
    }
  });
}

function addPathLabel(response) {
  if (response.routes[0].legs.length = 1) {
    var duration = response.routes[0].legs[0].duration.text;
    var distance = response.routes[0].legs[0].distance.text;
    var kcal = response.routes[0].legs[0].distance.value / 1000 * 102;
    var labeltxt = distance + ' in ' + duration;
    label.set('text', labeltxt);
    label.set('position', map.getCenter());
  } else {
    label.set('text', '');
  }

}

function getPlaces(bounds) {
  var request;
  if (walkType) {
    request = {
      bounds: bounds,
      types: walkType
    };
  } else {
    request = {
      bounds: bounds
    };
  }
  placesService.nearbySearch(request, showPlaces);
  map.fitBounds(bounds);
  map.setZoom(map.getZoom() + 1);
}

function showPlaces(results, status) {
  clearPlaceMarkers();
  if (status == google.maps.places.PlacesServiceStatus.OK) {
    for (var i = 0; i < results.length; i++) {
      var place = results[i];
      var marker = createPlaceMarker(results[i], i);
      var placePics = '';
      if (place.photos) {
        placePics = addPhotosToGrid(place.photos, i);
      }
      placeMarkers[i] = [place, marker];
    }
  }
}

/**
 * Add the photo list to the grid with a given index.
 * @param {Array} photos array of photos.
 * @param {number} index the index of the photo to add.
 * @return {HTMLDivElement}
 */
function addPhotosToGrid(photos, index) {
  var placePics = createPhotosDiv(photos, 'photos_', index);
  document.getElementById('photos').appendChild(placePics);
  var callback = createActivateCallback(index);
  placePics.addEventListener('click', callback);
  placePics.className += ' inactive';
  return placePics;
}

/**
 * Create a div with a given id and list of photos.
 * possibly add size later
 * @param {Array} photos array of photos.
 * @param {string} prefix the div id prefix.
 * @param {number} index the index of the photo to add.
 * @return {HTMLDivElement}
 */
function createPhotosDiv(photos, prefix, index) {
  var placePics = document.createElement('div');
  placePics.setAttribute('id', prefix + index);
  placePics.className = 'gridbox';
  for (var i = 0; i < photos.length; i++) {
    var photo = photos[i];
    var imgdiv = document.createElement('div');
    imgdiv.className = 'picture';
    imgdiv.style.backgroundImage = 'url(' + photo.getUrl({
      'maxHeight': 200
    }) + ')';
    imgdiv.setAttribute('id', index + '_' + i);
    imgdiv.innerHTML = JSON.stringify(photo.html_attributions);
    console.log(JSON.stringify(photo.html_attributions));
    placePics.appendChild(imgdiv);
  }
  return placePics;
}

function createActivateCallback(index) {
  return function() {
    activatePlace(index);
  }
}

function activatePlace(index) {
  document.getElementById('map').style.height = '200px';
  google.maps.event.trigger(map, 'resize');
  // Prepare divs: put #placeinfo under #information.
  removePlaceInfoDiv();
  var infodiv = document.getElementById('information');
  var pinfo = document.createElement('div');
  pinfo.setAttribute('id', 'placeinfo');
  pinfo.setAttribute('class', 'placeinfo');
  infodiv.insertBefore(pinfo, infodiv.firstChild);

  // Prepare markers.
  var placeinfo = placeMarkers[index];
  var place = placeinfo[0];
  if (place.geometry.location && !map.getBounds().contains(place.geometry.location)) {
    map.panTo(place.geometry.location);
  }
  toggleBounce();
  activemarker = placeinfo[1];
  toggleBounce();

  // Place pics.
  if (place.photos) {
    placePics = createPhotosDiv(place.photos, 'pinfo', index);
    pinfo.appendChild(placePics);
  }
  // End Place pics.

  // Types and icon.
  var info = document.createElement('div');
  info.setAttribute('id', 'place_' + index);
  info.className = 'gridbox';

  if (place.geometry.location) {
    map.setCenter(place.geometry.location);
    map.setZoom(14);
  }
  if (place.opening_hours) {
    if (place.opening_hours.open_now) {
      info.style.borderTop = 'solid green 2px';
    }
  }

  var name = document.createElement('div');
  name.innerHTML = '<h2>' + place.name + '</h2>';
  info.appendChild(name);
  var categories = document.createElement('p');
  categories.className = 'left small';
  var content = '<footer>';
  for (var i in place.types) {
    if (i == 0) {
      content += place.types[i];
    } else {
      content += ', ' + place.types[i];
    }
  }
  categories.innerHTML += content + '</footer>';
  info.appendChild(categories);
  pinfo.appendChild(info);

  // Streetview and Address.
  var moreDetails = document.createElement('div');
  moreDetails.setAttribute('id', 'pdetails');
  moreDetails.setAttribute('class', 'gridbox ');

  var sv = document.createElement('img');
  sv.setAttribute('src', 'icons/pegman.png');
  sv.setAttribute('style', 'padding-top: 20px;');
  sv.setAttribute('id', 'pegman');
  //sv.onclick = function() { setPano(); };
  sv.className = 'right';
  panorama.setPosition(place.geometry.location);
  panorama.setPov({
    heading: 265,
    pitch: 0
  });
  sv.setAttribute('onclick', 'showPano();');
  moreDetails.appendChild(sv);
  // End Streetview and Address.

  // Start details and reviews.
  var request = {
    reference: place.reference
  };

  placesService.getDetails(request, function(placed, status) {
    if (status == google.maps.places.PlacesServiceStatus.OK) {
      console.log(JSON.stringify(placed));
      moreDetails.innerHTML += '<h3 style="margin-bottom: 5px;">' + placed.formatted_address + '</h3>';
      moreDetails.innerHTML += '<p style="padding-left: 10px;" >' + placed.formatted_phone_number + '</p>';
      if (placed.website) {
        moreDetails.innerHTML += '<a href="' + placed.website + '"> website </a>';
      }
      pinfo.appendChild(moreDetails);

      var reviews = document.createElement('div');
      reviews.setAttribute('id', 'reviews');
      reviews.setAttribute('class', 'gridbox');

      var summary = '';
      if (placed.rating) {
        summary += '<h3 style="margin-bottom: 5px; margin-left: 5px;">Rating:<br>';
        summary += '' + placed.rating + ' of 5</h3>';
      }
      if (placed.price_level) {
        summary += '<h3 style="margin-bottom: 5px; margin-left: 5px;">Price level:<br>';
        if (placed.price_level == 0) {
          summary += 'Free';
        }
        if (placed.price_level == 1) {
          summary += 'Inexpensive';
        }
        if (placed.price_level == 2) {
          summary += 'Moderate';
        }
        if (placed.price_level == 3) {
          summary += 'Expensive';
        }
        if (placed.price_level == 4) {
          summary += 'Very Expensive';
        }
        summary += '</h3>';
      }
      if (placed.html_attributions && placed.html_attributions.length) {
        summary += '<footer>' + JSON.stringify(placed.html_attributions) + '</footer>';
      }
      reviews.innerHTML += summary;
      reviews.innerHTML += '<h3 style=' + '"text-align:right; margin-right: 10px;">' + '<a href="">Moar</a></h3>';
      pinfo.appendChild(reviews);
    }
  });
  // End details and reviews.
}

function showPano() {
  panorama.setVisible(true);
}

function createPlaceMarker(place, index) {
  var marker_image = new google.maps.MarkerImage('icons/marker.png',
  new google.maps.Size(20, 20));
  var markerOptions = {
    clickable: true,
    draggable: false,
    title: place.name,
    position: place.geometry.location,
    icon: marker_image,
    map: map
  };
  var marker = new google.maps.Marker(markerOptions);

  // Mouseover only makes the pics animate a bit.
  google.maps.event.addListener(marker, 'mouseover', function() {
    if (document.getElementById('photos_' + index)) {
      document.getElementById('photos_' + index).className = 'gridbox active';
    }
    console.log('mouseover:' + index);
  });
  google.maps.event.addListener(marker, 'mouseout', function() {
    if (document.getElementById('photos_' + index)) {
      document.getElementById('photos_' + index).className = 'gridbox inactive';
    }
    console.log('mouseout: ' + index);
  });

  // A click displays extra information.
  google.maps.event.addListener(marker, 'click', function() {
    activatePlace(index);
  });

  return marker;
}

function addTypeListeners() {
  document.getElementById('eatout').addEventListener('click',

  function() {
    document.getElementById(lastWalkType).parentNode.className = '';
    lastWalkType = this.id;
    walkType = eatoutTypes;
    this.parentNode.className = 'selected';
  });
  document.getElementById('party').addEventListener('click',

  function() {
    document.getElementById(lastWalkType).parentNode.className = '';
    lastWalkType = this.id;
    walkType = partyTypes;
    this.parentNode.className = 'selected';
  });
  document.getElementById('edu').addEventListener('click',

  function() {
    document.getElementById(lastWalkType).parentNode.className = '';
    lastWalkType = this.id;
    walkType = eduTypes;
    this.parentNode.className = 'selected';
  });
  document.getElementById('practical').addEventListener('click',

  function() {
    document.getElementById(lastWalkType).parentNode.className = '';
    lastWalkType = this.id;
    walkType = practical;
    this.parentNode.className = 'selected';
  });
  document.getElementById('entertaining').addEventListener('click',

  function() {
    document.getElementById(lastWalkType).parentNode.className = '';
    lastWalkType = this.id;
    walkType = funTypes;
    this.parentNode.className = 'selected';
  });
  document.getElementById('wellness').addEventListener('click',

  function() {
    document.getElementById(lastWalkType).parentNode.className = '';
    lastWalkType = this.id;
    walkType = ablutionTypes;
    this.parentNode.className = 'selected';
  });
}

function removePlaceInfoDiv() {
  var placeinfo = document.getElementById('placeinfo');
  if (placeinfo) {
    placeinfo.parentNode.removeChild(placeinfo);
  }
}

function toggleBounce() {
  if (!activemarker) {
    return;
  }
  if (activemarker.getAnimation() != null) {
    activemarker.setAnimation(null);
  } else {
    activemarker.setAnimation(google.maps.Animation.BOUNCE);
  }
}

// Load the map
google.maps.event.addDomListener(window, 'load', displayMap);
