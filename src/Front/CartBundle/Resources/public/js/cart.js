const Cart = function () {

    const $cart = $('#cart');
    const $touchspin = $cart.find('.touchspin');
    const $deleteCartElement = $cart.find('.delete-cart-element');

    const $promotionCode = $cart.find('#val_promotion_code');
    const $btnPromotionCode = $cart.find('.btn-add-promotion-code');
    const $promotionCodeMessage = $cart.find('#promotion-code-message');
    const $deletePromotion = $cart.find('.delete-promotion');

    const uiInit = function () {
        initTouchspin();
        test();

        removeCartElement();
        onClickPromotionCode();
        removePromotion();
    }

    const initTouchspin = function () {
        $touchspin.TouchSpin({
            min: 1,
            max: 100,
            verticalbuttons: true,
            verticalupclass: 'fa fa-chevron-up',
            verticaldownclass: 'fa fa-chevron-down'
        });

        onChangeQuantity();
    }

    const test = function () {

        var priceArticle = $('#cart-total-elements');
        console.log(priceArticle);
        priceArticle= priceArticle.data('price');

        priceArticle= parseFloat(priceArticle);


        var shippedPrice = $('#cart-total-shipping');
        shippedPrice= shippedPrice.data('shipping');
        shippedPrice = parseFloat(shippedPrice);
        // console.log(shippedPrice);

        var tva = $('#cart-total-tva');
        tva =tva.data('tva');
        tva= parseFloat(tva);
        console.log(tva)



        var calcul = shippedPrice + tva + priceArticle ;
        console.log(calcul);

        $('#cart-total').html(AppGlobal.formatPrice(calcul))




    }

    const onChangeQuantity = function () {
        $touchspin.change(function () {
            updateQuantity($(this).data('id'), $(this).val());
        });
    }

    const updateQuantity = function (id, quantity) {
        $.ajax({
            url: Routing.generate('front_cart_element_quantity_update'),
            type: 'POST',
            dataType: "json",
            data: {'id': id, quantity: quantity},
            success: function (data) {
                console.log(data);
                updatePrice(data.carrierCart)
            },
            error: function (xhr) {
                console.log(xhr.responseText);
            }
        });
    }

    const removeCartElement = function () {
        $deleteCartElement.click(function () {
            const id = $(this).data('id');
            const btn = $(this);

            AppGlobal.spinnerButton(btn);

            $.ajax({
                url: Routing.generate('front_cart_element_delete'),
                type: 'POST',
                dataType: "json",
                data: {'id': id},
                success: function (data) {
                    console.log(data);


                    AppGlobal.spinnerButton(btn);
                    btn.closest('li').remove();

                    if ($('ul#cart-elements-container li').length > 0) {
                        // updatePrice(0);
                        updatePrice(data.carrierCart)

                    } else {
                        let html = '<div class="col-md-12">';
                        html += '<p>Il n\'y a aucun article dans votre panier</p>';
                        html += '</div>';

                        $cart.html(html);
                    }
                },
                error: function (xhr) {
                    console.log(xhr.responseText);
                }
            });
        });
    }

    const updatePrice = function (carrierCart) {
        const container = $('#cart-elements-container');
        const cartNbElementContainer = $('#cart-nb-elements');
        const cartTotalElementContainer = $('#cart-total-elements');
        const cartTotalShippingContainer = $('#cart-total-shipping');
        const cartTotalTvaContainer = $('#cart-total-tva');
        const cartTotalContainer = $('#cart-total');

        let nbElements = 0;
        let totalElements = 0;
        let totalShipping = carrierCart;
        let totalTva = 0;

        $(container.find('li')).each(function (index, value) {
            const cartElementPriceContainer = $(this).find('.cart-element-price')
            const elementPriceUnit = cartElementPriceContainer.data('elementpriceunitht');
            console.log(cartElementPriceContainer.data('elementpriceunitht'));
            const elementTva = cartElementPriceContainer.data('elementtva');
            const elementQuantity = $(this).find('.touchspin').val();

            const totalElement = elementPriceUnit * elementQuantity;

            totalTva += elementTva * elementQuantity;
            totalElements += totalElement;

            cartElementPriceContainer.data('elementprice', totalElement);
            cartElementPriceContainer.html(AppGlobal.formatPrice(totalElement));

            nbElements += parseInt(elementQuantity);
        });

        cartNbElementContainer.html(nbElements);
        cartTotalElementContainer.html(AppGlobal.formatPrice(totalElements));
        cartTotalShippingContainer.html(AppGlobal.formatPrice(totalShipping));
        cartTotalTvaContainer.html(AppGlobal.formatPrice(totalTva));

        const total = totalElements + totalShipping + totalTva;
        cartTotalContainer.html(AppGlobal.formatPrice(total));
    }

    const onClickPromotionCode = function () {
        $btnPromotionCode.click(function () {

            if ($promotionCode.val().length > 0) {

                const btn = $(this);
                AppGlobal.spinnerButton(btn);

                $.ajax({
                    url: Routing.generate('front_cart_promotion_code_add'),
                    type: 'POST',
                    dataType: "json",
                    data: {'promotionCode': $promotionCode.val()},
                    success: function (data) {
                        //console.log(data);

                        if (data.success) {
                            $promotionCodeMessage.html(data.success);
                            $promotionCodeMessage.removeClass('text-danger').addClass('text-success');
                            location.reload(true);
                            console.log('test')

                        } else {
                            $promotionCodeMessage.html(data.error);
                            $promotionCodeMessage.removeClass('text-success').addClass('text-danger');
                        }

                        $promotionCode.val('');
                        AppGlobal.spinnerButton(btn);
                    },
                    error: function (xhr) {
                        console.log(xhr.responseText);
                    }
                });
            }
        });
    }

    const removePromotion = function () {
        $deletePromotion.click(function () {
            const type = $(this).data('type');
            const id = $(this).data('id');
            const btn = $(this);

            AppGlobal.spinnerButton(btn);

            $.ajax({
                url: Routing.generate('front_cart_promotion_code_delete'),
                type: 'POST',
                dataType: "json",
                data: {
                    'type': type,
                    'id': id
                },
                success: function (data) {
                    //console.log(data);

                    AppGlobal.spinnerButton(btn);
                    btn.closest('div.row').remove();
                },
                error: function (xhr) {
                    console.log(xhr.responseText);
                }
            });
        });
    }

    return {
        init: function () {
            uiInit();
        }
    };
}();

$(function () {
    Cart.init();
});