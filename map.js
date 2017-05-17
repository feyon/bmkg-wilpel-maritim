var map,infoWindow;
function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
      zoom: 5,
      center: {lat: -5.087470, lng: 117.670192},
      streetViewControl: false,
      fullscreenControl: false,
      mapTypeControl: false,
      // scrollwheel: false,
  });


  //set center from ip api
  var apiGeolocationSuccess = function(position) {
      console.log("API geolocation success!\n\nlat = " + position.coords.latitude + "\nlng = " + position.coords.longitude);
      zoomCenter(position);
  };
  //try geo based on ip address
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
      zoomCenter(position);
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
  //geolocation host on https or ssl with gmap api
  var tryGeolocation = function() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
          browserGeolocationSuccess,
          browserGeolocationFail,
          {maximumAge: 50000, timeout: 20000, enableHighAccuracy: true});
    }
  };
  //try geolocation
  tryGeolocation();

  var zoomCenter = function(position){
    var pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        };
        map.setCenter(pos);
        map.setZoom(8);
  }



  // Load polygon GeoJSON.
  map.data.loadGeoJson(
      'assets/area/A-F.json');

  // Set the stroke width, and fill color for each polygon
  map.data.setStyle(function(feature){
      var color = "transparent";
      if (feature.getProperty('focus')) {
            color = 'green';
          }
      return /** @type {google.maps.Data.StyleOptions} */({
        fillColor: color,
        strokeWeight: 0,
        // strokeColor: 'green'
      });
  });

  // Set click event for each feature.
  map.data.addListener('click', function(event) {
    //revert to setStyle
    map.data.revertStyle();
    // event.feature.setProperty('focus', true);
    map.data.overrideStyle(event.feature, {
      fillColor: 'green',
    });

    document.getElementById('info').textContent =
        event.feature.getProperty('name')+'-'+event.feature.getProperty('description');
  });

}


  

angular.module('app', []);