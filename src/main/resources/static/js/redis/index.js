/**
 * Created by trustme on 2017/1/15.
 * index.js
 */
//当前key
var key;
//当前数据类型
var redisType;
//当前是第几个数据库
var redisDb;
var string = "string";
var list = "list";
var set = "set";
var zset = "zset";
var hash = "hash";
var nowNodeId;
var listSize = 0;
var zSetArr;
var hashArr;
var setArr;

var ttlStr = '<div class="panel " style="display: none;" id="ttl-content"> <table class="table table-bordered ">' +
    '<thead><tr><th style="width: 87%;">过期时间(秒)</th><th style="text-align: center;">操作</th></tr></thead>' +
    '<tbody><tr><td style="padding: 0;"><input type="text" maxlength="10" class="form-control"  value="-1"  ' +
    'onkeyup="checkNumber(this)"/></td><td><button type="button" class="btn btn-success btn-xs " style="margin-left: 5px;" onclick="setExpire(this)">保存</button>' +
    '</td></tr></tbody></table></div>';
$(function () {
    $(function () {
        //key导航切换
        $("#redisContent").on('click', ".nav-tabs li", function () {
            $(this).siblings("li").removeClass("active");
            $(this).addClass("active");
            var text = $(this).find("a").html();
            if (text == "生存时间") {
                if (!$(this).hasClass("firstClick")) {
                    $(this).addClass("firstClick");
                    $.ajax({
                        url: ctx + server + "/ttl",
                        data: {db: redisDb, key: key},
                        type: "post",
                        dataType: "json",
                        success: function (data) {
                            $("#ttl-content").find("input").val(data);
                        }
                    });
                }
                $("#type-content").css("display", "none");
                $("#ttl-content").css("display", "block");
            } else {
                $("#ttl-content").css("display", "none");
                $("#type-content").css("display", "block");
            }
        });

        //点击
        $("#tree").on('click', '.node-div', function () {
            var $result = $(this).find(".expand-icon");
            if ($result.length > 0) {
                return;
            }
            var db = $(this).parent().closest(".child_ul").siblings(".node-div").find(".text").html();
            var indexOf = db.indexOf("db");
            if (indexOf == -1 && db != "data") {
                redisDb = $(this).find(".text").html().substr(2);
                return;
            }
            redisDb = db.substring(indexOf + 2);
            var text = $(this).find(".text");
            key = text.html();
            var type = text.attr("type");
            nowNodeId = $(this).closest("li").attr("node-id");
            redisType = type;
            if (type == string) {
                getString();
            } else if (type == list) {
                getList();
            } else if (type == set) {
                getSet();
            } else if (type == zset) {
                getZSet();
            } else if (type == hash) {
                getHash();
            }

        })
    });
    //备份
    $("#backup").on("click", function () {
        open(ctx + server + "/backup");
    });
    //恢复
    $("#recover").on("change", function () {
        $("#recover").closest(".btn").addClass("disabled");
        $("#recover").closest(".btn").find(".text").html("恢复中");
        var options = {
            url: ctx + server + "/recover",
            type: "post",
            dataType: "text",
            success: function (data) {
                $("#recover").closest(".btn").removeClass("disabled");
                $("#recover").closest(".btn").find(".text").html("恢复");
                $("#promptBtn").on('click', function () {
                    document.location.reload();//当前页面
                });
                showModel(data);
            }
        };
        $("#fileForm").ajaxSubmit(options);
        $("#recover").val("");
    });
    //序列化恢复
    $("#serializeRecover").on("change", function () {
        $("#serializeRecover").closest(".btn").addClass("disabled");
        $("#serializeRecover").closest(".btn").find(".text").html("恢复中");
        var options = {
            url: ctx + server + "/serializeRecover",
            type: "post",
            dataType: "text",
            success: function (data) {
                $("#serializeRecover").closest(".btn").removeClass("disabled");
                $("#serializeRecover").closest(".btn").find(".text").html("JDK序列化恢复");

                $("#promptBtn").on('click', function () {
                    document.location.reload();//当前页面
                });
                showModel(data);
            }
        };
        $("#serializeFileForm").ajaxSubmit(options);
        $("#serializeRecover").val("");
    });
    //删除全部数据
    $("#flushAll").on("click", function () {
        $('#myModal').modal('hide');
        $.ajax({
            url: ctx + server + "/flushAll",
            type: "post",
            dataType: "text",
            success: function (data) {
                if (data == '1') {
                    $("#promptContent").html("<p>删除成功</p>");
                    $("#promptBtn").removeClass("btn-danger").addClass("btn-success");
                    $("#promptBtn").on('click', function () {
                        document.location.reload();//当前页面
                    })
                }
                showModel(data);
            }
        })
    });
    $(".noExploit").on('click', function () {
        $("#promptTitle").html("提示");
        $("#promptContent").html("<p>此功能待开发,感谢您对作者的支持 wang</p>");
        $("#promptBtn").removeClass("btn-danger").addClass("btn-success");
        $("#prompt").modal("show");
    })
});

