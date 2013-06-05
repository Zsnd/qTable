# 说明

jquery.qtable.js 是一个基于[Bootstrap](https://github.com/twitter/bootstrap) table样式的jquery插件。这个插件很简单，提供了一些基本的与table相关的功能。

[]() 可以看到更多说明和例子。

## 需求
 - [jQuery](http://jquery.com/)
 - [Bootstrap](https://github.com/twitter/bootstrap)
 - [jsrender](https://github.com/BorisMoore/jsrender) - 模版工具

## 功能
 - 远程加载数据
 - 分页
 - 排序
 - 移动端支持 - [http://elvery.net/demo/responsive-tables/]() 第三种

## 使用

首先假设我们需要操作一个*订单*，差不多是这样：

    public class Order{

        public int Id { get; set; }

        public string Number { get; set; }

        public DateTime Date { get; set; }

        public string Creator { get; set; }

        public string Remark { get; set; }
    }



然后需要html

    <!-- qtable -->
    <div id="container">
    <table class="table table-striped table-bordered" id="order-table">
        <thead>
            <tr>
                <th data-field="number">编号</th>
                <th data-field="date">日期</th>
                <th data-field="creator">制表人</th>
                <th data-field="remark">备注</th>
            </tr>
        </thead>
        <tbody>
        </tbody>
    </table>
    </div>

    <!-- tmpl for tbody -->
    <script id="order-table-body-tmpl" type="text/x-jsrender">
        <tr {{if id !== undefined}}data-row-id="{{>id}}"{{/if}}>
            <td data-title="编号">{{>number}}</td>
            <td data-title="日期">{{>date}}</td>
            <td data-title="制表人">{{>creator}}</td>
            <td data-title="备注">{{>remark}}</td>
        </tr>
    </script>

通过JavaScript启动
    
    $("#container").qtable();
