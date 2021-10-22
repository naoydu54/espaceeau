var Order = function () {

    var dialog = null;

    var uiInit = function () {
        initCollapse();
        onClickChangeBillingAddress();
        onClickChangeDeliveryAddress();
    };

    var initCollapse = function () {
        $(".collapse").on('show.bs.collapse', function () {
            var i = $("[data-toggle='collapse']").find('i');

            if (i.length > 0) {
                i.removeClass('fa-chevron-down').addClass('fa-chevron-up');
            }
        });

        $(".collapse").on('hide.bs.collapse', function () {
            var i = $("[data-toggle='collapse']").find('i');
            if (i.length > 0) {
                i.removeClass('fa-chevron-up').addClass('fa-chevron-down');
            }
        });
    };

    var onClickChangeBillingAddress = function () {
        $(".btn-edit-billing").click(function () {
            var btn = $(this);
            AppGlobal.spinnerButton(btn);
            getAddresseList(btn, 'billing');
        });
    };

    var onClickChangeDeliveryAddress = function () {
        $(".btn-edit-delivery").click(function () {
            var btn = $(this);
            AppGlobal.spinnerButton(btn);
            getAddresseList(btn, 'delivery');
        });
    };

    var getAddresseList = function (btn, type) {
        $.ajax({
            url: Routing.generate('front_order_address_list'),
            type: 'POST',
            success: function (data) {
                console.log(data);

                AppGlobal.spinnerButton(btn);

                if (data.length > 0) {

                    var html = '<div class="row">' +
                        '<div class="col-md-12">';


                    $(data).each(function (index, value) {
                        html +=


                            '<div class="row">' +
                                '<div class="well" id="adress">' +
                                    '<div class="col-md-10">' +
                                        '<ul>' +
                                            '<li>' + value.civility + '</li>' +
                                            '<li>' + value.address + '</li>' +
                                            '<li>' + value.city + '</li>' +
                                            '<li>' + value.country + '</li>' +
                                        '</ul>' +
                                    '</div>' +
                                    '<div class="col-md-2">' +
                                        '<a href="javascript:;" class="btn btn-primary btn-choice-address" data-id="' + value.id + '" data-type="' + type + '"><i class="fa fa-check"></i> Choisir</a>' +
                                    '</div>' +
                                '</div>'
                        ;
                    });

                    html+= '<a style="margin-left: 5%" href="'+ Routing.generate('front_user_address_add') +'" class="btn btn-primary"><i class="fa fa-plus" aria-hidden="true"></i> Ajouter une adresse</a>';

                    html += '</div></div>';

                    dialog = BootstrapDialog.show({
                        type: BootstrapDialog.TYPE_DEFAULT,
                        title: 'Mes adresses',
                        message: html,
                        buttons: [{
                            label: 'Annuler',
                            icon: 'fa fa-undo',
                            cssClass: 'btn-default',
                            id: 'btn-cancel',
                            action: function (dialogItself) {
                                dialogItself.close();
                            }
                        }],
                        onshown: function () {
                            onClickChoiceAddress();
                        }
                    });
                }
            },
            error: function (jqXHR) {
                console.log(jqXHR.responseText);
            }
        });
    };

    var onClickChoiceAddress = function () {
        $(".btn-choice-address").click(function () {
            var btn = $(this);
            AppGlobal.spinnerButton(btn);
            AppGlobal.spinnerButton($('#btn-cancel'));
            changeAddress(btn, btn.data('id'), btn.data('type'));
        });
    };

    var changeAddress = function (btn, id, type) {
        $.ajax({
            url: Routing.generate('front_order_address_change'),
            type: 'POST',
            dataType: "json",
            data: {'id': id, 'type': type},
            success: function (data) {
                //console.log(data);

                AppGlobal.spinnerButton(btn);
                AppGlobal.spinnerButton($('#btn-cancel'));
                dialog.close();

                if (data.success) {
                    if (type == 'billing') {
                        $('#billing_address').html(getAddressHtml(data.address));
                    } else {
                        $('#delivery_address').html(getAddressHtml(data.address));
                    }
                }
            },
            error: function (xhr) {
                console.log(xhr.responseText);
            }
        });
    };

    var getAddressHtml = function (address) {
        var html =
            '<li>' + address.civility + ' ' + address.firstname + ' ' + address.lastname + '</li>' +
            '<li>' + address.address + '</li>' +
            '<li>' + address.postalCode + ' ' + address.city + '</li>' +
            '<li>' + address.country + '</li>';

        return html;
    };

    return {
        init: function () {
            uiInit();
        }
    };
}();

$(function () {
    Order.init();
});