/**
 * 重命名key
 **/
function rename(th) {
    var newKey = $(th).closest("tr").find("input").val().trim();
    if (newKey == '' || newKey == key) {
        return;
    }
    $.ajax({
        url: ctx + server + "/renameNx",
        data: {db: redisDb, oldKey: key, newKey: newKey},
        type: "post",
        dataType: "text",
        success: function (data) {
            if (data == "1") {
                key = newKey;
                $("li[node-id='" + nowNodeId + "']").find(".text").html(key);
            }
            showModel(data);
        }
    });
}
//更新生存时间
function setExpire(th) {
    var seconds = $(th).closest("tr").find("input").val();
    if (!isNaN(seconds)) {
        if (2147483648 < seconds) {
            alert("超过int最大范围!");
            return;
        }
        if (seconds == '' || seconds < 0) {
            $.ajax({
                url: ctx + server + "/persist",
                data: {db: redisDb, key: key},
                type: "post",
                dataType: "text",
                success: function (data) {
                    showModel(data);
                }
            });
            return;
        }
        $.ajax({
            url: ctx + server + "/setExpire",
            data: {db: redisDb, key: key, seconds: seconds},
            type: "post",
            dataType: "text",
            success: function (data) {
                showModel(data);
            }
        });
    }
}
//删除key
function delKey(th) {
    $.ajax({
        url: ctx + server + "/delKey",
        data: {db: redisDb, key: key},
        type: "post",
        dataType: "text",
        success: function (data) {
            showModel(data);
            if (data == "1") {
                $("li[node-id='" + nowNodeId + "']").empty();
                $("#redisContent").empty();
            }
        }
    });
}
/**
 * string更新值
 * */
function updateString(th) {
    var val = $(th).closest("tr").find("textarea").val();
    val = val.trim();
    if (val == '') {
        return;
    }
    $.ajax({
        url: ctx + server + serialize + "/updateString",
        data: {db: redisDb, key: key, val: val},
        type: "post",
        dataType: "text",
        success: function (data) {
            showModel(data);
        }
    });
}
function updateList(th) {
    var val = $(th).closest("tr").find("textarea").val().trim();
    if (val == '') {
        return;
    }
    var index = $(th).closest("tr").find("td").first().html();
    --index;
    $.ajax({
        url: ctx + server + serialize + "/updateList",
        data: {db: redisDb, index: index, key: key, val: val},
        type: "post",
        dataType: "text",
        success: function (data) {
            showModel(data);
        }
    });
}
function delList(th) {
    var index = $(th).closest("tr").find("td").first().html();
    --index;
    var len = $(th).closest("tr").prevAll().length;
    var strLen = len.toString();
    var strIndex = index.toString();
    var num = parseInt(strIndex.substring(strIndex.length - strLen.length));
    if (num > 50) {
        index = index - ((num - 50) - len);
    } else {
        index = index - (num - len);
    }
    $.ajax({
        url: ctx + server + "/delList",
        data: {db: redisDb, index: index, listSize: listSize, key: key},
        type: "post",
        dataType: "text",
        success: function (data) {
            if (data == "2") {
                alert("不能从list删除行,因为行已经改变了。重载值并再试一次");
                return;
            }
            $(th).closest("tr").remove();
            --listSize;
            showModel(data);
        }
    });
}

