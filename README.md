# 说明

jquery.qtable.js 是一个基于[Bootstrap3](http://getbootstrap.com/) table样式的jquery插件。这个插件很简单，提供了一些基本功能。

[]() 可以看到更多说明和例子。

## 需求
 - [jQuery](http://jquery.com/)
 - [Bootstrap3](http://getbootstrap.com/)
 - [Font Awesome](http://fontawesome.io/) - 图标：fa-square-o fa-check-square-o fa-minus-square-o
 - [jsrender](https://github.com/BorisMoore/jsrender) - 模版工具

## API

###初始化

默认
```html
<div id="qtable" class="qt-content"></div>
```
```
<!-- tmpl https://github.com/BorisMoore/jsrender -->
<script class="qt-tmpl" type="text/x-jsrender">
    <table class="table table-hover table-condensed table-bordered">
        <thead>
            <tr>
                <th>用户名</th>
                <th>邮箱</th>
                <th>创建日期</th>
                <th>是否激活</th>
                <th>注解</th>
            </tr>
        </thead>
        <tbody>
            {{for #data}}
                <tr>
                    <td>{{>name}}</td>
                    <td>{{>email}}</td>
                    <td>{{>createDate}}</td>
                    <td>{{>isApproved}}</td>
                    <td>{{>comment}}</td>
                </tr>
            {{/for}}
        </tbody>
    </table>
</script>
```
```js
$('#qtable').qtable();
```

参数初始化
```js
$('#qtable').qtable({ url: "" });
```

Data attributes 初始化

```html
<div id="qtable" class="qt-content" data-url=""></div>
```
```js
$('#qtable').qtable();
```

设置参数
```js
$('#qtable').qtable("option", "url", "");
```
设置多个参数
```js
$('#qtable').qtable("option", { url: "" });
```
获取参数
```js
var url = $('#qtable').qtable("option", "url");
```

###Options

####url
ajax远程地址
- 默认值：`""` 默认意味着：**不启用远程**

####sort
ajax远程调用时提供的字段排序参数
- 默认值：`{ field: "id", order: "desc" }`

####pager
启用远程：分页参数
- 默认值：`pager: { size: 20, index: 0 }`

不启用远程：本地数据分页规则
- 默认值: `false` 默认不分页

####predicate
启用远程时的条件谓词参数。由服务器端代码决定
- 默认值：`{}`
- 举例：
 - `{ fuzzy: "" }`
 - `{ exacts: [{ name: "", value: "" },{ name: "", value: "" }] }`
 - `{ customs: [{ name: "", value: "" },{ name: "", value: "" }] }`

####tmpl or tmplThead tmplTbody
模板的id
- 默认值：`""`

####renderhelpers
模板帮助对象: [Sample: Passing helpers with a render() call](http://www.jsviews.com/#helpers)
- 默认值：`{}`

####data
不启用远程时，表示本地数据
- 默认值：`[]`

####check
表格每行前的选择框
- 默认值： `true`

####nest
表格嵌套时提供展开功能
- 默认值：`true`

####nestcheck
嵌套表格每行前的选择框
- 默认值：`true`