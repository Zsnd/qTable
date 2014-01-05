(function() {
    "use strict";
    var contentclass = ".qt-content",
        checkclass = "th:first-child i.fa.fa-square-o",
        pagerclass = ".qt-pager",
        pagertmpl = '<div class="row qt-pager"><div class="col-md-6"><label class="qt-pager-info"></label></div></div>',
        paginationtmpl = '<div class="col-md-6 qt-pagination"></div>',
        tmplclass = ".qt-tmpl",
        maskclass = ".qt-mark",
        masktmpl = '<div class="qt-mask fade in"></div>',
        tabletmplclass = 'qm-table table table-hover table-condensed table-bordered',
        tabletmpl = '<table class="' + tabletmplclass + '"><thead>{{:thead}}</thead><tbody>{{:tbody}}</tbody></table>',
        tathtmpl = '<th style="width: 2em" class="text-center"><i class="fa fa-square-o"></i></th>',
        tatdtmpl = '<td class="text-center"><i class="fa fa-square-o"></i></td>',
        spinner = '<div class="loading-spinner" style="width: 200px; margin-left: -100px;"><div class="progress progress-striped active"><div class="progress-bar" style="width: 100%;"></div></div></div>',
        QTable = function(div, options) {
            var self = this, $div = self.$div = $(div);
            self.$tacon = $(masktmpl);
            self.$pacon = $(pagertmpl);
            self.$tmpl = $(options.tmpl);
            self.$tmplThead = $(options.tmplThead);
            self.$tmplTbody = $(options.tmplTbody);
            self.options = options;

            $div.append(self.$tacon).append(self.$pacon);
            self.reinit.call(self);
            self.reload.call(self);
        };

    var _data, _pager, _nestcheck; //_url, _sort,  _predicate, _tmpl, _tmplThead, _tmplTbody, _renderhelpers, _local, _check, _nest;

    QTable.prototype = {
        constructor: QTable,

        //get set key word compatibility ie9+
        //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/get
        //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/set
        //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty
        _options: {
            get data() {
                if (this.url) {
                    return this.remote.data;
                }
                return _data;
            },
            set data(val) {
                _data = val;
            },
            get pager() {
                return this.url ? _pager : false;
            },
            set pager(val) {
                _pager = val;
            },
            get nestcheck() {
                return this.nest && _nestcheck;
            },
            set nestcheck(val) {
                _nestcheck = val;
            }
        },

        reinit: function() {
            reinitCheckEvent.call(this);
            reinitPagerEvent.call(this);
        },

        //远程数据为{data,other,total}
        reload: function() {
            var self = this, url = self.options.url;

            if (url) {
                var requestdata = getrequestdata.call(self);

                var callback = function() {
                    $.ajax({
                        url: url,
                        //type: 'POST',
                        type: 'GET',//iis no allow post to json.html
                        dataType: 'json',
                        data: JSON.stringify(requestdata),
                        contentType: 'application/json; charset=utf-8'
                    }).done(function(remotedata) {
                        self.options.remote = remotedata;
                        self.render();
                    }).then(function() {
                        if (self.isLoading) {
                            setTimeout(function() {
                                self.loading();
                            }, 200);
                        }
                    }).then(function() {
                        var e = $.Event('reloaded.qtable');
                        self.$div.trigger(e);
                    });
                };
                self.loading(callback);
            } else {
                self.loading(function() {
                    self.render();
                    setTimeout(function() {
                        self.loading.call(self);
                    }, 200);
                });
            }
        },

        //tabledata pager {info pagination}
        render: function() {
            var self = this, $div = self.$div;

            var e = $.Event('show.qtable'); //do something to remote or local
            $div.trigger(e);

            var data = self.options.data, pager = self.options.pager,
                total = self.options.url ? self.options.remote.total : data.length;

            rerendertable.call(self, data);
            rerenderpager.call(self, total, pager);
        },

        removeLoading: function() {
            this.$loading && this.$loading.remove();
            this.$loading = null;
            this.isLoading = false;
        },

        loading: function(callback) {
            callback = callback || function() {
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

                b2 && this.$div.find(".qt-mask").hasClass('fade') ? this.$loading.one($.support.transition.end, function() {
                    that.removeLoading();
                }) : that.removeLoading();

            } else if (callback) {
                callback(this.isLoading);
            }
        },

        getsel: function(e) {
            var self = this, $div = self.$div;
            var ids = $.map($(".table>tbody>tr.active", $div), function(v) {
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
        getseldata: function() {
            var self = this, $div = self.$div,
                data = this.predata.call(self), arr = [];

            $.each($(".table>tbody>tr", $div), function(i, tr) {
                if ($(tr).hasClass("active")) {
                    arr.push(data[i]);
                }
            });
            return arr;
        },

        option: function(name, value) {
            var self = this, n = typeof name, v = typeof value;
            if (n == "string" && v == "string") { //set value
                self.options[name] = value;
                self.reinit();
            } else if (n == "object" && v == "undefined") { //set values
                $.extend(self.options, name);
                self.reinit();
            } else if (n == "string" && v == "undefined") { //get value
                return self.options[name];
            }
        },
    };

    //private
    var tablehtml = function(data) {
        var self = this,
            $tmpl = self.$tmpl,
            $thead = self.$tmplThead,
            $tbody = self.$tmplTbody,
            helper = self.renderhelpers;

        if (data && data.length) {
            if ($tmpl.length) {
                return $tmpl.render([data], helper).replace(/<table.*>/, '<table class="' + tabletmplclass + '">');
            } else if ($thead.length && $tbody.length) {
                return $(tablehtml).render({ thead: $thead.html(), tbody: $tbody.render(data, helper) });
            }
        }
        return "";
    };

    var rerendertable = function(data) {
        var self = this, nest = self.options.nest,
            nestcheck = self.options.nestcheck, check = self.options.check,
            $tacon = self.$tacon,
            table = tablehtml.call(self, data);
        $tacon.find("> table").remove().end().find("> div.alert").remove();
        if (table) {
            var $table = $(table);
            if (nest) {

            }
            if (check) {
                $table.find("> thead > tr").prepend(tathtmpl).end().find("> tbody > tr:not(.table-detail)").prepend(tatdtmpl);
            }
            if (nestcheck) {
                $table.find("tr.table-detail > td.table-nested > table > thead > tr").prepend(tathtmpl).end()
                    .find("tr.table-detail > td.table-nested > table > tbody > tr:not(.table-detail)").prepend(tatdtmpl);
            }
            $tacon.append($table);
        } else {
            $tacon.append('<div class="alert alert-danger data-empty">未有任何数据！</div>');
        }
    };

    var rerenderpager = function(total, pager) {
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

    var reinitCheckEvent = function() {
        var self = this, check = self.options.check, $tablecontent = self.$tacon;
        $tablecontent.off("click");

        if (check) {
            var thead_tr_th_f = ">thead>tr>th:first-child",
                tbody_tr_td_f = ">tbody>tr:not(.table-detail)>td:first-child",
                tbody_tr_td_not_f = ">tbody>tr:not(.table-detail)>td:not(:first-child)";

            var table = ">table",
                table_thead_tr_th_f = table + thead_tr_th_f,
                table_tbody_tr_td_f = table + tbody_tr_td_f,
                table_tbody_tr_td_not_f = table + tbody_tr_td_not_f;

            var i = ">i.fa",
                thead_tr_th_f_i = thead_tr_th_f + i,
                tbody_tr_td_f_i = tbody_tr_td_f + i;

            var td_f_i = ">td:first-child" + i;

            var nest_table = "tr.table-detail>td.table-nested>table",
                nest_table_thead_tr_th_f = nest_table + thead_tr_th_f,
                nest_table_tbody_tr_td_f = nest_table + tbody_tr_td_f,
                nest_table_tbody_tr_td_not_f = nest_table + tbody_tr_td_not_f;

            var setclass = function($i, status) { //0 空框 1 打勾 2 -号
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
                updateth = function($ta) {
                    var $th_i = $(thead_tr_th_f_i, $ta),
                        $td_i = $(tbody_tr_td_f_i, $ta),
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
            var active = function($td, status) { // status: true false
                var a = false, s = 0;
                if (status) {
                    a = true;
                    s = 1;
                }

                var $tr = $td.closest("tr"), $i = $(td_f_i, $tr);
                $tr.toggleClass("active", a);
                setclass($i, s);
            }, activeall = function($ta, status) {
                var a = false, s = 0;
                if (status) {
                    a = true;
                    s = 1;
                }

                var $td_i = $(tbody_tr_td_f_i, $ta), $tr = $td_i.closest("tr");
                $tr.toggleClass("active", a);
                setclass($td_i, s);
            };

            var settable = function($tacon) {
                $tacon.on("click", table_thead_tr_th_f, function() {
                    var $th = $(this), $i = $(i, $th), $ta = $th.closest("table");

                    if ($i.hasClass("fa-check-square-o")) {
                        activeall($ta, false);
                        setclass($i, 0);
                    } else {
                        activeall($ta, true);
                        setclass($i, 1);
                    }
                });

                $tacon.on("click", table_tbody_tr_td_not_f, function() {
                    var $td = $(this), $ta = $td.closest("table");
                    activeall($ta, false);
                    active($td, true);
                    updateth($ta);
                });

                $tacon.on("click", table_tbody_tr_td_f, function() {
                    var $td = $(this), $tr = $td.closest("tr"), $ta = $td.closest("table");
                    active($td, !$tr.hasClass("active"));
                    updateth($ta);
                });
            };

            var setnesttable = function($tacon) {
                $tacon.on("click", nest_table_thead_tr_th_f, function() {
                    var $th = $(this), $i = $(i, $th), $ta_nest = $th.closest(".table-nested > table");

                    if ($ta_nest.find(thead_tr_th_f_i).length) {
                        if ($i.hasClass("fa-check-square-o")) {
                            activeall($ta_nest, false);
                            setclass($i, 0);
                        } else {
                            activeall($ta_nest, true);
                            setclass($i, 1);
                        }
                    }
                });

                $tacon.on("click", nest_table_tbody_tr_td_not_f, function() {
                    var $td = $(this), $ta_nest = $td.closest(".table-nested > table");

                    if ($ta_nest.find(thead_tr_th_f_i).length) {
                        activeall($ta_nest, false);
                        active($td, true);
                        updateth($ta_nest);
                    }
                });

                $tacon.on("click", nest_table_tbody_tr_td_f, function() {
                    var $td = $(this), $tr = $td.closest("tr"), $ta_nest = $td.closest(".table-nested > table");

                    if ($ta_nest.find(thead_tr_th_f_i).length) {
                        active($td, !$tr.hasClass("active"));
                        updateth($ta_nest);
                    }
                });
            };

            settable($tablecontent);
            setnesttable($tablecontent);
        }
    };

    var reinitPagerEvent = function() {
        var self = this, pager = self.options.pager, $pagercontent = self.$pacon;
        $pagercontent.off("click");

        if (pager) {
            var pager_a_cur = ".qt-pagination .pagination li.active a",
                pager_a = ".qt-pagination .pagination li:not(.active) a";

            $pagercontent.on("click", pager_a_cur, function(e) {
                e.preventDefault();
                e.stopImmediatePropagation();
            }).on("click", pager_a, function(e) {
                e.preventDefault();

                self.options.pager.index = parseInt($(this).attr("href").replace(/#/g, ""));
                self.reload.call(self);
            });
        }
    };

    var initNest = function() {

    };

    //pager predicate sort
    var getrequestdata = function() {
        var self = this, data = {};
        data.pager = self.options.pager;
        data.predicate = self.options.predicate;
        data.sort = self.options.sort;
        return data;
    };

    var old = $.fn.qtable;

    //plugin
    $.fn.qtable = function(a1, a2, a3) {
        var func = function() {
            var $this = $(this), option = a1, data = $this.data('qtable'),
                options = $.extend(true, QTable.prototype._options, $.fn.qtable.defaults, $this.data(), typeof option == 'object' && option);
            if (!data) $this.data('qtable', (data = new QTable(this, options)));
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

    $.fn.qtable.noConflict = function() {
        $.fn.qtable = old;
        return this;
    };

})(jQuery);