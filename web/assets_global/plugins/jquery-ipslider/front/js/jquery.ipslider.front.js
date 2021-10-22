(function ($) {
    var settings = {};

    var $elem;
    var slides;
    var total;
    var sliderNavContainer;
    var sliderDotContainer;
    var layerMinFontSize = 14;
    var layerMaxFontSize = 100;
    var slideIndex = 1;
    var interval = null;

    var methods = {
        init: function (elem) {
            $elem = elem;

            if ($elem.length > 0) {
                slides = $elem.find('div.slide');
                total = slides.length;
                sliderNavContainer = $elem.find('.slider-nav-container');
                sliderDotContainer = $('#slider-dot-container');

                if (methods.getDevice() === 'mobile' || methods.getDevice() === 'tablet') {
                    if (total > 1) {
                        methods.onSwipeLeft();
                        methods.onSwipeRight();
                    }
                } else if (methods.getDevice() === 'desktop' || methods.getDevice() === 'ldesktop') {
                    if (settings.showNav && total > 1) {
                        sliderNavContainer.css('display', 'block');
                        methods.navSlides();
                    }

                    if (settings.showDots && total > 1) {
                        sliderDotContainer.css('display', 'block');
                        methods.navDotSlide();
                    }
                }

                methods.showSlide(slideIndex);
                methods.responsiveLayer();
                methods.windowsOnResize();
            }
        },
        navSlides: function () {
            $('.prev').click(function () {
                methods.showSlide(slideIndex -= 1);
            });

            $('.next').click(function () {
                methods.showSlide(slideIndex += 1);
            });
        },
        navDotSlide: function () {
            sliderDotContainer.find('.dot').click(function () {
                methods.showSlide(slideIndex = $(this).data('index'));
            });
        },
        showSlide: function (slide) {
            var i;
            var dots = sliderDotContainer.find('.dot');

            if (slide > slides.length) {
                slideIndex = 1
            }

            if (slide < 1) {
                slideIndex = slides.length
            }

            for (i = 0; i < slides.length; i++) {
                slides[i].style.display = "none";
            }
            for (i = 0; i < dots.length; i++) {
                dots[i].className = dots[i].className.replace(" active", "");
            }

            slides[slideIndex - 1].style.display = "block";
            dots[slideIndex - 1].className += " active";

            methods.loadLayers();

            if (total > 1) {
                methods.stopAutoSlide();
                methods.startAutoSlide();
            }
        },
        loadLayers: function () {
            if (methods.getDevice() !== 'mobile') {
                $elem.find("[data-slide='" + slideIndex + "']").find('div.layer').each(function (index) {
                    setTimeout(function (el) {
                        el.css('display', 'block');
                        el.addClass(el.data('animation'));

                    }, index * 1000, $(this));
                });
            }
        },
        startAutoSlide: function () {
            if (total !== 0) {
                var countLayer = $('div').find("[data-slide='" + slideIndex + "']").find('div.layer').length;

                interval = setTimeout(function () {
                    methods.showSlide(slideIndex += 1);
                }, settings.defaultDuration + (countLayer * 1000));
            }
        },
        stopAutoSlide: function () {
            if (interval !== null) {
                clearTimeout(interval);
                interval = null;
            }
        },
        /**
         * @return {string}
         */
        getDevice: function () {
            var windowW = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;

            if (windowW < 768) {
                return 'mobile';
            }
            else if (windowW >= 768 && windowW <= 991) {
                return 'tablet';
            }
            else if (windowW >= 992 && windowW <= 1199) {
                return 'desktop';
            }
            else if (windowW >= 1200) {
                return 'ldesktop';
            }
        },
        layerSize: function (ratio) {
            $elem.find("[data-slide='" + slideIndex + "']").find('div.layer').each(function () {
                if ($(this).data('type') === 'text') {
                    if (ratio === -1) {
                        $(this).css('font-size', $(this).data('fontsize'));
                    } else {
                        var fontSize = ($(this).data('fontsize') / 100) * ratio;
                        fontSize = Math.round(fontSize * 100) / 100;
                        fontSize = $(this).data('fontsize') - fontSize;

                        if (fontSize < layerMinFontSize || fontSize > layerMaxFontSize) {
                            fontSize = $(this).data('fontsize');
                        }

                        $(this).css('font-size', fontSize + 'px');
                    }

                } else if ($(this).data('type') === 'button') {
                    var a = $(this).find('a');
                    if (a) {
                        if (ratio === -1 || ratio === 20) {
                            a.removeClass('btn-xs');
                        } else if (ratio === 40 || ratio === 60) {
                            a.addClass('btn-xs');
                        }
                    }
                }
            });
        },
        responsiveLayer: function () {
            if (methods.getDevice() === 'mobile') {
                methods.layerSize(60);
                $elem.css('height', settings.slideHeight / 3 + 'px');
            }
            else if (methods.getDevice() === 'tablet') {
                methods.layerSize(40);
                $elem.css('height', settings.slideHeight / 2 + 'px');
            }
            else if (methods.getDevice() === 'desktop') {
                methods.layerSize(20);
                $elem.css('height', settings.slideHeight + 'px');
            }
            else if (methods.getDevice() === 'ldesktop') {
                methods.layerSize(-1);
                $elem.css('height', settings.slideHeight + 'px');
            }
        },
        windowsOnResize: function () {
            $(window).resize(function () {
                methods.responsiveLayer();
            });
        },
        onSwipeLeft: function () {
            $elem.swipeleft(function () {
                methods.showSlide(slideIndex -= 1);
            });
        },
        onSwipeRight: function () {
            $elem.swiperight(function () {
                methods.showSlide(slideIndex += 1);
            });
        }
    };

    $.fn.ipSliderFront = function (options) {
        var $this = this;

        $.getScript("/web/assets_global/plugins/jquery-ipslider/jquery.mobile-events.min.js")
            .done(function () {
                return $this.each(function () {
                    var defaults = {
                        slideHeight: 500,
                        defaultDuration: 5000,
                        showNav: true,
                        showDots: true,
                    };

                    settings = $.extend({}, defaults, options);

                    return methods.init($(this));
                });
            })
            .fail(function () {
                console.error('error: jquery.mobile-events.min.js');
            });
    };
})
(jQuery);