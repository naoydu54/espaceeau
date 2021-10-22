(function ($) {
    $.fn.ipFlashbag = function (options) {
        var obj = $(this);
        var s = this;
        var defaults = {
            message: null,
            className: 'info',
            autoHide: false,
            autoHideSpeed: 10000,
            scrollToTop: true,
            dismissible: true,
            type: 'append'
        };

        var settings = $.extend({}, defaults, options);

        function init() {

            if (obj.length > 0) {

                if (settings.message !== null) {

                    var uniqId = generateId();
                    var fa = 'fa-info-circle';

                    switch (settings.className) {
                        case 'success':
                            fa = 'fa-check-circle';
                            break;
                        case 'warning':
                            fa = 'fa-exclamation-circle';
                            break;
                        case 'danger':
                            fa = 'fa-exclamation-circle';
                            break;
                    }

                    var html = '<div class="alert alert-' + settings.className + ' ' + (settings.dismissible ? 'alert-dismissible' : '') + '" ' + (settings.dismissible ? 'alert-dismissible' : '') + ' id="' + uniqId + '">';

                    if (settings.dismissible) {
                        html += '<button type="button" class="close" data-dismiss="alert" aria-label="Close">';
                        html += '<span aria-hidden="true"><i class="fa fa-times"></i></span>';
                        html += '</button>';
                    }

                    html += '<strong><i class="fa ' + fa + '"></i></strong>';

                    if ($.isArray(settings.message)) {
                        html += '<ul class="nostyle">';

                        $.each(settings.message, function (index, message) {
                            html += '<li>' + message + '</li>';
                        });

                        html += '</ul>';
                    } else {
                        html += ' ' + settings.message;
                    }

                    html += '</div>';

                    var $container = $('<div/>').addClass('container').css('margin-top', '55px');
                    var $row = $('<div/>').addClass('row');
                    var $col = $('<div/>').addClass('col-md-12');

                    $row.append($col);
                    $container.append($row);
                    $col.append(html);

                    switch (settings.type) {
                        case 'html':
                            obj.html($container);
                            break;
                        case 'warning':
                            obj.prepend($container);
                            break;
                        default:
                            obj.append($container);
                            break;
                    }

                    if (settings.autoHide === true) {
                        setTimeout(function () {

                            $("#" + uniqId).closest('div.container').remove();

                            //$("#" + uniqId).hide(500);
                        }, settings.autoHideSpeed);
                    }

                    if (settings.scrollToTop) {
                        $('html, body').animate({scrollTop: 0}, 800);
                    }

                } else {
                    console.error('Please specify a message as array or string');
                }
            }
        }

        function generateId() {
            return Math.round(new Date().getTime() + (Math.random() * 100));
        }

        return init();
    };
})
(jQuery);