(function ($) {
    $.fn.ipCollection = function (options) {
        var obj = $(this);
        var s = this;
        var defaults = {
            addText: '<i class="fa fa-plus" aria-hidden="true"></i>',
            removeText: '<i class="fa fa-minus" aria-hidden="true"></i>',
            remaining: null
        };

        var settings = $.extend({}, defaults, options);

        var $collectionHolder;
        var $html;
        var $addElementLink = $('<a href="javascript:;" class="btn btn-xs btn-success mb10">' + settings.addText + '</a>');
        var $newElementContainer = $('<div class="mt20"></div>').append($addElementLink);
        var $collectionError = $('<div id="collection-error"></div>');
        var remaining;
        var $totalPriceContainer = $('#total-price');

        function init() {
            if (obj.length > 0) {
                obj.each(function () {
                    remaining = settings.remaining - 1;

                    $html = obj.html();
                    $collectionHolder = obj;
                    $collectionHolder.after($newElementContainer);

                    $addElementLink.on('click', function (e) {
                        e.preventDefault();
                        addElementForm($collectionHolder);
                    });

                    getTotalPrice();
                    onChangeSelect();
                });
            }
        }

        function addElementForm($collectionHolder) {
            var canAdd = true;
            if (remaining !== null && remaining == 0) {
                canAdd = false;
            }

            if (canAdd) {
                var $newElement = $('<div class="col-md-12"></div>').append($html);
                var $newRow = $('<div class="row"></div>').append($newElement);

                $collectionHolder.prepend($newRow);

                $newRow.find('input').val('');
                $newRow.find('select option:selected').removeAttr('selected');

                addElementFormDeleteLink($newRow);

                getTotalPrice();
                onChangeSelect();
                remaining--;
            } else {
                flashBag($collectionError, ['Pas assez de place disponible'], 'danger', true);
                $addElementLink.after($collectionError);
            }
        }

        function addElementFormDeleteLink($elementFormContainer) {
            var $removeElement = $('<a href="javascript:;" class="btn btn-xs btn-danger pull-right">' + settings.removeText + '</a>');
            var $removeElementContainer = $('<div class="col-md-12 mb20"></div>').append($removeElement);

            $elementFormContainer.append($removeElementContainer);

            $removeElement.on('click', function (e) {
                e.preventDefault();
                $elementFormContainer.remove();

                if (remaining !== null) {
                    remaining++;
                    $collectionError.html('');
                }

                getTotalPrice();
            });
        }

        function onChangeSelect() {
            obj.find('select').change(function () {
                getTotalPrice();
            });
        }

        function getTotalPrice() {
            var totalPrice = $totalPriceContainer.data('productprice');
            totalPrice = totalPrice * obj.find('.collection').length;

            obj.find('select option:selected').each(function () {
                if (typeof $(this).data('impactprice') !== "undefined") {
                    totalPrice += $(this).data('impactprice');
                }
            });

            $totalPriceContainer.html(getFormatMoney(totalPrice));
        }

        function getFormatMoney(price) {
            price = parseFloat(price);
            return price.formatMoney(2, ',') + " €";
        }

        return init();
    };
})
(jQuery);