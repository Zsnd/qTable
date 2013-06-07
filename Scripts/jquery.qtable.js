(function () {
    "use strict";
    var QTable = function (div, options) {
        var self = this;
        this.$div = $(div);
        this.options = options;
        this.$table = this.$div.find(".table");
        this.$tmpl = this.$div.find(options.tmplclass);
        this.$pager = this.$div.find(options.pagerclass);
        if (this.$pager.length) {
            self.$pager.on("click", ".pagination active a", function (e) {
                e.preventDefault();
                e.stopImmediatePropagation();
            });
            self.$pager.on("click", ".pagination a", function (e) {
                e.preventDefault();
                var pageindex = $(this).attr("href").replace(/#/g, "");
                self.options.pager.pageindex = pageindex;
                self.reload.call(self);
            });

        }
        var $check = $(".qtable-select-all", this.$table);
        if ($check.length) {
            self.$table.on("click", ".qtable-select-all", function () {
                var b = $(this).prop("checked");
                if (b) {
                    $.each(self.$table.find("tr:not(.active)"), function () {
                        $(this).find("td:eq(0)").click();
                    });
                } else {
                    $.each(self.$table.find("tr.active"), function () {
                        $(this).find("td:eq(0)").click();
                    });
                }
            });
            self.$table.on("click", "tr td", function () {
                var $tr = $(this).closest("tr"), b = $tr.hasClass("active"), $c = $(this).closest("tr").find("td:eq(0) .qtable-select-row");
                $c.prop("checked", !b);
                $tr.toggleClass("active", !b);
            });
        }
        self.reload.call(self);
    };

    QTable.prototype = {
        constructor: QTable,

        init: function () {

        },

        reload: function () {
            var self = this, url = self.options.url,
                data = {
                    sidx: self.options.sidx,
                    sort: self.options.sort,
                    pageindex: self.options.pager.pageindex,
                    pagesize: self.options.pager.pagesize
                };
            if (url) {
                self.loading.call(self);
                $.post(url, data).done(function (json) {
                    var tabledata = json.data,
                        pager = json.pager;
                    if (tabledata && tabledata.length) {
                        self.options.data = tabledata;
                        self.options.pager = pager;

                        rendertable.call(self);
                        renderpager.call(self);
                        self.$table.show();
                        self.$pager.show();
                        $("#nodata-alert", self.$div).remove();
                    } else {
                        self.$table.hide();
                        self.$pager.hide();
                        if ($("#nodata-alert", self.$div).length == 0) {
                            self.$div.prepend('<div class="alert alert-error" id="nodata-alert">没有查到任何数据！</div>');
                        }
                    }
                }).then(function () {
                    setTimeout(function() {
                        self.loading.call(self);
                    }, 200);
                });
            }
        },
        removeLoading: function () {
            this.$loading.remove();
            this.$loading = null;
            this.isLoading = false;
        },
        
        loading: function (callback) {
            callback = callback || function () { };

            var animate = this.$div.find(".mask-needed").hasClass('fade') ? 'fade' : '';

            if (!this.isLoading) {
                var doAnimate = $.support.transition && animate;

                this.$loading = $('<div class="loading-mask ' + animate + '">')
                    .append(this.options.spinner)
                    .appendTo(this.$div.find(".mask-needed"));

                if (doAnimate) this.$loading[0].offsetWidth; // force reflow

                this.$loading.addClass('in');

                this.isLoading = true;

                doAnimate ? this.$loading.one($.support.transition.end, callback) : callback();

            } else if (this.isLoading && this.$loading) {
                this.$loading.removeClass('in');

                var that = this;
                $.support.transition && this.$div.find(".mask-needed").hasClass('fade') ? this.$loading.one($.support.transition.end, function () {
                    that.removeLoading()
                }) : that.removeLoading();

            } else if (callback) {
                callback(this.isLoading);
            }
        },
    };

    //private
    var rendertable = function () {
        var self = this, $table = self.$table, $tmpl = self.$tmpl, data = self.options.data;
        $("tbody", $table).html($tmpl.render(data));
    };

    var renderpager = function () {
        var self = this, $pager = self.$pager, pager = self.options.pager,
            pageindex = pager.pageindex, pagesize = pager.pagesize, total = pager.total,
            lastindex = Math.ceil(total / pagesize) - 1, pagewidth = 3, arr = [];
        if (total <= pagesize) {//不需要分页
            $(".pagination-info", $pager).text("合计：" + total + "项");
            $(".qpagination", $pager).html("");
            return;
        }
        if (pageindex > 3) {//首页上一页按钮
            arr.push('<li><a href="#0" title="首页"><i class="icon-double-angle-left"></i></a></li>');
            arr.push('<li><a href="#' + (pageindex - 1) + '" title="上一页"><i class="icon-angle-left"></i></a></li>');
        }
        //左边
        for (var i = pagewidth; i > 0; i--) {
            var index = pageindex - i;
            if (index >= 0) {
                arr.push('<li><a href="#' + index + '">' + (index + 1) + '</a></li>');
            }
        }
        //当前页按钮
        arr.push('<li class="active"><a href="#' + pageindex + '">' + (pageindex + 1) + '</a></li>');

        //右边
        for (var i1 = 0; i1 < pagewidth; i1++) {
            var index1 = pageindex + i1 + 1;
            if (index1 <= lastindex) {
                arr.push('<li><a href="#' + index1 + '">' + (index1 + 1) + '</a></li>');
            }
        }
        if (pageindex < lastindex - 3) {//需要下一页末页按钮
            arr.push('<li><a href="#' + (pageindex + 1) + '" title="下一页"><i class="icon-angle-right"></i></a></li>');
            arr.push('<li><a href="#' + lastindex + '" title="末页"><i class="icon-double-angle-right"></i></a></l');
        }
        $(".qpagination", $pager).html(function () {
            return "<ul>" + arr.join("") + "</ul>";
        });
        $(".pagination-info", $pager).text("当前位置：" + (pageindex + 1) + "/" + (lastindex + 1) + "页 合计：" + total + "项");
    };

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
        url: undefined,
        sidx: undefined,
        sort: "desc",
        pager: {
            pagesize: 20,
            pageindex: 0,
            total: undefined
        },
        pagerclass: ".qpager",
        tmplclass: ".qtmpl",
        spinner: '<div class="loading-spinner" style="width: 200px; margin-left: -100px;"><div class="progress progress-striped active"><div class="bar" style="width: 100%;"></div></div></div>'
    };

    $.fn.qtable.Constructor = QTable;

    $.fn.qtable.noConflict = function () {
        $.fn.qtable = old;
        return this;
    };
})(jQuery);