function updateSet(th) {
    var node = $(th).closest("tr").find("textarea");
    var val = node.val().trim();
    if (val == '') {
        return;
    }
    var i = node.attr("oldVal");
    var oldVal = setArr[i];
    $.ajax({
        url: ctx + server + serialize + "/updateSet",
        data: {db: redisDb, key: key, oldVal: oldVal, newVal: val},
        type: "post",
        dataType: "text",
        success: function (data) {
            if (data == "1") {
                node.attr("oldVal", val);
            }
            showModel(data);
        }
    });
}
function delSet(th) {
    var i = $(th).closest("tr").find("textarea").attr("oldVal");
    var val = setArr[i];
    $.ajax({
        url: ctx + server + "/delSet",
        data: {db: redisDb, key: key, val: val},
        type: "post",
        dataType: "text",
        success: function (data) {
            $(th).closest("tr").remove();
            if (data == "1") {
                return;
            }
            showModel(data);
        }
    });
}
function updateZSet(th) {
    var node = $(th).closest("td").prev("td").find("textarea");
    var i = node.attr("oldVal");
    var oldVal = zSetArr[i];
    var newVal = node.val().trim();
    if (newVal == '') {
        return;
    }
    var score = $(th).closest("tr").find("input").val();
    $.ajax({
        url: ctx + server + serialize + "/updateZSet",
        data: {db: redisDb, key: key, oldVal: oldVal, newVal: newVal, score: score},
        type: "post",
        dataType: "text",
        success: function (data) {
            if (data == "1") {
                node.attr("oldVal", newVal);
            }
            showModel(data);
        }
    });

}
function delZSet(th) {
    var i = $(th).closest("td").prev("td").find("textarea").attr("oldVal");
    var oldVal = zSetArr[i];
    $.ajax({
        url: ctx + server + "/delZSet",
        data: {db: redisDb, key: key, val: oldVal},
        type: "post",
        dataType: "text",
        success: function (data) {
            $(th).closest("tr").remove();
            if (data == "1") {
                return;
            }
            showModel(data);
        }
    });
}
function updateHash(th) {
    var val = $(th).closest("td").prev("td").find("textarea").val().trim();
    if (val == "") {
        return;
    }
    var node = $(th).closest("tr").find("textarea");
    var i = node.attr("oldField");
    var oldField = hashArr[i];
    var newField = node.val().trim();
    if (newField == "") {
        return;
    }
    if (oldField == newField) {
        $.ajax({
            url: ctx + server + serialize + "/hSet",
            data: {db: redisDb, key: key, field: oldField, val: val},
            type: "post",
            dataType: "text",
            success: function (data) {
                showModel(data);
            }
        });
    } else {
        $.ajax({
            url: ctx + server + serialize + "/updateHash",
            data: {db: redisDb, key: key, oldField: oldField, newField: newField, val: val},
            type: "post",
            dataType: "text",
            success: function (data) {
                if (data == "1") {
                    node.attr("oldField", newField);
                }
                showModel(data);
            }
        });
    }
}
function delHash(th) {
    var i = $(th).closest("tr").find("textarea").attr("oldField");
    var field = hashArr[i];
    $.ajax({
        url: ctx + server + "/delHash",
        data: {db: redisDb, key: key, field: field},
        type: "post",
        dataType: "text",
        success: function (data) {
            $(th).closest("tr").remove();
            if (data == "1") {
                return;
            }
            showModel(data);
        }
    });
}

/**
 * 检查是否是数字不包含小数点 包含负数
 * @param th this
 */
function checkNumber(th) {
    var value = th.value;
    if (value || value.length > 0) {
        var charAt = value.charAt(0);
        if (charAt == '-') {
            th.value = charAt + value.replace(/[^0-9]/g, '');
        } else {
            th.value = value.replace(/[^0-9]/g, '');
        }
    }
}
function checkDouble(th) {
    var value = th.value;
    var index = value.indexOf(".");
    if (index != -1) {
        if (index > 0) {
            if (value.charAt(0) == '-' && value.charAt(1) == '.') {
                value = "-0.";
            } else {
                var start = value.substring(0, index + 1);
                var end = value.substring(index + 1);
                value = start + end.replace(".", "");
            }
        } else {
            value = 0 + value;
        }
    }
    if (value || value.length > 0) {
        var charAt = value.charAt(0);
        if (charAt == '-') {
            th.value = charAt + value.replace(/[^\d\.]/g, '');
        } else {
            th.value = value.replace(/[^\d\.]/g, '');
        }
    }
}


