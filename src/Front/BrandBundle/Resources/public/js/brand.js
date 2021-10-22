var brand = function () {


    var uiInit = function () {
        owlCarrousselSubItem()
    };

    var owlCarrousselSubItem = function () {
        $(".owl-carouselSubItem").owlCarousel({
            items:4,
            nav:true,
            dots: false,
            margin:40,

            navText: [
                "<i class=\"fa fa-chevron-circle-left\" aria-hidden=\"true\"></i>\n",
                "<i class=\"fa fa-chevron-circle-right\" aria-hidden=\"true\"></i>\n"
            ],

        });
    }



    return {
        init: function () {
            uiInit();
        }
    };
}();

$(function () {
    brand.init();
});