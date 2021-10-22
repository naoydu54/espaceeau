var Carrier = function () {

    var uiInit = function () {
        selectCarrier();
        clickable();

    };



    var clickable = function () {
        $('.clickable').click(function () {

            var radioButton = $(this).find("input");
            radioButton.prop('checked', true);

            if (radioButton.prop('checked', true)){
                $('#btn-carrier').removeClass('disabled');

            }
        })
    }


    var selectCarrier = function () {

        $( "#btn-carrier" ).click(function() {
            var  btn = $(this);
            AppGlobal.spinnerButton(btn);
            $.ajax({
                url: Routing.generate('front_order_add_carrier', {'carrier': $("input[name='val_carrier']:checked"). val()}),
                type: 'POST',
                success: function (data) {
                    console.log(data);

                    if (data.success ) {
                        AppGlobal.spinnerButton(btn);
                        // window.location = Routing.generate('front_order_resume');
                        window.location = Routing.generate('front_order_select_payment');
                    }else{
                        AppGlobal.spinnerButton(btn);
                        window.location = Routing.generate('front_cart_index');
                    }

                },
                error: function (xhr) {
                    console.log(xhr.responseText);
                }
            });
        });


    };



    return {
        init: function () {
            uiInit();
        }
    };
}();

$(function () {
    Carrier.init();
});