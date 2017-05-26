angular.module('app', ['ngSanitize','angular.filter'])
.filter('cut', function () {
        return function (value, wordwise, max, tail) {
            if (!value) return '';

            max = parseInt(max, 10);
            if (!max) return value;
            if (value.length <= max) return value;

            value = value.substr(0, max);
            if (wordwise) {
                var lastspace = value.lastIndexOf(' ');
                if (lastspace !== -1) {
                  //Also remove . and , so its gives a cleaner result.
                  if (value.charAt(lastspace-1) === '.' || value.charAt(lastspace-1) === ',') {
                    lastspace = lastspace - 1;
                  }
                  value = value.substr(0, lastspace);
                }
            }

            return value + (tail || ' …');
        };
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
    
    // getAreaJson();
    $.getJSON("assets/area/map.json", function(data){
        geoJsonObject = topojson.feature(data, data.objects.collection);
        map.data.addGeoJson(geoJsonObject); 
        console.log('areas are loaded..');
    }); 
    
    // get area list in navigation
    $.getJSON("assets/area/mapping.json", function(data){        
        $scope.$apply(function(){
            $scope.arealist = data;
        }); 
    }); 
 
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
            $scope.detailBtnTxt = "Tampilkan Wilayah Perairan";
            $scope.areaName = true;

            //get province from mapping.json
            $.getJSON("assets/area/mapping.json", function(data){  
                for(var i=0;i<data.length;i++){
                    if(data[i].kode==codearea){
                        var province = data[i].propinsi;
                        $scope.$apply(function(){
                            $scope.area.province = province;
                        });
                    }
                    
                }
            });
            

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

                    $scope.dataArea.h.angin_to = matchArahAngin($scope.dataArea.h.angin_to);
                    $scope.dataArea.h1.angin_to = matchArahAngin($scope.dataArea.h1.angin_to);
                    $scope.dataArea.h2.angin_to = matchArahAngin($scope.dataArea.h2.angin_to);
                    $scope.dataArea.h3.angin_to = matchArahAngin($scope.dataArea.h3.angin_to);

                    $scope.dataArea.h.valid_from = dateStringToFormat($scope.dataArea.h.valid_from);
                    $scope.dataArea.h1.valid_from = dateStringToFormat($scope.dataArea.h1.valid_from);
                    $scope.dataArea.h2.valid_from = dateStringToFormat($scope.dataArea.h2.valid_from);
                    $scope.dataArea.h3.valid_from = dateStringToFormat($scope.dataArea.h3.valid_from);

                    $scope.dataArea.h.valid_to = dateStringToFormat($scope.dataArea.h.valid_to);
                    $scope.dataArea.h1.valid_to = dateStringToFormat($scope.dataArea.h1.valid_to);
                    $scope.dataArea.h2.valid_to = dateStringToFormat($scope.dataArea.h2.valid_to);
                    $scope.dataArea.h3.valid_to = dateStringToFormat($scope.dataArea.h3.valid_to);
                    
                    
                    // console.log($scope.dataArea.h.icon);
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

    $scope.closeNameBar = function(){
        $scope.detailBar = {'height':'0'};
        $scope.mapStyle = {'height':'100%'};
    }
    
    $scope.jumpToArea = function(name){     
        code = matchJsonToArea(name);
        // console.log(code);
        let bounds = new google.maps.LatLngBounds(); 
        
        //check the feature codename
        map.data.forEach(function(feature) {
          if (feature.getProperty('name') === code) {
            //zoom view to fit poly boundaries
            feature.getGeometry().forEachLatLng(function(latlng){
                bounds.extend(latlng);
            });
            map.fitBounds(bounds);
            //trigger click on area polygon
            google.maps.event.trigger(map.data, 'click', {
                feature: feature
            });
          }
        });
    }

}); //end of controller


//get json file add to map from jquery
const getAreaJson = function(){
    $.getJSON("assets/area/map.json", function(data){
        geoJsonObject = topojson.feature(data, data.objects.collection);
        map.data.addGeoJson(geoJsonObject); 
        console.log('areas are loaded..');
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

//convert A.1 -> A.01
function matchAreaToJson(str){
    let arrcode = str.split('.');
    let codenum = parseInt(arrcode[1]);
    return arrcode[0]+'.'+pad(codenum);
}
function pad(n) {
    return (n < 10) ? ("0" + n) : n;
}

//convert A.01 -> A.1
function matchJsonToArea(str){
    let arrcode = str.split('.');
    let codenum = parseInt(arrcode[1]);
    return arrcode[0]+'.'+codenum;
}

function matchCuaca(str){
    // console.log(str);
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

function matchArahAngin(str){
    switch(str){
        case 'Utara':
            var angin = 'N';
            break;
        case 'Timur Laut':
            var angin = 'NE';
            break;
        case 'Timur':
            var angin = 'E';
            break;
        case 'Tenggara':
            var angin = 'SE';
            break;
        case 'Selatan':
            var angin = 'S';
            break;
        case 'Barat Daya':
            var angin = 'SW';
            break;
        case 'Barat':
            var angin = 'W';
            break;   
        case 'Barat Laut':
            var angin = 'NW';
            break;            
    }
    return angin;
}

function dateStringToFormat(str){
    var dateArr = str.split(" ");
    var iso_date = dateArr[0]+'T'+dateArr[1];
    var date = new Date(iso_date);

    var monthId = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
    var d = date.getDate();
    var M = monthId[date.getMonth()];
    var Y = date.getFullYear();
    if(date.getHours()<10){
        var H = '0'+date.getHours();
    }else{
        var H = date.getHours();
    }

    if(date.getMinutes()<10){
        var m = '0'+date.getMinutes();
    }else{
        var m = date.getMinutes();        
    }
    
    return d+' '+M+' '+Y+' pukul '+H+'.'+m;
}