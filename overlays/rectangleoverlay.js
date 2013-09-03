function RectangleOverlay(opt_options) {
  this.setValues(opt_options);

  this.createDivs_();
}
RectangleOverlay.prototype = new google.maps.OverlayView();

function px(value) {
  return Math.round(value) + 'px';
}

RectangleOverlay.prototype.positionBoundingBox1_ =
    function(top, left, width, height) {
  this.div1_.style.left = px(left);
  this.div1_.style.top = px(top);
  this.div2_.style.height = px(height);
  this.div2_.style.width = px(width);
  // Hide div3 if we're displaying the first bounding box.  When we position
  // the second bounding box, this will be displayed again.
  this.div3_.style.display = 'none';
};

RectangleOverlay.prototype.positionBoundingBox2_ =
    function(top, left, width, height) {
  this.div3_.style.left = px(left);
  this.div3_.style.top = px(top);
  this.div4_.style.height = px(height);
  this.div4_.style.width = px(width);
  this.div3_.style.display = '';
};

RectangleOverlay.prototype.createDivs_ = function() {
  var div1 = this.div1_ = document.createElement('div');
  div1.style.position = 'absolute';
  div1.style.border = '1px solid rgb(68, 68, 187)';
  var div2 = this.div2_ = document.createElement('div');
  div2.style.backgroundColor = '#6666CC';
  div2.style.opacity = '0.2';
  div1.appendChild(div2);

  // Used when the bounds is Latitude inverted.
  var div3 = this.div3_ = document.createElement('div');
  div3.style.position = 'absolute';
  div3.style.border = '1px solid rgb(68, 68, 187)';
  var div4 = this.div4_ = document.createElement('div');
  div4.style.backgroundColor = '#6666CC';
  div4.style.opacity = '0.2';
  div3.appendChild(div4);
  div3.style.display = 'none';
}

// Implement onAdd
RectangleOverlay.prototype.onAdd = function() {
  // Then add the overlay to the DOM
  var pane = this.getPanes().overlayLayer;
  pane.appendChild(this.div1_);
  pane.appendChild(this.div3_);

 // Ensures the label is redrawn if the text or position is changed.
 var me = this;
 this.listeners_ = [
   google.maps.event.addListener(this, 'bounds_changed',
       function() { me.draw(); })
 ];
}

// Implement onRemove
RectangleOverlay.prototype.onRemove = function() {
  this.div1_.parentNode.removeChild(this.div1_);
  this.div3_.parentNode.removeChild(this.div3_);

  // RectangleOverlay is removed from the map, stop updating its position.
  for (var i = 0, I = this.listeners_.length; i < I; ++i) {
    maps.google.event.removeListener(this.listeners_[i]);
  }
};

// Implement draw
RectangleOverlay.prototype.draw = function() {
  var bounds = this.get('bounds');
  if (!bounds) {
    this.div1_.style.display = 'none';
    this.div3_.style.display = 'none';
    return;
  }

  var projection = this.getProjection();
  var swPoint = projection.fromLatLngToDivPixel(bounds.getSouthWest());
  var nePoint = projection.fromLatLngToDivPixel(bounds.getNorthEast());
  var worldHeight =
    projection.fromLatLngToDivPixel(new google.maps.LatLng(-85, 0)).y -
    projection.fromLatLngToDivPixel(new google.maps.LatLng(85, 0)).y;
  var width = nePoint.x - swPoint.x;
  var height = swPoint.y - nePoint.y;
  if (nePoint.y <= swPoint.y) {
    this.positionBoundingBox1_(nePoint.y, swPoint.x, width, height);
  } else {
    height = worldHeight - height;
    this.positionBoundingBox1_(nePoint.y, swPoint.x, width, height);
    this.positionBoundingBox2_(swPoint.y - height, swPoint.x, width, height);
  }
};
