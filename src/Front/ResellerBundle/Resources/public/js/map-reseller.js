var mapReseller = function () {

    var uiInit = function () {
        mapReseller();
    };

    var mapReseller = function () {

        $.ajax({
            url: Routing.generate('front_reseller_get'),
            dataType: 'json',
            success: function (response) {
                console.log(response);

                console.log(response.resellers);
                console.log();

                $('#francemap').vectorMap({
                    map: 'france_fr',
                    hoverOpacity: 0.5,
                    hoverColor: false,
                    backgroundColor: "#ffffff",
                    colors: response.dataColor,
                    borderColor: "#000000",
                    selectedColor: "#F79218",
                    enableZoom: true,
                    showTooltip: true,
                    onLabelShow: function(event, label, code) {

                        $(label).append($("<br/>"));
                        $(label).append($("<span/>", {
                            //'class': 'population',
                            'html': response.resellers[code]
                        }));
                    }
                });


            },
            error: function (jqxhr) {
                console.log(jqxhr.responseText);
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
    mapReseller.init();
});