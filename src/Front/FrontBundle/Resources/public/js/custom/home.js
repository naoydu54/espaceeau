var Home = function () {

    var uiInit = function () {
        initOwlCarousel();
        modifyFlexCol();
    };

    var initOwlCarousel = function () {
        $('.owl-actuality').owlCarousel({
            loop: true,
            margin: 10,
            nav: false,
            responsive: {
                0: {
                    items: 1
                },
                600: {
                    items: 2
                },
                1000: {
                    items: 3
                }
            }
        });
    };


    var modifyFlexCol = function () {
        $('.flex-col').css('flex-flow', 'column nowrap');
        $('.flex-col').removeClass('flex-col');
    }

    return {
        init: function () {
            uiInit();
        }
    };
}();

$(document).ready(function () {
    Home.init();
});