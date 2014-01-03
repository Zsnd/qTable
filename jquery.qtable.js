(function () {
    "use strict";
    var contentclass = ".qt-content",
        checkclass = "th:first-child i.fa.fa-square-o",
        pagerclass = ".qt-pager",
        pager = '<div class="row qt-pager"><div class="col-md-6"><label class="qt-pager-info"></label></div></div>',
        pagination = '<div class="col-md-6 qt-pagination"></div>',
        tmplclass = ".qt-tmpl",
        maskclass = ".qt-mark",
        mask = '<div class="qt-mask fade in"></div>',
        spinner = '<div class="loading-spinner" style="width: 200px; margin-left: -100px;"><div class="progress progress-striped active"><div class="progress-bar" style="width: 100%;"></div></div></div>',

        QTable = function (div, options) {
            var self = this, $div = self.$div = $(div);
            self.$mask = $(mask);
            self.$tmpl = $(options.tmpl);
            self.$tmplThead = $(options.tmplThead);
            self.$tmplTbody = $(options.tmplTbody);
            self.options = options;

            $div.append(self.$mask);
            self.reinit.call(self);
        };

    QTable.prototype = {
        constructor: QTable,

        reinit: function () {

        },

        //远程数据和本地数据是不相同的
        //远程数据为{data,other,total,pagination: {pageindex:0, pagesize:20}
        //本地数据一般直接为data

        reload: function () {
            var self = this, $div = self.$div, url = self.url, remoteable = !!url;

            if (remoteable) {
                var requestdata = getrequestdata.call(self);

                var callback = function () {
                    var def;
                    if ($.isEmptyObject(requestdata)) {
                        def = $.post(url);
                    } else {
                        def = $.ajax({
                            url: url,
                            type: 'POST',
                            dataType: 'json',
                            data: JSON.stringify(requestdata),
                            contentType: 'application/json; charset=utf-8'
                        });
                    }

                    def.done(function (remotedata) {
                        self.remote = remotedata;
                        self.render();
                    }).then(function () {
                        if (self.isLoading) {
                            setTimeout(function () {
                                self.loading.call(self);
                            }, 200);
                        }
                    }).then(function () {
                        var e = $.Event('reloaded.qtable');
                        self.$div.trigger(e);
                    });
                };
                self.loading.call(self, callback);
            } else {
                self.loading.call(self, function () {
                    self.render();
                    setTimeout(function () {
                        self.loading.call(self);
                    }, 200);
                });
            }
        },

        //有些奇怪的需求比如：本地、远程或者远程加载一次之后本地。所以用self.remote是最棒的
        //tabledata pager {info pagination}
        render: function () {
            var self = this, $div = self.$div, data = this.predata.call(self), total, pager,
                $table = self.$table, $pager = self.$pager, pageable = self.pageable;

            if (data && data.length) {
                if (self.remote) {
                    total = self.remote.total || 0;
                    pager = self.remote.pagination || self.pager;
                } else {
                    total = data.length;
                    pager = self.pager;
                }

                $(".data-empty", $div).remove();
                $table.show();
                pageable && $pager.show();

                rendertable.call(self, data);
                pageable && renderpager.call(self, total, pager);
            } else {
                $table.hide();
                pageable && $pager.hide();
                if ($(".data-empty", $div).length == 0) {
                    $table.before('<div class="alert alert-danger data-empty">未有任何数据！</div>');
                }
            }
        },

        removeLoading: function () {
            this.$loading && this.$loading.remove();
            this.$loading = null;
            this.isLoading = false;
        },

        loading: function (callback) {
            callback = callback || function () {
            };
            var $mask = this.$div.find(".qt-mask"),
                animate = $mask.hasClass('fade') ? 'fade' : '';
            if (!this.isLoading) {
                var doAnimate = $.support.transition && animate;

                this.$loading = $('<div class="loading-mask ' + animate + '">')
                    .append(spinner)
                    .appendTo($mask);

                var b = doAnimate && $mask.is(":visible");
                if (b) this.$loading[0].offsetWidth; // force reflow

                this.$loading.addClass('in');

                this.isLoading = true;

                b ? this.$loading.one($.support.transition.end, callback) : callback();

            } else if (this.isLoading && this.$loading) {
                this.$loading.removeClass('in');
                var that = this;
                var b2 = $.support.transition && $mask.is(":visible");

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
        predata: function () {
            var self = this, $div = self.$div, data;

            var e = $.Event('show.qtable'); //do something to remote or local
            $div.trigger(e);

            if (self.remote) {
                data = self.remote.data;
            } else {
                data = self.local;
            }
            return data;
        },
        

        getData: function() {
            
        },
        setData: function(data) {
            
        },
        
        option: function (name, value) {
            var self = this, n1 = typeof name, v1 = typeof value,
                firstUpperCase = function(str) {
                    return str.substr(0, 1).toUpperCase() + str.substr(1);
                },
                set = function(n, v) {
                    var setname = "set" + firstUpperCase(n);
                    if (self[setname] == undefined) {
                        self.options[setname] = v;
                    } else {
                        self[setname].call(self, n, v);
                    }
                }, get = function(n) {
                    var getname = "set" + firstUpperCase(n);
                    if (self[getname] == undefined) {
                        return self.options[getname];
                    } else {
                        return self[getname].call(self, n);
                    }
                };
            
            if (n1 == "string" && v1 == "string") {//set value
                set(name, value);
            }else if (n1 == "object" && v1 == "undefined") {//set values
                for (var index in object) {
                    if (object.hasOwnProperty(index)) {
                        set(index, object[index]);
                    }
                }
            }else if (n1 == "string" && v1 == "undefined") {//get value
                return get(name);
            }
        },
    };

    //private
    var rendertable = function (data) {
        var self = this, $table = self.$table, $ith = $("th:first-child i", $table),
            renderhelpers = self.renderhelpers, $tmpl = self.$tmpl;
        $("tbody", $table).html($tmpl.render(data, renderhelpers));
        $ith.attr("class", "fa fa-square-o");
    };

    //info几乎是一定的，pagination不一定
    var renderpager = function (total, pager) {
        var self = this, $pager = self.$pager,
            $info = $(".qt-pager-info", $pager),
            $pagination = $(".qt-pagination", $pager),
            paginationable = $pagination.length > 0,
            pageindex = pager.index, pagesize = pager.size,
            lastindex = Math.ceil(total / pagesize) - 1, pagewidth = 3, arr = [];

        if (total > -1 && $info.length) {
            if (paginationable) {
                $info.text("当前位置：" + (pageindex + 1) + "/" + (lastindex + 1) + "页 合计：" + total + "项");
            } else {
                $info.text("合计：" + total + "项");
            }
        }

        if (paginationable) {
            if (total <= pagesize) { //不需要分页
                $pagination.html("");
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
            $pagination.html(function () {
                return "<ul class='pagination pull-right'>" + arr.join("") + "</ul>";
            });
        }
    };

    var initCheck = function() {
        var self = this, check = self.options.check;
        
        if (check) {
            var $tacon = self.$mask;

            var table_th_sel = ">thead>tr>th:first-child",
            table_td_f_sel = ">tbody>tr:not(.table-detail)>td:first-child",
            table_td_nof_sel = ">tbody>tr:not(.table-detail)>td:not(:first-child)";

            var i_sel = ">i.fa",
                table_th_i_sel = table_th_sel + i_sel,
                table_td_i_sel = table_td_f_sel + i_sel;

            var tr_td_i_sel = ">td:first-child" + i_sel;

            var nest_table = "tr.table-detail>td.table-nested>.table";

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
                    var $table_th_sel = $(table_th_i_sel, $ta),
                        $table_td_sels = $(table_td_i_sel, $ta),
                        c1 = $table_td_sels.length,
                        c2 = $table_td_sels.filter(".fa.fa-check-square-o").length;

                    switch (c2) {
                        case 0:
                            setclass($table_th_sel, 0);
                            break;
                        case c1:
                            setclass($table_th_sel, 1);
                            break;
                        default:
                            setclass($table_th_sel, 2);
                    }
                };
            var active = function ($td, status) { // status: true false
                var a = false, s = 0;
                if (status) {
                    a = true;
                    s = 1;
                }

                var $tr = $td.closest("tr"), $i = $(tr_td_i_sel, $tr);
                $tr.toggleClass("active", a);
                setclass($i, s);
            }, activeall = function ($ta, status) {
                var a = false, s = 0;
                if (status) {
                    a = true;
                    s = 1;
                }

                var $tdis = $(table_td_i_sel, $ta), $trs = $tdis.closest("tr");
                $trs.toggleClass("active", a);
                setclass($tdis, s);
            };

            var settable = function ($ta) {
                $ta.on("click", table_th_sel, function () {
                    var $self = $(this), $i = $(i_sel, $self);

                    if ($i.hasClass("fa-check-square-o")) {
                        activeall($ta, false);
                        setclass($i, 0);
                    } else {
                        activeall($ta, true);
                        setclass($i, 1);
                    }
                });

                $ta.on("click", table_td_nof_sel, function () {
                    var $td = $(this);
                    activeall($ta, false);
                    active($td, true);
                    updateth($ta);
                });

                $ta.on("click", table_td_f_sel, function () {
                    var $td = $(this), $tr = $td.closest("tr");
                    active($td, !$tr.hasClass("active"));
                    updateth($ta);
                });
            };

            var setnesttable = function ($ta) {
                $ta.on("click", nest_table + " " + table_th_sel, function () {
                    var $self = $(this), $i = $(i_sel, $self), $ta_nest = $self.closest(".table-nested table");

                    if ($ta_nest.find(table_th_i_sel).length) {
                        if ($i.hasClass("fa-check-square-o")) {
                            activeall($ta_nest, false);
                            setclass($i, 0);
                        } else {
                            activeall($ta_nest, true);
                            setclass($i, 1);
                        }
                    }
                });

                $ta.on("click", nest_table + " " + table_td_nof_sel, function () {
                    var $td = $(this), $ta_nest = $td.closest(".table-nested table");

                    if ($ta_nest.find(table_th_i_sel).length) {
                        activeall($ta_nest, false);
                        active($td, true);
                        updateth($ta_nest);
                    }
                });

                $ta.on("click", nest_table + " " + table_td_f_sel, function () {
                    var $td = $(this), $tr = $td.closest("tr"), $ta_nest = $td.closest(".table-nested table");

                    if ($ta_nest.find(table_th_i_sel).length) {
                        active($td, !$tr.hasClass("active"));
                        updateth($ta);
                    }
                });
            };

            settable($tacon);
            setnesttable($tacon);
        }
    };

    var initPager = function() {
        if (!!$pager.length) {
            self.pageable = true, self.$pager = $pager, self.pager = options.pager;

            var pager_a_cur = ".qt-pagination .pagination li.active a",
                pager_a = ".qt-pagination .pagination li:not(.active) a";

            $pager.on("click", pager_a_cur, function (e) {
                e.preventDefault();
                e.stopImmediatePropagation();
            }).on("click", pager_a, function (e) {
                e.preventDefault();

                self.pager.index = $(this).attr("href").replace(/#/g, "");
                self.reload.call(self);
            });
        } else {
            delete self.pager;
        }
    };

    var initNest = function() {

    };
    
    //pager predicate sort
    var getrequestdata = function () {
        var self = this, data = {};
        data.pager = self.pager;
        data.predicate = self.predicate;
        data.sort = self.sort;
        return data;
    };

    var old = $.fn.qtable;

    //plugin
    $.fn.qtable = function (a1, a2, a3) {
        var func = function () {
            var $this = $(this), option = a1, data = $this.data('qtable'),
                options = $.extend(true, {}, $.fn.qtable.defaults, $this.data(), typeof option == 'object' && option);
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

        local: {},
        check: true,
        nest: true,
    };

    $.fn.qtable.Constructor = QTable;

    $.fn.qtable.noConflict = function () {
        $.fn.qtable = old;
        return this;
    };

})(jQuery);