var OrderList = function () {

    var uiInit = function () {
        initCollapse();
    };

    var initCollapse = function () {
        $(".collapse").on('show.bs.collapse', function () {
            var id = $(this).attr('id');
            var i = $("[data-target='#" + id + "']").find('i');

            if (i.length > 0) {
                i.removeClass('fa-chevron-down').addClass('fa-chevron-up');
            }
        });

        $(".collapse").on('hide.bs.collapse', function () {
            var id = $(this).attr('id');
            var i = $("[data-target='#" + id + "']").find('i');

            if (i.length > 0) {
                i.removeClass('fa-chevron-up').addClass('fa-chevron-down');
            }
        });
    };

    return {
        init: function () {
            uiInit();
        }
    };
}();

$(function () {
    OrderList.init();
});