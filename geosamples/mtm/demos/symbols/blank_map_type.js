// Copyright 2012 Google Inc. All Rights Reserved.

/**
 * @fileoverview Defines BlankMapType.
 * @author enochlau@google.com (Enoch Lau)
 */

/**
 * A map type that shows blank gray tiles, for use in screenshot tests.
 * @constructor
 * @implements {google.maps.MapType}
 */
function BlankMapType() {
  this.tileSize = new google.maps.Size(256, 256);
  this.maxZoom = 30;
}

/** @inheritDoc */
BlankMapType.prototype.getTile = function(tileCoord, zoom, ownerDocument) {
  var tile = ownerDocument.createElement('div');
  tile.style.width = tile.style.height = '256px';
  tile.style.backgroundColor = 'white';
  return tile;
};

/** @inheritDoc */
BlankMapType.prototype.releaseTile = function(tile) {};