/* 格式化JSON源码(对象转换为JSON文本) */
function format(txt, compress/*是否为压缩模式*/) {
    var indentChar = '    ';
    if (/^\s*$/.test(txt)) {
        return;
    }
    try {
        var data = eval('(' + txt + ')');
    }
    catch (e) {
        return txt;
    }
    var draw = [], last = false, This = this, line = compress ? '' : '\n', nodeCount = 0, maxDepth = 0;

    var notify = function (name, value, isLast, indent/*缩进*/, formObj) {
        nodeCount++;
        /*节点计数*/
        for (var i = 0, tab = ''; i < indent; i++)tab += indentChar;
        /* 缩进HTML */
        tab = compress ? '' : tab;
        /*压缩模式忽略缩进*/
        maxDepth = ++indent;
        /*缩进递增并记录*/
        if (value && value.constructor == Array) {/*处理数组*/
            draw.push(tab + (formObj ? ('"' + name + '":') : '') + '[' + line);
            /*缩进'[' 然后换行*/
            for (var i = 0; i < value.length; i++)
                notify(i, value[i], i == value.length - 1, indent, false);
            draw.push(tab + ']' + (isLast ? line : (',' + line)));
            /*缩进']'换行,若非尾元素则添加逗号*/
        } else if (value && typeof value == 'object') {/*处理对象*/
            draw.push(tab + (formObj ? ('"' + name + '":') : '') + '{' + line);
            /*缩进'{' 然后换行*/
            var len = 0, i = 0;
            for (var key in value)len++;
            for (var key in value)notify(key, value[key], ++i == len, indent, true);
            draw.push(tab + '}' + (isLast ? line : (',' + line)));
            /*缩进'}'换行,若非尾元素则添加逗号*/
        } else {
            if (typeof value == 'string') value = '"' + value + '"';
            draw.push(tab + (formObj ? ('"' + name + '":') : '') + value + (isLast ? '' : ',') + line);
        }
    };
    var isLast = true, indent = 0;
    notify('', data, isLast, indent, false);
    return draw.join('');
}
function pageViewAjax(url, th) {
    if (redisType == list) {
        $.ajax({
            url: ctx + server + url,
            data: {db: redisDb, key: key},
            type: "post",
            dataType: "json",
            success: function (data) {
                var str = "";
                for (var i = 0; i < data.results.length; i++) {
                    str += '<tr><td>' + ((data.pageNo - 1) * data.pageSize + i + 1) + '</td><td style="padding: 0;"><input type="text" class="form-control" value="' + data.results[i] + '"></td>' +
                        '<td><button type="button" class="btn btn-success btn-xs " onclick="updateList(this)">保存</button>' +
                        '<a href="javascript:void(0);" class="btn btn-danger btn-xs" onclick="delList(this);" style="margin-left: 4px;">删除</a></td></tr>';
                }
                $("#list-content").html(str);
                var page = "";
                for (var j = 0; j < data.pageView.length; j++) {
                    page += data.pageView[j];
                }
                listSize = data.totalRecord;
                $("#page").html(page);
            }
        });
    } else if (redisType == zset) {
        $.ajax({
            url: ctx + server + url,
            data: {db: redisDb, key: key},
            type: "post",
            dataType: "json",
            success: function (data) {
                var str = "";
                zSetArr = [];
                for (var i = 0; i < data.results.length; i++) {
                    zSetArr[i] = data.results.element;
                    str += '<tr><td style="padding: 0;"><input type="text" maxlength="50" class="form-control" value="' + data.results[i].score + '" onkeyup="checkDouble(this)">' +
                        '</td><td style="padding: 0;"><input type="text" class="form-control"  oldVal="' + i + '" value="' + data.results[i].element + '"></td>' +
                        '<td><button type="button" class="btn btn-success btn-xs " onclick="updateZSet(this)">保存</button>' +
                        '<a href="javascript:void(0);" class="btn btn-danger btn-xs" onclick="delZSet(this);" style="margin-left: 4px;">删除</a></td></tr>';
                }
                $("#zset-content").html(str);
                var page = "";
                for (var j = 0; j < data.pageView.length; j++) {
                    page += data.pageView[j];
                }
                $("#page").html(page);
            }
        });
    }
}
function getHash() {
    $.ajax({
        url: ctx + server + serialize + "/hGetAll",
        data: {db: redisDb, key: key},
        type: "post",
        dataType: "json",
        success: function (data) {
            var str = '<ul class="nav nav-tabs"><li role="presentation" class="active"><a href="javascript:void(0);">hash</a></li>' +
                '<li role="presentation"><a href="javascript:void(0);">生存时间</a></li> </ul> <div class="panel" id="type-content">' +
                '<table class="table table-bordered "><thead><tr><th style="width: 87%;">key</th><th style="text-align: center">' +
                '操作</th></tr></thead><tbody style="border: 1px solid #ddd;"><tr><td style="padding: 0;"><input type="text"  class="form-control" ' +
                'value="' + key + '"> </td><td><button type="button" class="btn btn-success btn-xs " onclick="rename(this)">保存</button>' +
                '<a href="javascript:void(0);" class="btn btn-danger btn-xs" onclick="delKey(this);" style="margin-left: 4px;">删除</a>' +
                '</td></tr></tbody></table><table class="table table-bordered "><thead><tr><th style="width:39%;">field</th><th style="width:48%;">value</th><th style="text-align: center;">操作</th></tr></thead><tbody >';
            hashArr = [];
            var i = 0;
            for (var field in data) {
                hashArr.push(field);
                str += '<tr><td style="padding: 0;"><textarea class="form-control" oldField=\'' + i++ + '\'>' + ((redisView == 1 || redisView == 3) ? format(field) : field) + '</textarea></td><td style="padding: 0;">' +
                    '<textarea class="form-control">' + ((redisView == 1 || redisView == 3) ? format(data[field]) : data[field]) + '</textarea></td>' +
                    '<td><button type="button" class="btn btn-success btn-xs " onclick="updateHash(this)">保存</button>' +
                    '<a href="javascript:void(0);" class="btn btn-danger btn-xs" onclick="delHash(this);" style="margin-left: 4px;">删除</a></td></tr>';
            }
            str += '</table></div>' + ttlStr;
            $("#redisContent").html(str);
        }
    });
}
function getZSet() {
    $.ajax({
        url: ctx + server + serialize + "/getZSet",
        data: {db: redisDb, pageNo: 1, key: key},
        type: "post",
        dataType: "json",
        success: function (data) {
            var str = '<ul class="nav nav-tabs"><li role="presentation" class="active"><a href="javascript:void(0);">zset</a></li>' +
                '<li role="presentation"><a href="javascript:void(0);">生存时间</a></li> </ul> <div class="panel" id="type-content">' +
                '<table class="table table-bordered "><thead> <tr><th style="width: 87%;">key</th><th style="text-align: center">' +
                '操作</th> </tr> </thead> <tbody style="border: 1px solid #ddd;"> <tr> <td style="padding: 0;"><input type="text"  class="form-control" ' +
                'value="' + key + '"> </td><td><button type="button" class="btn btn-success btn-xs " onclick="rename(this)">保存</button>' +
                '<a href="javascript:void(0);" class="btn btn-danger btn-xs" onclick="delKey(this);" style="margin-left: 4px;">删除</a>' +
                '</td> </tr></tbody></table><table class="table table-bordered "><thead><tr><th style="width:10%;">score</th><th style="width:77%;">value</th><th style="text-align: center;">操作</th></tr></thead><tbody id="zset-content">';
            zSetArr = [];
            for (var i = 0; i < data.results.length; i++) {
                zSetArr[i] = data.results.element;
                str += '<tr><td style="padding: 0;"><input type="text" maxlength="50" class="form-control" value="' + data.results[i].score + '" onkeyup="checkDouble(this)"></td><td style="padding: 0;">' +
                    '<textarea class="form-control" oldVal="' + i + '" >' + ((redisView == 1 || redisView == 3) ? format(data[i].element) : data[i].element) + '</textarea></td>' +
                    '<td><button type="button" class="btn btn-success btn-xs " onclick="updateZSet(this)">保存</button>' +
                    '<a href="javascript:void(0);" class="btn btn-danger btn-xs" onclick="delZSet(this);" style="margin-left: 4px;">删除</a></td></tr>';
            }
            str += '</table><div id="page">';
            for (var j = 0; j < data.pageView.length; j++) {
                str += data.pageView[j];
            }
            str += '</div></div>' + ttlStr;
            $("#redisContent").html(str);
        }
    });
}
function getSet() {
    $.ajax({
        url: ctx + server + serialize + "/getSet",
        data: {db: redisDb, key: key},
        type: "post",
        dataType: "json",
        success: function (data) {
            var str = '<ul class="nav nav-tabs"><li role="presentation" class="active"><a href="javascript:void(0);">set</a></li>' +
                '<li role="presentation"><a href="javascript:void(0);">生存时间</a></li> </ul> <div class="panel" id="type-content">' +
                '<table class="table table-bordered "><thead><tr><th style="width: 87%;">key</th><th style="text-align: center">' +
                '操作</th></tr></thead> <tbody style="border:1px solid #ddd;"><tr><td style="padding: 0;"><input type="text"  class="form-control" ' +
                'value="' + key + '"> </td><td><button type="button" class="btn btn-success btn-xs " onclick="rename(this)">保存</button>' +
                '<a href="javascript:void(0);" class="btn btn-danger btn-xs" onclick="delKey(this);" style="margin-left: 4px;">删除</a>' +
                '</td> </tr></tbody></table><table class="table table-bordered "><thead><tr><th style="width:87%;">value</th><th style="text-align: center;">操作</th></tr></thead><tbody id="list-content">';
            setArr = [];
            for (var i = 0; i < data.length; i++) {
                setArr[i] = data[i];
                str += '<tr><td style="padding: 0;"><textarea class="form-control" oldVal="' + i + '">' + ((redisView == 1 || redisView == 3) ? format(data[i]) : data[i]) + '</textarea></td>' +
                    '<td><button type="button" class="btn btn-success btn-xs " onclick="updateSet(this)">保存</button>' +
                    '<a href="javascript:void(0);" class="btn btn-danger btn-xs" onclick="delSet(this);" style="margin-left: 4px;">删除</a></td></tr>';
            }
            str += '</table></div>' + ttlStr;
            $("#redisContent").html(str);
        }
    });
}
function getList() {
    $.ajax({
        url: ctx + server + serialize + "/getList",
        data: {db: redisDb, key: key, pageNo: 1},
        type: "post",
        dataType: "json",
        success: function (data) {
            var str = '<ul class="nav nav-tabs"><li role="presentation" class="active"><a href="javascript:void(0);">list</a></li>' +
                '<li role="presentation"><a href="javascript:void(0);">生存时间</a></li> </ul> <div class="panel" id="type-content">' +
                '<table class="table table-bordered "><thead> <tr><th style="width: 87%;">key</th><th style="text-align: center">' +
                '操作</th> </tr> </thead> <tbody style="border: 1px solid #ddd;"> <tr> <td style="padding: 0;"><input type="text" class="form-control" ' +
                'value="' + key + '"> </td><td><button type="button" class="btn btn-success btn-xs " onclick="rename(this)">保存</button>' +
                '<a href="javascript:void(0);" class="btn btn-danger btn-xs" onclick="delKey(this);" style="margin-left: 4px;">删除</a>' +
                '</td> </tr></tbody></table><table class="table table-bordered "><thead><tr><th style="width:3%;">' +
                'row</th><th style="width:83%;">value</th><th style="text-align: center;">操作</th></tr>' +
                '</thead><tbody id="list-content">';
            for (var i = 0; i < data.results.length; i++) {
                str += '<tr><td >' + ((data.pageNo - 1) * data.pageSize + i + 1) + '</td><td style="padding: 0;"><textarea class="form-control">' + ((redisView == 1 || redisView == 3) ? format(data.results[i]) : data.results[i]) + '</textarea></td>' +
                    '<td><button type="button" class="btn btn-success btn-xs " onclick="updateList(this)">保存</button>' +
                    '<a href="javascript:void(0);" class="btn btn-danger btn-xs" onclick="delList(this);" style="margin-left: 4px;">删除</a></td></tr>';
            }
            str += '</table><div id="page">';
            for (var j = 0; j < data.pageView.length; j++) {
                str += data.pageView[j];
            }
            str += '</div></div>' + ttlStr;
            listSize = data.totalRecord;
            $("#redisContent").html(str);
        }
    });
}
function getString() {
    $.ajax({
        url: ctx + server + serialize + "/getString",
        data: {db: redisDb, key: key},
        type: "post",
        dataType: "text",
        success: function (data) {
            var str = '<ul class="nav nav-tabs"><li role="presentation" class="active"><a href="javascript:void(0);">string</a></li>' +
                '<li role="presentation"><a href="javascript:void(0);">生存时间</a></li> </ul> <div class="panel panel-default" id="type-content">' +
                '<table class="table table-bordered "><thead><tr><th style="width:87%;">key</th><th style="text-align: center">' +
                '操作</th></tr></thead><tbody><tr><td style="padding:0;"><input type="text"  class="form-control" ' +
                'value="' + key + '"></td><td><button type="button" class="btn btn-success btn-xs " onclick="rename(this)">保存</button>' +
                '<a href="javascript:void(0);" class="btn btn-danger btn-xs" onclick="delKey(this);" style="margin-left: 4px;">删除</a>' +
                '</td></tr></tbody><thead><tr><th>value</th><th style="text-align:center;">操作</th></tr></thead>' +
                '<tbody><tr><td style="padding: 0;"><textarea class="form-control">' + ((redisView == 1 || redisView == 3) ? format(data) : data) + '</textarea></td>' +
                '<td><button type="button" class="btn btn-success btn-xs " onclick="updateString(this)">保存</button></td></tr></table>' +
                '</table> </div>' + ttlStr;
            $("#redisContent").html(str);
        }
    });
}
function clusterUpPage(pageNo, event) {
    event = event || window.event;
    var obj = event.srcElement ? event.srcElement : event.target;
    $.ajax({
        url: ctx + server + serialize + "/upPage",
        data: {pageNo: pageNo, match: match},
        type: "post",
        dataType: "text",
        success: function (data) {
            data = eval('(' + data + ')');
            $(obj).addNode(data)
        }
    })
}

