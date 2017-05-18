angular.module('app', [])
.controller('MainCtrl', function ($scope, $window) {
    
    // init map
    $window.map  = new google.maps.Map(document.getElementById('map'), {
        zoom: 5,
        center: {lat: -5.087470, lng: 117.670192},
        streetViewControl: false,
        fullscreenControl: false,
        mapTypeControl: false,
        // scrollwheel: false,
    });
    const map = $window.map;

    //try geolocation
    // tryGeolocation();
    
    //load map json
    map.data.loadGeoJson('assets/area/ALL.json');
    //set initial state transparent for each polygon
    map.data.setStyle(function(feature){
        var color = "transparent";
        // if (feature.getProperty('focus')) {
        //         color = 'green';
        //     }
        return ({
            fillColor: color,
            strokeWeight: 0,
            // strokeColor: 'green'
        });
    });

    //click event on outside poly
    map.addListener('click',function(event){
        map.data.revertStyle();
        // magic is here :D
        $scope.$apply(function(){
            $scope.detailBar = {'height':'0'};
            $scope.mapStyle = {'height':'100%'};
        });
    });

    // Set click event for each feature.
    map.data.addListener('click', function(event) {
        //revert to transparent style
        map.data.revertStyle();
        // event.feature.setProperty('focus', true);
        map.data.overrideStyle(event.feature, {
            fillColor: 'green',
        });

        const area = {
            name: event.feature.getProperty('name'),
            desc: event.feature.getProperty('description'),
        }

        // magic is here :D
        $scope.$apply(function(){
            $scope.detailBar = {'height':'10%'};
            $scope.mapStyle = {'height':'90%'};
            $scope.area = area;
        });
        
    });


    $scope.openDetail = function(code){
        codearea = matchAreaToJson(code);
        console.log(codearea);
    }
    
});



//geolocation host on https or ssl with gmap api
const tryGeolocation = function() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            browserGeolocationSuccess,
            browserGeolocationFail,
        //   {maximumAge: 50000, timeout: 20000, enableHighAccuracy: true}
        );
    }
};

const browserGeolocationSuccess = function(position) {
    console.log("Browser geolocation success!\n\nlat = " + position.coords.latitude + "\nlng = " + position.coords.longitude);
    zoomCenter(position);
};

const zoomCenter = function(position){
    const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        };
        map.setCenter(pos);
        map.setZoom(8);
}

const browserGeolocationFail = function(error) {
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
                tryAPIGeolocation();
        break;
    }
};

//try geo based on ip address
const tryAPIGeolocation = function() {
        jQuery.post( "http://geoip.nekudo.com/api/", 
        function(data) {
            apiGeolocationSuccess({coords: {latitude: data.location.latitude, longitude: data.location.longitude}});
    })
    .fail(function(err) {
        console.log("API Geolocation error! \n\n"+err);
    });
};

const apiGeolocationSuccess = function(position) {
    console.log("API geolocation success!\n\nlat = " + position.coords.latitude + "\nlng = " + position.coords.longitude);
    zoomCenter(position);
};

function matchAreaToJson(str){
    let arrcode = str.split('.');
    let codenum = parseInt(arrcode[1]);
    return arrcode[0]+'.'+pad(codenum);
}

function pad(n) {
    return (n < 10) ? ("0" + n) : n;
}