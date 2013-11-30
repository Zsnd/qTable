(function() {
    "use strict";
    var QTable = function(div, options) {
        var self = this, $div = self.$div = $(div),
            $table = self.$table = $(".table", $div),
            $tmpl = self.$tmpl = $(options.tmplclass, $div),
            $pager = $(options.pagerclass, $div),
            pageable = self.pageable = !!$pager.length,
            $check = $("th:first-child i.fa-square-o", $table),
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
                options.pagination.pageindex = $(this).attr("href").replace(/#/g, "");
                self.reload.call(self);
            });
        } else {
            delete options.pagination;
        }

        if (check) {
            var thi = "th:first-child i",
                tdi = "td:first-child i",
                $thi = $(thi, $table),
                updateth = function() {
                    var $tdis = $(tdi, $table), c1 = $tdis.length, c2 = $tdis.filter(".fa-check-square-o").length;
                    switch (c2) {
                    case 0:
                        $thi.attr("class", "fa fa-square-o");
                        break;
                    case c1:
                        $thi.attr("class", "fa fa-check-square-o");
                        break;
                    default:
                        $thi.attr("class", "fa fa-minus-square-o");
                    }
                },
                unactive = function($td) {
                    var $tr = $td.closest("tr");
                    $tr.toggleClass("active", false);
                    $td.attr("class", "fa fa-square-o");
                },
                active = function ($td) {
                    var $tr = $td.closest("tr");
                    $tr.toggleClass("active", true);
                    $td.attr("class", "fa fa-check-square-o");
                },
                unactiveall = function () {
                    var $tdis = $(tdi, $table), $trs = $tdis.closest("tr");
                    $trs.toggleClass("active", false);
                    $tdis.attr("class", "fa fa-square-o");
                },
                activeall = function() {
                    var $tdis = $(tdi, $table), $trs = $tdis.closest("tr");
                    $trs.toggleClass("active", true);
                    $tdis.attr("class", "fa fa-check-square-o");
                };
            $table.on("click", thi, function() {
                switch ($thi.attr("class")) {
                case "fa fa-check-square-o":
                    unactiveall();
                    $thi.attr("class", "fa fa-square-o");
                    break;
                default:
                    activeall();
                    $thi.attr("class", "fa fa-check-square-o");
                }
            });
            $table.on("click", "tr td:not(:first-child)", function () {
                var $tr = $(this).closest("tr"), $td = $tr.find(tdi);
                unactiveall();
                active($td);
                updateth();
            });
            $table.on("click", "tr td:first-child", function () {
                var $tr = $(this).closest("tr"), $td = $tr.find(tdi);
                if ($tr.hasClass("active")) {
                    unactive($td);
                } else {
                    active($td);
                }
                updateth();
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
                pageable = self.pageable, data = getrequestdata.call(self);

            if (url) {
                self.$div.is(":visible") && self.loading.call(self);

                var def;
                if ($.isEmptyObject(data)) {
                    def = $.post(url);
                } else {
                    def = $.ajax({
                        url: url,
                        type: 'POST',
                        dataType: 'json',
                        data: JSON.stringify(data),
                        contentType: 'application/json; charset=utf-8'
                    });
                }

                def.done(function(json) {
                    var tabledata = json.data;
                    //clear json.other
                    options.other = json.other;
                    if (tabledata && tabledata.length) {
                        options.data = tabledata;
                        options.total = json.total;

                        //json.other && (options.other = json.other);
                        pageable && (options.pagination = json.pagination);

                        self.render();

                        $table.show();
                        pageable && $pager.show();
                    } else {
                        $table.hide();
                        pageable && $pager.hide();
                        if ($(".data-empty", $div).length == 0) {
                            $table.before('<div class="alert alert-danger data-empty">没有查到任何数据！</div>');
                        }
                    }
                }).then(function() {
                    if (self.isLoading) {
                        setTimeout(function() {
                            //用来避免奇怪的bug
                            if (self.isLoading) {
                                self.loading.call(self);
                            }
                        }, 200);
                    }
                }).then(function() {
                    var e = $.Event('reloaded');
                    self.$div.trigger(e);
                });
            }
        },

        render: function() {
            var self = this, $div = self.$div,
                pageable = self.pageable, e = $.Event('show');

            $div.trigger(e);

            rendertable.call(self);
            pageable && renderpager.call(self);
            $(".data-empty", $div).remove();
        },

        removeLoading: function() {
            this.$loading && this.$loading.remove();
            this.$loading = null;
            this.isLoading = false;
        },

        loading: function(callback) {
            callback = callback || function() {
            };

            var animate = this.$div.find(".qt-mask").hasClass('fade') ? 'fade' : '';
            if (!this.isLoading) {
                var doAnimate = $.support.transition && animate;

                this.$loading = $('<div class="loading-mask ' + animate + '">')
                    .append(this.options.spinner)
                    .appendTo(this.$div.find(".qt-mask"));

                if (doAnimate) this.$loading[0].offsetWidth; // force reflow

                this.$loading.addClass('in');

                this.isLoading = true;

                doAnimate ? this.$loading.one($.support.transition.end, callback) : callback();

            } else if (this.isLoading && this.$loading) {
                this.$loading.removeClass('in');
                var that = this;
                $.support.transition && this.$div.find(".qt-mask").hasClass('fade') ? this.$loading.one($.support.transition.end, function() {
                    that.removeLoading();
                }) : that.removeLoading();

            } else if (callback) {
                callback(this.isLoading);
            }
        },
    };

    //private
    var rendertable = function() {
        var self = this, $table = self.$table, $ith = $("th:first-child i", $table),
            $tmpl = self.$tmpl, data = self.options.data,
            renderhelpers = self.options.renderhelpers;
        $("tbody", $table).html($tmpl.render(data, renderhelpers));
        $ith.attr("class", "fa fa-square-o");
    };

    var renderpager = function() {
        var self = this, $pager = self.$pager, pagination = self.options.pagination,
            pageindex = pagination.pageindex, pagesize = pagination.pagesize, total = self.options.total,
            lastindex = Math.ceil(total / pagesize) - 1, pagewidth = 3, arr = [];
        if (total <= pagesize) { //不需要分页
            $(".qt-pager-info", $pager).text("合计：" + total + "项");
            $(".qt-pagination", $pager).html("");
            return;
        }
        if (pageindex > 3) { //首页上一页按钮
            arr.push('<li><a href="#0" title="首页"><i class="fa fa-angle-double-left"></i></a></li>');
            arr.push('<li><a href="#' + (pageindex - 1) + '" title="上一页"><i class="fa fa-angle-left"></i></a></li>');
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
            arr.push('<li><a href="#' + (pageindex + 1) + '" title="下一页"><i class="fa fa-angle-right"></i></a></li>');
            arr.push('<li><a href="#' + lastindex + '" title="末页"><i class="fa fa-angle-double-right"></i></a></l');
        }
        $(".qt-pagination", $pager).html(function () {
            return "<ul class='pagination pull-right'>" + arr.join("") + "</ul>";
        });
        $(".qt-pager-info", $pager).text("当前位置：" + (pageindex + 1) + "/" + (lastindex + 1) + "页 合计：" + total + "项");
    };

    var getrequestdata = function() {
        var self = this, options = self.options, data = {};
        data.pagination = options.pagination;
        data.predicate = options.predicate;
        data.sort = options.sort;
        return data;
    };

    //plugin
    $.fn.qtable = function(option) {
        return this.each(function() {
            var $this = $(this), data = $this.data('qtable'),
                options = $.extend(true, {}, $.fn.qtable.defaults, $this.data(), typeof option == 'object' && option);
            if (!data) $this.data('qtable', (data = new QTable(this, options)));
            if (typeof option == 'string') data[option]();
            else $this.init();
        });
    };

    $.fn.qtable.defaults = {
        url: null,
        total: null,
        sort: {
            fieldname: "id",
            sortorder: "desc"
        },
        pagination: {
            pagesize: 20,
            pageindex: 0,
        },
        //谓词，分两类：模糊搜索（fuzzy），精确指定（exact）
        predicate: {},
        renderhelpers: {},
        pagerclass: ".qt-pager",
        tmplclass: ".qtmpl",
        spinner: '<div class="loading-spinner" style="width: 200px; margin-left: -100px;"><div class="progress progress-striped active"><div class="progress-bar" style="width: 100%;"></div></div></div>'
    };

    $.fn.qtable.Constructor = QTable;

    $.fn.qtable.noConflict = function() {
        $.fn.qtable = old;
        return this;
    };

})(jQuery);