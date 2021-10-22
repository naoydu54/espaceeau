var Resume = function () {

    var uiInit = function () {

        onChangeConfirmation();
    };




    var onChangeConfirmation = function () {
        console.log('a');
        $('.clickable').click(function () {
            console.log('b');
            $('#btn-carrier').removeClass('hidden');

            var radioButton = $(this).find("input");
            radioButton.prop('checked', true);
            var nameCheck = radioButton.data('name');
            if (nameCheck === 'cbSingle') {
                $('#btn-carrier').attr('href', Routing.generate('front_order_resume', {'paymentType': 'cb', 'configPayment': 'single'}));

            } else if (nameCheck === 'cbMulti') {
                $('#btn-carrier').attr('href', Routing.generate('front_order_resume', {'paymentType': 'cb', 'configPayment': 'multi'}));

            } else if (nameCheck === 'cheque') {
                $('#btn-carrier').attr('href', Routing.generate('front_order_resume', {'paymentType': 'cheque', 'configPayment': 'multi'}));

            } else if (nameCheck === 'virement') {
                $('#btn-carrier').attr('href', Routing.generate('front_order_resume', {'paymentType': 'virement', 'configPayment': 'multi'}));

            }
        })
    }

    return {
        init: function () {
            uiInit();
        }
    };
}();

$(function () {
    Resume.init();
});