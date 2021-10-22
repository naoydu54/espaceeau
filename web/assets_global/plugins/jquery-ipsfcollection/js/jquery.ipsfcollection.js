(function ($) {
    $.fn.ipSfCollection = function (options) {
        var obj = $(this);
        var s = this;
        var defaults = {
            addText: '<i class="fa fa-plus" aria-hidden="true"></i>',
            removeText: '<i class="fa fa-minus" aria-hidden="true"></i>',
            moveUpText: '<i class="fa fa-angle-up" aria-hidden="true"></i>',
            moveDownText: '<i class="fa fa-angle-down" aria-hidden="true"></i>',
            remove: true,
            reorder: false,
            formname: null,
            formchildname: null,
            fields: null,
        };

        var settings = $.extend({}, defaults, options);

        var $collectionHolder;
        var $addElementLink = $('<a href="javascript:;" class="btn btn-xs btn-success">' + settings.addText + '</a>');
        var $newElementContainer = $('<div class="mt20 mb20"></div>').append($addElementLink);

        function init() {
            if (obj.length > 0) {
                obj.each(function () {
                    $collectionHolder = obj;

                    if (settings.formname === null) {
                        console.error('Please specify the option "formname"');
                        return false;
                    }

                    if (settings.formchildname === null) {
                        console.error('Please specify the option "formchildname"');
                        return false;
                    }

                    if (settings.reorder) {
                        if (settings.fields === null) {
                            console.error('Please specify the option "fields" if "reorder" option is true');
                            return false;
                        }
                    }

                    if (!$collectionHolder.hasClass('sfcollection')) {
                        $collectionHolder.addClass('sfcollection');
                    }

                    $collectionHolder.find('div.sfelement').each(function () {
                        addElementFormButton($(this));
                    });

                    $collectionHolder.after($newElementContainer);
                    $collectionHolder.data('index', $collectionHolder.find('div.sfelement').length);

                    $addElementLink.on('click', function (e) {
                        e.preventDefault();
                        addElementForm($collectionHolder);
                    });

                    if (settings.reorder) {
                        reIndexElement();
                    }
                });
            }
        }

        function addElementForm($collectionHolder) {
            var prototype = $collectionHolder.data('prototype');
            var index = $collectionHolder.data('index');
            var newForm = prototype;
            newForm = newForm.replace(/__name__/g, index);

            $collectionHolder.data('index', index + 1);

            var $newForm = $(newForm);
            $newForm.addClass('sfelement');

            obj.append($newForm);

            addElementFormButton($newForm);
        }

        function addElementFormButton($elementFormContainer) {
            var $removeElement;
            var $moveDownElement;
            var $moveUpElement;

            if (settings.remove) {
                $removeElement = $('<a href="javascript:;" class="btn btn-xs btn-danger btn-remove pull-right">' + settings.removeText + '</a>');
            }

            if (settings.reorder) {
                $moveDownElement = $('<a href="javascript:;" class="btn btn-xs btn-default btn-down pull-right">' + settings.moveDownText + '</a>');
                $moveUpElement = $('<a href="javascript:;" class="btn btn-xs btn-default btn-up pull-right">' + settings.moveUpText + '</a>');
            }

            if (settings.remove || settings.reorder) {
                var $buttonContainer = $('<div class="col-md-12 mb20"></div>').append($removeElement, $moveDownElement, $moveUpElement);
                $elementFormContainer.append($buttonContainer);
            }

            if (settings.remove) {
                $removeElement.on('click', function (e) {
                    e.preventDefault();
                    $elementFormContainer.remove();

                    if (settings.reorder) {
                        reIndexElement();
                    }
                });
            }

            if (settings.reorder) {
                $moveDownElement.on('click', function (e) {
                    e.preventDefault();

                    var hook = $(this).closest('.sfelement').next('.sfelement');
                    var elementToMove = $(this).closest('.sfelement').detach();
                    hook.after(elementToMove);

                    reIndexElement();
                });

                $moveUpElement.on('click', function (e) {
                    e.preventDefault();

                    var hook = $(this).closest('.sfelement').prev('.sfelement');
                    var elementToMove = $(this).closest('.sfelement').detach();
                    hook.before(elementToMove);

                    reIndexElement();
                });
            }
        }

        function reIndexElement() {
            /*$collectionHolder.find('div.sfelement').each(function (i) {
                var prefix = settings.formname + '_' + settings.formchildname;

                $(this).attr('id', prefix + '_' + i);

                $(this).find('div.form-group').each(function (j) {
                    var inputId = prefix + '_' + i + '_' + settings.fields[j];
                    var inputName = settings.formname + '[' + settings.formchildname + ']' + '[' + i + ']' + '[' + settings.fields[j] + ']';

                    $(this).find('label').attr('for', inputId);
                    $(this).find('input').attr('id', inputId);
                    $(this).find('input').attr('name', inputName);
                });
            });*/
        }

        return init();
    };
})
(jQuery);