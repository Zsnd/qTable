(function () {
    "use strict";
    var contentclass = ".qt-content",
        checkclass = "th:first-child i.fa.fa-square-o",
        pagerclass = ".qt-pager",
        pagertmpl = '<div class="row qt-pager"><div class="col-md-6"><label class="qt-pager-info"></label></div></div>',
        paginationtmpl = '<div class="col-md-6 qt-pagination"></div>',
        tmplclass = ".qt-tmpl",
        maskclass = ".qt-mark",
        masktmpl = '<div class="qt-mask fade in"></div>',
        tableclass = 'qm-table table table-striped table-bordered table-hover table-condensed',
        nesttableclass = "qt-nest-table table table-striped table-bordered table-hover table-condensed",
        tabletmpl = '<table class="' + tableclass + '"><thead>{{:thead}}</thead><tbody>{{:tbody}}</tbody></table>',
        check_th_tmpl = '<th class="qt-check"><i class="fa fa-square-o"></i></th>',
        nest_th_tmpl = '<th class="qt-nest"><i class="fa fa-plus"></i></th>',
        spinner = '<div class="loading-spinner" style="width: 200px; margin-left: -100px;"><div class="progress progress-striped active"><div class="progress-bar" style="width: 100%;"></div></div></div>',
        QTable = function (div, options) {
            var self = this, $div = self.$div = $(div);
            self.$tacon = $(masktmpl);
            self.$pacon = $(pagertmpl);
            self.$tmpl = $(options.tmpl);
            self.$tmplThead = $(options.tmplThead);
            self.$tmplTbody = $(options.tmplTbody);
            self.options = options;

            $div.append(self.$tacon).append(self.$pacon);
            self.reinit.call(self);
        };

    QTable.prototype = {
        constructor: QTable,

        //_url, _sort,  _predicate, _tmpl, _tmplThead, _tmplTbody, _renderhelpers, _local, _check, _nest;
        //get set key word compatibility ie9+
        //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/get
        //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/set
        //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty
        _options: function () {
            var _data, _pager, _nestcheck;

            Object.defineProperty(this, "data", {
                get: function () {
                    if (this.url && this.remote) {
                        return this.remote.data;
                    }
                    return _data;
                },
                set: function (v) {
                    //set data of using local data
                    this.url = "";
                    _data = v;
                }
            });
            Object.defineProperty(this, "pager", {
                get: function () {
                    return this.url ? _pager : false;
                },
                set: function (v) {
                    _pager = v;
                }
            });
            Object.defineProperty(this, "nestcheck", {
                get: function () {
                    return this.nest && _nestcheck;
                },
                set: function (v) {
                    _nestcheck = v;
                }
            });
        },

        reinit: function () {
            reinitCheckEvent.call(this);
            reinitPagerEvent.call(this);
            reinitNestEvent.call(this);
        },

        //远程数据为{data,other,total}
        reload: function () {
            var self = this, url = self.options.url;

            if (url) {
                var requestdata = getrequestdata.call(self);

                var callback = function () {
                    $.ajax({
                        url: url,
                        //type: 'POST',
                        type: 'GET',//iis no allow post to index.json
                        dataType: 'json',
                        data: JSON.stringify(requestdata),
                        contentType: 'application/json; charset=utf-8'
                    }).done(function (remotedata) {
                        self.options.remote = remotedata;
                        self.render();
                    }).then(function () {
                        if (self.isLoading) {
                            setTimeout(function () {
                                self.loading();
                            }, 200);
                        }
                    }).then(function () {
                        var e = $.Event('reloaded.qtable');
                        self.$div.trigger(e);
                    });
                };
                self.loading(callback);
            } else {
                self.loading(function () {
                    self.render();
                    setTimeout(function () {
                        self.loading.call(self);
                    }, 200);
                });
            }
        },

        //tabledata pager {info pagination}
        render: function () {
            var self = this, $div = self.$div;

            var e = $.Event('show.qtable'); //do something to remote or local
            $div.trigger(e);

            var data = self.options.data, pager = self.options.pager,
                total = self.options.url ? self.options.remote.total : data.length;

            rerendertable.call(self, data);
            rerenderpager.call(self, total, pager);
        },

        removeLoading: function () {
            this.$loading && this.$loading.remove();
            this.$loading = null;
            this.isLoading = false;
        },

        loading: function (callback) {
            callback = callback || function () {
            };
            var $tacon = this.$tacon,
                animate = $tacon.hasClass('fade') ? 'fade' : '';
            if (!this.isLoading) {
                var doAnimate = $.support.transition && animate;

                this.$loading = $('<div class="loading-mask ' + animate + '">')
                    .append(spinner)
                    .appendTo($tacon);

                var b = doAnimate && $tacon.is(":visible");
                if (b) this.$loading[0].offsetWidth; // force reflow

                this.$loading.addClass('in');

                this.isLoading = true;

                b ? this.$loading.one($.support.transition.end, callback) : callback();

            } else if (this.isLoading && this.$loading) {
                this.$loading.removeClass('in');
                var that = this;
                var b2 = $.support.transition && $tacon.is(":visible");

                b2 && this.$div.find(".qt-mask").hasClass('fade') ? this.$loading.one($.support.transition.end, function () {
                    that.removeLoading();
                }) : that.removeLoading();

            } else if (callback) {
                callback(this.isLoading);
            }
        },

        getsel: function (e) {
            var self = this, $div = self.$div;
            var ids = $.map($(".table>tbody>tr.active", $div), function (v) {
                return $(v).attr("data-row-id");
            });
            if (ids.length) {
                return ids;
            } else {
                $.error("警告", "请选择记录！");
                e && e.stopPropagation();
                return null;
            }
        },
        getseldata: function () {
            var self = this, $div = self.$div,
                data = this.predata.call(self), arr = [];

            $.each($(".table>tbody>tr", $div), function (i, tr) {
                if ($(tr).hasClass("active")) {
                    arr.push(data[i]);
                }
            });
            return arr;
        },

        option: function (name, value) {
            var self = this, n = typeof name, v = typeof value;
            if (n == "string" && v != "undefined") { //set value
                self.options[name] = value;
                self.reinit();
                self.reload();
            } else if (n == "object" && v == "undefined") { //set values
                $.extend(self.options, name);
                self.reinit();
                self.reload();
            } else if (n == "string" && v == "undefined") { //get value
                return self.options[name];
            }
        },
    };

    //private
    var tablehtml = function (data) {
        var self = this,
            $tmpl = self.$tmpl,
            $thead = self.$tmplThead,
            $tbody = self.$tmplTbody,
            helper = self.renderhelpers;

        if (data && data.length) {
            if ($tmpl.length) {
                return $tmpl.render([data], helper).replace(/<table.*>/, '<table class="' + tableclass + '">');
            } else if ($thead.length && $tbody.length) {
                return tabletmpl.replace(/{{:thead}}/, $thead.html()).replace(/{{:tbody}}/, $tbody.render(data, helper));
            }
        }
        return "";
    };

    var rerendertable = function (data) {
        var self = this, nest = self.options.nest,
            nestcheck = self.options.nestcheck, check = self.options.check,
            $tacon = self.$tacon,
            table = tablehtml.call(self, data);
        $tacon.find("> table").remove().end().find("> div.alert").remove();
        if (table) {
            var $table = $(table);
            if (nest) {
                var $nest_trs = $table.find(">tbody>tr.qt-nest-tr");
                if ($nest_trs.length) {
                    //remove table-striped from top table class
                    $table.toggleClass("table-striped", false);
                    //add "+" to top table thead
                    $table.find(">thead>tr").prepend(nest_th_tmpl).end()
                        //add fixed <th> to top table tbody
                        .find(">tbody>tr").prepend('<th class="qt-nest"></th>');
                    //replace nest table class
                    $nest_trs.find(">.qt-nest-td>table").attr("class", nesttableclass);

                    var $trs = $table.find(">tbody>tr");
                    $.each($trs, function (i, tr) {
                        var $nest_tr = $(tr).next("tr.qt-nest-tr");
                        if ($nest_tr.length) {
                            $(tr).find(".qt-nest").html('<i class="fa fa-plus"></i>');
                            $nest_tr.find(".qt-nest").toggleClass("qt-nest", false)
                                .html('<i class="fa fa-level-up fa-rotate-90"></i>');
                        } else {
                            $(tr).find(".qt-nest").toggleClass("qt-nest", false);
                        }
                    });
                }
            } else {
                $table.find(">tbody>tr.qt-nest-tr").remove();
            }
            if (check) {
                $table.find(">thead>tr, " +
                    ">tbody>tr:not(.qt-nest-tr)").prepend(check_th_tmpl).end()
                    .find(">tbody>tr.qt-nest-tr").prepend("<th></th>");
            }
            if (nestcheck) {
                $table.find("tr.qt-nest-tr > td.qt-nest-td > table > thead > tr, " +
                    "tr.qt-nest-tr > td.qt-nest-td > table > tbody > tr:not(.qt-nest-tr)").prepend(check_th_tmpl).end()
                    .find("tr.qt-nest-tr > td.qt-nest-td > table > tbody > tr.qt-nest-tr").prepend("<th></th>");
            }
            $tacon.append($table);
        } else {
            $tacon.append('<div class="alert alert-danger data-empty">未有任何数据！</div>');
        }
    };

    var rerenderpager = function (total, pager) {
        var self = this, $pacon = self.$pacon,
            $info = $(".qt-pager-info", $pacon),
            paginationable = self.options.pager;

        $(".qt-pagination", $pacon).remove();
        $pacon.hide();
        if (total > 0) {
            $pacon.show();
            if (paginationable) {
                var pageindex = pager.index, pagesize = pager.size,
                    lastindex = Math.ceil(total / pagesize) - 1, pagewidth = 3, arr = [];

                $info.text("当前位置：" + (pageindex + 1) + "/" + (lastindex + 1) + "页 合计：" + total + "项");

                if (total <= pagesize) { //不需要分页
                    return;
                }
                if (pageindex > pagewidth) { //首页上一页按钮
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
                if (pageindex < lastindex - pagewidth) { //需要下一页末页按钮
                    arr.push('<li><a href="#' + (pageindex + 1) + '" title="下一页"><i class="fa fa-angle-right"></i></a></li>');
                    arr.push('<li><a href="#' + lastindex + '" title="末页"><i class="fa fa-angle-double-right"></i></a></l');
                }
                $pacon.append('<div class="col-md-6 qt-pagination"><ul class="pagination pull-right">' + arr.join("") + '</ul></div>');
            } else {
                $info.text("合计：" + total + "项");
            }
        }
    };

    var reinitCheckEvent = function () {
        var self = this, check = self.options.check,
            nestcheck = self.options.nestcheck, $tablecontent = self.$tacon;
        $tablecontent.off("click.check");

        if (check || nestcheck)
            var thead_th = ">thead>tr>th.qt-check",
                tbody_th = ">tbody>tr:not(.qt-nest-tr)>th.qt-check",
                tbody_td = ">tbody>tr:not(.qt-nest-tr)>td";

        var table = ">table",
            table_thead_th = table + thead_th,
            table_tbody_th = table + tbody_th,
            table_tbody_td = table + tbody_td;

        var i = ">i.fa",
            thead_th_i = thead_th + i,
            tbody_th_i = tbody_th + i;

        var th_i = ">th.qt-check" + i;

        var nest_table = "tr.qt-nest-tr>td.qt-nest-td>table",
            nest_table_thead_th = nest_table + thead_th,
            nest_table_tbody_th = nest_table + tbody_th,
            nest_table_tbody_td = nest_table + tbody_td;

        var setclass = function ($i, status) { //0 空框 1 打勾 2 -号
            $i.toggleClass("fa fa-square-o fa-check-square-o fa-minus-square-o", false);
            switch (status) {
                case 1:
                    $i.toggleClass("fa fa-check-square-o", true);
                    break;
                case 2:
                    $i.toggleClass("fa fa-minus-square-o", true);
                    break;
                default:
                    $i.toggleClass("fa fa-square-o", true);
            }
        },
            updateth = function ($ta) {
                var $th_i = $(thead_th_i, $ta),
                    $td_i = $(tbody_th_i, $ta),
                    c1 = $td_i.length,
                    c2 = $td_i.filter(".fa.fa-check-square-o").length;

                switch (c2) {
                    case 0:
                        setclass($th_i, 0);
                        break;
                    case c1:
                        setclass($th_i, 1);
                        break;
                    default:
                        setclass($th_i, 2);
                }
            };
        var active = function ($td, status) { // status: true false
            var a = false, s = 0;
            if (status) {
                a = true;
                s = 1;
            }

            var $tr = $td.closest("tr"), $i = $(th_i, $tr);
            $tr.toggleClass("active", a);
            setclass($i, s);
        }, activeall = function ($ta, status) {
            var a = false, s = 0;
            if (status) {
                a = true;
                s = 1;
            }

            var $td_i = $(tbody_th_i, $ta), $tr = $td_i.closest("tr");
            $tr.toggleClass("active", a);
            setclass($td_i, s);
        };
        var settable = function ($tacon) {
            $tacon.on("click.check", table_thead_th, function () {
                var $th = $(this), $i = $(i, $th), $ta = $th.closest("table");

                if ($i.hasClass("fa-check-square-o")) {
                    activeall($ta, false);
                    setclass($i, 0);
                } else {
                    activeall($ta, true);
                    setclass($i, 1);
                }
            });

            $tacon.on("click.check", table_tbody_td, function () {
                var $td = $(this), $ta = $td.closest("table");
                activeall($ta, false);
                active($td, true);
                updateth($ta);
            });

            $tacon.on("click.check", table_tbody_th, function () {
                var $td = $(this), $tr = $td.closest("tr"), $ta = $td.closest("table");
                active($td, !$tr.hasClass("active"));
                updateth($ta);
            });
        };
        var setnesttable = function ($tacon) {
            $tacon.on("click.check", nest_table_thead_th, function () {
                var $th = $(this), $i = $(i, $th), $ta_nest = $th.closest(".qt-nest-td > table");

                if ($ta_nest.find(thead_th_i).length) {
                    if ($i.hasClass("fa-check-square-o")) {
                        activeall($ta_nest, false);
                        setclass($i, 0);
                    } else {
                        activeall($ta_nest, true);
                        setclass($i, 1);
                    }
                }
            });

            $tacon.on("click.check", nest_table_tbody_td, function () {
                var $td = $(this), $ta_nest = $td.closest(".qt-nest-td > table");

                if ($ta_nest.find(thead_th_i).length) {
                    activeall($ta_nest, false);
                    active($td, true);
                    updateth($ta_nest);
                }
            });

            $tacon.on("click.check", nest_table_tbody_th, function () {
                var $td = $(this), $tr = $td.closest("tr"), $ta_nest = $td.closest(".qt-nest-td > table");

                if ($ta_nest.find(thead_th_i).length) {
                    active($td, !$tr.hasClass("active"));
                    updateth($ta_nest);
                }
            });
        };
        check && settable($tablecontent);
        nestcheck && setnesttable($tablecontent);
    };

    var reinitPagerEvent = function () {
        var self = this, pager = self.options.pager, $pagercontent = self.$pacon;
        $pagercontent.off("click.pager");

        if (pager) {
            var pager_a_cur = ".qt-pagination .pagination li.active a",
                pager_a = ".qt-pagination .pagination li:not(.active) a";

            $pagercontent.on("click.pager", pager_a_cur, function (e) {
                e.preventDefault();
                e.stopImmediatePropagation();
            }).on("click.pager", pager_a, function (e) {
                e.preventDefault();

                self.options.pager.index = parseInt($(this).attr("href").replace(/#/g, ""));
                self.reload.call(self);
            });
        }
    };

    var reinitNestEvent = function () {
        var self = this, $tacon = self.$tacon;
        $tacon.off("click.nest");

        var setclass = function ($i, status) { //(false)0:关闭 (true)1:展开
            $i.toggleClass("fa fa-plus fa-minus", false);
            if (status) {
                $i.toggleClass("fa fa-minus", true);
            } else {
                $i.toggleClass("fa fa-plus", true);
            }
        };

        $tacon.on("click.nest", "tbody>tr>th.qt-nest", function (e) {
            e.stopImmediatePropagation();
            e.stopPropagation();
            var $i = $(this).find(">i.fa"),
                $nest_tr = $i.closest("tr").next("tr.qt-nest-tr"),
                status = $i.hasClass("fa-plus");
            setclass($i, status);
            $nest_tr.toggleClass("hide", !status);

        }).on("click.nest", "thead>tr>th.qt-nest", function (e) {
            e.stopImmediatePropagation();
            e.stopPropagation();
            var $i = $(this).find(">i.fa"),
                status = $i.hasClass("fa-plus"),
                fa = status ? "fa-plus" : "fa-minus";
            setclass($i, status);
            $i.closest("table").find(">tbody>tr>th.qt-nest>i." + fa).click();
        });
    };

    //pager predicate sort
    var getrequestdata = function () {
        var self = this, data = {};
        data.pager = self.options.pager;
        data.predicate = self.options.predicate;
        data.sort = self.options.sort;
        return data;
    };

    var old = $.fn.qtable;

    //plugin
    $.fn.qtable = function (a1, a2, a3) {
        var func = function () {
            var $this = $(this), option = a1, data = $this.data('qtable'), init = !data,
                options = $.extend(true, new QTable.prototype._options(), $.fn.qtable.defaults, $this.data(), typeof option == 'object' && option);
            if (!data) $this.data('qtable', (data = new QTable(this, options)));

            if (init && !(options.url == "" && options.data.length == 0) &&
                option != 'reload' && option != 'option') {
                data.reload.call(data);
            }

            if (typeof option == 'string') {
                var value = data[option](a2, a3);
                if (value != undefined) {
                    return value;
                }
            }
        };

        if (typeof a1 == 'string' && a1 == 'option' && typeof a2 == 'string' && typeof a3 == 'undefined') {
            //get prop value
            return func.call(this.eq(0));
        } else {
            return this.each(func);
        }
    };

    $.fn.qtable.defaults = {
        url: "",
        sort: { field: "id", order: "desc" },
        pager: { index: 0, size: 20 },
        predicate: {},

        tmpl: "",
        tmplThead: "",
        tmplTbody: "",
        renderhelpers: {},

        data: [],
        check: true,
        nest: true,
        nestcheck: true,
    };

    $.fn.qtable.Constructor = QTable;

    $.fn.qtable.noConflict = function () {
        $.fn.qtable = old;
        return this;
    };
    $(function () {
        $.views.tags("qtnest", function (array) {
            if (array && array.length) {
                var html = '<tr class="qt-nest-tr hide"><td colspan="10" class="qt-nest-td">' +
                    $(this.tagCtx.props.tmpl).render(array) +
                    '</td></tr>';
                return html;
            }
            return "";
        });
    });

})(jQuery);