var productFilterV = function () {
    // Config
    var enableBrand = true;

    // Container
    var filterContainer = $('#filter-container');
    var productContainer = $('#product-container');

    // Range
    var arrayIonRange = [];

    var uiInit = function () {
        getFiltre();
        owlCarrousselSubItem()
    };

    var owlCarrousselSubItem = function () {
        $(".owl-carouselSubItem").owlCarousel({
            items:4,
            nav:true,
            dots: false,
            margin: 40,

            navText: [
                "<i class=\"fa fa-chevron-circle-left\" aria-hidden=\"true\"></i>\n",
                "<i class=\"fa fa-chevron-circle-right\" aria-hidden=\"true\"></i>\n"
            ],

        });
    }

    var addLoader = function () {
        return '<div class="col-md-12 text-center mt-20"><i class="fa fa-spinner fa-spin fa-3x fa-fw"></i><span class="sr-only">Chargement...</span></div>';
    };

    var initSelect2 = function () {
        $('.select2').select2({
            placeholder: "Sélectionner..",
            width: '100%'
        });
    };

    var initRangeSlider = function (elm, min, max) {
        $("#" + elm).ionRangeSlider({
            type: 'double',
            min: min,
            max: max,
            prefix: '',
            onStart: function (data) {
                saveRangeSlider(data);
            },
            onChange: saveRangeSlider,
            onFinish: saveRangeSlider
        });
    };

    var saveRangeSlider = function (data) {
        var element = data.input[0].id.replace('range_', '');
        $('#val_filtrerange_' + element + '_min').val(data.from);
        $('#val_filtrerange_' + element + '_max').val(data.to);
    };

    var initCheckboxColor = function () {
        $('.checkbox-color').ipCheckbox();
    };

    var addSelect = function (id, label, array) {
        var html = '<div class="mt10 mb10">';
        html += '<label for="val_filtre_' + id + '">' + label + '</label>';
        html += '<select class="form-control select2" name="val_filtreselect_' + id + '[]" id="val_filtre_' + id + '" multiple="multiple">';

        $.each(array, function (key, value) {
            html += '<option value="' + value.id + '">' + value.name + '</option>';
        });

        html += '</select>';
        html += '</div>';

        return html;
    };

    var addRange = function (value) {
        var idRange = 'range_' + value.filter.name.toLowerCase().replace(/\s/g, '');
        var idValFiltre = 'val_filtrerange_' + value.filter.name.toLowerCase().replace(/\s/g, '') + '_filtre';
        var idValFiltreMin = 'val_filtrerange_' + value.filter.name.toLowerCase().replace(/\s/g, '') + '_min';
        var idValFiltreMax = 'val_filtrerange_' + value.filter.name.toLowerCase().replace(/\s/g, '') + '_max';

        var html = '<div class="mt10 mb10">';
        html += '<label for="' + idValFiltreMin + '">' + value.filter.name + '</label>';
        html += '<div id="' + idRange + '"></div>';
        html += '<input type="hidden" value="' + value.filter.id + '" name="' + idValFiltre + '" id="' + idValFiltre + '">';
        html += '<input type="hidden" value="' + value.featureElementValues.min + '" name="' + idValFiltreMin + '" id="' + idValFiltreMin + '">';
        html += '<input type="hidden" value="' + value.featureElementValues.max + '" name="' + idValFiltreMax + '" id="' + idValFiltreMax + '">';
        html += '</div>';

        arrayIonRange.push({
            'name': idRange,
            'min': value.featureElementValues.min,
            'max': value.featureElementValues.max
        });

        return html;
    };

    var addCheckbox = function (filtreId, filtreLabel, array, isColor) {
        var html = '<div class="mt10 mb10">';
        html += '<label for="val_filtre_checkbox">' + filtreLabel + '</label>';
        html += '<ul class="nostyle">';

        $.each(array, function (key, value) {
            var dataColor = '';
            if (isColor) {
                dataColor = 'data-color="' + value.color;
            }

            html += '<li>';
            html += '<div class="checkbox-color checkbox" ' + dataColor + '">';
            html += '<input type="checkbox" id="val_filtre_checkbox_' + value.id + '" name="val_filtreselect_' + filtreId + '[]" value="' + value.id + '">';
            html += '<label for="val_filtre_checkbox_' + value.id + '"> ' + value.name + ' </label>';
            html += '</li>';
        });

        html += '</ul>';
        html += '</div>';
        html += '</div>';

        return html;
    };

    var getFiltre = function () {
        filterContainer.html(addLoader);

        $.ajax({
            url: Routing.generate('front_site_product_filter_get'),
            type: 'POST',
            data: {'idMenu': filterContainer.data('id')},
            success: function (data) {
                console.log(data);

                if (data.filters) {
                    var html = '<form id="form-filter" method="POST" action="" class="" onsubmit="return false;">';
                    html += '<input type="hidden" id="val_menu" name="val_menu" value="' + filterContainer.data('id') + '">';

                    // Marques
                    if (enableBrand) {
                        html += addSelect('brand', 'Marque', data.brands);
                    }

                    // Prix
                    var fromLoad = data.price.min;
                    var toLoad = data.price.max;

                    html += '<div>';
                    html += '<label for="val_prix">Prix</label>';
                    html += '<div id="range_prix"></div>';
                    html += '<input type="hidden" value="prix" name="val_filtrerange_prix_filtre" id="val_filtrerange_prix_filtre">';
                    html += '<input type="hidden" value="' + fromLoad + '" name="val_filtrerange_prix_min" id="val_filtrerange_prix_min">';
                    html += '<input type="hidden" value="' + toLoad + '" name="val_filtrerange_prix_max" id="val_filtrerange_prix_max">';
                    html += '</div>';

                    arrayIonRange.push({
                        'name': 'range_prix',
                        'min': fromLoad,
                        'max': toLoad
                    });

                    // Filtres
                    $.each(data.filters, function (key, value) {
                        switch (value.filter.type) {
                            case 'range':
                                html += addRange(value);
                                break;
                            case 'case_a_cocher':
                                html += addCheckbox(value.filter.id, value.filter.name, value.featureElementValues, false);
                                break;
                            case 'couleur':
                                html += addCheckbox(value.filter.id, value.filter.name, value.featureElementValues, true);
                                break;
                            default:
                                html += addSelect(value.filter.id, value.filter.name, value.featureElementValues);
                                break;
                        }
                    });

                    // Tri
                    html += '<div class="mt10 mb10">';
                    html += '<label for="val_order" class="">Trier par</label>';
                    html += '<select class="form-control" name="val_order" id="val_order">';
                    html += '<option value="price_asc">Prix croissant</option>';
                    html += '<option value="price_desc">Prix décroissant</option>';
                    html += '</select>'
                    html += '</div>';

                    // Button
                    html += '<div class="mt10 mb10">';
                    html += '<button type="submit" class="btn btn-primary pull-right" id="btn-send-filter"><i class="fa fa-tasks"></i> Filtrer</button>';
                    html += '</div>';

                    // Html end
                    html += '</form>';

                    filterContainer.html(html);

                    // Add ionRange
                    $.each(arrayIonRange, function (key, value) {
                        initRangeSlider(value.name, value.min, value.max);
                    });

                    initSelect2();
                    initCheckboxColor();
                    sendFiltre();

                    $('.btn-more-criteria').attr('disabled', false);
                } else {
                    var nextElement = filterContainer.parent().next();
                    var currentClass = nextElement.attr('class');
                    nextElement.removeClass(currentClass).addClass('col-md-12');
                    filterContainer.parent().remove();
                }
            },
            error: function (jqXHR) {
                console.log(jqXHR.responseText);
            }
        });
    };

    var sendFiltre = function () {
        $('#btn-send-filter').click(function () {
            var btn = $(this);

            var $form = $("#form-filter");
            var data = $form.serialize();

            AppGlobal.spinnerButton(btn);

            if (data.length > 0) {
                $.ajax({
                    url: Routing.generate('front_site_product_filter_send'),
                    type: 'POST',
                    dataType: "html",
                    data: data,
                    success: function (data) {
                        //console.log(data);

                        AppGlobal.spinnerButton(btn);
                        productContainer.html(data);
                    },
                    error: function (jqXHR) {
                        console.log(jqXHR.responseText);
                    }
                });

            } else {
                spinnerButton(btn);
            }
        });
    };

    return {
        init: function () {
            uiInit();
        }
    };
}();

$(function () {
    productFilterV.init();
});