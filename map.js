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

infoWindow = new google.maps.InfoWindow;
 // Try HTML5 geolocation.
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
    var pos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
    };
    // infoWindow.setPosition(pos);
    // infoWindow.setContent('Location found.');
    // infoWindow.open(map);
    map.setCenter(pos);
    });
}

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