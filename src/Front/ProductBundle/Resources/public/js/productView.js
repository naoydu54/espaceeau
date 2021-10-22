const ProductView = function () {

    var productCombinationContainer = $('#product-combination-container');
    var quantityContainer = $('#quantity-container');
    var btnAddCart = $('#add-product-cart');
    var basePrice = parseFloat($('#product-price').data('baseprice'));
    var $formAddCart = $('#form_add_cart');
    var $productImage = $('#product-image');
    var haveColor = false;
    var productAvailable = $('#addAvailable');

    const uiInit = function () {
        initOwlCarousel();
        initTouchspin();
        loadProductCombination();
        preventProductAvailable();
        productAttributAvailable();
    }

    var addLoader = function () {
        return '<div class="col-md-12 text-center mt-20"><i class="fa fa-spinner fa-spin fa-3x fa-fw"></i><span class="sr-only">Chargement...</span></div>';
    };

    var initTouchspin = function () {
        $('.touchspin').TouchSpin({
            min: 1,
            max: 100,
            initval: 1,
            verticalbuttons: true,
            verticalupclass: 'fa fa-chevron-up',
            verticaldownclass: 'fa fa-chevron-down'
        });
    };

    var initQuantity = function () {
        var html = '';
        html += '<div class="form-group">'
        html += '<label for="val_product_qty" class="col-md-3 control-label">Quantité</label>'
        html += '<div class="col-md-9">'
        html += '<input type="text" class="form-control touchspin" value="1" id="val_product_qty" name="val_product_qty">'
        html += '</div>'
        html += '</div>';

        quantityContainer.html(html);

        initTouchspin();
    };

    const initOwlCarousel = function () {
        var imgZoom = $('.zoom  img');
        const $owlProduct = $('.owl-product');

        imgZoom.wrap('<span style="display:inline-block"></span>')
            .css('display', 'block')
            .parent()
            .zoom();


        $owlProduct.owlCarousel({
            loop: true,
            responsive: {
                0: {
                    items: 1
                }
            }
        });

        $owlProduct.owlThumbs();
    }

    var loadProductCombination = function () {

        $productImage.html(addLoader());
        productCombinationContainer.html(addLoader());

        $.ajax({
            url: Routing.generate('front_site_product_attribut_list_ajax', {'product': productCombinationContainer.data('id')}),
            type: 'POST',
            success: function (data) {

                productCombinationContainer.html('');
                initQuantity();

                if (!$.isEmptyObject(data.attributProducts)) {
                    $.each(data.attributProducts, function (index, attribut) {



                        var html = '';
                        html += '<div class="form-group">';
                        html += '<label for="val_attribut_' + attribut.id + '" class="col-md-3 control-label">' + attribut.name + '</label>';
                        html += '<div class="col-md-9">';
                        html += '<select id="val_attribut_' + attribut.id + '"  name="val_attribut_' + attribut.id + '" class="form-control">';

                        $.each(attribut.attributProducts, function (key, attributProduct) {
                            html += '<option value="' + attributProduct.id + '" data-attribut="' + attributProduct.attribut + '"  data-reference="' + attributProduct.reference + '"  data-prevent-available="' + attributProduct.preventAvailableProduct + '" data-user="' + attributProduct.user + '" data-available="' + attributProduct.available + '" data-impactpricettc="' + attributProduct.impactPriceTtc + '" ' + ((attributProduct.isPriceMini) ? 'selected="selected"' : '') + ' > ' + attributProduct.name + ' </option>';
                        });

                        html += '</select>';
                        html += '</div>';
                        html += '</div>';

                        productCombinationContainer.append(html);

                        imageProduct($("#val_attribut_" + attribut.id).val(), attribut.attributProducts);

                        $("#val_attribut_" + attribut.id).change(function () {



                            var reference = null
                            $.each($('#product-combination-container select'), function (index, value) {
                                console.log($(this).find(':selected').data('reference'))
                                reference = $(this).find(':selected').data('reference');
                            });

                            $('#ref').html(reference);


                            imageProduct($(this).val(), attribut.attributProducts);
                            calculTotalPrice();
                            productAttributAvailable();
                        });
                    });

                    if (!haveColor) {
                        $productImage.html(data.productFiles);
                    }

                    //imageProduct($('#val_attribut_1').val(), attribut.attributProducts);
                    calculTotalPrice();
                    productAttributAvailable();
                } else {
                    $productImage.html(data.productFiles);
                    initOwlCarousel();
                }

                addProductCart();
                btnAddCart.removeClass('disabled');
                btnAddCart.removeAttr('disabled');
            },
            error: function (xhr) {
                console.log(xhr.responseText);
            }
        });
    };


    const imageProduct = function (attributValue, attributProducts) {
        var valueSelected = null;

        $.each(attributProducts, function (key, attributProduct) {
            if (attributProduct.id == attributValue) {
                valueSelected = attributProduct;
            }
        });

        if (valueSelected.color !== null) {
            $productImage.html(valueSelected.images);


            initOwlCarousel();
            haveColor = true;
        } else {
            initOwlCarousel();
        }
    }


    var productAttributAvailable = function () {
        var addProductCart = $('#add-product-cart');
        var addAvailable = btnAddCart;
        var available;
        var user;
        var attribut;
        var preventAvailable;

        if (sessionStorage) {
            var color = sessionStorage.getItem('colorId')
            $('select option[value="' + color + '"]').attr("selected", true);


        }
        if ($('#product-combination-container select').length > 0) {
            $.each($('#product-combination-container select'), function (index, value) {
                available = $(this).find(':selected').data('available');
                user = $(this).find(':selected').data('user');
                attribut = $(this).find(':selected').data('attribut');
                preventAvailable = $(this).find(':selected').data('prevent-available');

                $('#product-combination-container select').change(function () {
                    sessionStorage.setItem('colorId', $(this).children("option:selected").val())
                })





            });

            if (preventAvailable !== false) {
                addProductCart.html('Vous serez informé de la disponibilité par mail');
                addProductCart.attr('disabled', 'disabled');
                addProductCart.addClass('disabled');

            } else {
                if (available === false) {

                    if (preventAvailable !== false) {
                        addProductCart.html('Vous serez informé de la disponibilité par mail');
                        addProductCart.attr('disabled', 'disabled');
                        addProductCart.addClass('disabled');

                    }

                    $('#noAvailableAttribut').html('<h3  style="color: red">Produit non disponible</h3>');
                    addProductCart.html('M’avertir de la disponibilité');
                    if (user === null) {

                        addProductCart.attr('href', Routing.generate('front_fos_user_security_login'));
                        addProductCart.addClass('notLogged');
                        addProductCart.html('Afin de vous tenir informé(e) de la disponibilité de ce produit, <br> merci de vous identifier ou de vous inscrire ')
                    }
                    addProductCart.attr('data-user', user);

                    addProductCart.prop('id', 'addAvailableAttribut');
                    $('#addAvailableAttribut').click(function (e) {
                        if (!addProductCart.hasClass('notLogged')) {
                            var btn = $(this);
                            AppGlobal.spinnerButton(btn);

                            var data = $formAddCart.serialize();


                            if ($('#addAvailableAttribut').attr('disabled') != "disabled") {
                                $.ajax({
                                    url: Routing.generate('front_site_product_available_prevent_available', {'product': btn.data('id'), 'attribut': attribut}),
                                    type: 'POST',
                                    data: data,
                                    dataType: "json",
                                    success: function (data) {

                                        btn.attr('disabled', 'disabled');

                                        AppGlobal.spinnerButton(btn);
                                        $("<div id =\"message-green\" class=\"alert alert-success alert-dismissible \" role=\"alert\">Vous serez informé par mail de la disponibilité du produit</div>").insertAfter("#noAvailableAttribut");
                                        $("#message-green").delay(5000).fadeOut("slow");
                                        $("#addAvailableAttribut").html("Vous serez informé de la disponibilité par mail");

                                        $('#product-combination-container select').find(':selected').data('prevent-available', 1);


                                    },
                                    error: function (xhr) {
                                        console.log(xhr.responseText);
                                    }
                                })
                            }
                        } else {
                            window.location.href = Routing.generate('front_fos_user_security_login');

                        }


                    })


                } else {
                    addAvailable.html('<i class="fa fa-cart-plus"></i> Ajouter au panier');
                    addAvailable.prop('id', 'add-product-cart');
                    addAvailable.removeAttr('disabled');
                    addAvailable.removeClass('disabled');
                    $('#product-combination-container select').find(':selected').data('prevent-available', false);
                    $('#noAvailableAttribut').html(' ');


                }
            }


        }


    }


    var calculTotalPrice = function () {
        var totalPrice = basePrice;

        $.each($('#product-combination-container select'), function (index, value) {
            totalPrice += parseFloat($(this).find(':selected').data('impactpricettc'));
        });

        $('#product-price').html(AppGlobal.formatPrice(totalPrice));
    };

    var preventProductAvailable = function () {
        productAvailable.click(function () {

            var btn = $(this);
            AppGlobal.spinnerButton(btn);

            var data = $formAddCart.serialize();


            if (productAvailable.attr('disabled') != "disabled") {
                $.ajax({
                    url: Routing.generate('front_site_product_prevent_available', {'product': btn.data('id')}),
                    type: 'POST',
                    data: data,
                    dataType: "json",
                    success: function (data) {

                        btn.attr('disabled', 'disabled');

                        AppGlobal.spinnerButton(btn);
                        $("<div id =\"message-green\" class=\"alert alert-success alert-dismissible \" role=\"alert\">Vous serez informé par mail de la disponibilité du produit</div>").insertAfter("#noAvailable");
                        $("#message-green").delay(5000).fadeOut("slow");
                        $("a#addAvailable.btn.btn-primary").text("Vous serez informé de la disponibilité par mail");


                    },
                    error: function (xhr) {
                        console.log(xhr.responseText);
                    }
                })
            }

        })
    }


    var addProductCart = function () {
        btnAddCart.click(function (e) {

            if ($('#addAvailableAttribut').length !== 0) {
                e.preventDefault();
                return false;
            }

            var btn = $(this);
            AppGlobal.spinnerButton(btn);

            var data = $formAddCart.serialize();

            $.ajax({
                url: Routing.generate('front_cart_product_add', {'product': btn.data('id')}),
                type: 'POST',
                data: data,
                dataType: "json",
                success: function (data) {

                    AppGlobal.spinnerButton(btn);

                    if (data.success) {

                        var html = '';
                        html += '<div class="row">';
                        html += '<div class="col-md-4">';
                        html += '<img src="' + data.success.image + '" alt="' + data.success.image + '">';
                        html += '</div>';
                        html += '<div class="col-md-8">';
                        html += '<p><strong>' + data.success.name + '</strong></p>';

                        if (data.success.attributProducts.length > 0) {
                            html += '<p>';

                            var total = data.success.attributProducts.length;

                            $.each(data.success.attributProducts, function (index, value) {
                                html += value.attributName + ': ' + value.attributValueName;

                                if (index !== total - 1) {
                                    html += ', ';
                                }
                            });

                            html += '</p>';
                        }

                        html += '<p>' + AppGlobal.formatPrice(data.success.totalPriceTtc) + '</p>';
                        html += '<p>' + data.success.quantity + '</p>';
                        html += '</div>';
                        html += '</div>';

                        BootstrapDialog.show({
                            type: BootstrapDialog.TYPE_SUCCESS,
                            title: data.success.message,
                            message: html,
                            buttons: [{
                                label: data.success.btnStay,
                                icon: 'fa fa-times',
                                cssClass: 'btn-default',
                                action: function (dialogItself) {
                                    dialogItself.close();
                                }
                            }, {
                                label: data.success.btnCart,
                                icon: 'fa fa-shopping-cart',
                                cssClass: 'btn-primary',
                                action: function (dialogItself) {
                                    window.location = Routing.generate('front_cart_index');
                                }
                            }]
                        });
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
    }
}();

$(function () {
    ProductView.init();
});