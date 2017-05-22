angular.module('app', ['ngSanitize'])
.config(function($httpProvider){
    delete $httpProvider.defaults.headers.common['X-Requested-With'];
})
.controller('MainCtrl', function ($scope, $window, $http, $sce) {
    
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

    tryGeolocation();
    
    getAreaJson();
 
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
            $scope.detailBar = {'height':'15%'};
            $scope.mapStyle = {'height':'85%'};
            $scope.area = area;
        });
        
    });

    $scope.detailBtnTxt = "Info Selengkapnya";            

    //detail view area
    $scope.openDetail = function(code){
        codearea = matchAreaToJson(code); //return i.e : A.1 into A.01;
        const url = 'http://maritim.bmkg.go.id/xml/wilayah_pelayanan/prakiraan?kode='+codearea+'&format=json';
        // const url = 'assets/response-bmkg-test.json';

        $scope.detailClose = !$scope.detailClose;    
        if($scope.detailClose==true){
            //opened detail
            $scope.detailBar = {'height':'100%'};
            $('.detail').addClass('overflow');
            $scope.detailBtnTxt = "Lihat Wilayah Perairan";
            $scope.areaName = true;

            //get detail from api
            $.getJSON(url,function(data){
                // console.log('Loading..');                
                obj = data;
                // magic is here :D
                $scope.$apply(function(){
                    $scope.dataArea = {
                        'h' : obj.kategoris[0],
                        'h1': obj.kategoris[1],
                        'h2': obj.kategoris[2],
                        'h3': obj.kategoris[3],                    
                    };
                    $scope.spinnerShow = true;
                    //show data as html
                    $scope.dataArea.h.peringatan_dini = $sce.trustAsHtml(obj.kategoris[0].peringatan_dini);
                    $scope.dataArea.h1.peringatan_dini = $sce.trustAsHtml(obj.kategoris[1].peringatan_dini);
                    $scope.dataArea.h2.peringatan_dini = $sce.trustAsHtml(obj.kategoris[2].peringatan_dini);
                    $scope.dataArea.h3.peringatan_dini = $sce.trustAsHtml(obj.kategoris[3].peringatan_dini);

                    $scope.dataArea.h.kondisi_sinoptik = $sce.trustAsHtml(obj.kategoris[0].kondisi_synoptik);
                    $scope.dataArea.h1.kondisi_synoptik = $sce.trustAsHtml(obj.kategoris[1].kondisi_synoptik);
                    $scope.dataArea.h2.kondisi_synoptik = $sce.trustAsHtml(obj.kategoris[2].kondisi_synoptik);
                    $scope.dataArea.h3.kondisi_synoptik = $sce.trustAsHtml(obj.kategoris[3].kondisi_synoptik);

                    $scope.dataArea.h.icon = matchCuaca($scope.dataArea.h.cuaca);
                    $scope.dataArea.h1.icon = matchCuaca($scope.dataArea.h1.cuaca);
                    $scope.dataArea.h2.icon = matchCuaca($scope.dataArea.h2.cuaca);
                    $scope.dataArea.h3.icon = matchCuaca($scope.dataArea.h3.cuaca);
                    
                    // console.log($scope.dataArea);
                });  
            }).done(function(){
                // console.log('selesai');
                $scope.$apply(function(){
                    $scope.spinnerShow = false;                
                })
            })
            ; 

        }else{ 
            //closed detail
            $scope.detailBar = {'height':'15%'};
            $('.detail').removeClass('overflow');
            $scope.detailBtnTxt = "Info Selengkapnya";
            $scope.areaName = false;
                        
        }
    }
    
});

//get json file add to map from jquery
const getAreaJson = function(){
    $.getJSON("assets/area/map.json", function(data){
        geoJsonObject = topojson.feature(data, data.objects.collection);
        map.data.addGeoJson(geoJsonObject); 
        console.log('areas are loaded..')
      }); 
}

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

function matchCuaca(str){
    if(str!=null){
        var string = str,
        substring = "ujan";
        if(string.includes(substring)){
            return 'assets/weather/rain.svg';
        }else{
            return 'assets/weather/clouds.svg';    
        }
    }else{
        return 'assets/weather/clouds.svg';
    }
}