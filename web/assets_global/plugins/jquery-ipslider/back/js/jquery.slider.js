(function ($) {
    $.fn.slider = function (options) {
        var obj = $(this);
        var s = this;
        var defaults = {
            addText: 'Séléctionner une image',
            editText: "Modifier l'image",
            deleteText: "Supprimer",
            slideWidth: 1300,
            slideHeight: 800,
            previewImgDefault: "http://www.placehold.it/1920x738/EFEFEF/AAAAAA&amp;text=aucune+image",
            fileInputTemplate: "/web/assets_global/plugins/jquery-ipslider/back/mst/fileinput.mst",
            layerTemplate: "/web/assets_global/plugins/jquery-ipslider/back/mst/layer.mst",
            buttonTemplate: "/web/assets_global/plugins/jquery-ipslider/back/mst/button.mst",
            layerTextDefault: "[Entrez un texte]",
            layerAnimations: [],
            layerFonts: [],
            layerButtons: [],
            layerUnit: 'px',
            layerMinFontSize: 14,
            layerMaxFontSize: 100
        };

        var loader = '<div id="spinner-loading" class="text-center mt-20"><i class="fa fa-circle-o-notch fa-spin fa-3x fa-fw"></i></div>';
        var settings = $.extend({}, defaults, options);
        var currentTab;
        var $fileinput;
        var $slideIdInput;
        var $preview;
        var $fileinputAdd;
        var $fileinputDelete;
        var $slideDelete;
        var lastSlideId;
        var lastSlidePosition;

        function init() {
            initNavTabs();
        };

        /* NAVTABS */
        function initNavTabs() {
            var html =
                '<ul class="nav nav-tabs">' +
                '<li><a href="javascript:;" class="btn btn-sm green add-tab" disabled="disabled"><i class="fa fa-plus"></i></a></li>' +
                '</ul>' +
                '<div class="tab-content"></div>';
            obj.html(html);

            getSlide();
        };

        function definedActive(currentTab) {
            $(".nav-tabs li").each(function (index) {
                $(this).removeClass('active');

                if ($(this).find('a').attr('href') == currentTab) {
                    $(this).addClass('active');
                }
            });

            $(".tab-content .tab-pane").each(function (index) {
                $(this).removeClass('active in');

                if ('#' + $(this).attr('id') == currentTab) {
                    $(this).addClass('active in');
                }
            });

            $fileinput = $(currentTab + ' [data-type="fileinput"]');
            $preview = $(currentTab + ' .fileinput-preview');
            $fileinputAdd = $(currentTab + ' .fileinput-add');
            $fileinputDelete = $(currentTab + ' .fileinput-delete');
            $slideDelete = $(currentTab + ' .btn-delete-slide');
            $slideIdInput = $(currentTab + ' [data-type="slideinput"]');
        };

        function onChangeNavTab() {
            $('.nav-tabs [data-toggle="tab"]').unbind('click');
            $('.nav-tabs [data-toggle="tab"]').click(function () {
                if ($(this).attr('href') != currentTab) {
                    currentTab = $(this).attr('href');
                    definedActive(currentTab);
                    onChangeFileInput();
                }
            });
        };

        function addNavTab(data) {
            if (data == null) {
                var data = {
                    'id': lastSlideId,
                    'position': lastSlidePosition,
                    'document': settings.previewImgDefault,
                    'visible': true,
                    'layers': []
                };

                lastSlideId++;
                lastSlidePosition++;
            }

            var count = $('.nav-tabs li').length;
            var tabActive = '';
            var tabContentActive = '';

            if (count == 1) {
                tabActive = 'active';
                tabContentActive = 'active in';
            }

            var htmlTab =
                '<li class="' + tabActive + '" >' +
                '<a href="#tab_' + data['id'] + '" data-toggle="tab" data-id="' + data.id + '"> Slide ' + count + ' </a>' +
                '</li>';

            if (count == 1) {
                $('.nav-tabs li:nth-last-child(1)').before(htmlTab);
            } else {
                $('.nav-tabs li:nth-last-child(2)').after(htmlTab);
            }

            var htmlTabContent =
                '<div class="tab-pane fade ' + tabContentActive + '" id="tab_' + data['id'] + '" data-position="' + data.position + '" data-id="' + data.id + '"></div>';
            $('.tab-content').append(htmlTabContent);

            if (currentTab == null) {
                currentTab = '#tab_' + data['id'];
            }

            onChangeNavTab();
            initSlide(data);
        };

        function onClickAddTab() {
            $(".add-tab").attr("disabled", false);
            $(".add-tab").unbind('click');
            $(".add-tab").click(function () {
                addNavTab(null);
            });
        };

        function onSortableTab() {
            obj.find(".nav-tabs").sortable({
                axis: "x",
                stop: function () {
                    obj.find('.nav-tabs li').each(function (index) {
                        var id = $(this).find('a').data('id');

                        if (typeof id !== 'undefined') {
                            var tabPane = obj.find('div.tab-content div.tab-pane[data-id="' + $(this).find('a').data('id') + '"]');
                            tabPane.data('position', index);
                            tabPane.attr('data-position', index);
                        }
                    });
                }
            });
        }

        function generateId() {
            var id = '';
            var chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
            for (var i = 0; i < 10; i++) {
                id += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return id;
        };

        function inputHttp() {
            $("input")
                .focus(function () {
                    var $input = $(this);
                    if ($input.attr("placeholder") == "http://") {
                        if ($input.val() == "") {
                            $input.val("http://");
                        }
                    }
                });

            $("input")
                .focusout(function () {
                    var $input = $(this);
                    if ($input.attr("placeholder") == "http://") {
                        if ($input.val() == "http://") {
                            $input.val("");
                        }
                    }
                });
        };

        /* FILEINPUT */
        function initSlide(data) {
            $.get(settings.fileInputTemplate, function (template) {
                var rendered = Mustache.render(template, {addText: settings.addText, deleteText: settings.deleteText});
                $('#tab_' + data['id']).html(rendered);

                currentTab = '#tab_' + data['id'];
                definedActive(currentTab);

                $(currentTab + ' div.fileinput-preview').css('width', settings.slideWidth + 'px').css('height', settings.slideHeight + 'px');

                if (data['document'] == settings.previewImgDefault) {
                    $fileinputAdd.html(settings.addText);
                    $fileinputDelete.addClass('hidden');
                } else {
                    $fileinputAdd.html(settings.editText);
                    $fileinputDelete.removeClass('hidden');
                    clearFileInput();
                }

                $preview.css('background-image', "url(" + data['document'] + ")");
                $slideIdInput.val(data['id']);

                onChangeFileInput();
                onClickDeleteSlide();

                $(data['layers']).each(function (index, value) {
                    addLayer(value);
                });

                onClickAddLayer();
                onClickAddButton();

                // Grid
                for (var x = 0; x < 10; x++) {
                    for (var y = 0; y < 4; y++) {
                        var grid = $("<div class='grid'></div>");
                        grid.appendTo(currentTab + ' .fileinput-preview');
                    }
                }

                $(currentTab + ' div.fileinput-preview div.grid').css('width', settings.slideWidth / 10 - .2 + 'px').css('height', settings.slideHeight / 4 + 'px');
            });
        };

        function onChangeFileInput() {
            $fileinput.unbind('change');
            $fileinput.change(function (e) {
                $fileinputAdd.html('').addClass('fa fa-spinner fa-spin');

                var files = e.target.files === undefined ? (e.target && e.target.value ? [{name: e.target.value.replace(/^.+\\/, '')}] : []) : e.target.files;
                e.stopPropagation();

                if (files.length === 0) {
                    //this.clear();
                    return
                }

                var file = files[0];

                if ($preview.length > 0 && (typeof file.type !== "undefined" ? file.type.match(/^image\/(gif|png|jpeg)$/) : file.name.match(/\.(gif|png|jpe?g)$/i)) && typeof FileReader !== "undefined") {
                    var reader = new FileReader();

                    reader.onload = function (re) {
                        $preview.css('background-image', "url(" + re.target.result + ")");

                        $fileinputAdd.html(settings.editText).removeClass('fa fa-spinner fa-spin');
                        $fileinputAdd.html(settings.editText);
                        $fileinputDelete.removeClass('hidden');
                        clearFileInput();
                    }
                    reader.readAsDataURL(file);
                }
            });
        };

        function clearFileInput() {
            $fileinputDelete.unbind('click');
            $fileinputDelete.click(function () {
                $fileinputDelete.addClass('hidden');
                $preview.css('background-image', "url(" + settings.previewImgDefault + ")");
                $fileinputAdd.html(settings.addText);
            });
        };

        function onClickDeleteSlide() {
            $slideDelete.unbind('click');
            $slideDelete.click(function () {
                $('.nav-tabs li.active').remove();
                $(currentTab).remove();

                if ($('.nav-tabs li').length > 1) {
                    $('.nav-tabs li:first-child').addClass('active');
                    var navTab = $('.nav-tabs li:first-child a').attr('href');
                    $(navTab).addClass('active in');
                    currentTab = navTab;
                }
            });
        };

        function onSave() {
            $('.btn-save').attr("disabled", false);
            $('.btn-save').click(function () {
                var btn = $(this);
                btn.attr("disabled", true);
                btn.children().removeClass('fa-floppy-o').addClass('fa fa-spinner fa-spin');

                var formData = new FormData();

                var slidesIds = $('input[name="val_slide_id[]"]');
                var slidesFiles = $('input[name="val_file[]"]');

                slidesIds.each(function (index, value) {
                    if (slidesFiles[index].files[0] != null) {
                        formData.append(value.value + '[file]', slidesFiles[index].files[0]);
                    } else {
                        formData.append(value.value + '[file]', null);
                    }

                });

                $('#slider .tab-pane').each(function (index) {
                    var tabPane = $(this);

                    $('#' + tabPane.attr('id') + ' table.table-layers tr').each(function (indexTr) {
                        var tr = $(this);

                        var checkedBold = false;
                        if (tr.find("input[name='val_layer_bold']").is(':checked')) {
                            checkedBold = true;
                        }

                        var checkedBg = false;
                        if (tr.find("input[name='val_layer_background']").is(':checked')) {
                            checkedBg = true;
                        }

                        var layer = {
                            id: tr.data('id'),
                            type: tr.data('type'),
                            value: tr.find("input[name='val_layer_value']").val(),
                            posX: tr.find("input[name='val_layer_x']").val(),
                            posY: tr.find("input[name='val_layer_y']").val(),
                            color: tr.find("input[name='val_layer_color']").val(),
                            bold: checkedBold,
                            font: tr.find("select[name='val_layer_font'] option:selected").val(),
                            animation: tr.find("select[name='val_layer_animation'] option:selected").val(),
                            fontSize: tr.find("input[name='val_layer_font_size']").val(),
                            background: checkedBg,
                            button: tr.find("select[name='val_layer_button'] option:selected").val(),
                            url: tr.find("input[name='val_layer_url']").val(),
                            position: indexTr
                        };

                        formData.append(tabPane.find("[data-type='slideinput']").val() + '[]', JSON.stringify(layer));
                    });

                    formData.append(tabPane.find("[data-type='slideinput']").val() + '[position]', JSON.stringify(tabPane.data('position')));
                });

                $.ajax({
                    url: Routing.generate('admin_slider_update_slide', {slider: $('#val_slider_id').val(), locale: $('#val_locale').val()}),
                    type: 'POST',
                    contentType: false,
                    processData: false,
                    data: formData,
                    success: function (data) {
                        //console.log(data);

                        btn.children().removeClass('fa-spinner fa-spin').addClass('fa-floppy-o');
                        btn.attr("disabled", false);
                    },
                    error: function (jqXHR) {
                        console.log(jqXHR.responseText);
                    }
                });
            });
        };

        function getSlide() {
            obj.append(loader);

            $.ajax({
                url: Routing.generate('admin_slider_get_slide', {slider: $('#val_slider_id').val(), locale: $('#val_locale').val()}),
                type: 'POST',
                success: function (data) {
                    //console.log(data);

                    lastSlideId = data['lastSlideId'];
                    lastSlidePosition = data['lastSlidePosition'];

                    $('#spinner-loading').remove();

                    if (data.slides.length > 0) {
                        $(data.slides).each(function (index, value) {
                            addNavTab(value);
                        });
                    }

                    settings.layerAnimations = data.layerAnimation;
                    settings.layerFonts = data.layerFont;
                    settings.layerButtons = data.layerButton;

                    onClickAddTab();
                    onSortableTab();
                    onSave();
                },
                error: function (jqXHR) {
                    console.log(jqXHR.responseText);
                }
            });
        };

        /* LAYER */
        function addLayer(data) {
            var templateLink = settings.layerTemplate;
            if (data['type'] == 'button') {
                templateLink = settings.buttonTemplate;
            }

            $.get(templateLink, function (template) {

                var rendered = Mustache.render(template, {
                    id: data['id'],
                    type: data['type'],
                    value: data['value'],
                    posX: data['posX'],
                    posY: data['posY'],
                    color: data['color'],
                    bold: data['bold'],
                    animation: data['animation'],
                    font: data['font'],
                    fontSize: data['fontSize'],
                    background: data['background'],
                    button: data['button'],
                    url: data['url']
                });

                $(data['tab'] + ' .table-layers').append(rendered);

                var htmlLayer = '<div class="layer" data-id="' + data['id'] + '" data-type="' + data['type'] + '">';
                htmlLayer += '<div class="content">';

                switch (data['type']) {
                    case 'text':
                        htmlLayer += data['value'];
                        break;
                    case 'button':
                        htmlLayer += '<a href="javascript:;" class="btn">' + data['value'] + '</a>';
                        break;
                }

                htmlLayer += '</div>';
                htmlLayer += '</div>';

                $(data['tab'] + ' .fileinput-preview').prepend(htmlLayer);

                //$('tbody').sortable();

                $(data['tab'] + ' .table-layers tbody').sortable({
                    handle: ".ui-handle-td",
                    placeholder: "ui-state-highlight"
                });

                if (data['type'] == 'text') {
                    var newLayer = $(data['tab'] + ' .fileinput-preview').find("[data-id='" + data['id'] + "']");
                    var newLayerContent = newLayer.find('div.content');

                    if (data['isNewLayer']) {
                        var posXpercent = (100 * parseFloat((newLayer.position().left) / parseFloat(newLayer.parent().width())));
                        var posYpercent = (100 * parseFloat((newLayer.position().top) / parseFloat(newLayer.parent().height())));

                        $(data['tab'] + ' .table-layers').find("[data-id='" + data['id'] + "']").find('#val_layer_x').val(posXpercent);
                        $(data['tab'] + ' .table-layers').find("[data-id='" + data['id'] + "']").find('#val_layer_y').val(posYpercent);
                    } else {
                        newLayer.css('left', data['posX'] + '%').css('top', data['posY'] + '%');
                        newLayerContent.css('color', data['color']).css('font-size', data['fontSize'] + settings.layerUnit);
                    }

                    if (data['bold']) {
                        newLayerContent.css('font-weight', 'bold');
                    }

                    if (data['background']) {
                        newLayerContent.addClass('bg');
                    }

                    onChangeLayerValue(data['tab'], newLayer, data['type']);
                    onChangeFont(data['tab'], newLayer);
                    onChangeColor(data['tab'], newLayer);
                    onChangeCheckbox(data['tab'], newLayer);
                    onChangeFontSizeValue(data['tab'], newLayer);
                    onMouseenterLayer(data['tab']);
                    onMouseleaveLayer(data['tab']);
                    onClickDeleteLayer();

                } else if (data['type'] == 'button') {
                    var newLayer = $(data['tab'] + ' .fileinput-preview').find("[data-id='" + data['id'] + "']");
                    var newLayerContent = newLayer.find('div.content a');

                    if (data['isNewLayer']) {
                        var posXpercent = (100 * parseFloat((newLayer.position().left) / parseFloat(newLayer.parent().width())));
                        var posYpercent = (100 * parseFloat((newLayer.position().top) / parseFloat(newLayer.parent().height())));

                        $(data['tab'] + ' .table-layers').find("[data-id='" + data['id'] + "']").find('#val_layer_x').val(posXpercent);
                        $(data['tab'] + ' .table-layers').find("[data-id='" + data['id'] + "']").find('#val_layer_y').val(posYpercent);
                    } else {
                        newLayer.css('left', data['posX'] + '%').css('top', data['posY'] + '%');
                    }

                    newLayerContent.addClass($(data['tab'] + ' .table-layers').find("[data-id='" + data['id'] + "']").find("select[name='val_layer_button'] option:selected").data('value'));

                    onChangeLayerValue(data['tab'], newLayer, data['type']);
                    onChangeButton(data['tab'], newLayer);
                    onMouseenterLayer(data['tab']);
                    onMouseleaveLayer(data['tab']);
                    onClickDeleteLayer();
                    inputHttp();
                }
            });
        };

        function onChangeLayerValue(tab, layer, type) {
            var input = $(tab + ' .table-layers').find("[data-id='" + layer.data('id') + "']").find('#val_layer_value');
            input.unbind('change paste keyup');
            input.bind('change paste keyup', function () {
                if (type == 'text') {
                    var layerContent = layer.find('div.content');
                } else if (type == 'button') {
                    var layerContent = layer.find('div.content a');
                }
                layerContent.html($(this).val());
            });
        };

        function onChangeFont(tab, layer) {
            var input = $(tab + ' .table-layers').find("[data-id='" + layer.data('id') + "']").find('#val_layer_font');
            input.unbind('change');
            input.bind('change', function () {
                var layerContent = layer.find('div.content');
                layerContent.css('font-family', $(this).find('option:selected').data('value'));
            });
        };

        function onChangeColor(tab, layer) {
            var input = $(tab + ' .table-layers').find("[data-id='" + layer.data('id') + "']").find('#val_layer_color');
            input.minicolors({
                control: 'hue',
                defaultValue: '',
                letterCase: 'lowercase',
                position: 'bottom left',
                change: function (hex, opacity) {
                    if (!hex) {
                        return;
                    } else {
                        var layerContent = layer.find('div.content');
                        layerContent.css('color', hex);
                    }
                },
                theme: 'bootstrap'
            });
        };

        function onChangeCheckbox(tab, layer) {
            // bold
            var boldCheckbox = $(tab + ' .table-layers').find("[data-id='" + layer.data('id') + "']").find('#val_layer_bold');
            boldCheckbox.unbind('change');
            boldCheckbox.bind('change', function () {
                var layerContent = layer.find('div.content');
                if ($(this).is(':checked')) {
                    layerContent.css('font-weight', 'bold');
                } else {
                    layerContent.css('font-weight', 'normal');
                }
            });

            // background
            var bgCheckbox = $(tab + ' .table-layers').find("[data-id='" + layer.data('id') + "']").find('#val_layer_background');
            bgCheckbox.unbind('change');
            bgCheckbox.bind('change', function () {
                var layerContent = layer.find('div.content');
                if ($(this).is(':checked')) {
                    layerContent.addClass('bg');
                } else {
                    layerContent.removeClass('bg');
                }
            });
        };

        function onChangeFontSizeValue(tab, layer) {
            var input = $(tab + ' .table-layers').find("[data-id='" + layer.data('id') + "']").find('#val_layer_font_size');
            input.unbind('change paste keyup');
            input.bind('change paste keyup', function () {
                if ($(this).val() >= settings.layerMinFontSize && $(this).val() <= settings.layerMaxFontSize) {
                    var layerContent = layer.find('div.content');
                    layerContent.css('font-size', $(this).val() + settings.layerUnit);
                }
            });

            input.off('focusout');
            input.focusout(function () {
                if ($(this).val() < settings.layerMinFontSize || $(this).val() > settings.layerMaxFontSize) {
                    $(this).val(settings.layerMinFontSize);
                }
            });
        };

        function onChangeButton(tab, layer) {
            var input = $(tab + ' .table-layers').find("[data-id='" + layer.data('id') + "']").find('#val_layer_button');
            input.unbind('change');
            input.bind('change', function () {
                var layerContent = layer.find('div.content a');
                layerContent.removeClass(layerContent.attr('class')).addClass('btn ' + $(this).find('option:selected').data('value'));
            });
        };

        function onMouseenterLayer(tab) {
            $(tab + ' .fileinput-preview div.layer').unbind('mouseenter');
            $(tab + ' .fileinput-preview div.layer').mouseenter(function () {
                var layer = $(this);

                layer.draggable({
                    containment: tab + ' .fileinput-preview',
                    scroll: false,
                    drag: function (e, ui) {
                        var posXpercent = (100 * parseFloat(($(this).position().left) / parseFloat($(this).parent().width())));
                        posXpercent = Math.round(posXpercent);

                        var posYpercent = (100 * parseFloat(($(this).position().top) / parseFloat($(this).parent().height())));
                        posYpercent = Math.round(posYpercent);

                        layer.data('x', posXpercent);
                        layer.data('y', posYpercent);

                        $(tab + ' .table-layers').find("[data-id='" + layer.data('id') + "']").find('#val_layer_x').val(posXpercent);
                        $(tab + ' .table-layers').find("[data-id='" + layer.data('id') + "']").find('#val_layer_y').val(posYpercent);
                    }
                })
            });
        };

        function onMouseleaveLayer(tab) {
            $(tab + ' .fileinput-preview div.layer').unbind('mouseout');
            $(tab + ' .fileinput-preview div.layer').mouseout(function () {
                $(this).removeClass('ui-draggable ui-draggable-handle');
            });
        };

        function onClickAddLayer() {
            $('.btn-add-layer').attr("disabled", false);
            $('.btn-add-layer').unbind('click');
            $('.btn-add-layer').click(function () {

                var data = {
                    'isNewLayer': true,
                    'tab': currentTab,
                    'id': generateId(),
                    'type': 'text',
                    'value': settings.layerTextDefault,
                    'posX': 0,
                    'posY': 0,
                    'color': '#000000',
                    'bold': false,
                    'animation': settings.layerAnimations,
                    'font': settings.layerFonts,
                    'fontSize': settings.layerMinFontSize,
                    'background': false,
                    'button': settings.layerButtons,
                    'url': ''
                };

                addLayer(data);
            });
        };

        function onClickAddButton() {
            $('.btn-add-button').attr("disabled", false);
            $('.btn-add-button').unbind('click');
            $('.btn-add-button').click(function () {

                var data = {
                    'isNewLayer': true,
                    'tab': currentTab,
                    'id': generateId(),
                    'type': 'button',
                    'value': settings.layerTextDefault,
                    'posX': 0,
                    'posY': 0,
                    'color': '#000000',
                    'bold': false,
                    'animation': settings.layerAnimations,
                    'font': settings.layerFonts,
                    'fontSize': settings.layerMinFontSize,
                    'background': false,
                    'button': settings.layerButtons,
                    'url': ''
                };

                addLayer(data);
            });
        };

        function onClickDeleteLayer() {
            $('.btn-delete-layer').unbind('click');
            $('.btn-delete-layer').click(function () {
                var layerId = $(this).parent().parent().data('id');
                $(this).parent().parent().remove();
                $(currentTab + ' .fileinput-preview').find("[data-id='" + layerId + "']").remove();
            });
        };

        return init();
    };
})
(jQuery);