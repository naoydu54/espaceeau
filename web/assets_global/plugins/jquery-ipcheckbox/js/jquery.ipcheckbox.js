(function ($) {
    $.fn.ipCheckbox = function (options) {
        var obj = $(this);
        var s = this;
        var defaults = {
            defaultBackgroundColor: '#ffffff',
            defaultColor: '#ffffff'
        };

        var settings = $.extend({}, defaults, options);

        var UID = {
            _current: 0,
            getNew: function () {
                this._current++;
                return this._current;
            }
        };

        HTMLElement.prototype.pseudoStyle = function (element, prop, value) {
            var _this = this;
            var _sheetId = "pseudoStyles";
            var _head = document.head || document.getElementsByTagName('head')[0];
            var _sheet = document.getElementById(_sheetId) || document.createElement('style');
            _sheet.id = _sheetId;
            var className = "pseudoStyle" + UID.getNew();

            _this.className += " " + className;

            _sheet.innerHTML += " ." + className + ":" + element + "{" + prop + ":" + value + "}";
            _head.appendChild(_sheet);
            return this;
        };

        // Global
        function init() {
            if (obj.length > 0) {
                obj.each(function () {
                    var color = $(this).data('color');
                    if (color) {
                        var $container = $(this).find('label');

                        if ($container) {
                            var container = $container[0];
                            container.pseudoStyle('before', 'background-color', color + '!important');
                            container.pseudoStyle('after', 'color', settings.defaultColor + '!important');
                        }
                    }
                });
            }
        };

        return init();
    };
})
(jQuery);