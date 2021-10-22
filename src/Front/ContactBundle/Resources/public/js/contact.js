var Contact = function () {

    var mapLocation = new google.maps.LatLng(48.258361, 6.396894);
    var markerName = 'Wismer S.A.S';
    var infoWindowContent = "Wismer S.A.S<br>Zone Inova 3000 Allée n°5<br>88150 CAPAVENIR";

    var uiInit = function () {
        initMap();
    };

    var initMap = function () {
        google.maps.event.addDomListener(window, 'load', init);

        function init() {

            var mapOptions = {
                zoom: 15,
                center: mapLocation,
                disableDefaultUI: false,
                scrollwheel: false,
                navigationControl: true,
                mapTypeControl: false,
                scaleControl: true,
                draggable: true,
                mapTypeControlOptions: {
                    mapTypeIds: [google.maps.MapTypeId.ROADMAP, 'roadatlas']
                },
                /*styles: [{"featureType": "administrative", "elementType": "labels.text.fill", "stylers": [{"color": "#444444"}]}, {"featureType": "landscape", "elementType": "all", "stylers": [{"color": "#f2f2f2"}]}, {"featureType": "poi", "elementType": "all", "stylers": [{"visibility": "off"}]}, {"featureType": "road", "elementType": "all", "stylers": [{"saturation": -100}, {"lightness": 45}]}, {"featureType": "road.highway", "elementType": "all", "stylers": [{"visibility": "simplified"}]}, {"featureType": "road.arterial", "elementType": "labels.icon", "stylers": [{"visibility": "off"}]}, {"featureType": "transit", "elementType": "all", "stylers": [{"visibility": "off"}]}, {"featureType": "water", "elementType": "all", "stylers": [{"color": "#46bcec"}, {"visibility": "on"}]}]*/
            };

            var map = new google.maps.Map(document.getElementById('map'), mapOptions);

            var infowindow = new google.maps.InfoWindow({
                content: infoWindowContent
            });

            var marker = new google.maps.Marker({
                position: mapLocation,
                title: markerName,
                map: map
            });
            marker.addListener('click', function () {
                infowindow.open(map, marker);
            });
        }
    }

    return {
        init: function () {
            uiInit();
        }
    };
}();

$(document).ready(function () {
    Contact.init();
});