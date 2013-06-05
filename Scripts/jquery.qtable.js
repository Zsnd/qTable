(function () {
    "use strict";
    var QTable = function (div, options) {
        this.$div = $(div);
        this.options = options;
        this.$table = this.$div.find("");
        this.$tmpl = this.$div.find("");
        this.$pager = this.$div.find("");
        this.$toolbar = this.$div.find("");

    };

    QTable.prototype = {
        constructor: QTable,

        init: function () {

        },

        reload: function () {

        }


    };

    //private


    //plugin
    $.fn.qtable = function (option) {
        return this.each(function () {
            var $this = $(this), data = $this.data('qtable'),
                options = $.extend({}, $.fn.qtable.defaults, $this.data(), typeof option == 'object' && option);
            if (!data) $this.data('qtable', (data = new QTable(this, options)));
            if (typeof option == 'string') data[option]();
            else $this.init();
        });
    };

    $.fn.qtable.defaults = {
    };

    $.fn.qtable.Constructor = QTable;

    $.fn.qtable.noConflict = function () {
        $.fn.qtable = old;
        return this;
    };

    $(function () {

    });
})(jQuery);