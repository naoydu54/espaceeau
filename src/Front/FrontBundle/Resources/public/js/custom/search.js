var Menu = function () {

    var uiInit = function () {
        search();
    };

    var search = function () {
        console.log('a');
        $('a[href="#search"]').on('click', function(event) {
            event.preventDefault();
            $('#search').addClass('open');
            $('#search > form > input[type="search"]').focus();
        });

        $('#search, #search button.close').on('click keyup', function(event) {
            if (event.target == this || event.target.className == 'close' || event.keyCode == 27) {
                $(this).removeClass('open');
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
    Menu.init();
});