var map,infoWindow;
function initMap() {
map = new google.maps.Map(document.getElementById('map'), {
    zoom: 6,
    center: {lat: -5.087470, lng: 117.670192},
    streetViewControl: false,
    fullscreenControl: false,
    mapTypeControl: false,
    scrollwheel: false,
});

var apiGeolocationSuccess = function(position) {
    console.log("API geolocation success!\n\nlat = " + position.coords.latitude + "\nlng = " + position.coords.longitude);
};

var tryAPIGeolocation = function() {
    jQuery.post( "http://geoip.nekudo.com/api/", 
    function(data) {
        apiGeolocationSuccess({coords: {latitude: data.location.latitude, longitude: data.location.longitude}});
  })
  .fail(function(err) {
    console.log("API Geolocation error! \n\n"+err);
  });
};

var browserGeolocationSuccess = function(position) {
    console.log("Browser geolocation success!\n\nlat = " + position.coords.latitude + "\nlng = " + position.coords.longitude);
};

var browserGeolocationFail = function(error) {
  switch (error.code) {
    case error.TIMEOUT:
      console.log("Browser geolocation error !\n\nTimeout.");
      break;
    case error.PERMISSION_DENIED:
      if(error.message.indexOf("Only secure origins are allowed") == 0) {
        tryAPIGeolocation();
      }
      break;
    case error.POSITION_UNAVAILABLE:
      console.log("Browser geolocation error !\n\nPosition unavailable.");
      break;
  }
};

var tryGeolocation = function() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
        browserGeolocationSuccess,
        browserGeolocationFail,
        {maximumAge: 50000, timeout: 20000, enableHighAccuracy: true});
  }
};

tryGeolocation();

 // Try HTML5 geolocation.
// if (navigator.geolocation) {
//     navigator.geolocation.getCurrentPosition(function(position) {
//     var pos = {
//         lat: position.coords.latitude,
//         lng: position.coords.longitude
//     };
//     map.setCenter(pos);
//     });
// }

// Load GeoJSON.
map.data.loadGeoJson(
    'assets/area/A1.json');

// Set the stroke width, and fill color for each polygon
map.data.setStyle({
    fillColor: 'green',
    strokeWeight: 0.5,
    strokeColor: 'green'
});
}

angular.module('app', []);