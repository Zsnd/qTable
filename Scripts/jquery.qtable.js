(function() {
    "use strict";
    var QTable = function(div, options) {
        var self = this, $div = self.$div = $(div),
            $table = self.$table = $(".table", $div),
            $tmpl = self.$tmpl = $(options.tmplclass, $div),
            $pager = $(options.pagerclass, $div),
            pageable = self.pageable = !!$pager.length,
            $check = $(".qtable-select-all", $table),
            check = self.check = !!$check.length;
        self.options = options;

        if (pageable) {
            self.$pager = $pager;

            $pager.on("click", ".pagination active a", function(e) {
                e.preventDefault();
                e.stopImmediatePropagation();
            });
            $pager.on("click", ".pagination a", function(e) {
                e.preventDefault();
                options.pager.pageindex = $(this).attr("href").replace(/#/g, "");
                self.reload.call(self);
            });
        } else {
            delete options.pager;
        }

        if (check) {
            $table.on("click", ".qtable-select-all", function() {
                var b = $(this).prop("checked");
                if (b) {
                    $.each($table.find("tr:not(.active)"), function() {
                        $(this).find("td:eq(0)").click();
                    });
                } else {
                    $.each($table.find("tr.active"), function() {
                        $(this).find("td:eq(0)").click();
                    });
                }
            });
            $table.on("click", "tr td", function() {
                var $tr = $(this).closest("tr"), b = $tr.hasClass("active"), $c = $(this).closest("tr").find("td:eq(0) .qtable-select-row");
                $c.prop("checked", !b);
                $tr.toggleClass("active", !b);
            });
        }
        self.reload.call(self);
    };

    QTable.prototype = {
        constructor: QTable,

        init: function() {

        },

        reload: function() {
            var self = this, options = self.options, url = options.url,
                $div = self.$div, $table = self.$table, $pager = self.$pager,
                pageable = self.pageable, data = getdata.call(self),
                def = $.isEmptyObject(data) ? $.post(url) : $.post(url, data);

            if (url) {
                self.loading.call(self);

                def.done(function(json) {
                    var tabledata = json.data;
                    if (tabledata && tabledata.length) {
                        options.data = tabledata;
                        rendertable.call(self);
                        $table.show();
                        if (pageable) {
                            options.pager = json.pager;
                            renderpager.call(self);
                            $pager.show();
                        }
                        $(".data-empty", $div).remove();
                    } else {
                        $table.hide();
                        if (pageable) {
                            $pager.hide();
                        }
                        if ($(".data-empty", $div).length == 0) {
                            $table.before('<div class="alert alert-error data-empty">没有查到任何数据！</div>');
                        }
                    }
                }).then(function() {
                    setTimeout(function() {
                        self.loading.call(self);
                    }, 200);
                });
            }
        },
        removeLoading: function() {
            this.$loading.remove();
            this.$loading = null;
            this.isLoading = false;
        },

        loading: function(callback) {
            callback = callback || function() {
            };

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
                $.support.transition && this.$div.find(".mask-needed").hasClass('fade') ? this.$loading.one($.support.transition.end, function() {
                    that.removeLoading();
                }) : that.removeLoading();

            } else if (callback) {
                callback(this.isLoading);
            }
        },
    };

    //private
    var rendertable = function() {
        var self = this, $table = self.$table, $tmpl = self.$tmpl, data = self.options.data;
        $("tbody", $table).html($tmpl.render(data));
    };

    var renderpager = function() {
        var self = this, $pager = self.$pager, pager = self.options.pager,
            pageindex = pager.pageindex, pagesize = pager.pagesize, total = pager.total,
            lastindex = Math.ceil(total / pagesize) - 1, pagewidth = 3, arr = [];
        if (total <= pagesize) { //不需要分页
            $(".pagination-info", $pager).text("合计：" + total + "项");
            $(".qpagination", $pager).html("");
            return;
        }
        if (pageindex > 3) { //首页上一页按钮
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
        if (pageindex < lastindex - 3) { //需要下一页末页按钮
            arr.push('<li><a href="#' + (pageindex + 1) + '" title="下一页"><i class="icon-angle-right"></i></a></li>');
            arr.push('<li><a href="#' + lastindex + '" title="末页"><i class="icon-double-angle-right"></i></a></l');
        }
        $(".qpagination", $pager).html(function() {
            return "<ul>" + arr.join("") + "</ul>";
        });
        $(".pagination-info", $pager).text("当前位置：" + (pageindex + 1) + "/" + (lastindex + 1) + "页 合计：" + total + "项");
    };

    var getdata = function() {
        var self = this, options = self.options, data = {};

        options.sidx && (data["sidx"] = options.sidx);
        options.sort && (data["sort"] = options.sort);

        if (self.pager) {
            data["pageindex"] = options.pager.pageindex;
            data["pagesize"] = options.pager.pagesize;
        }
    };

    //plugin
    $.fn.qtable = function(option) {
        return this.each(function() {
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

    $.fn.qtable.noConflict = function() {
        $.fn.qtable = old;
        return this;
    };
})(jQuery);