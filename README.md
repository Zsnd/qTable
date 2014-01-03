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
```html
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
ajax远程获取数据
- 默认值：`""`

####sort
ajax远程调用时提供的字段排序规则
- 默认值：`{ field: "id", order: "desc" }`

####pager
ajax远程调用时提供的分页规则。
- 默认值：`pager: { size: 20, index: 0 }`

非远程时为本地数据分页规则。
- 默认值: `false`

####predicate
ajax远程调用是提供的条件谓词。由服务器端代码决定。
- 默认值：`{}`
- 格式：
 - `{ fuzzy: "" }`
 - `{ exacts: [{ name: "", value: "" },{ name: "", value: "" }] }`
 - `{ customs: [{ name: "", value: "" },{ name: "", value: "" }] }`

####tmpl or tmplThead tmplTbody
可以使用表格模板或是直接使用thead和tbody模板
- 默认值：""

####renderhelpers
模板帮助方法
- 默认值：{}

####local
url为""时，表示本地数据
- 默认值：{}

####check
表格每行前的选择框
- 默认值： `true`

####nest
表格嵌套时提供展开功能
- 默认值：`true`