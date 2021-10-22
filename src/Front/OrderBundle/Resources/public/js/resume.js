var Resume = function () {

    var uiInit = function () {

        onChangeDisableCGV();
        onChangeConfirmation();
        blinkColor();
        changeChoicePayment();
    };




    var onChangeConfirmation = function () {
        $("input[name='chkmethode']").click(function () {
            if($("input[name='chkmethode']:checked").val()){
                $('#btn-confiramtion').removeClass('disabled');
            }


            if ($(this).data('name') == CHEQUE){
                $('#btn-confiramtion').removeClass('hidden');

                $('#btn-confiramtion').attr('href', Routing.generate('front_order_payment', {'payment': CHEQUE}));
                $('.paymentCard').addClass('hidden');
                $('.paymentMulti').addClass('hidden');


            }else if($(this).data('name') == CARTEBLEUE){
                $('.paymentCard').removeClass('hidden');
                $('.paymentMulti').removeClass('hidden');
                $('#btn-confiramtion').addClass('hidden');



            }
        })
    };

    var onChangeDisableCGV = function () {

        var $div2blink = $(".labelCgv2");
        var cgv1Checked = $("input[ name='cgv1']");
        var cgv2Checked = $("input[ name='cgv2']");

        cgv1Checked.click(function () {
            if(cgv1Checked.is(':checked') ){
                $(".paymentCard").removeClass('hidden');
                $div2blink.removeClass('labelCgv2');
                $div2blink.css('color', 'green');
                cgv2Checked.prop( "checked", true );
                $("html, body").animate({ scrollTop: $(document).height()-$(window).height() }, 800);



            }else{
                $(".paymentCard").addClass('hidden');
                // $('#btn-confiramtion').addClass('disabled');
                $("input[name='chkmethode']:checked").prop("checked", false);
                $div2blink.css('color', 'red');
                $div2blink.toggleClass("labelCgv2");
                cgv2Checked.prop( "checked", false );

            }

        });

        cgv2Checked.click(function () {
            if(cgv2Checked.is(':checked') ){
                $(".paymentCard").removeClass('hidden');
                $div2blink.removeClass('labelCgv2');
                $div2blink.css('color', 'green');
                cgv1Checked.prop( "checked", true );


            }else{
                $(".paymentCard").addClass('hidden');
                // $('#btn-confiramtion').addClass('disabled');
                $("input[name='chkmethode']:checked").prop("checked", false);
                $div2blink.css('color', 'red');
                $div2blink.toggleClass("labelCgv2");
                cgv1Checked.prop( "checked", false );


            }
        })
    };


    var blinkColor = function () {
        var $div2blink = $(".labelCgv2"); // Save reference, only look this item up once, then save
        var backgroundInterval = setInterval(function(){
            $div2blink.toggleClass("labelCgv2");
        },1500);
    };


    return {
        init: function () {
            uiInit();
        }
    };
}();

$(function () {
    Resume.init();
});