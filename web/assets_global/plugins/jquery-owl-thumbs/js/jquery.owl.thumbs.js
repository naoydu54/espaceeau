(function ($) {
    $.fn.owlThumbs = function (options) {
        const obj = $(this);
        const s = this;
        const defaults = {
            width: '100px',
            height: '100px',
            margin: '10px',
        }

        const settings = $.extend({}, defaults, options);

        function init() {
            if (obj.length > 0) {
                obj.each(function () {
                    var $dots = obj.find('.owl-dot');
                    var count = 0;

                    $dots.each(function () {
                        const $owlItem = obj.find('.owl-item').not('.cloned').eq(count);

                        $(this).css("background-image", "url(" + $owlItem.find('img').attr('src') + ")");
                        $(this).css("background-repeat", "no-repeat");
                        $(this).css("background-size", "contain");

                        $(this).css("width", settings.width);
                        $(this).css("height", settings.height);
                        $(this).css("margin", settings.margin);

                        count++;
                    });
                });
            }
        }

        return init();
    };
})
(jQuery);