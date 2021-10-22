var AddressList = function () {

    var uiInit = function () {
        onChangeBillingAddress();
        onChangeDeliveryAddress();
        deleteAddress();
    };

    var onChangeBillingAddress = function () {
        $("input[name='billing_address']").change(function () {
            $.ajax({
                url: Routing.generate('front_user_address_edit_default', {'address': $(this).val()}),
                type: 'POST',
                data: {'type': 'billing_address'},
                success: function (data) {
                    //console.log(data);

                    var c = $('#default_billing_address');
                    c.empty();
                    c.html(getAddressHtml(data.address));
                },
                error: function (jqXHR) {
                    console.log(jqXHR.responseText);
                }
            });
        });
    };

    var onChangeDeliveryAddress = function () {
        $("input[name='delivery_address']").change(function () {
            $.ajax({
                url: Routing.generate('front_user_address_edit_default', {'address': $(this).val()}),
                type: 'POST',
                data: {'type': 'delivery_address'},
                success: function (data) {
                    //console.log(data);

                    var c = $('#default_delivery_address');
                    c.empty();
                    c.html(getAddressHtml(data.address));
                },
                error: function (jqXHR) {
                    console.log(jqXHR.responseText);
                }
            });
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

    var deleteAddress = function () {
        $(".delete-address").click(function () {
            var id = $(this).data('id');
            BootstrapDialog.show({
                type: BootstrapDialog.TYPE_DANGER,
                title: 'Supprimer une adresse',
                message: 'Voulez-vous vraiment supprimer cette adresse ?',
                buttons: [{
                    label: 'Supprimer',
                    icon: 'fa fa-times',
                    cssClass: 'btn-danger',
                    action: function (dialogItself) {

                        var btn = $(this);
                        btn.children().removeClass('fa-check').addClass('fa-spinner fa-spin');
                        btn.prop("disabled", true);
                        $('#btn-cancel').prop("disabled", true);

                        $.ajax({
                            url: Routing.generate('front_user_address_delete', {'address': id}),
                            type: 'POST',
                            success: function (data) {
                                console.log(data);

                                btn.children().removeClass('fa-spinner fa-spin').addClass('fa-floppy-o');
                                btn.prop("disabled", false);
                                $('#btn-cancel').prop("disabled", false);

                                dialogItself.close();

                                if (data.error) {
                                    $('.messages-container').ipFlashbag({
                                        message: data.error,
                                        className: 'danger',
                                        autoHide: false
                                    });

                                } else if (data.success) {
                                    //flashBag($('.messages-container'), data.success, 'success', true);
                                    window.location.href = Routing.generate('front_user_address_index');
                                }
                            },
                            error: function (jqXHR) {
                                console.log(jqXHR.responseText);
                            }
                        });
                    }
                }, {
                    label: 'Annuler',
                    icon: 'fa fa-undo',
                    cssClass: 'btn-default',
                    id: 'btn-cancel',
                    action: function (dialogItself) {
                        dialogItself.close();
                    }
                }]
            });
        });
    };

    return {
        init: function () {
            uiInit();
        }
    };
}();

$(document).ready(function () {
    AddressList.init();
});