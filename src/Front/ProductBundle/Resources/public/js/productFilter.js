var filtres = function () {

    // Config
    var title = 'TITLE';
    var enableBrand = true;

    // Container
    var globalFilterContainer = $('#global-filtre-container');
    var filterContainer = $('#filter-container');
    var productContainer = $('#product-container');
    var btnMoreCriteria = $('.btn-more-criteria');

    // Range
    var arrayIonRange = [];

    var uiInit = function () {
        getFiltre();
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

    var addSelect = function (filtreId, filtreLabel, array, last, row) {
        var html = '';

        if (row) {
            html += '<div class="row">';
        }

        html +=
            '<div class="col-md-6">' +
            '<label for="nom" class="">' + filtreLabel + '</label>' +
            '<select class="form-control select2" name="val_filtreselect_' + filtreId + '[]" id="val_filtre_' + filtreId + '" multiple="multiple">';

        $.each(array, function (key, value) {
            html += '<option value="' + value.id + '">' + value.name + '</option>';
        });

        html +=
            '</select>' +
            '</div>';

        if (!row || last) {
            html += '</div>';
        }

        return html;
    };

    var addCheckbox = function (filtreId, filtreLabel, array, last, row) {
        var html = '';

        if (row) {
            html += '<div class="row">';
        }

        html += '<div class="col-md-6">';
        html += '<label for="nom" class="">' + filtreLabel + '</label>';
        html += '<div>';

        $.each(array, function (key, value) {
            /*html += '<label class="checkbox-inline">';
            html += '<input type="checkbox" id="val_filtre_checkbox_' + value.id + '" name="val_filtreselect_' + filtreId + '[]" value="' + value.id + '"><span>' + value.name + '</span>';
            html += '</label>';*/

            html += '<div class="checkbox-color checkbox-inline">';
            html += '<input type="checkbox" id="val_filtre_checkbox_' + value.id + '" name="val_filtreselect_' + filtreId + '[]" value="' + value.id + '">';
            html += '<label for="val_filtre_checkbox_' + value.id + '"> ' + value.name + ' </label>';
            html += '</div>';
        });

        html += '</div>';
        html += '</div>';

        if (!row || last) {
            html += '</div>';
        }

        return html;
    };

    var addRange = function (value, last, row) {
        var html = '';
        var idRange = 'range_' + value.filter.name.toLowerCase().replace(/\s/g, '');
        var idValFiltre = 'val_filtrerange_' + value.filter.name.toLowerCase().replace(/\s/g, '') + '_filtre';
        var idValFiltreMin = 'val_filtrerange_' + value.filter.name.toLowerCase().replace(/\s/g, '') + '_min';
        var idValFiltreMax = 'val_filtrerange_' + value.filter.name.toLowerCase().replace(/\s/g, '') + '_max';

        if (row) {
            html += '<div class="row">';
        }

        html +=
            '<div class="col-md-6">' +
            '<label for="' + idValFiltreMin + '">' + value.filter.name + '</label>' +
            '<div id="' + idRange + '"></div>' +
            '<input type="hidden" value="' + value.filter.id + '" name="' + idValFiltre + '" id="' + idValFiltre + '">' +
            '<input type="hidden" value="' + value.featureElementValues.min + '" name="' + idValFiltreMin + '" id="' + idValFiltreMin + '">' +
            '<input type="hidden" value="' + value.featureElementValues.max + '" name="' + idValFiltreMax + '" id="' + idValFiltreMax + '">' +
            '</div>';

        if (!row || last) {
            html += '</div>';
        }

        arrayIonRange.push({
            'name': idRange,
            'min': value.featureElementValues.min,
            'max': value.featureElementValues.max
        });

        return html;
    };

    var addColor = function (filtreId, filtreLabel, array, last, row) {
        var html = '';

        if (row) {
            html += '<div class="row">';
        }

        html += '<div class="col-md-6">';
        html += '<label for="nom" class="">' + filtreLabel + '</label>';
        html += '<div>';

        $.each(array, function (key, value) {
            html += '<div class="checkbox-color checkbox-inline" data-color="' + value.color + '">';
            html += '<input type="checkbox" id="val_filtre_checkbox_color_' + value.id + '" name="val_filtreselect_' + filtreId + '[]" value="' + value.id + '">';
            html += '<label for="val_filtre_checkbox_color_' + value.id + '"> ' + value.name + ' </label>';
            html += '</div>';
        });

        html += '</div>';
        html += '</div>';

        if (!row || last) {
            html += '</div>';
        }

        return html;
    };

    var getFiltre = function () {
        spinnerButton(btnMoreCriteria);

        $.ajax({
            url: Routing.generate('front_site_product_filter_get'),
            type: 'POST',
            data: {'idMenu': filterContainer.data('id')},
            success: function (data) {
                console.log('data')
                console.log(data);

                if (data.filters) {
                    // Prix
                    var fromLoad = data.price.min;
                    var toLoad = data.price.max;

                    // Html start
                    if (title.length > 0) {
                        title = '<h3>' + title + '</h3>';
                    }

                    var html =
                        '<div class="container-fluid">' +
                        title +
                        '<form id="form-filtre" method="POST" action="" class="" onsubmit="return false;">' +
                        '<input type="hidden" id="val_menu" name="val_menu" value="' + filterContainer.data('id') + '">';

                    // Marques
                    if (enableBrand) {
                        html += addSelect('marque', 'Marque', data.brands, false, true);
                    }

                    // Prix
                    html +=
                        '<div class="row">' +
                        '<div class="col-md-6">' +
                        '<label for="val_prix">Prix</label>' +
                        '<div id="range_prix"></div>' +
                        '<input type="hidden" value="prix" name="val_filtrerange_prix_filtre" id="val_filtrerange_prix_filtre">' +
                        '<input type="hidden" value="' + fromLoad + '" name="val_filtrerange_prix_min" id="val_filtrerange_prix_min">' +
                        '<input type="hidden" value="' + toLoad + '" name="val_filtrerange_prix_max" id="val_filtrerange_prix_max">' +
                        '</div>' +
                        '</div>';

                    arrayIonRange.push({
                        'name': 'range_prix',
                        'min': fromLoad,
                        'max': toLoad
                    });

                    // Filtres
                    $.each(data.filters, function (key, value) {

                        // Si le nombre de filtre est impair
                        var last = false;
                        if (data.filters.length % 2 == 1) {
                            // Si c'est le dernier element
                            if (key == data.filters.length - 1) {
                                last = true;
                            }
                        }

                        // Row
                        var row = false;
                        if (key % 2 == 0) {
                            row = true;
                        }

                        switch (value.filter.type) {
                            case 'range':
                                html += addRange(value, last, row);
                                break;
                            case 'case_a_cocher':
                                html += addCheckbox(value.filter.id, value.filter.name, value.featureElementValues, last, row);
                                break;
                            case 'couleur':
                                html += addColor(value.filter.id, value.filter.name, value.featureElementValues, last, row);
                                break;
                            default:
                                html += addSelect(value.filter.id, value.filter.name, value.featureElementValues, last, row);
                                break;
                        }
                    });

                    // Tri
                    html +=
                        '<div class="row">' +
                        '<div class="col-md-2 pull-right">' +
                        '<label for="val_order" class="">Trier par</label>' +
                        '<select class="form-control" name="val_order" id="val_order">' +
                        '<option value="price_asc">Prix croissant</option>' +
                        '<option value="price_desc">Prix décroissant</option>' +
                        '</select>' +
                        '</div>' +
                        '</div>';

                    // Button
                    html +=
                        '<div class="row" style="margin-top: 10px;">' +
                        '<button type="submit" class="btn btn-primary pull-right" id="btn-send-filtre"><i class="fa fa-tasks"></i> Filtrer</button>' +
                        '</div>';

                    // Html end
                    html +=
                        '</form>' +
                        '</div>';

                    filterContainer.html(html);

                    // Add ionRange
                    $.each(arrayIonRange, function (key, value) {
                        initRangeSlider(value.name, value.min, value.max);
                    });

                    initSelect2();
                    initCheckboxColor();
                    sendFiltre();

                    spinnerButton(btnMoreCriteria);
                } else {
                    globalFilterContainer.remove();
                }
            },
            error: function (jqXHR) {
                console.log(jqXHR.responseText);
            }
        });
    };

    var sendFiltre = function () {
        $('#btn-send-filtre').click(function () {

            var btn = $(this);

            var $form = $("#form-filtre");
            var data = $form.serialize();

            btn.prop("disabled", true);
            btn.children().removeClass('fa-tasks').addClass('fa-refresh fa-spin');

            if (data.length > 0) {
                $.ajax({
                    url: Routing.generate('front_site_product_filter_send'),
                    type: 'POST',
                    dataType: "html",
                    data: data,
                    success: function (data) {
                        //console.log(data);

                        btn.prop("disabled", false);
                        btn.children().removeClass('fa-refresh fa-spin').addClass('fa-tasks');

                        productContainer.html(data);
                    },
                    error: function (jqXHR) {
                        console.log(jqXHR.responseText);
                    }
                });

            } else {
                btn.prop("disabled", false);
                btn.children().removeClass('fa-refresh fa-spin').addClass('fa-tasks');
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
    filtres.init();
});