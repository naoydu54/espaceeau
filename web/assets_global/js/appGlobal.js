var AppGlobal = function () {

    var uiInit = function () {
        initFormatMoney();
        initExternalLink();
        initInputHttp();
    };

    var initFormatMoney = function () {
        Number.prototype.formatMoney = function (c, d, t) {
            var n = this,
                c = isNaN(c = Math.abs(c)) ? 2 : c,
                d = d === undefined ? "." : d,
                t = t === undefined ? "," : t,
                s = n < 0 ? "-" : "",
                i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "",
                j = (j = i.length) > 3 ? j % 3 : 0;
            return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
        };
    };

    var initExternalLink = function () {
        $('a').click(function (e) {
            var siteProtocol = window.location.protocol;
            var siteOrigin = window.location.origin;
            var siteDomaine = siteOrigin.replace(siteProtocol + '//', '');

            var url = $(this).attr("href");
            var a = $('<a>', {href: url});
            var hostname = a.prop('hostname');

            if (hostname){
                if (hostname !== siteDomaine && hostname !== 'www.' + siteDomaine) {
                    // $(this).attr('target', '_blank');

                    console.log(hostname);

                    // console.log(a);
                    // console.log(url);
                    // console.log('a');
                    console.log(siteDomaine);

                }
            }

            // e.preventDefault();

        });
    };

    var initInputHttp = function () {
        var input = $('input');

        input.focus(function () {
            var $this = $(this);
            var placeholder = $this.attr('placeholder');
            if (placeholder === "http://" || placeholder === "https://") {
                if ($this.val() === "") {
                    $this.val(placeholder);
                }
            }
        });

        input.focusout(function () {
            var $this = $(this);
            var placeholder = $this.attr('placeholder');
            if (placeholder === "http://" || placeholder === "https://") {
                if ($this.val() === placeholder) {
                    $this.val("");
                }
            }
        });
    };

    var formatPrice = function (price) {
        price = price.formatMoney(2, '.', ' ') + " €";
        return price;
    };

    var spinnerButton = function (btn) {
        if (btn.hasClass('disabled')) {
            btn.prop('disabled', false);
            btn.removeClass('disabled');
        } else {
            btn.prop('disabled', true);
            btn.addClass('disabled');
        }

        var i = btn.find('i');
        var span = btn.find('span');

        if (i.length > 0) {
            var iClassSaved = i.data('class');

            if (!iClassSaved) {
                var iClass = i.attr('class');
                i.data('class', iClass);
                i.removeClass(iClass).addClass('fa fa-spinner fa-spin');
            } else {
                i.removeClass('fa fa-spinner fa-spin').addClass(i.data('class'));
                i.data('class', null);
            }
        } else if (span.length > 0) {
            var spanClassSaved = i.data('class');

            if (!spanClassSaved) {
                var spanClass = i.attr('class');
                span.data('class', spanClass);
                span.removeClass(spanClass).addClass('bootstrap-dialog-button-icon fa fa-spinner fa-spin');
            } else {
                span.removeClass('bootstrap-dialog-button-icon fa fa-spinner fa-spin').addClass(span.data('class'));
                span.data('class', null);
            }
        }
    };

    var flashBag = function (container, array, alertClass, autoHide) {
        if (autoHide === null) {
            autoHide = false;
        }

        var uniqId = generateId();

        var html = '<div class="alert alert-' + alertClass + ' alert-dismissible" role="alert" id="' + uniqId + '">';
        html += '<button type="button" class="close" data-dismiss="alert" aria-label="Close">';
        html += '<span aria-hidden="true"><i class="fa fa-times"></i></span>';
        html += '</button>';
        html += '<ul class="nostyle">';

        $.each(array, function (index, value) {
            html += '<li>' + value + '</li>';
        });

        html += '</ul></div>';
        container.append(html);

        if (autoHide === true) {
            setTimeout(function () {
                $("#" + uniqId).hide(500);
            }, 10000);
        }

        $('html, body').animate({scrollTop: 0}, 800);
    };

    var generateId = function () {
        return Math.round(new Date().getTime() + (Math.random() * 100));
    };

    return {
        init: function () {
            uiInit();
        },
        formatPrice: function (price) {
            return formatPrice(price);
        },
        spinnerButton: function (btn) {
            spinnerButton(btn);
        },
        flashBag: function (container, array, alertClass, autoHide) {
            flashBag(container, array, alertClass, autoHide);
        }
    };
}();

$(document).ready(function () {
    AppGlobal.init();
});