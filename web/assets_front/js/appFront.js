var App = function () {

    var uiInit = function () {
        loadPlugins();
        initPreLoader();
        initScrollToTop();
        initIpSlider();
        initOwlCarouselMenu();
        initOwlCarouseBrand();
    }

    var loadPlugins = function () {
        $('[data-toggle="tooltip"]').tooltip();
    }

    var initPreLoader = function () {
        if ($('.preloader').length) {
            $('.preloader').fadeOut(500);
        }
    }

    var initScrollToTop = function () {
        $.scrollUp({
            scrollText: '<i class="fa fa-arrow-up"></i>',
            easingType: 'linear',
            scrollSpeed: 900,
            animation: 'fade'
        });
    }

    var initIpSlider = function () {
        var slideContainer = $('#slider');
        if (slideContainer.length > 0) {
            slideContainer.ipSliderFront({
                slideHeight: 800,
                showDots: false
            });
        }
    }

    var initOwlCarouselMenu = function () {
        if ($('.owl-menu').length > 0) {
            $('.owl-menu').owlCarousel({
                loop: false,
                margin: 10,
                dots: true,
                nav: true,
                responsive: {
                    0: {
                        items: 1
                    },
                    600: {
                        items: 4
                    },
                    1000: {
                        items: 6
                    }
                },
                onInitialized: function () {
                    $($('li.dropdown.product').find('.dropdown-menu')).click(function () {
                        return false;
                    });

                    $($('li.dropdown.product').find('.dropdown-menu a')).each(function (index) {
                        $($(this)).click(function () {
                            window.location.href = $(this).attr('href');
                        });
                    });
                }
            });
        }
    }

    var initOwlCarouseBrand = function () {
        var $owlBrand = $('.owl-brand');
        $owlBrand.owlCarousel({
            loop: true,
            margin: 80,
            nav: false,
            center: true,
            autoplay: true,
            autoplayTimeout: 2500,
            responsive: {
                0: {
                    items: 1
                },
                600: {
                    items: 3
                },
                1000: {
                    items: 5
                }
            }
        });

        $owlBrand.find('img').hover(
            function () {
                var currentSrc = $(this).attr('src');
                var newSrc = $(this).attr('data-img');

                $(this).css('cursor', 'pointer');
                $(this).attr('src', newSrc);
                $(this).attr('data-img', currentSrc);

            }, function () {
                var currentSrc = $(this).attr('src');
                var newSrc = $(this).attr('data-img');

                $(this).css('cursor', 'auto');
                $(this).attr('src', newSrc);
                $(this).attr('data-img', currentSrc);
            }
        );

        $owlBrand.find('img').click(function (e) {
            e.stopPropagation();
            window.location.href = $(this).attr('data-link');
        })
    }

    return {
        init: function () {
            uiInit();
        }
    };
}();

$(document).ready(function () {
    App.init();
});