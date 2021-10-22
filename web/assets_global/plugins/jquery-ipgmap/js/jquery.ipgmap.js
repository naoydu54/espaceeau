(function ($) {
    $.fn.ipGmap = function (options) {
        var obj = $(this);
        var s = this;
        var defaults = {
            lat: 48.193719,
            lng: 6.446276,
            zoom: 15,
            name: 'Info Plus',
            info: 'Info Plus<br>46, rue de la Moselle<br>88190 GOLBEY',
            height: 400
        };

        var settings = $.extend({}, defaults, options);

        var id;
        var lat;
        var lng;
        var zoom;
        var name;
        var info;

        function init() {
            if (obj.length > 0) {
                obj.each(function () {
                    id = obj.attr('id');

                    obj.css('height', settings.height + 'px');

                    if (obj.data('lat')) {
                        lat = obj.data('lat');
                    } else {
                        lat = settings.lat;
                    }

                    if (obj.data('lng')) {
                        lng = obj.data('lng');
                    } else {
                        lng = settings.lng;
                    }

                    if (obj.data('zoom')) {
                        zoom = obj.data('zoom');
                    } else {
                        zoom = settings.zoom;
                    }

                    if (obj.data('name')) {
                        name = obj.data('name');
                    } else {
                        name = settings.name;
                    }

                    if (obj.data('info')) {
                        info = obj.data('info');
                    } else {
                        info = settings.info;
                    }

                    initMap();
                });
            }
        }

        function initMap() {
            google.maps.event.addDomListener(window, 'load', map);
        }

        function map() {
            var mapOptions = {
                zoom: zoom,
                center: {lat: lat, lng: lng},
                disableDefaultUI: false,
                scrollwheel: false,
                navigationControl: true,
                mapTypeControl: false,
                scaleControl: true,
                draggable: true,
                mapTypeControlOptions: {
                    mapTypeIds: [google.maps.MapTypeId.ROADMAP, 'roadatlas']
                }
            };

            var map = new google.maps.Map(document.getElementById(id), mapOptions);

            var infowindow = new google.maps.InfoWindow({
                content: info
            });

            var marker = new google.maps.Marker({
                position: {lat: lat, lng: lng},
                title: name,
                map: map
            });

            marker.addListener('click', function () {
                infowindow.open(map, marker);
            });
        }

        return init();
    };
})
(jQuery);