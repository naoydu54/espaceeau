var Login = function () {

    var uiInit = function () {
        errorLogin();
    };

    var errorLogin = function () {


        var name = $('#username');
        var password = $('#password');


        if ($('.alert-danger').length > 0) {
            var url = Routing.generate('front_login_fail', {'name': sessionStorage.getItem('name'), 'password': sessionStorage.getItem('password')});

            $(location).attr("href", url);

        } else {

            $("form").submit(function (event) {
                if (name.length > 0 && password.length > 0) {
                    sessionStorage.setItem('name', name.val());
                    sessionStorage.setItem('password', password.val());
                }
            });

        }


    };

    return {
        init: function () {
            uiInit();
        }
    };
}();

$(document).ready(function () {
    Login.init();
});