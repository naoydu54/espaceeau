/*!
 * Nestable jQuery Plugin - Copyright (c) 2014 Ramon Smit - https://github.com/RamonSmit/Nestable
 */
;
(function($, window, document, undefined) {
    var hasTouch = 'ontouchstart' in window;

    /**
     * Detect CSS pointer-events property
     * events are normally disabled on the dragging element to avoid conflicts
     * https://github.com/ausi/Feature-detection-technique-for-pointer-events/blob/master/modernizr-pointerevents.js
     */
    var hasPointerEvents = (function() {
        var el = document.createElement('div'),
            docEl = document.documentElement;
        if(!('pointerEvents' in el.style)) {
            return false;
        }
        el.style.pointerEvents = 'auto';
        el.style.pointerEvents = 'x';
        docEl.appendChild(el);
        var supports = window.getComputedStyle && window.getComputedStyle(el, '').pointerEvents === 'auto';
        docEl.removeChild(el);
        return !!supports;
    })();

    var eStart = hasTouch ? 'touchstart' : 'mousedown',
        eMove = hasTouch ? 'touchmove' : 'mousemove',
        eEnd = hasTouch ? 'touchend' : 'mouseup',
        eCancel = hasTouch ? 'touchcancel' : 'mouseup';

    var defaults = {
        contentCallback: function(item) {return item.content || '' ? item.content : item.id;},
        listNodeName: 'ol',
        itemNodeName: 'li',
        handleNodeName: 'div',
        contentNodeName: 'span',
        rootClass: 'dd',
        listClass: 'dd-list',
        itemClass: 'dd-item',
        dragClass: 'dd-dragel',
        handleClass: 'dd-handle',
        contentClass: 'dd-content',
        collapsedClass: 'dd-collapsed',
        placeClass: 'dd-placeholder',
        noDragClass: 'dd-nodrag',
        noChildrenClass: 'dd-nochildren',
        emptyClass: 'dd-empty',
        expandBtnHTML: '<button class="dd-expand" data-action="expand" type="button">Expand</button>',
        collapseBtnHTML: '<button class="dd-collapse" data-action="collapse" type="button">Collapse</button>',
        group: 0,
        maxDepth: 5,
        threshold: 20,
        fixedDepth: false, //fixed item's depth
        fixed: false,
        includeContent: false,
        callback: function(l, e) {},
        listRenderer: function(children, options) {
            var html = '<' + options.listNodeName + ' class="' + options.listClass + '">';
            html += children;
            html += '</' + options.listNodeName + '>';

            return html;
        },
        itemRenderer: function(item_attrs, content, children, options, item) {
            var item_attrs_string = $.map(item_attrs, function(value, key) {
                return ' ' + key + '="' + value + '"';
            }).join(' ');

            var html = '<' + options.itemNodeName + item_attrs_string + '>';
            html += '<' + options.handleNodeName + ' class="' + options.handleClass + '">';
            html += '<' + options.contentNodeName + ' class="' + options.contentClass + '">';
            html += content;
            html += '</' + options.contentNodeName + '>';
            html += '</' + options.handleNodeName + '>';
            html += children;
            html += '</' + options.itemNodeName + '>';

            return html;
        }
    };

    function Plugin(element, options) {
        this.w = $(document);
        this.el = $(element);
        if(!options) {
            options = defaults;
        }
        if(options.rootClass !== undefined && options.rootClass !== 'dd') {
            options.listClass = options.listClass ? options.listClass : options.rootClass + '-list';
            options.itemClass = options.itemClass ? options.itemClass : options.rootClass + '-item';
            options.dragClass = options.dragClass ? options.dragClass : options.rootClass + '-dragel';
            options.handleClass = options.handleClass ? options.handleClass : options.rootClass + '-handle';
            options.collapsedClass = options.collapsedClass ? options.collapsedClass : options.rootClass + '-collapsed';
            options.placeClass = options.placeClass ? options.placeClass : options.rootClass + '-placeholder';
            options.noDragClass = options.noDragClass ? options.noDragClass : options.rootClass + '-nodrag';
            options.noChildrenClass = options.noChildrenClass ? options.noChildrenClass : options.rootClass + '-nochildren';
            options.emptyClass = options.emptyClass ? options.emptyClass : options.rootClass + '-empty';
        }

        this.options = $.extend({}, defaults, options);

        // build HTML from serialized JSON if passed
        if(this.options.json !== undefined) {
            this._build();
        }

        this.init();
    }

    Plugin.prototype = {

        init: function() {
            var list = this;

            list.reset();

            list.el.data('nestable-group', this.options.group);

            list.placeEl = $('<div class="' + list.options.placeClass + '"/>');

            $.each(this.el.find(list.options.itemNodeName), function(k, el) {
                var item = $(el),
                    parent = item.parent();
                list.setParent(item);
                if(parent.hasClass(list.options.collapsedClass)) {
                    list.collapseItem(parent.parent());
                }
            });

            list.el.on('click', 'button', function(e) {
                if(list.dragEl || (!hasTouch && e.button !== 0)) {
                    return;
                }
                var target = $(e.currentTarget),
                    action = target.data('action'),
                    item = target.parent(list.options.itemNodeName);
                if(action === 'collapse') {
                    list.collapseItem(item);
                }
                if(action === 'expand') {
                    list.expandItem(item);
                }
            });

            var onStartEvent = function(e) {
                var handle = $(e.target);
                if(!handle.hasClass(list.options.handleClass)) {
                    if(handle.closest('.' + list.options.noDragClass).length) {
                        return;
                    }
                    handle = handle.closest('.' + list.options.handleClass);
                }
                if(!handle.length || list.dragEl || (!hasTouch && e.which !== 1) || (hasTouch && e.touches.length !== 1)) {
                    return;
                }
                e.preventDefault();
                list.dragStart(hasTouch ? e.touches[0] : e);
            };

            var onMoveEvent = function(e) {
                if(list.dragEl) {
                    e.preventDefault();
                    list.dragMove(hasTouch ? e.touches[0] : e);
                }
            };

            var onEndEvent = function(e) {
                if(list.dragEl) {
                    e.preventDefault();
                    list.dragStop(hasTouch ? e.touches[0] : e);
                }
            };

            if(hasTouch) {
                list.el[0].addEventListener(eStart, onStartEvent, false);
                window.addEventListener(eMove, onMoveEvent, false);
                window.addEventListener(eEnd, onEndEvent, false);
                window.addEventListener(eCancel, onEndEvent, false);
            }
            else {
                list.el.on(eStart, onStartEvent);
                list.w.on(eMove, onMoveEvent);
                list.w.on(eEnd, onEndEvent);
            }

        },

        _build: function() {
            function escapeHtml(text) {
                var map = {
                    '&': '&amp;',
                    '<': '&lt;',
                    '>': '&gt;',
                    '"': '&quot;',
                    "'": '&#039;'
                };

                return text + "".replace(/[&<>"']/g, function(m) { return map[m]; });
            }

            function filterClasses(classes) {
                var new_classes = {};

                for(var k in classes) {
                    // Remove duplicates
                    new_classes[classes[k]] = classes[k];
                }

                return new_classes;
            }

            function createClassesString(item, options) {
                var classes = item.classes || {};

                if(typeof classes == 'string') {
                    classes = [classes];
                }

                var item_classes = filterClasses(classes);
                item_classes[options.itemClass] = options.itemClass;

                // create class string
                return $.map(item_classes, function(val) {
                    return val;
                }).join(' ');
            }

            function createDataAttrs(attr) {
                attr = $.extend({}, attr);

                delete attr.children;
                delete attr.classes;
                delete attr.content;

                var data_attrs = {};

                $.each(attr, function(key, value) {
                    if(typeof value == 'object') {
                        value = JSON.stringify(value);
                    }

                    data_attrs["data-" + key] = escapeHtml(value);
                });

                return data_attrs;
            }

            function buildList(items, options) {
                if(!items) {
                    return '';
                }

                var children = '';

                $.each(items, function(index, sub) {
                    children += buildItem(sub, options);
                });

                return options.listRenderer(children, options);
            }

            function buildItem(item, options) {
                var item_attrs = createDataAttrs(item);
                item_attrs["class"] = createClassesString(item, options);

                var content = options.contentCallback(item);
                var children = buildList(item.children, options);

                return options.itemRenderer(item_attrs, content, children, options, item);
            }

            var json = this.options.json;

            if(typeof json == 'string') {
                json = JSON.parse(json);
            }

            $(this.el).html(buildList(json, this.options));
        },

        serialize: function() {
            var data, list = this, step = function(level) {
                var array = [],
                    items = level.children(list.options.itemNodeName);
                items.each(function() {
                    var li = $(this),
                        item = $.extend({}, li.data()),
                        sub = li.children(list.options.listNodeName);

                    if(list.options.includeContent) {
                        var content = li.find('.' + list.options.contentClass).html();

                        if(content) {
                            item.content = content;
                        }
                    }

                    if(sub.length) {
                        item.children = step(sub);
                    }
                    array.push(item);
                });
                return array;
            };
            data = step(list.el.find(list.options.listNodeName).first());
            return data;
        },

        asNestedSet: function() {
            var list = this, o = list.options, depth = -1, ret = [], lft = 1;
            var items = list.el.find(o.listNodeName).first().children(o.itemNodeName);

            items.each(function () {
                lft = traverse(this, depth + 1, lft);
            });

            ret = ret.sort(function(a,b){ return (a.lft - b.lft); });
            return ret;

            function traverse(item, depth, lft) {
                var rgt = lft + 1, id, pid;

                if ($(item).children(o.listNodeName).children(o.itemNodeName).length > 0 ) {
                    depth++;
                    $(item).children(o.listNodeName).children(o.itemNodeName).each(function () {
                        rgt = traverse($(this), depth, rgt);
                    });
                    depth--;
                }

                id = parseInt($(item).attr('data-id'));
                pid = parseInt($(item).parent(o.listNodeName).parent(o.itemNodeName).attr('data-id')) || '';

                if (id) {
                    ret.push({"id": id, "parent_id": pid, "depth": depth, "lft": lft, "rgt": rgt});
                }

                lft = rgt + 1;
                return lft;
            }
        },

        returnOptions: function() {
            return this.options;
        },

        serialise: function() {
            return this.serialize();
        },

        reset: function() {
            this.mouse = {
                offsetX: 0,
                offsetY: 0,
                startX: 0,
                startY: 0,
                lastX: 0,
                lastY: 0,
                nowX: 0,
                nowY: 0,
                distX: 0,
                distY: 0,
                dirAx: 0,
                dirX: 0,
                dirY: 0,
                lastDirX: 0,
                lastDirY: 0,
                distAxX: 0,
                distAxY: 0
            };
            this.moving = false;
            this.dragEl = null;
            this.dragRootEl = null;
            this.dragDepth = 0;
            this.hasNewRoot = false;
            this.pointEl = null;
        },

        expandItem: function(li) {
            li.removeClass(this.options.collapsedClass);
        },

        collapseItem: function(li) {
            var lists = li.children(this.options.listNodeName);
            if(lists.length) {
                li.addClass(this.options.collapsedClass);
            }
        },

        expandAll: function() {
            var list = this;
            list.el.find(list.options.itemNodeName).each(function() {
                list.expandItem($(this));
            });
        },

        collapseAll: function() {
            var list = this;
            list.el.find(list.options.itemNodeName).each(function() {
                list.collapseItem($(this));
            });
        },

        setParent: function(li) {
            if(li.children(this.options.listNodeName).length) {
                li.prepend($(this.options.expandBtnHTML));
                li.prepend($(this.options.collapseBtnHTML));
            }
        },

        unsetParent: function(li) {
            li.removeClass(this.options.collapsedClass);
            li.children('[data-action]').remove();
            li.children(this.options.listNodeName).remove();
        },

        dragStart: function(e) {
            var mouse = this.mouse,
                target = $(e.target),
                dragItem = target.closest(this.options.itemNodeName);

            this.placeEl.css('height', dragItem.height());

            mouse.offsetX = e.pageX - dragItem.offset().left;
            mouse.offsetY = e.pageY - dragItem.offset().top;
            mouse.startX = mouse.lastX = e.pageX;
            mouse.startY = mouse.lastY = e.pageY;

            this.dragRootEl = this.el;
            this.dragEl = $(document.createElement(this.options.listNodeName)).addClass(this.options.listClass + ' ' + this.options.dragClass);
            this.dragEl.css('width', dragItem.outerWidth());

            this.setIndexOfItem(dragItem);

            // fix for zepto.js
            //dragItem.after(this.placeEl).detach().appendTo(this.dragEl);
            dragItem.after(this.placeEl);
            dragItem[0].parentNode.removeChild(dragItem[0]);
            dragItem.appendTo(this.dragEl);

            $(document.body).append(this.dragEl);
            this.dragEl.css({
                'left': e.pageX - mouse.offsetX,
                'top': e.pageY - mouse.offsetY
            });
            // total depth of dragging item
            var i, depth,
                items = this.dragEl.find(this.options.itemNodeName);
            for(i = 0; i < items.length; i++) {
                depth = $(items[i]).parents(this.options.listNodeName).length;
                if(depth > this.dragDepth) {
                    this.dragDepth = depth;
                }
            }
        },

        setIndexOfItem: function(item, index) {
            if((typeof index) === 'undefined') {
                index = [];
            }

            index.unshift(item.index());

            if($(item[0].parentNode)[0] !== this.dragRootEl[0]) {
                this.setIndexOfItem($(item[0].parentNode), index);
            }
            else {
                this.dragEl.data('indexOfItem', index);
            }
        },

        restoreItemAtIndex: function(dragElement) {
            var indexArray = this.dragEl.data('indexOfItem'),
                currentEl = this.el;

            for(i = 0; i < indexArray.length; i++) {
                if((indexArray.length - 1) === parseInt(i)) {
                    placeElement(currentEl, dragElement);
                    return
                }
                currentEl = currentEl[0].children[indexArray[i]];
            }

            function placeElement(currentEl, dragElement) {
                if(indexArray[indexArray.length - 1] === 0) {
                    $(currentEl).prepend(dragElement.clone());
                }
                else {
                    $(currentEl.children[indexArray[indexArray.length - 1] - 1]).after(dragElement.clone());
                }
            }
        },

        dragStop: function(e) {
            // fix for zepto.js
            //this.placeEl.replaceWith(this.dragEl.children(this.options.itemNodeName + ':first').detach());
            var el = this.dragEl.children(this.options.itemNodeName).first();
            el[0].parentNode.removeChild(el[0]);
            this.placeEl.replaceWith(el);

            if(this.hasNewRoot) {
                if(this.options.fixed === true) {
                    this.restoreItemAtIndex(el);
                }
                else {
                    this.el.trigger('lostItem');
                }
                this.dragRootEl.trigger('gainedItem');
            }
            else {
                this.dragRootEl.trigger('change');
            }

            this.dragEl.remove();
            this.options.callback.call(this, this.dragRootEl, el);

            this.reset();
        },

        dragMove: function(e) {
            var list, parent, prev, next, depth,
                opt = this.options,
                mouse = this.mouse;

            this.dragEl.css({
                'left': e.pageX - mouse.offsetX,
                'top': e.pageY - mouse.offsetY
            });

            // mouse position last events
            mouse.lastX = mouse.nowX;
            mouse.lastY = mouse.nowY;
            // mouse position this events
            mouse.nowX = e.pageX;
            mouse.nowY = e.pageY;
            // distance mouse moved between events
            mouse.distX = mouse.nowX - mouse.lastX;
            mouse.distY = mouse.nowY - mouse.lastY;
            // direction mouse was moving
            mouse.lastDirX = mouse.dirX;
            mouse.lastDirY = mouse.dirY;
            // direction mouse is now moving (on both axis)
            mouse.dirX = mouse.distX === 0 ? 0 : mouse.distX > 0 ? 1 : -1;
            mouse.dirY = mouse.distY === 0 ? 0 : mouse.distY > 0 ? 1 : -1;
            // axis mouse is now moving on
            var newAx = Math.abs(mouse.distX) > Math.abs(mouse.distY) ? 1 : 0;

            // do nothing on first move
            if(!mouse.moving) {
                mouse.dirAx = newAx;
                mouse.moving = true;
                return;
            }

            // calc distance moved on this axis (and direction)
            if(mouse.dirAx !== newAx) {
                mouse.distAxX = 0;
                mouse.distAxY = 0;
            }
            else {
                mouse.distAxX += Math.abs(mouse.distX);
                if(mouse.dirX !== 0 && mouse.dirX !== mouse.lastDirX) {
                    mouse.distAxX = 0;
                }
                mouse.distAxY += Math.abs(mouse.distY);
                if(mouse.dirY !== 0 && mouse.dirY !== mouse.lastDirY) {
                    mouse.distAxY = 0;
                }
            }
            mouse.dirAx = newAx;

            /**
             * move horizontal
             */
            if(mouse.dirAx && mouse.distAxX >= opt.threshold) {
                // reset move distance on x-axis for new phase
                mouse.distAxX = 0;
                prev = this.placeEl.prev(opt.itemNodeName);
                // increase horizontal level if previous sibling exists, is not collapsed, and can have children
                if(mouse.distX > 0 && prev.length && !prev.hasClass(opt.collapsedClass) && !prev.hasClass(opt.noChildrenClass)) {
                    // cannot increase level when item above is collapsed
                    list = prev.find(opt.listNodeName).last();
                    // check if depth limit has reached
                    depth = this.placeEl.parents(opt.listNodeName).length;
                    if(depth + this.dragDepth <= opt.maxDepth) {
                        // create new sub-level if one doesn't exist
                        if(!list.length) {
                            list = $('<' + opt.listNodeName + '/>').addClass(opt.listClass);
                            list.append(this.placeEl);
                            prev.append(list);
                            this.setParent(prev);
                        }
                        else {
                            // else append to next level up
                            list = prev.children(opt.listNodeName).last();
                            list.append(this.placeEl);
                        }
                    }
                }
                // decrease horizontal level
                if(mouse.distX < 0) {
                    // we can't decrease a level if an item preceeds the current one
                    next = this.placeEl.next(opt.itemNodeName);
                    if(!next.length) {
                        parent = this.placeEl.parent();
                        this.placeEl.closest(opt.itemNodeName).after(this.placeEl);
                        if(!parent.children().length) {
                            this.unsetParent(parent.parent());
                        }
                    }
                }
            }

            var isEmpty = false;

            // find list item under cursor
            if(!hasPointerEvents) {
                this.dragEl[0].style.visibility = 'hidden';
            }
            this.pointEl = $(document.elementFromPoint(e.pageX - document.body.scrollLeft, e.pageY - (window.pageYOffset || document.documentElement.scrollTop)));
            if(!hasPointerEvents) {
                this.dragEl[0].style.visibility = 'visible';
            }
            if(this.pointEl.hasClass(opt.handleClass)) {
                this.pointEl = this.pointEl.closest(opt.itemNodeName);
            }
            if(this.pointEl.hasClass(opt.emptyClass)) {
                isEmpty = true;
            }
            else if(!this.pointEl.length || !this.pointEl.hasClass(opt.itemClass)) {
                return;
            }

            // find parent list of item under cursor
            var pointElRoot = this.pointEl.closest('.' + opt.rootClass),
                isNewRoot = this.dragRootEl.data('nestable-id') !== pointElRoot.data('nestable-id');

            /**
             * move vertical
             */
            if(!mouse.dirAx || isNewRoot || isEmpty) {
                // check if groups match if dragging over new root
                if(isNewRoot && opt.group !== pointElRoot.data('nestable-group')) {
                    return;
                }

                // fixed item's depth, use for some list has specific type, eg:'Volume, Section, Chapter ...'
                if(this.options.fixedDepth && this.dragDepth + 1 !== this.pointEl.parents(opt.listNodeName).length) {
                    return;
                }

                // check depth limit
                depth = this.dragDepth - 1 + this.pointEl.parents(opt.listNodeName).length;
                if(depth > opt.maxDepth) {
                    return;
                }
                var before = e.pageY < (this.pointEl.offset().top + this.pointEl.height() / 2);
                parent = this.placeEl.parent();
                // if empty create new list to replace empty placeholder
                if(isEmpty) {
                    list = $(document.createElement(opt.listNodeName)).addClass(opt.listClass);
                    list.append(this.placeEl);
                    this.pointEl.replaceWith(list);
                }
                else if(before) {
                    this.pointEl.before(this.placeEl);
                }
                else {
                    this.pointEl.after(this.placeEl);
                }
                if(!parent.children().length) {
                    this.unsetParent(parent.parent());
                }
                if(!this.dragRootEl.find(opt.itemNodeName).length) {
                    this.dragRootEl.append('<div class="' + opt.emptyClass + '"/>');
                }
                // parent root list has changed
                this.dragRootEl = pointElRoot;
                if(isNewRoot) {
                    this.hasNewRoot = this.el[0] !== this.dragRootEl[0];
                }
            }
        }

    };

    $.fn.nestable = function(params) {
        var lists = this,
            retval = this;

        if(!('Nestable' in window)) {
            window.Nestable = {};
            Nestable.counter = 0;
        }

        lists.each(function() {
            var plugin = $(this).data("nestable");

            if(!plugin) {
                Nestable.counter++;
                $(this).data("nestable", new Plugin(this, params));
                $(this).data("nestable-id", Nestable.counter);

            }
            else {
                if(typeof params === 'string' && typeof plugin[params] === 'function') {
                    retval = plugin[params]();
                }
            }
        });

        return retval || lists;
    };

})(window.jQuery || window.Zepto, window, document);

/*! jQuery Validation Plugin - v1.15.0 - 2/24/2016
 * http://jqueryvalidation.org/
 * Copyright (c) 2016 J??rn Zaefferer; Licensed MIT */
!function(a){"function"==typeof define&&define.amd?define(["jquery"],a):"object"==typeof module&&module.exports?module.exports=a(require("jquery")):a(jQuery)}(function(a){a.extend(a.fn,{validate:function(b){if(!this.length)return void(b&&b.debug&&window.console&&console.warn("Nothing selected, can't validate, returning nothing."));var c=a.data(this[0],"validator");return c?c:(this.attr("novalidate","novalidate"),c=new a.validator(b,this[0]),a.data(this[0],"validator",c),c.settings.onsubmit&&(this.on("click.validate",":submit",function(b){c.settings.submitHandler&&(c.submitButton=b.target),a(this).hasClass("cancel")&&(c.cancelSubmit=!0),void 0!==a(this).attr("formnovalidate")&&(c.cancelSubmit=!0)}),this.on("submit.validate",function(b){function d(){var d,e;return c.settings.submitHandler?(c.submitButton&&(d=a("<input type='hidden'/>").attr("name",c.submitButton.name).val(a(c.submitButton).val()).appendTo(c.currentForm)),e=c.settings.submitHandler.call(c,c.currentForm,b),c.submitButton&&d.remove(),void 0!==e?e:!1):!0}return c.settings.debug&&b.preventDefault(),c.cancelSubmit?(c.cancelSubmit=!1,d()):c.form()?c.pendingRequest?(c.formSubmitted=!0,!1):d():(c.focusInvalid(),!1)})),c)},valid:function(){var b,c,d;return a(this[0]).is("form")?b=this.validate().form():(d=[],b=!0,c=a(this[0].form).validate(),this.each(function(){b=c.element(this)&&b,b||(d=d.concat(c.errorList))}),c.errorList=d),b},rules:function(b,c){if(this.length){var d,e,f,g,h,i,j=this[0];if(b)switch(d=a.data(j.form,"validator").settings,e=d.rules,f=a.validator.staticRules(j),b){case"add":a.extend(f,a.validator.normalizeRule(c)),delete f.messages,e[j.name]=f,c.messages&&(d.messages[j.name]=a.extend(d.messages[j.name],c.messages));break;case"remove":return c?(i={},a.each(c.split(/\s/),function(b,c){i[c]=f[c],delete f[c],"required"===c&&a(j).removeAttr("aria-required")}),i):(delete e[j.name],f)}return g=a.validator.normalizeRules(a.extend({},a.validator.classRules(j),a.validator.attributeRules(j),a.validator.dataRules(j),a.validator.staticRules(j)),j),g.required&&(h=g.required,delete g.required,g=a.extend({required:h},g),a(j).attr("aria-required","true")),g.remote&&(h=g.remote,delete g.remote,g=a.extend(g,{remote:h})),g}}}),a.extend(a.expr[":"],{blank:function(b){return!a.trim(""+a(b).val())},filled:function(b){var c=a(b).val();return null!==c&&!!a.trim(""+c)},unchecked:function(b){return!a(b).prop("checked")}}),a.validator=function(b,c){this.settings=a.extend(!0,{},a.validator.defaults,b),this.currentForm=c,this.init()},a.validator.format=function(b,c){return 1===arguments.length?function(){var c=a.makeArray(arguments);return c.unshift(b),a.validator.format.apply(this,c)}:void 0===c?b:(arguments.length>2&&c.constructor!==Array&&(c=a.makeArray(arguments).slice(1)),c.constructor!==Array&&(c=[c]),a.each(c,function(a,c){b=b.replace(new RegExp("\\{"+a+"\\}","g"),function(){return c})}),b)},a.extend(a.validator,{defaults:{messages:{},groups:{},rules:{},errorClass:"error",pendingClass:"pending",validClass:"valid",errorElement:"label",focusCleanup:!1,focusInvalid:!0,errorContainer:a([]),errorLabelContainer:a([]),onsubmit:!0,ignore:":hidden",ignoreTitle:!1,onfocusin:function(a){this.lastActive=a,this.settings.focusCleanup&&(this.settings.unhighlight&&this.settings.unhighlight.call(this,a,this.settings.errorClass,this.settings.validClass),this.hideThese(this.errorsFor(a)))},onfocusout:function(a){this.checkable(a)||!(a.name in this.submitted)&&this.optional(a)||this.element(a)},onkeyup:function(b,c){var d=[16,17,18,20,35,36,37,38,39,40,45,144,225];9===c.which&&""===this.elementValue(b)||-1!==a.inArray(c.keyCode,d)||(b.name in this.submitted||b.name in this.invalid)&&this.element(b)},onclick:function(a){a.name in this.submitted?this.element(a):a.parentNode.name in this.submitted&&this.element(a.parentNode)},highlight:function(b,c,d){"radio"===b.type?this.findByName(b.name).addClass(c).removeClass(d):a(b).addClass(c).removeClass(d)},unhighlight:function(b,c,d){"radio"===b.type?this.findByName(b.name).removeClass(c).addClass(d):a(b).removeClass(c).addClass(d)}},setDefaults:function(b){a.extend(a.validator.defaults,b)},messages:{required:"This field is required.",remote:"Please fix this field.",email:"Please enter a valid email address.",url:"Please enter a valid URL.",date:"Please enter a valid date.",dateISO:"Please enter a valid date ( ISO ).",number:"Please enter a valid number.",digits:"Please enter only digits.",equalTo:"Please enter the same value again.",maxlength:a.validator.format("Please enter no more than {0} characters."),minlength:a.validator.format("Please enter at least {0} characters."),rangelength:a.validator.format("Please enter a value between {0} and {1} characters long."),range:a.validator.format("Please enter a value between {0} and {1}."),max:a.validator.format("Please enter a value less than or equal to {0}."),min:a.validator.format("Please enter a value greater than or equal to {0}."),step:a.validator.format("Please enter a multiple of {0}.")},autoCreateRanges:!1,prototype:{init:function(){function b(b){var c=a.data(this.form,"validator"),d="on"+b.type.replace(/^validate/,""),e=c.settings;e[d]&&!a(this).is(e.ignore)&&e[d].call(c,this,b)}this.labelContainer=a(this.settings.errorLabelContainer),this.errorContext=this.labelContainer.length&&this.labelContainer||a(this.currentForm),this.containers=a(this.settings.errorContainer).add(this.settings.errorLabelContainer),this.submitted={},this.valueCache={},this.pendingRequest=0,this.pending={},this.invalid={},this.reset();var c,d=this.groups={};a.each(this.settings.groups,function(b,c){"string"==typeof c&&(c=c.split(/\s/)),a.each(c,function(a,c){d[c]=b})}),c=this.settings.rules,a.each(c,function(b,d){c[b]=a.validator.normalizeRule(d)}),a(this.currentForm).on("focusin.validate focusout.validate keyup.validate",":text, [type='password'], [type='file'], select, textarea, [type='number'], [type='search'], [type='tel'], [type='url'], [type='email'], [type='datetime'], [type='date'], [type='month'], [type='week'], [type='time'], [type='datetime-local'], [type='range'], [type='color'], [type='radio'], [type='checkbox'], [contenteditable]",b).on("click.validate","select, option, [type='radio'], [type='checkbox']",b),this.settings.invalidHandler&&a(this.currentForm).on("invalid-form.validate",this.settings.invalidHandler),a(this.currentForm).find("[required], [data-rule-required], .required").attr("aria-required","true")},form:function(){return this.checkForm(),a.extend(this.submitted,this.errorMap),this.invalid=a.extend({},this.errorMap),this.valid()||a(this.currentForm).triggerHandler("invalid-form",[this]),this.showErrors(),this.valid()},checkForm:function(){this.prepareForm();for(var a=0,b=this.currentElements=this.elements();b[a];a++)this.check(b[a]);return this.valid()},element:function(b){var c,d,e=this.clean(b),f=this.validationTargetFor(e),g=this,h=!0;return void 0===f?delete this.invalid[e.name]:(this.prepareElement(f),this.currentElements=a(f),d=this.groups[f.name],d&&a.each(this.groups,function(a,b){b===d&&a!==f.name&&(e=g.validationTargetFor(g.clean(g.findByName(a))),e&&e.name in g.invalid&&(g.currentElements.push(e),h=h&&g.check(e)))}),c=this.check(f)!==!1,h=h&&c,c?this.invalid[f.name]=!1:this.invalid[f.name]=!0,this.numberOfInvalids()||(this.toHide=this.toHide.add(this.containers)),this.showErrors(),a(b).attr("aria-invalid",!c)),h},showErrors:function(b){if(b){var c=this;a.extend(this.errorMap,b),this.errorList=a.map(this.errorMap,function(a,b){return{message:a,element:c.findByName(b)[0]}}),this.successList=a.grep(this.successList,function(a){return!(a.name in b)})}this.settings.showErrors?this.settings.showErrors.call(this,this.errorMap,this.errorList):this.defaultShowErrors()},resetForm:function(){a.fn.resetForm&&a(this.currentForm).resetForm(),this.invalid={},this.submitted={},this.prepareForm(),this.hideErrors();var b=this.elements().removeData("previousValue").removeAttr("aria-invalid");this.resetElements(b)},resetElements:function(a){var b;if(this.settings.unhighlight)for(b=0;a[b];b++)this.settings.unhighlight.call(this,a[b],this.settings.errorClass,""),this.findByName(a[b].name).removeClass(this.settings.validClass);else a.removeClass(this.settings.errorClass).removeClass(this.settings.validClass)},numberOfInvalids:function(){return this.objectLength(this.invalid)},objectLength:function(a){var b,c=0;for(b in a)a[b]&&c++;return c},hideErrors:function(){this.hideThese(this.toHide)},hideThese:function(a){a.not(this.containers).text(""),this.addWrapper(a).hide()},valid:function(){return 0===this.size()},size:function(){return this.errorList.length},focusInvalid:function(){if(this.settings.focusInvalid)try{a(this.findLastActive()||this.errorList.length&&this.errorList[0].element||[]).filter(":visible").focus().trigger("focusin")}catch(b){}},findLastActive:function(){var b=this.lastActive;return b&&1===a.grep(this.errorList,function(a){return a.element.name===b.name}).length&&b},elements:function(){var b=this,c={};return a(this.currentForm).find("input, select, textarea, [contenteditable]").not(":submit, :reset, :image, :disabled").not(this.settings.ignore).filter(function(){var d=this.name||a(this).attr("name");return!d&&b.settings.debug&&window.console&&console.error("%o has no name assigned",this),this.hasAttribute("contenteditable")&&(this.form=a(this).closest("form")[0]),d in c||!b.objectLength(a(this).rules())?!1:(c[d]=!0,!0)})},clean:function(b){return a(b)[0]},errors:function(){var b=this.settings.errorClass.split(" ").join(".");return a(this.settings.errorElement+"."+b,this.errorContext)},resetInternals:function(){this.successList=[],this.errorList=[],this.errorMap={},this.toShow=a([]),this.toHide=a([])},reset:function(){this.resetInternals(),this.currentElements=a([])},prepareForm:function(){this.reset(),this.toHide=this.errors().add(this.containers)},prepareElement:function(a){this.reset(),this.toHide=this.errorsFor(a)},elementValue:function(b){var c,d,e=a(b),f=b.type;return"radio"===f||"checkbox"===f?this.findByName(b.name).filter(":checked").val():"number"===f&&"undefined"!=typeof b.validity?b.validity.badInput?"NaN":e.val():(c=b.hasAttribute("contenteditable")?e.text():e.val(),"file"===f?"C:\\fakepath\\"===c.substr(0,12)?c.substr(12):(d=c.lastIndexOf("/"),d>=0?c.substr(d+1):(d=c.lastIndexOf("\\"),d>=0?c.substr(d+1):c)):"string"==typeof c?c.replace(/\r/g,""):c)},check:function(b){b=this.validationTargetFor(this.clean(b));var c,d,e,f=a(b).rules(),g=a.map(f,function(a,b){return b}).length,h=!1,i=this.elementValue(b);if("function"==typeof f.normalizer){if(i=f.normalizer.call(b,i),"string"!=typeof i)throw new TypeError("The normalizer should return a string value.");delete f.normalizer}for(d in f){e={method:d,parameters:f[d]};try{if(c=a.validator.methods[d].call(this,i,b,e.parameters),"dependency-mismatch"===c&&1===g){h=!0;continue}if(h=!1,"pending"===c)return void(this.toHide=this.toHide.not(this.errorsFor(b)));if(!c)return this.formatAndAdd(b,e),!1}catch(j){throw this.settings.debug&&window.console&&console.log("Exception occurred when checking element "+b.id+", check the '"+e.method+"' method.",j),j instanceof TypeError&&(j.message+=".  Exception occurred when checking element "+b.id+", check the '"+e.method+"' method."),j}}if(!h)return this.objectLength(f)&&this.successList.push(b),!0},customDataMessage:function(b,c){return a(b).data("msg"+c.charAt(0).toUpperCase()+c.substring(1).toLowerCase())||a(b).data("msg")},customMessage:function(a,b){var c=this.settings.messages[a];return c&&(c.constructor===String?c:c[b])},findDefined:function(){for(var a=0;a<arguments.length;a++)if(void 0!==arguments[a])return arguments[a]},defaultMessage:function(b,c){var d=this.findDefined(this.customMessage(b.name,c.method),this.customDataMessage(b,c.method),!this.settings.ignoreTitle&&b.title||void 0,a.validator.messages[c.method],"<strong>Warning: No message defined for "+b.name+"</strong>"),e=/\$?\{(\d+)\}/g;return"function"==typeof d?d=d.call(this,c.parameters,b):e.test(d)&&(d=a.validator.format(d.replace(e,"{$1}"),c.parameters)),d},formatAndAdd:function(a,b){var c=this.defaultMessage(a,b);this.errorList.push({message:c,element:a,method:b.method}),this.errorMap[a.name]=c,this.submitted[a.name]=c},addWrapper:function(a){return this.settings.wrapper&&(a=a.add(a.parent(this.settings.wrapper))),a},defaultShowErrors:function(){var a,b,c;for(a=0;this.errorList[a];a++)c=this.errorList[a],this.settings.highlight&&this.settings.highlight.call(this,c.element,this.settings.errorClass,this.settings.validClass),this.showLabel(c.element,c.message);if(this.errorList.length&&(this.toShow=this.toShow.add(this.containers)),this.settings.success)for(a=0;this.successList[a];a++)this.showLabel(this.successList[a]);if(this.settings.unhighlight)for(a=0,b=this.validElements();b[a];a++)this.settings.unhighlight.call(this,b[a],this.settings.errorClass,this.settings.validClass);this.toHide=this.toHide.not(this.toShow),this.hideErrors(),this.addWrapper(this.toShow).show()},validElements:function(){return this.currentElements.not(this.invalidElements())},invalidElements:function(){return a(this.errorList).map(function(){return this.element})},showLabel:function(b,c){var d,e,f,g,h=this.errorsFor(b),i=this.idOrName(b),j=a(b).attr("aria-describedby");h.length?(h.removeClass(this.settings.validClass).addClass(this.settings.errorClass),h.html(c)):(h=a("<"+this.settings.errorElement+">").attr("id",i+"-error").addClass(this.settings.errorClass).html(c||""),d=h,this.settings.wrapper&&(d=h.hide().show().wrap("<"+this.settings.wrapper+"/>").parent()),this.labelContainer.length?this.labelContainer.append(d):this.settings.errorPlacement?this.settings.errorPlacement(d,a(b)):d.insertAfter(b),h.is("label")?h.attr("for",i):0===h.parents("label[for='"+this.escapeCssMeta(i)+"']").length&&(f=h.attr("id"),j?j.match(new RegExp("\\b"+this.escapeCssMeta(f)+"\\b"))||(j+=" "+f):j=f,a(b).attr("aria-describedby",j),e=this.groups[b.name],e&&(g=this,a.each(g.groups,function(b,c){c===e&&a("[name='"+g.escapeCssMeta(b)+"']",g.currentForm).attr("aria-describedby",h.attr("id"))})))),!c&&this.settings.success&&(h.text(""),"string"==typeof this.settings.success?h.addClass(this.settings.success):this.settings.success(h,b)),this.toShow=this.toShow.add(h)},errorsFor:function(b){var c=this.escapeCssMeta(this.idOrName(b)),d=a(b).attr("aria-describedby"),e="label[for='"+c+"'], label[for='"+c+"'] *";return d&&(e=e+", #"+this.escapeCssMeta(d).replace(/\s+/g,", #")),this.errors().filter(e)},escapeCssMeta:function(a){return a.replace(/([\\!"#$%&'()*+,./:;<=>?@\[\]^`{|}~])/g,"\\$1")},idOrName:function(a){return this.groups[a.name]||(this.checkable(a)?a.name:a.id||a.name)},validationTargetFor:function(b){return this.checkable(b)&&(b=this.findByName(b.name)),a(b).not(this.settings.ignore)[0]},checkable:function(a){return/radio|checkbox/i.test(a.type)},findByName:function(b){return a(this.currentForm).find("[name='"+this.escapeCssMeta(b)+"']")},getLength:function(b,c){switch(c.nodeName.toLowerCase()){case"select":return a("option:selected",c).length;case"input":if(this.checkable(c))return this.findByName(c.name).filter(":checked").length}return b.length},depend:function(a,b){return this.dependTypes[typeof a]?this.dependTypes[typeof a](a,b):!0},dependTypes:{"boolean":function(a){return a},string:function(b,c){return!!a(b,c.form).length},"function":function(a,b){return a(b)}},optional:function(b){var c=this.elementValue(b);return!a.validator.methods.required.call(this,c,b)&&"dependency-mismatch"},startRequest:function(b){this.pending[b.name]||(this.pendingRequest++,a(b).addClass(this.settings.pendingClass),this.pending[b.name]=!0)},stopRequest:function(b,c){this.pendingRequest--,this.pendingRequest<0&&(this.pendingRequest=0),delete this.pending[b.name],a(b).removeClass(this.settings.pendingClass),c&&0===this.pendingRequest&&this.formSubmitted&&this.form()?(a(this.currentForm).submit(),this.formSubmitted=!1):!c&&0===this.pendingRequest&&this.formSubmitted&&(a(this.currentForm).triggerHandler("invalid-form",[this]),this.formSubmitted=!1)},previousValue:function(b,c){return a.data(b,"previousValue")||a.data(b,"previousValue",{old:null,valid:!0,message:this.defaultMessage(b,{method:c})})},destroy:function(){this.resetForm(),a(this.currentForm).off(".validate").removeData("validator").find(".validate-equalTo-blur").off(".validate-equalTo").removeClass("validate-equalTo-blur")}},classRuleSettings:{required:{required:!0},email:{email:!0},url:{url:!0},date:{date:!0},dateISO:{dateISO:!0},number:{number:!0},digits:{digits:!0},creditcard:{creditcard:!0}},addClassRules:function(b,c){b.constructor===String?this.classRuleSettings[b]=c:a.extend(this.classRuleSettings,b)},classRules:function(b){var c={},d=a(b).attr("class");return d&&a.each(d.split(" "),function(){this in a.validator.classRuleSettings&&a.extend(c,a.validator.classRuleSettings[this])}),c},normalizeAttributeRule:function(a,b,c,d){/min|max|step/.test(c)&&(null===b||/number|range|text/.test(b))&&(d=Number(d),isNaN(d)&&(d=void 0)),d||0===d?a[c]=d:b===c&&"range"!==b&&(a[c]=!0)},attributeRules:function(b){var c,d,e={},f=a(b),g=b.getAttribute("type");for(c in a.validator.methods)"required"===c?(d=b.getAttribute(c),""===d&&(d=!0),d=!!d):d=f.attr(c),this.normalizeAttributeRule(e,g,c,d);return e.maxlength&&/-1|2147483647|524288/.test(e.maxlength)&&delete e.maxlength,e},dataRules:function(b){var c,d,e={},f=a(b),g=b.getAttribute("type");for(c in a.validator.methods)d=f.data("rule"+c.charAt(0).toUpperCase()+c.substring(1).toLowerCase()),this.normalizeAttributeRule(e,g,c,d);return e},staticRules:function(b){var c={},d=a.data(b.form,"validator");return d.settings.rules&&(c=a.validator.normalizeRule(d.settings.rules[b.name])||{}),c},normalizeRules:function(b,c){return a.each(b,function(d,e){if(e===!1)return void delete b[d];if(e.param||e.depends){var f=!0;switch(typeof e.depends){case"string":f=!!a(e.depends,c.form).length;break;case"function":f=e.depends.call(c,c)}f?b[d]=void 0!==e.param?e.param:!0:(a.data(c.form,"validator").resetElements(a(c)),delete b[d])}}),a.each(b,function(d,e){b[d]=a.isFunction(e)&&"normalizer"!==d?e(c):e}),a.each(["minlength","maxlength"],function(){b[this]&&(b[this]=Number(b[this]))}),a.each(["rangelength","range"],function(){var c;b[this]&&(a.isArray(b[this])?b[this]=[Number(b[this][0]),Number(b[this][1])]:"string"==typeof b[this]&&(c=b[this].replace(/[\[\]]/g,"").split(/[\s,]+/),b[this]=[Number(c[0]),Number(c[1])]))}),a.validator.autoCreateRanges&&(null!=b.min&&null!=b.max&&(b.range=[b.min,b.max],delete b.min,delete b.max),null!=b.minlength&&null!=b.maxlength&&(b.rangelength=[b.minlength,b.maxlength],delete b.minlength,delete b.maxlength)),b},normalizeRule:function(b){if("string"==typeof b){var c={};a.each(b.split(/\s/),function(){c[this]=!0}),b=c}return b},addMethod:function(b,c,d){a.validator.methods[b]=c,a.validator.messages[b]=void 0!==d?d:a.validator.messages[b],c.length<3&&a.validator.addClassRules(b,a.validator.normalizeRule(b))},methods:{required:function(b,c,d){if(!this.depend(d,c))return"dependency-mismatch";if("select"===c.nodeName.toLowerCase()){var e=a(c).val();return e&&e.length>0}return this.checkable(c)?this.getLength(b,c)>0:b.length>0},email:function(a,b){return this.optional(b)||/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(a)},url:function(a,b){return this.optional(b)||/^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})).?)(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(a)},date:function(a,b){return this.optional(b)||!/Invalid|NaN/.test(new Date(a).toString())},dateISO:function(a,b){return this.optional(b)||/^\d{4}[\/\-](0?[1-9]|1[012])[\/\-](0?[1-9]|[12][0-9]|3[01])$/.test(a)},number:function(a,b){return this.optional(b)||/^(?:-?\d+|-?\d{1,3}(?:,\d{3})+)?(?:\.\d+)?$/.test(a)},digits:function(a,b){return this.optional(b)||/^\d+$/.test(a)},minlength:function(b,c,d){var e=a.isArray(b)?b.length:this.getLength(b,c);return this.optional(c)||e>=d},maxlength:function(b,c,d){var e=a.isArray(b)?b.length:this.getLength(b,c);return this.optional(c)||d>=e},rangelength:function(b,c,d){var e=a.isArray(b)?b.length:this.getLength(b,c);return this.optional(c)||e>=d[0]&&e<=d[1]},min:function(a,b,c){return this.optional(b)||a>=c},max:function(a,b,c){return this.optional(b)||c>=a},range:function(a,b,c){return this.optional(b)||a>=c[0]&&a<=c[1]},step:function(b,c,d){var e=a(c).attr("type"),f="Step attribute on input type "+e+" is not supported.",g=["text","number","range"],h=new RegExp("\\b"+e+"\\b"),i=e&&!h.test(g.join());if(i)throw new Error(f);return this.optional(c)||b%d===0},equalTo:function(b,c,d){var e=a(d);return this.settings.onfocusout&&e.not(".validate-equalTo-blur").length&&e.addClass("validate-equalTo-blur").on("blur.validate-equalTo",function(){a(c).valid()}),b===e.val()},remote:function(b,c,d,e){if(this.optional(c))return"dependency-mismatch";e="string"==typeof e&&e||"remote";var f,g,h,i=this.previousValue(c,e);return this.settings.messages[c.name]||(this.settings.messages[c.name]={}),i.originalMessage=i.originalMessage||this.settings.messages[c.name][e],this.settings.messages[c.name][e]=i.message,d="string"==typeof d&&{url:d}||d,h=a.param(a.extend({data:b},d.data)),i.old===h?i.valid:(i.old=h,f=this,this.startRequest(c),g={},g[c.name]=b,a.ajax(a.extend(!0,{mode:"abort",port:"validate"+c.name,dataType:"json",data:g,context:f.currentForm,success:function(a){var d,g,h,j=a===!0||"true"===a;f.settings.messages[c.name][e]=i.originalMessage,j?(h=f.formSubmitted,f.resetInternals(),f.toHide=f.errorsFor(c),f.formSubmitted=h,f.successList.push(c),f.invalid[c.name]=!1,f.showErrors()):(d={},g=a||f.defaultMessage(c,{method:e,parameters:b}),d[c.name]=i.message=g,f.invalid[c.name]=!0,f.showErrors(d)),i.valid=j,f.stopRequest(c,j)}},d)),"pending")}}});var b,c={};a.ajaxPrefilter?a.ajaxPrefilter(function(a,b,d){var e=a.port;"abort"===a.mode&&(c[e]&&c[e].abort(),c[e]=d)}):(b=a.ajax,a.ajax=function(d){var e=("mode"in d?d:a.ajaxSettings).mode,f=("port"in d?d:a.ajaxSettings).port;return"abort"===e?(c[f]&&c[f].abort(),c[f]=b.apply(this,arguments),c[f]):b.apply(this,arguments)})});
/*! jQuery Validation Plugin - v1.15.0 - 2/24/2016
 * http://jqueryvalidation.org/
 * Copyright (c) 2016 J??rn Zaefferer; Licensed MIT */
!function(a){"function"==typeof define&&define.amd?define(["jquery","./jquery.validate.min"],a):"object"==typeof module&&module.exports?module.exports=a(require("jquery")):a(jQuery)}(function(a){!function(){function b(a){return a.replace(/<.[^<>]*?>/g," ").replace(/&nbsp;|&#160;/gi," ").replace(/[.(),;:!?%#$'\"_+=\/\-?????????]*/g,"")}a.validator.addMethod("maxWords",function(a,c,d){return this.optional(c)||b(a).match(/\b\w+\b/g).length<=d},a.validator.format("Please enter {0} words or less.")),a.validator.addMethod("minWords",function(a,c,d){return this.optional(c)||b(a).match(/\b\w+\b/g).length>=d},a.validator.format("Please enter at least {0} words.")),a.validator.addMethod("rangeWords",function(a,c,d){var e=b(a),f=/\b\w+\b/g;return this.optional(c)||e.match(f).length>=d[0]&&e.match(f).length<=d[1]},a.validator.format("Please enter between {0} and {1} words."))}(),a.validator.addMethod("accept",function(b,c,d){var e,f,g,h="string"==typeof d?d.replace(/\s/g,""):"image/*",i=this.optional(c);if(i)return i;if("file"===a(c).attr("type")&&(h=h.replace(/[\-\[\]\/\{\}\(\)\+\?\.\\\^\$\|]/g,"\\$&").replace(/,/g,"|").replace("/*","/.*"),c.files&&c.files.length))for(g=new RegExp(".?("+h+")$","i"),e=0;e<c.files.length;e++)if(f=c.files[e],!f.type.match(g))return!1;return!0},a.validator.format("Please enter a value with a valid mimetype.")),a.validator.addMethod("alphanumeric",function(a,b){return this.optional(b)||/^\w+$/i.test(a)},"Letters, numbers, and underscores only please"),a.validator.addMethod("bankaccountNL",function(a,b){if(this.optional(b))return!0;if(!/^[0-9]{9}|([0-9]{2} ){3}[0-9]{3}$/.test(a))return!1;var c,d,e,f=a.replace(/ /g,""),g=0,h=f.length;for(c=0;h>c;c++)d=h-c,e=f.substring(c,c+1),g+=d*e;return g%11===0},"Please specify a valid bank account number"),a.validator.addMethod("bankorgiroaccountNL",function(b,c){return this.optional(c)||a.validator.methods.bankaccountNL.call(this,b,c)||a.validator.methods.giroaccountNL.call(this,b,c)},"Please specify a valid bank or giro account number"),a.validator.addMethod("bic",function(a,b){return this.optional(b)||/^([A-Z]{6}[A-Z2-9][A-NP-Z1-9])(X{3}|[A-WY-Z0-9][A-Z0-9]{2})?$/.test(a.toUpperCase())},"Please specify a valid BIC code"),a.validator.addMethod("cifES",function(a){"use strict";var b,c,d,e,f,g,h=[];if(a=a.toUpperCase(),!a.match("((^[A-Z]{1}[0-9]{7}[A-Z0-9]{1}$|^[T]{1}[A-Z0-9]{8}$)|^[0-9]{8}[A-Z]{1}$)"))return!1;for(d=0;9>d;d++)h[d]=parseInt(a.charAt(d),10);for(c=h[2]+h[4]+h[6],e=1;8>e;e+=2)f=(2*h[e]).toString(),g=f.charAt(1),c+=parseInt(f.charAt(0),10)+(""===g?0:parseInt(g,10));return/^[ABCDEFGHJNPQRSUVW]{1}/.test(a)?(c+="",b=10-parseInt(c.charAt(c.length-1),10),a+=b,h[8].toString()===String.fromCharCode(64+b)||h[8].toString()===a.charAt(a.length-1)):!1},"Please specify a valid CIF number."),a.validator.addMethod("cpfBR",function(a){if(a=a.replace(/([~!@#$%^&*()_+=`{}\[\]\-|\\:;'<>,.\/? ])+/g,""),11!==a.length)return!1;var b,c,d,e,f=0;if(b=parseInt(a.substring(9,10),10),c=parseInt(a.substring(10,11),10),d=function(a,b){var c=10*a%11;return 10!==c&&11!==c||(c=0),c===b},""===a||"00000000000"===a||"11111111111"===a||"22222222222"===a||"33333333333"===a||"44444444444"===a||"55555555555"===a||"66666666666"===a||"77777777777"===a||"88888888888"===a||"99999999999"===a)return!1;for(e=1;9>=e;e++)f+=parseInt(a.substring(e-1,e),10)*(11-e);if(d(f,b)){for(f=0,e=1;10>=e;e++)f+=parseInt(a.substring(e-1,e),10)*(12-e);return d(f,c)}return!1},"Please specify a valid CPF number"),a.validator.addMethod("creditcard",function(a,b){if(this.optional(b))return"dependency-mismatch";if(/[^0-9 \-]+/.test(a))return!1;var c,d,e=0,f=0,g=!1;if(a=a.replace(/\D/g,""),a.length<13||a.length>19)return!1;for(c=a.length-1;c>=0;c--)d=a.charAt(c),f=parseInt(d,10),g&&(f*=2)>9&&(f-=9),e+=f,g=!g;return e%10===0},"Please enter a valid credit card number."),a.validator.addMethod("creditcardtypes",function(a,b,c){if(/[^0-9\-]+/.test(a))return!1;a=a.replace(/\D/g,"");var d=0;return c.mastercard&&(d|=1),c.visa&&(d|=2),c.amex&&(d|=4),c.dinersclub&&(d|=8),c.enroute&&(d|=16),c.discover&&(d|=32),c.jcb&&(d|=64),c.unknown&&(d|=128),c.all&&(d=255),1&d&&/^(5[12345])/.test(a)?16===a.length:2&d&&/^(4)/.test(a)?16===a.length:4&d&&/^(3[47])/.test(a)?15===a.length:8&d&&/^(3(0[012345]|[68]))/.test(a)?14===a.length:16&d&&/^(2(014|149))/.test(a)?15===a.length:32&d&&/^(6011)/.test(a)?16===a.length:64&d&&/^(3)/.test(a)?16===a.length:64&d&&/^(2131|1800)/.test(a)?15===a.length:!!(128&d)},"Please enter a valid credit card number."),a.validator.addMethod("currency",function(a,b,c){var d,e="string"==typeof c,f=e?c:c[0],g=e?!0:c[1];return f=f.replace(/,/g,""),f=g?f+"]":f+"]?",d="^["+f+"([1-9]{1}[0-9]{0,2}(\\,[0-9]{3})*(\\.[0-9]{0,2})?|[1-9]{1}[0-9]{0,}(\\.[0-9]{0,2})?|0(\\.[0-9]{0,2})?|(\\.[0-9]{1,2})?)$",d=new RegExp(d),this.optional(b)||d.test(a)},"Please specify a valid currency"),a.validator.addMethod("dateFA",function(a,b){return this.optional(b)||/^[1-4]\d{3}\/((0?[1-6]\/((3[0-1])|([1-2][0-9])|(0?[1-9])))|((1[0-2]|(0?[7-9]))\/(30|([1-2][0-9])|(0?[1-9]))))$/.test(a)},a.validator.messages.date),a.validator.addMethod("dateITA",function(a,b){var c,d,e,f,g,h=!1,i=/^\d{1,2}\/\d{1,2}\/\d{4}$/;return i.test(a)?(c=a.split("/"),d=parseInt(c[0],10),e=parseInt(c[1],10),f=parseInt(c[2],10),g=new Date(Date.UTC(f,e-1,d,12,0,0,0)),h=g.getUTCFullYear()===f&&g.getUTCMonth()===e-1&&g.getUTCDate()===d):h=!1,this.optional(b)||h},a.validator.messages.date),a.validator.addMethod("dateNL",function(a,b){return this.optional(b)||/^(0?[1-9]|[12]\d|3[01])[\.\/\-](0?[1-9]|1[012])[\.\/\-]([12]\d)?(\d\d)$/.test(a)},a.validator.messages.date),a.validator.addMethod("extension",function(a,b,c){return c="string"==typeof c?c.replace(/,/g,"|"):"png|jpe?g|gif",this.optional(b)||a.match(new RegExp("\\.("+c+")$","i"))},a.validator.format("Please enter a value with a valid extension.")),a.validator.addMethod("giroaccountNL",function(a,b){return this.optional(b)||/^[0-9]{1,7}$/.test(a)},"Please specify a valid giro account number"),a.validator.addMethod("iban",function(a,b){if(this.optional(b))return!0;var c,d,e,f,g,h,i,j,k,l=a.replace(/ /g,"").toUpperCase(),m="",n=!0,o="",p="";if(c=l.substring(0,2),h={AL:"\\d{8}[\\dA-Z]{16}",AD:"\\d{8}[\\dA-Z]{12}",AT:"\\d{16}",AZ:"[\\dA-Z]{4}\\d{20}",BE:"\\d{12}",BH:"[A-Z]{4}[\\dA-Z]{14}",BA:"\\d{16}",BR:"\\d{23}[A-Z][\\dA-Z]",BG:"[A-Z]{4}\\d{6}[\\dA-Z]{8}",CR:"\\d{17}",HR:"\\d{17}",CY:"\\d{8}[\\dA-Z]{16}",CZ:"\\d{20}",DK:"\\d{14}",DO:"[A-Z]{4}\\d{20}",EE:"\\d{16}",FO:"\\d{14}",FI:"\\d{14}",FR:"\\d{10}[\\dA-Z]{11}\\d{2}",GE:"[\\dA-Z]{2}\\d{16}",DE:"\\d{18}",GI:"[A-Z]{4}[\\dA-Z]{15}",GR:"\\d{7}[\\dA-Z]{16}",GL:"\\d{14}",GT:"[\\dA-Z]{4}[\\dA-Z]{20}",HU:"\\d{24}",IS:"\\d{22}",IE:"[\\dA-Z]{4}\\d{14}",IL:"\\d{19}",IT:"[A-Z]\\d{10}[\\dA-Z]{12}",KZ:"\\d{3}[\\dA-Z]{13}",KW:"[A-Z]{4}[\\dA-Z]{22}",LV:"[A-Z]{4}[\\dA-Z]{13}",LB:"\\d{4}[\\dA-Z]{20}",LI:"\\d{5}[\\dA-Z]{12}",LT:"\\d{16}",LU:"\\d{3}[\\dA-Z]{13}",MK:"\\d{3}[\\dA-Z]{10}\\d{2}",MT:"[A-Z]{4}\\d{5}[\\dA-Z]{18}",MR:"\\d{23}",MU:"[A-Z]{4}\\d{19}[A-Z]{3}",MC:"\\d{10}[\\dA-Z]{11}\\d{2}",MD:"[\\dA-Z]{2}\\d{18}",ME:"\\d{18}",NL:"[A-Z]{4}\\d{10}",NO:"\\d{11}",PK:"[\\dA-Z]{4}\\d{16}",PS:"[\\dA-Z]{4}\\d{21}",PL:"\\d{24}",PT:"\\d{21}",RO:"[A-Z]{4}[\\dA-Z]{16}",SM:"[A-Z]\\d{10}[\\dA-Z]{12}",SA:"\\d{2}[\\dA-Z]{18}",RS:"\\d{18}",SK:"\\d{20}",SI:"\\d{15}",ES:"\\d{20}",SE:"\\d{20}",CH:"\\d{5}[\\dA-Z]{12}",TN:"\\d{20}",TR:"\\d{5}[\\dA-Z]{17}",AE:"\\d{3}\\d{16}",GB:"[A-Z]{4}\\d{14}",VG:"[\\dA-Z]{4}\\d{16}"},g=h[c],"undefined"!=typeof g&&(i=new RegExp("^[A-Z]{2}\\d{2}"+g+"$",""),!i.test(l)))return!1;for(d=l.substring(4,l.length)+l.substring(0,4),j=0;j<d.length;j++)e=d.charAt(j),"0"!==e&&(n=!1),n||(m+="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ".indexOf(e));for(k=0;k<m.length;k++)f=m.charAt(k),p=""+o+f,o=p%97;return 1===o},"Please specify a valid IBAN"),a.validator.addMethod("integer",function(a,b){return this.optional(b)||/^-?\d+$/.test(a)},"A positive or negative non-decimal number please"),a.validator.addMethod("ipv4",function(a,b){return this.optional(b)||/^(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)$/i.test(a)},"Please enter a valid IP v4 address."),a.validator.addMethod("ipv6",function(a,b){return this.optional(b)||/^((([0-9A-Fa-f]{1,4}:){7}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){6}:[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){5}:([0-9A-Fa-f]{1,4}:)?[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){4}:([0-9A-Fa-f]{1,4}:){0,2}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){3}:([0-9A-Fa-f]{1,4}:){0,3}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){2}:([0-9A-Fa-f]{1,4}:){0,4}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){6}((\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b)\.){3}(\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b))|(([0-9A-Fa-f]{1,4}:){0,5}:((\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b)\.){3}(\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b))|(::([0-9A-Fa-f]{1,4}:){0,5}((\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b)\.){3}(\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b))|([0-9A-Fa-f]{1,4}::([0-9A-Fa-f]{1,4}:){0,5}[0-9A-Fa-f]{1,4})|(::([0-9A-Fa-f]{1,4}:){0,6}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){1,7}:))$/i.test(a)},"Please enter a valid IP v6 address."),a.validator.addMethod("lettersonly",function(a,b){return this.optional(b)||/^[a-z]+$/i.test(a)},"Letters only please"),a.validator.addMethod("letterswithbasicpunc",function(a,b){return this.optional(b)||/^[a-z\-.,()'"\s]+$/i.test(a)},"Letters or punctuation only please"),a.validator.addMethod("mobileNL",function(a,b){return this.optional(b)||/^((\+|00(\s|\s?\-\s?)?)31(\s|\s?\-\s?)?(\(0\)[\-\s]?)?|0)6((\s|\s?\-\s?)?[0-9]){8}$/.test(a)},"Please specify a valid mobile number"),a.validator.addMethod("mobileUK",function(a,b){return a=a.replace(/\(|\)|\s+|-/g,""),this.optional(b)||a.length>9&&a.match(/^(?:(?:(?:00\s?|\+)44\s?|0)7(?:[1345789]\d{2}|624)\s?\d{3}\s?\d{3})$/)},"Please specify a valid mobile number"),a.validator.addMethod("nieES",function(a){"use strict";return a=a.toUpperCase(),a.match("((^[A-Z]{1}[0-9]{7}[A-Z0-9]{1}$|^[T]{1}[A-Z0-9]{8}$)|^[0-9]{8}[A-Z]{1}$)")?/^[T]{1}/.test(a)?a[8]===/^[T]{1}[A-Z0-9]{8}$/.test(a):/^[XYZ]{1}/.test(a)?a[8]==="TRWAGMYFPDXBNJZSQVHLCKE".charAt(a.replace("X","0").replace("Y","1").replace("Z","2").substring(0,8)%23):!1:!1},"Please specify a valid NIE number."),a.validator.addMethod("nifES",function(a){"use strict";return a=a.toUpperCase(),a.match("((^[A-Z]{1}[0-9]{7}[A-Z0-9]{1}$|^[T]{1}[A-Z0-9]{8}$)|^[0-9]{8}[A-Z]{1}$)")?/^[0-9]{8}[A-Z]{1}$/.test(a)?"TRWAGMYFPDXBNJZSQVHLCKE".charAt(a.substring(8,0)%23)===a.charAt(8):/^[KLM]{1}/.test(a)?a[8]===String.fromCharCode(64):!1:!1},"Please specify a valid NIF number."),jQuery.validator.addMethod("notEqualTo",function(b,c,d){return this.optional(c)||!a.validator.methods.equalTo.call(this,b,c,d)},"Please enter a different value, values must not be the same."),a.validator.addMethod("nowhitespace",function(a,b){return this.optional(b)||/^\S+$/i.test(a)},"No white space please"),a.validator.addMethod("pattern",function(a,b,c){return this.optional(b)?!0:("string"==typeof c&&(c=new RegExp("^(?:"+c+")$")),c.test(a))},"Invalid format."),a.validator.addMethod("phoneNL",function(a,b){return this.optional(b)||/^((\+|00(\s|\s?\-\s?)?)31(\s|\s?\-\s?)?(\(0\)[\-\s]?)?|0)[1-9]((\s|\s?\-\s?)?[0-9]){8}$/.test(a)},"Please specify a valid phone number."),a.validator.addMethod("phoneUK",function(a,b){return a=a.replace(/\(|\)|\s+|-/g,""),this.optional(b)||a.length>9&&a.match(/^(?:(?:(?:00\s?|\+)44\s?)|(?:\(?0))(?:\d{2}\)?\s?\d{4}\s?\d{4}|\d{3}\)?\s?\d{3}\s?\d{3,4}|\d{4}\)?\s?(?:\d{5}|\d{3}\s?\d{3})|\d{5}\)?\s?\d{4,5})$/)},"Please specify a valid phone number"),a.validator.addMethod("phoneUS",function(a,b){return a=a.replace(/\s+/g,""),this.optional(b)||a.length>9&&a.match(/^(\+?1-?)?(\([2-9]([02-9]\d|1[02-9])\)|[2-9]([02-9]\d|1[02-9]))-?[2-9]([02-9]\d|1[02-9])-?\d{4}$/)},"Please specify a valid phone number"),a.validator.addMethod("phonesUK",function(a,b){return a=a.replace(/\(|\)|\s+|-/g,""),this.optional(b)||a.length>9&&a.match(/^(?:(?:(?:00\s?|\+)44\s?|0)(?:1\d{8,9}|[23]\d{9}|7(?:[1345789]\d{8}|624\d{6})))$/)},"Please specify a valid uk phone number"),a.validator.addMethod("postalCodeCA",function(a,b){return this.optional(b)||/^[ABCEGHJKLMNPRSTVXY]\d[ABCEGHJKLMNPRSTVWXYZ] *\d[ABCEGHJKLMNPRSTVWXYZ]\d$/i.test(a)},"Please specify a valid postal code"),a.validator.addMethod("postalcodeBR",function(a,b){return this.optional(b)||/^\d{2}.\d{3}-\d{3}?$|^\d{5}-?\d{3}?$/.test(a)},"Informe um CEP v??lido."),a.validator.addMethod("postalcodeIT",function(a,b){return this.optional(b)||/^\d{5}$/.test(a)},"Please specify a valid postal code"),a.validator.addMethod("postalcodeNL",function(a,b){return this.optional(b)||/^[1-9][0-9]{3}\s?[a-zA-Z]{2}$/.test(a)},"Please specify a valid postal code"),a.validator.addMethod("postcodeUK",function(a,b){return this.optional(b)||/^((([A-PR-UWYZ][0-9])|([A-PR-UWYZ][0-9][0-9])|([A-PR-UWYZ][A-HK-Y][0-9])|([A-PR-UWYZ][A-HK-Y][0-9][0-9])|([A-PR-UWYZ][0-9][A-HJKSTUW])|([A-PR-UWYZ][A-HK-Y][0-9][ABEHMNPRVWXY]))\s?([0-9][ABD-HJLNP-UW-Z]{2})|(GIR)\s?(0AA))$/i.test(a)},"Please specify a valid UK postcode"),a.validator.addMethod("require_from_group",function(b,c,d){var e=a(d[1],c.form),f=e.eq(0),g=f.data("valid_req_grp")?f.data("valid_req_grp"):a.extend({},this),h=e.filter(function(){return g.elementValue(this)}).length>=d[0];return f.data("valid_req_grp",g),a(c).data("being_validated")||(e.data("being_validated",!0),e.each(function(){g.element(this)}),e.data("being_validated",!1)),h},a.validator.format("Please fill at least {0} of these fields.")),a.validator.addMethod("skip_or_fill_minimum",function(b,c,d){var e=a(d[1],c.form),f=e.eq(0),g=f.data("valid_skip")?f.data("valid_skip"):a.extend({},this),h=e.filter(function(){return g.elementValue(this)}).length,i=0===h||h>=d[0];return f.data("valid_skip",g),a(c).data("being_validated")||(e.data("being_validated",!0),e.each(function(){g.element(this)}),e.data("being_validated",!1)),i},a.validator.format("Please either skip these fields or fill at least {0} of them.")),a.validator.addMethod("stateUS",function(a,b,c){var d,e="undefined"==typeof c,f=e||"undefined"==typeof c.caseSensitive?!1:c.caseSensitive,g=e||"undefined"==typeof c.includeTerritories?!1:c.includeTerritories,h=e||"undefined"==typeof c.includeMilitary?!1:c.includeMilitary;return d=g||h?g&&h?"^(A[AEKLPRSZ]|C[AOT]|D[CE]|FL|G[AU]|HI|I[ADLN]|K[SY]|LA|M[ADEINOPST]|N[CDEHJMVY]|O[HKR]|P[AR]|RI|S[CD]|T[NX]|UT|V[AIT]|W[AIVY])$":g?"^(A[KLRSZ]|C[AOT]|D[CE]|FL|G[AU]|HI|I[ADLN]|K[SY]|LA|M[ADEINOPST]|N[CDEHJMVY]|O[HKR]|P[AR]|RI|S[CD]|T[NX]|UT|V[AIT]|W[AIVY])$":"^(A[AEKLPRZ]|C[AOT]|D[CE]|FL|GA|HI|I[ADLN]|K[SY]|LA|M[ADEINOST]|N[CDEHJMVY]|O[HKR]|PA|RI|S[CD]|T[NX]|UT|V[AT]|W[AIVY])$":"^(A[KLRZ]|C[AOT]|D[CE]|FL|GA|HI|I[ADLN]|K[SY]|LA|M[ADEINOST]|N[CDEHJMVY]|O[HKR]|PA|RI|S[CD]|T[NX]|UT|V[AT]|W[AIVY])$",d=f?new RegExp(d):new RegExp(d,"i"),this.optional(b)||d.test(a)},"Please specify a valid state"),a.validator.addMethod("strippedminlength",function(b,c,d){return a(b).text().length>=d},a.validator.format("Please enter at least {0} characters")),a.validator.addMethod("time",function(a,b){return this.optional(b)||/^([01]\d|2[0-3]|[0-9])(:[0-5]\d){1,2}$/.test(a)},"Please enter a valid time, between 00:00 and 23:59"),a.validator.addMethod("time12h",function(a,b){return this.optional(b)||/^((0?[1-9]|1[012])(:[0-5]\d){1,2}(\ ?[AP]M))$/i.test(a)},"Please enter a valid time in 12-hour am/pm format"),a.validator.addMethod("url2",function(a,b){return this.optional(b)||/^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)*(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(a)},a.validator.messages.url),a.validator.addMethod("vinUS",function(a){if(17!==a.length)return!1;var b,c,d,e,f,g,h=["A","B","C","D","E","F","G","H","J","K","L","M","N","P","R","S","T","U","V","W","X","Y","Z"],i=[1,2,3,4,5,6,7,8,1,2,3,4,5,7,9,2,3,4,5,6,7,8,9],j=[8,7,6,5,4,3,2,10,0,9,8,7,6,5,4,3,2],k=0;for(b=0;17>b;b++){if(e=j[b],d=a.slice(b,b+1),8===b&&(g=d),isNaN(d)){for(c=0;c<h.length;c++)if(d.toUpperCase()===h[c]){d=i[c],d*=e,isNaN(g)&&8===c&&(g=h[c]);break}}else d*=e;k+=d}return f=k%11,10===f&&(f="X"),f===g},"The specified vehicle identification number (VIN) is invalid."),a.validator.addMethod("zipcodeUS",function(a,b){return this.optional(b)||/^\d{5}(-\d{4})?$/.test(a)},"The specified US ZIP Code is invalid"),a.validator.addMethod("ziprange",function(a,b){return this.optional(b)||/^90[2-5]\d\{2\}-\d{4}$/.test(a)},"Your ZIP-code must be in the range 902xx-xxxx to 905xx-xxxx")});
(function( factory ) {
	if ( typeof define === "function" && define.amd ) {
		define( ["jquery", "../jquery.validate"], factory );
	} else if (typeof module === "object" && module.exports) {
		module.exports = factory( require( "jquery" ) );
	} else {
		factory( jQuery );
	}
}(function( $ ) {

/*
 * Translated default messages for the jQuery validation plugin.
 * Locale: FR (French; fran??ais)
 */
$.extend( $.validator.messages, {
	required: "Ce champ est obligatoire.",
	remote: "Veuillez corriger ce champ.",
	email: "Veuillez fournir une adresse ??lectronique valide.",
	url: "Veuillez fournir une adresse URL valide.",
	date: "Veuillez fournir une date valide.",
	dateISO: "Veuillez fournir une date valide (ISO).",
	number: "Veuillez fournir un num??ro valide.",
	digits: "Veuillez fournir seulement des chiffres.",
	creditcard: "Veuillez fournir un num??ro de carte de cr??dit valide.",
	equalTo: "Veuillez fournir encore la m??me valeur.",
	extension: "Veuillez fournir une valeur avec une extension valide.",
	maxlength: $.validator.format( "Veuillez fournir au plus {0} caract??res." ),
	minlength: $.validator.format( "Veuillez fournir au moins {0} caract??res." ),
	rangelength: $.validator.format( "Veuillez fournir une valeur qui contient entre {0} et {1} caract??res." ),
	range: $.validator.format( "Veuillez fournir une valeur entre {0} et {1}." ),
	max: $.validator.format( "Veuillez fournir une valeur inf??rieure ou ??gale ?? {0}." ),
	min: $.validator.format( "Veuillez fournir une valeur sup??rieure ou ??gale ?? {0}." ),
	maxWords: $.validator.format( "Veuillez fournir au plus {0} mots." ),
	minWords: $.validator.format( "Veuillez fournir au moins {0} mots." ),
	rangeWords: $.validator.format( "Veuillez fournir entre {0} et {1} mots." ),
	letterswithbasicpunc: "Veuillez fournir seulement des lettres et des signes de ponctuation.",
	alphanumeric: "Veuillez fournir seulement des lettres, nombres, espaces et soulignages.",
	lettersonly: "Veuillez fournir seulement des lettres.",
	nowhitespace: "Veuillez ne pas inscrire d'espaces blancs.",
	ziprange: "Veuillez fournir un code postal entre 902xx-xxxx et 905-xx-xxxx.",
	integer: "Veuillez fournir un nombre non d??cimal qui est positif ou n??gatif.",
	vinUS: "Veuillez fournir un num??ro d'identification du v??hicule (VIN).",
	dateITA: "Veuillez fournir une date valide.",
	time: "Veuillez fournir une heure valide entre 00:00 et 23:59.",
	phoneUS: "Veuillez fournir un num??ro de t??l??phone valide.",
	phoneUK: "Veuillez fournir un num??ro de t??l??phone valide.",
	mobileUK: "Veuillez fournir un num??ro de t??l??phone mobile valide.",
	strippedminlength: $.validator.format( "Veuillez fournir au moins {0} caract??res." ),
	email2: "Veuillez fournir une adresse ??lectronique valide.",
	url2: "Veuillez fournir une adresse URL valide.",
	creditcardtypes: "Veuillez fournir un num??ro de carte de cr??dit valide.",
	ipv4: "Veuillez fournir une adresse IP v4 valide.",
	ipv6: "Veuillez fournir une adresse IP v6 valide.",
	require_from_group: "Veuillez fournir au moins {0} de ces champs.",
	nifES: "Veuillez fournir un num??ro NIF valide.",
	nieES: "Veuillez fournir un num??ro NIE valide.",
	cifES: "Veuillez fournir un num??ro CIF valide.",
	postalCodeCA: "Veuillez fournir un code postal valide."
} );

}));
/*
 *  Document   : formsCategoryEdit.js
 *  Author     : Aur??lien MONCHABLON
 *  Description: Custom javascript code
 */

var formsCategoryEdit = function () {

    return {
        init: function (dialog) {
            /*
             *  Jquery Validation, Check out more examples and documentation at https://github.com/jzaefferer/jquery-validation
             */
            /* Initialize Form Validation */
            $('#form-category-edit').validate({
                errorClass: 'help-block animation-slideDown', // You can change the animation class for a different entrance animation - check animations page
                errorElement: 'div',
                errorPlacement: function (error, e) {
                    //e.parents('.form-group').append(error);
                    e.parents('.form-group > div').append(error);
                },
                highlight: function (e) {
                    $(e).closest('.form-group').removeClass('has-success has-error').addClass('has-error');
                    $(e).closest('.help-block').remove();
                },
                success: function (e) {
                    // You can use the following if you would like to highlight with green color the input after successful validation!
                    e.closest('.form-group').removeClass('has-success has-error').addClass('has-success');
                    e.closest('.help-block').remove();
                },
                submitHandler: function (e) {
                    $('.form-group').removeClass('has-success has-error');
                    $('.help-block').remove();

                    var $form = $("#form-category-edit");
                    var formdata = (window.FormData) ? new FormData($form[0]) : null;
                    var data = (formdata !== null) ? formdata : $form.serialize();
                    
                    $('#btn-valid-edit-category').children().removeClass('fa fa-floppy-o').addClass('fa fa-spinner fa-spin');
                    $('#btn-valid-edit-category').prop( "disabled", true );

                    $.ajax({
                        url: $form.attr('action'),
                        type: $form.attr('method'),
                        contentType: false,
                        processData: false,
                        data: data,
                        success: function (data) {
                            //console.log(data);

                            $('#btn-valid-edit-category').children().removeClass('fa fa-spinner fa-spin').addClass('fa fa-floppy-o');
                            $('#btn-valid-edit-category').prop( "disabled", false );

                            if(data.success == false){
                                flashBag($('.messages-container-category'), data.error, 'danger');
                            } else{
                                dialog.close();

                                $('#add-category').children().removeClass('fa-spinner fa-spin').addClass('fa-floppy-o');
                                $('#add-category').prop( "disabled", false );
                                $('#val_title').val('');
                                $('#val_sub_title').val('');
                                $('#val_photo').val('');

                                flashBag($('.messages-container'), data.success, 'success', true);

                                initNestableContainer();
                                initNestable();
                            }
                        },
                        error: function (jqXHR, exception) {
                            var msg = '';
                            if (jqXHR.status === 0) {
                                msg = 'Not connect.\n Verify Network.';
                            } else if (jqXHR.status == 404) {
                                msg = 'Requested page not found. [404]';
                            } else if (jqXHR.status == 500) {
                                msg = 'Internal Server Error [500].';
                            } else if (exception === 'parsererror') {
                                msg = 'Requested JSON parse failed.';
                            } else if (exception === 'timeout') {
                                msg = 'Time out error.';
                            } else if (exception === 'abort') {
                                msg = 'Ajax request aborted.';
                            } else {
                                msg = 'Uncaught Error.\n' + jqXHR.responseText;
                            }
                            //console.log(msg)
                            //console.log(jqXHR.responseText);
                        }
                    });
                },
                invalidHandler: function () {
                },
                ignore: [],
                rules: {
                    'val_title': {
                        required: true
                    },
                    'val_sub_title': {
                        required: false
                    },
                    'val_photo': {
                        required: false,
                        extension: "jpg|png"
                    }
                }
            });
        }
    };
}();
/*
 *  Document   : formsCategoryAdd.js
 *  Author     : Aur??lien MONCHABLON
 *  Description: Custom javascript code
 */

var formsCategoryAdd = function () {

    return {
        init: function () {
            /*
             *  Jquery Validation, Check out more examples and documentation at https://github.com/jzaefferer/jquery-validation
             */
            /* Initialize Form Validation */
            $('#form-category-add').validate({
                errorClass: 'help-block animation-slideDown', // You can change the animation class for a different entrance animation - check animations page
                errorElement: 'div',
                errorPlacement: function (error, e) {
                    //e.parents('.form-group').append(error);
                    e.parents('.form-group > div').append(error);
                },
                highlight: function (e) {
                    $(e).closest('.form-group').removeClass('has-success has-error').addClass('has-error');
                    $(e).closest('.help-block').remove();
                },
                success: function (e) {
                    // You can use the following if you would like to highlight with green color the input after successful validation!
                    e.closest('.form-group').removeClass('has-success has-error').addClass('has-success');
                    e.closest('.help-block').remove();
                },
                submitHandler: function (e) {
                    $('.form-group').removeClass('has-success has-error');
                    $('.help-block').remove();

                    var $form = $("#form-category-add");
                    var formdata = (window.FormData) ? new FormData($form[0]) : null;
                    var data = (formdata !== null) ? formdata : $form.serialize();

                    $('#add-category').children().removeClass('fa-floppy-o').addClass('fa-spinner fa-spin');
                    $('#add-category').prop( "disabled", true );

                    $.ajax({
                        url: $form.attr('action'),
                        type: $form.attr('method'),
                        contentType: false,
                        processData: false,
                        data: data,
                        success: function (data) {
                            //console.log(data);
                            $('#add-category').children().removeClass('fa-spinner fa-spin').addClass('fa-floppy-o');
                            $('#add-category').prop( "disabled", false );

                            if(data.success == false){
                                flashBag($('.messages-container'), data.error, 'danger');
                            } else{
                                $('#val_title').val('');
                                $('#val_sub_title').val('');
                                $('#val_photo').val('');
                                flashBag($('.messages-container'), data.success, 'success', true);

                                initNestableContainer();
                                initNestable();
                                initCategoryList();
                            }
                        },
                        error: function (jqXHR, exception) {
                            var msg = '';
                            if (jqXHR.status === 0) {
                                msg = 'Not connect.\n Verify Network.';
                            } else if (jqXHR.status == 404) {
                                msg = 'Requested page not found. [404]';
                            } else if (jqXHR.status == 500) {
                                msg = 'Internal Server Error [500].';
                            } else if (exception === 'parsererror') {
                                msg = 'Requested JSON parse failed.';
                            } else if (exception === 'timeout') {
                                msg = 'Time out error.';
                            } else if (exception === 'abort') {
                                msg = 'Ajax request aborted.';
                            } else {
                                msg = 'Uncaught Error.\n' + jqXHR.responseText;
                            }
                            //console.log(msg)
                            //console.log(jqXHR.responseText);
                        }
                    });
                },
                invalidHandler: function () {
                },
                ignore: [],
                rules: {
                    'val_title': {
                        required: true
                    },
                    'val_sub_title': {
                        required: false
                    },
                    'val_photo': {
                        required : function(element){
                            return $("#val_type_category").val() == 'cat';
                        },
                        extension: "jpg|png"
                    }
                }
            });
        }
    };
}();
function initCategoryList() {
    var c = $('#val_category_parent');
    c.html('');

    $.ajax({
        url: Routing.generate('category_parents_list'),
        type: 'POST',
        dataType: 'json',
        success: function (data) {
            //console.log(data);
            if (data.categorysOnlyParents.length > 0) {
                $.each(data.categorysOnlyParents, function (index, value) {
                    c.append('<option value="' + value.id + '">' + value.title + '</option>');
                });
            }
        }
    });
}

function initCategoryWithoutFile() {
    var c = $('#category-withoutfile-container');
    c.html('');

    $.ajax({
        url: Routing.generate('category_without_file'),
        type: 'POST',
        dataType: 'json',
        success: function (data) {
            //console.log(data);

            if (data.categorysWithoutFile.length > 0) {
                if (data.categorysWithoutFile.length == 1) {
                    var msg = "Cette cat??gorie parente n'a pas de photo <small>(elle n'appara??tra pas sur le site)</small> !";
                } else {
                    var msg = "Ces cat??gories parentes n'ont pas de photo <small>(elles n'appara??tront pas sur le site)</small> !";
                }
                var html = '<div class="alert alert-warning alert-dismissable">' +
                    '<h4><i class="fa fa-exclamation-triangle"></i> Attention</h4> ' + msg + ' <br><br>' +
                    '<ul>';

                $.each(data.categorysWithoutFile, function (index, value) {
                    html += '<li>' + value.title + '</li>';
                });
                html += '</ul>';

                c.html(html);
            }
        },
        error: function (jqXHR, exception) {
            var msg = '';
            if (jqXHR.status === 0) {
                msg = 'Not connect.\n Verify Network.';
            } else if (jqXHR.status == 404) {
                msg = 'Requested page not found. [404]';
            } else if (jqXHR.status == 500) {
                msg = 'Internal Server Error [500].';
            } else if (exception === 'parsererror') {
                msg = 'Requested JSON parse failed.';
            } else if (exception === 'timeout') {
                msg = 'Time out error.';
            } else if (exception === 'abort') {
                msg = 'Ajax request aborted.';
            } else {
                msg = 'Uncaught Error.\n' + jqXHR.responseText;
            }
            console.log(jqXHR.responseText);
            console.log(msg);
        }
    });
}

function initNestableContainer() {
    $('#nestable-container').html('');
    $('#nestable-container').html('<div class="cf nestable-lists">' +
        '<div class="dd" id="nestable"></div>' +
        '</div>' +
        '<p><textarea id="nestable-output" style="display: none;"></textarea></p>');
}

function initNestable() {

    var c = $('#nestable');

    c.html('<div class="text-center" style="font-size:4em;"><i class="fa fa-spinner fa-spin"></i></div>');

    $.ajax({
        url: Routing.generate('category_sort_view'),
        type: 'POST',
        success: function (data) {
            //console.log(data);

            if (data == false) {
                c.html('<div class="alert alert-info alert-dismissable">' +
                    '<h4><i class="fa fa-info-circle"></i> Info</h4> Il n\'y a aucune cat??gorie pour le moment !' +
                    '</div>');
            } else {
                var jsonUpdate;
                var updateOutput = function (e) {
                    var list = e.length ? e : $(e.target),
                        output = list.data('output');
                    if (window.JSON) {
                        output.val(window.JSON.stringify(list.nestable('serialize')));//, null, 2));
                        jsonUpdate = $('#nestable-output').val();
                    }
                    else {
                        output.val('JSON browser support required.');
                    }
                };

                // activate Nestable for list
                $('#nestable').nestable({
                    maxDepth: 2,
                    group: 1,
                    json: data,
                    contentCallback: function (item) {
                        var content = '<span data-id="' + item.id + '">' + item.title + '</span>';
                        return content;
                    }
                }).on('change', updateOutput);

                // output initial serialised data
                updateOutput($('#nestable').data('output', $('#nestable-output')));

                // Nestable Formating
                $(".dd-handle").each(function (index) {
                    var ddContent = $(this).children();
                    ddContent.remove();
                    $(this).after(ddContent);
                });

                // Add buttons
                $(".dd-content").each(function (index) {

                    var categoryId = $(this).children().data('id');

                    var buttons = '<div class="btn-group btn-group-xs pull-right" data-toggle="buttons" style="margin-top:-3px;">' +
                        '<a href="javascript:void(0);" data-editid="' + categoryId + '" class="btn btn-info"><i class="fa fa-pencil-square-o"></i></a>' +
                        '<a href="javascript:void(0);" data-deleteid="' + categoryId + '" class="btn btn-danger"><i class="fa fa-times"></i></a>' +
                        '</div>';

                    $(this).append(buttons);

                    // Edit Btn
                    $('[data-editid="' + categoryId + '"]').click(function () {
                        var cLink = $(this).children();
                        cLink.removeClass('fa-pencil-square-o').addClass('fa-spinner fa-spin');

                        $.ajax({
                            url: Routing.generate('category_edit'),
                            type: 'POST',
                            dataType: 'json',
                            data: {'category_id': categoryId},
                            success: function (data) {
                                //console.log(data);

                                cLink.removeClass('fa-spinner fa-spin').addClass('fa-pencil-square-o');

                                var html = '<div class="messages-container-category"></div>' +
                                    '<form id="form-category-edit" action="' + Routing.generate('category_edit') + '" method="post" enctype="multipart/form-data" class="form-horizontal form-bordered" onsubmit="return false;">' +
                                    '<div class="form-group">' +
                                    '<label class="col-md-3 control-label" for="val_title">Nom <span class="text-danger">*</span></label>' +
                                    '<div class="col-md-6">' +
                                    '<input type="text" id="val_title" name="val_title" class="form-control" placeholder="Nom de la cat??gorie.." value="' + data.category.title + '" required=""/>' +
                                    '</div>' +
                                    '</div>' +

                                    '<div class="form-group">' +
                                    '<label class="col-md-3 control-label" for="val_sub_title">Sous-titre</label>' +
                                    '<div class="col-md-6">' +
                                    '<input type="text" id="val_sub_title" name="val_sub_title" class="form-control" placeholder="Sous-titre de la cat??gorie.." value="' + data.category.sub_title + '" required=""/>' +
                                    '</div>' +
                                    '</div>';

                                if (data.category.sub_id == 0) {

                                    //console.log(data.category.file);

                                    if (data.category.file != 'noFile') {
                                        html += '<div class="form-group">' +
                                            '<label class="col-md-3 control-label" for="val_current_image">Photo acutelle</label>' +
                                            '<div class="col-md-6">' +
                                            '<img src="' + data.category.file + '" alt="' + data.category.title + '" class="img-responsive">' +
                                            '</div>' +
                                            '</div>';
                                    } else {
                                        html += '<div class="form-group">' +
                                            '<div class="alert alert-warning alert-dismissable">' +
                                            '<h4><i class="fa fa-exclamation-triangle"></i> Attention</h4> Cette cat??gorie parente n\'a pas de photo !' +
                                            '</div>' +
                                            '</div>';
                                    }

                                    html += '<div class="form-group">' +
                                        '<label class="col-md-3 control-label" for="val_photo">Selectionner un fichier</label>' +
                                        '<div class="col-md-6">' +
                                        '<input type="file" id="val_photo" name="val_photo" accept="image/*">' +
                                        '</div>' +
                                        '</div>';
                                }

                                html += '<input type="hidden" id="val_category_id" name="val_category_id" value="' + data.category.id + '">' +
                                    '</form>';

                                var dialog = BootstrapDialog.show({
                                    size: BootstrapDialog.SIZE_WIDE,
                                    title: '<strong>Editer la cat??gorie</strong> : ' + data.category.title,
                                    message: html,
                                    buttons: [
                                        {
                                            icon: 'fa fa-ban',
                                            label: 'Annuler',
                                            cssClass: 'btn-default',
                                            action: function (dialogItself) {
                                                dialogItself.close();
                                            }
                                        },
                                        {
                                            id: 'btn-valid-edit-category',
                                            icon: 'fa fa-floppy-o',
                                            label: 'Valider',
                                            cssClass: 'btn-primary',
                                            hotkey: 13, // Enter.
                                            action: function () {
                                                formsCategoryEdit.init(dialog);
                                                $("#form-category-edit").submit();
                                            }
                                        }]
                                });
                            },
                            error: function (xhr) {
                                console.log(xhr.responseText)
                            }
                        });
                    });

                    // Delete Btn
                    $('[data-deleteid="' + categoryId + '"]').click(function () {
                        var cLink = $(this).children();
                        cLink.removeClass('fa-times').addClass('fa-spinner fa-spin');

                        $.ajax({
                            url: Routing.generate('category_delete'),
                            type: 'POST',
                            dataType: 'json',
                            data: {'category_id': categoryId},
                            success: function (data) {
                                //console.log(data);

                                cLink.removeClass('fa-spinner fa-spin').addClass('fa-times');

                                var html = '<h4>Voulez vous vraiment supprimer cette cat??gorie ?</h4>';

                                if (data.category.galleryCount > 0 || data.category.subCategoryCount > 0) {
                                    html += 'Ceci entrainera la suppression de :';
                                }

                                if (data.category.subCategoryCount > 0) {
                                    html += '<p style="margin:0;"><strong>' + data.category.subCategoryCount + '</strong> sous cat??gorie(s)</p>';
                                }

                                if (data.category.galleryCount > 0) {
                                    html += '<p style="margin:0;"><strong>' + data.category.galleryCount + '</strong> photo(s)</p>';
                                }

                                if (data.category.subId == 0) {
                                    var title = '<strong>Supprimer la cat??gorie</strong> : ' + data.category.title;
                                } else {
                                    var title = '<strong>Supprimer la sous cat??gorie</strong> : ' + data.category.title;
                                }

                                var dialog = BootstrapDialog.show({
                                    type: BootstrapDialog.TYPE_DANGER,
                                    title: title,
                                    message: html,
                                    buttons: [
                                        {
                                            icon: 'fa fa-ban',
                                            label: 'Annuler',
                                            cssClass: 'btn-default',
                                            action: function (dialogItself) {
                                                dialogItself.close();
                                            }
                                        },
                                        {
                                            id: 'btn-valid-edit-category',
                                            icon: 'fa fa-times',
                                            label: 'Supprimer',
                                            cssClass: 'btn-danger',
                                            hotkey: 13, // Enter.
                                            action: function (dialogItself) {
                                                //console.log('delete');
                                                /*formsCategoryEdit.init(dialog);
                                                 $("#form-category-edit").submit();*/

                                                var cLink = $(this).children();
                                                cLink.removeClass('fa-times').addClass('fa-spinner fa-spin');

                                                $.ajax({
                                                    url: Routing.generate('category_delete'),
                                                    type: 'POST',
                                                    dataType: 'json',
                                                    data: {'category_id': categoryId, 'confirm': true},
                                                    success: function (data) {
                                                        //console.log(data);

                                                        cLink.removeClass('fa-spinner fa-spin').addClass('fa-times');
                                                        dialogItself.close();

                                                        initNestableContainer();
                                                        initNestable();
                                                    },
                                                    error: function (jqXHR, exception) {
                                                        var msg = '';
                                                        if (jqXHR.status === 0) {
                                                            msg = 'Not connect.\n Verify Network.';
                                                        } else if (jqXHR.status == 404) {
                                                            msg = 'Requested page not found. [404]';
                                                        } else if (jqXHR.status == 500) {
                                                            msg = 'Internal Server Error [500].';
                                                        } else if (exception === 'parsererror') {
                                                            msg = 'Requested JSON parse failed.';
                                                        } else if (exception === 'timeout') {
                                                            msg = 'Time out error.';
                                                        } else if (exception === 'abort') {
                                                            msg = 'Ajax request aborted.';
                                                        } else {
                                                            msg = 'Uncaught Error.\n' + jqXHR.responseText;
                                                        }
                                                        console.log(jqXHR.responseText);
                                                        console.log(msg);
                                                    }
                                                });
                                            }
                                        }]
                                });
                            },
                            error: function (jqXHR) {
                                console.log(jqXHR.responseText);
                            }
                        });
                    });
                });

                // Update category
                $("#update-sort-category").click(function () {
                    //console.log(jsonUpdate);
                    $('#update-sort-category').children().removeClass('fa-floppy-o').addClass('fa-spinner fa-spin');
                    $('#update-sort-category').prop("disabled", true);

                    $.ajax({
                        url: Routing.generate('category_sort_update'),
                        type: 'POST',
                        data: {"jsonUpdate": jsonUpdate},
                        success: function (data) {
                            //console.log(data);
                            flashBag($('.messages-container'), data.success, 'success', true);

                            $('#update-sort-category').children().removeClass('fa-spinner fa-spin').addClass('fa-floppy-o');
                            $('#update-sort-category').prop("disabled", false);
                            initCategoryWithoutFile();
                        },
                        error: function (jqXHR, exception) {
                            console.log(jqXHR.responseText);
                        }
                    });
                });
            }
        },
        error: function (jqXHR, exception) {
            console.log(jqXHR.responseText);
        }
    });
}