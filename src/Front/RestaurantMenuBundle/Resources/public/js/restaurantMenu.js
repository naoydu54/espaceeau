var RestaurantMenu = function () {

    var uiInit = function () {
        initOwlCarousel();
    };

    var initOwlCarousel = function () {
        $('.owl-carousel').owlCarousel({
            loop: true,
            margin: 10,
            nav: true,
            responsive: {
                0: {
                    items: 1
                },
            },
            navText: ['&#8249;', '&#8250;'],
            onInitialized: function (e) {
                $('.owl-carousel-loader').html('');
            }
        });
    };

    return {
        init: function () {
            uiInit();
        }
    };
}();

$(document).ready(function () {
    RestaurantMenu.init();
});