function clusterNextPage(pageNo, event) {
    event = event || window.event;
    var obj = event.srcElement ? event.srcElement : event.target;
    $.ajax({
        url: ctx + server + serialize + "/nextPage",
        data: {pageNo: pageNo, match: match},
        type: "post",
        dataType: "text",
        success: function (data) {
            data = eval('(' + data + ')');
            $(obj).addNode(data)
        }
    })
}
function nextPage(db, cursor, event) {
    event = event || window.event;
    var obj = event.srcElement ? event.srcElement : event.target;
    $.ajax({
        url: ctx + server + serialize + "/nextPage",
        data: {db: db, cursor: cursor, match: match},
        type: "post",
        dataType: "text",
        success: function (data) {
            data = eval('(' + data + ')');
            $(obj).addNode(data)
        }
    })
}

function upPage(db, cursor, event) {
    event = event || window.event;
    var obj = event.srcElement ? event.srcElement : event.target;
    $.ajax({
        url: ctx + server + "/upPage",
        data: {db: db, cursor: cursor, match: match},
        type: "post",
        dataType: "text",
        success: function (data) {
            data = eval('(' + data + ')');
            $(obj).addNode(data)
        }
    })
}

function showModel(data) {
    if (data == '1') {
        $("#promptContent").html("<p>修改成功</p>");
        $("#promptBtn").removeClass("btn-danger").addClass("btn-success");
    } else if (data == "2") {
        $("#promptContent").html("<p>键已存在!</p>");
        $("#promptBtn").removeClass("btn-success").addClass("btn-danger");
    } else {
        $("#promptTitle").html("失败提示");
        $("#promptContent").html("<p>" + data + "</p>");
        $("#promptBtn").removeClass("btn-success").addClass("btn-danger");
    }
    $("#prompt").modal("show");

}

