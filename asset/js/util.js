//对应页面所有接口配置
var joggle = '';
joggle = {

    doLogin: joggle + '/doLogin.json',   //登陆
    logout: joggle + '/logout.json',   //登出

    doRegist: joggle + '/doRegist.json',   //新建用户
    deleteUsers: joggle + '/user/deleteUsers.json',   //删除用户列表
    updateUser: joggle + '/user/updateUser.json',   //编辑用户
    getUserListForPage: joggle + '/user/getUserListForPage.json',   //获取用户列表

    getAllProvince: joggle + '/city/getAllProvince.json',   // 城市省份
    getAllCity: joggle + '/city/getAllCity.json',   //城市
    getAllArea: joggle + '/city/getAllArea.json',   //城市地区

    getCustomerListForPage: joggle + '/customer/getCustomerListForPage.json',   //查询客户联系列表
    getCustomerDetail: joggle + '/customer/getCustomerDetail.json',   //联系客户联系详情
    deleteCustomers: joggle + '/customer/deleteCustomers.json',   //批量删除客户
    uploadExcelAndSave: joggle + '/customer/uploadExcelAndSave.json',   //上传excel导入客户列表
    updateCustomersGroup: joggle + '/customer/updateCustomersGroup.json',   //用户批量分组
    getCustomerEdit: joggle + '/customer/getCustomerEdit.json',   //编辑联系记录

    addRecord: joggle + '/record/addRecord.json',   //新增联系记录
    deleteRecord: joggle + '/record/deleteRecord.json',   //删除聊天记录
    getRecordListForPage: joggle + '/record/getRecordListForPage.json',   //获取聊天记录

    addOrUpdateCustGroup: joggle + '/group/addOrUpdateCustGroup.json',   //新增与编辑客户分类
    deleteCustGroupById: joggle + '/group/deleteCustGroupById.json',   //删除客户分类
    getCustGroupList: joggle + '/group/getCustGroupList.json',   //查询客户分类列表

};

/**
 * 合并基本参数和用户参数
 */
function extend(base, param) {
    var all = {};
    if (base) {
        for (var key in base) {
            all[key] = base[key];
        }
    }
    if (param) {
        for (var key in param) {
            all[key] = param[key];
        }
    }
    return all;
}

/**
 * 根据排序好的参数生成签名
 */
function createSign(base, param) {
    // 合并基本参数和用户参数
    var allParam = extend(base, param);
    var newObj = objKeySort(allParam);
    var signStr = '';
    for (var key in newObj) {
        var value = newObj[key];
        if (key != 'sign' && key != 'appSecret' && value && value != '') {
            if (typeof value == 'object') {
                for (var sKey in value) {
                    var sValue = value[sKey];
                    if (sValue && sValue != '') {
                        signStr += sKey + '=' + sValue;
                    }
                }
            } else {
                signStr += key + '=' + value;
            }
        }
    }
    signStr += newObj['appSecret'];
    return hexMD5(signStr);
}
/**
 * 排序函数
 */
function objKeySort(obj) {
    if (!obj) return null;
    var newkey = Object.keys(obj).sort();
    // 先用Object内置类的keys方法获取要排序对象的属性名，再利用Array原型上的sort方法对获取的属性名进行排序，newkey是一个数组
    var newObj = {}; // 创建一个新的对象，用于存放排好序的键值对
    for (var i = 0; i < newkey.length; i++) { // 遍历newkey数组
        newObj[newkey[i]] = obj[newkey[i]]; // 向新创建的对象中按照排好的顺序依次增加键值对
    }
    return newObj; // 返回排好序的新对象
}

/**
 * ajax原封装方法
 * @param obj.url 接口地址
 * @param obj.data 参数
 * @param obj.loading 可以设置的值为 布尔值 true,设置true后，默认使用封装中的loading,loading的关闭不能控制。
 *                  可以传入自定义的loading对象，以便控制loading的关闭时机
 * @param obj.fn 成功获取数据后的执行函数
 * @param obj.fnErr 失败后执行函数
 * @param obj.options 相关表头的配置项
 * @param obj.type 指定发送类型，默认为post
 */
Vue.prototype.$ajax = function (obj) {
    //配置表头
    var options = {
        headers: function () {
            // 3.1 构建请求头参数(获取基本参数、生成签名)
            var base = {
                appKey: 'appKey',
                appSecret: 'appSecret',
                timestamp: new Date().getTime() + '',
                sessionId: sessionStorage.sessionId || '',
                token: sessionStorage.sessionId || ''
            };
            base.sign = createSign(base, obj.data);

            // 生成签名后移除秘钥
            delete base.appSecret;

            // 3.2 合并用户请求头参数
            return base;
        }()
    };
    obj.options = extend(options, obj.options);
    console.log(obj.options, options, '????obj.options');


    if (typeof obj.loading === 'boolean' && obj.loading) {
        obj.loading = Vue.prototype.$loading();
    }
    var eventFn = {
        success: function (res) {
            if (res.body.code !== 'ok') {
                Vue.prototype.$message({
                    type: 'error',
                    duration: 10000,
                    message: res.body.msg
                });
                if (res.body.code === 'token_not_exist' || res.body.code === 'token_error') {
                    setTimeout(function () {
                        turnToNextPage('login.html');
                    }, 1200);
                }
            } else {
                sessionStorage.sessionId = res.body.sessionId;
            }
            obj.fn && obj.fn(res.body, obj.loading);
        },
        error: function (error) {
            if (obj.loading) obj.loading.close();
            Vue.prototype.$message({
                type: 'error',
                duration: 1200,
                message: error.body.msg
            });
            obj.fnErr && obj.fnErr();
        }
    };
    obj.type = obj.type ? obj.type.toLowerCase() : 'post';
    var typeList = ['get', 'head', 'delete', 'jsonp'];
    var hasType = false;
    for (var i = 0; i < typeList.length; i++) {
        if (typeList[i] === obj.type) {
            hasType = true;
            break
        }
    }
    if (hasType) {
        obj.options.params = obj.data;
        Vue.http[obj.type](obj.url, obj.options).then(function (res) {
                eventFn.success(res);
            },
            function (error) {
                eventFn.error(error);
            }
        );
    } else {
        if (obj.type === 'post') {
            obj.options.emulateJSON = true;
        }
        Vue.http[obj.type](obj.url, obj.data, obj.options).then(function (res) {
                eventFn.success(res);
            },
            function (error) {
                eventFn.error(error);
            }
        );
    }
};


function paramToObject(str) {
    var obj = {};

    if (str.substring(0, 1) === '?') {
        str = str.slice(1);
    }

    var strArr = str.split('&');
    var param = '';

    for (var i = 0; i < strArr.length; i++) {
        param = strArr[i].split('=');
        obj[param[0]] = param[1] || null;
    }

    return obj;
}

//获取地址栏参数，转化成json
function getDataFromParam(key) {
    var param = location.search;

    if (!param) {
        return null;
    }
    param = paramToObject(decodeURIComponent(param.slice(0)));

    return isEmpty(key) ? param : param[key];
}

function objectToParam(obj) {
    var str = '';

    for (var key in obj) {
        str += key + '=' + obj[key] + '&';

    }
    str = str.slice(0, -1);
    return str;
}

function turnToNextPage(url, opt, newWin) {
    var u = isEmpty(opt) ? url : url + '?' + objectToParam(opt);
    if (newWin) {
        window.open(u);
    } else {
        window.location.href = u;
    }
}


/**
 * 判断是否为空或者null或者undefined
 * @param obj
 * @returns {boolean}
 */
function isEmpty(obj) {
    if (typeof(obj) != 'undefined' &&
        obj != 'undefined' &&
        obj != null &&
        obj != '' &&
        obj != "null"
    ) {
        return false;
    } else {
        return true;
    }
}

/**
 * 字符串方法扩展
 */
//格式化HTML(动态生成HTML时使用)
String.prototype.formatHTML = function (arr) {
    var string = this;
    for (var i = 0; i < arr.length; i++) {
        string = string.replace(new RegExp("\\{" + i + "\\}", "gm"), arr[i]);
    }
    return string;
};
// 去首尾空格
String.prototype.strim = function () {
    return this.replace(/(^\s*)|(\s*$)/g, '');
};
//验证规则
var janReg = {
    isChinese: /^[\u4e00-\u9fa5]+$/,
    isEmail: /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/,
    isURL: /^[a-zA-z]+:\/\/[^\s]+$/,
    isTel: /^(0\d{2,3})?(\d{7,8})(-(\d{3,}))?$/,
    isMobile: /^(?:13\d|14\d|15\d|16\d|17\d|18\d|19\d)\d{5}(\d{3}|\*{3})$/,
    isLegal: /^[a-zA-Z0-9]{6,20}$/, //(允许6-20字节，允许字母数字下划线)
    isIP: /^\d+\.\d+\.\d+\.\d+$/,
    isEmpty: /^\s*$/,
    isCarNum: /^[a-zA-Z0-9]{5}$/,
    isFullCarNum: /^[\u4e00-\u9fa5][a-zA-Z][a-zA-Z0-9]{5}$/,
    isName: /^[a-zA-Z\u4e00-\u9fa5][a-zA-Z0-9\u4e00-\u9fa5]{0,13}$/ //姓名和昵称格式
}
//中文验证
String.prototype.isChinese = function () {
    return this.isInReg(janReg.isChinese);
}
//邮箱验证
String.prototype.isEmail = function () {
    return this.isInReg(janReg.isEmail);
};
//URL验证
String.prototype.isURL = function () {
    return this.isInReg(janReg.isURL);
};
//固话验证
String.prototype.isTel = function () {
    return this.isInReg(janReg.isTel);
};
//移动电话验证
String.prototype.isMobile = function () {
    return this.isInReg(janReg.isMobile);
};
//账号合法性验证
String.prototype.isLegal = function () {
    return this.isInReg(janReg.isLegal);
};
//空验证
String.prototype.isEmpty = function () {
    return this.isInReg(janReg.isEmpty);
};
//验证车牌
String.prototype.isCarNum = function () {
    return this.isInReg(janReg.isCarNum);
};
//按规则验证
String.prototype.isInReg = function (reg) {
    var _i = reg;
    var _s = this;
    return _i.test(_s);
};
/**
 * 字符串工具
 *
 */
var StrUtils = {
    //从字符串中获取 位于指定字符之间 的字符串
    searchFromLab: function (str, lab) {
        var fInd = str.indexOf(lab);
        var nextlab = lab;
        if (fInd >= 0) {
            fInd += lab.length;
            lab == '[' && (nextlab = ']');
            lab == '{' && (nextlab = '}');
            lab == '(' && (nextlab = ')');
            lab == '<' && (nextlab = '>');
            lab == '{' && (nextlab = '}');
            var lInd = str.indexOf(nextlab, fInd);
            return str.substring(fInd, lInd);
        }
        ;
        return '';
    },
    //将url参数字符串转成对象
    paramToObject: function (str) {
        var obj = {};
        if (str.substring(0, 1) == '?') {
            str = str.slice(1);
        }

        var strArr = str.split('&');
        var param = '';
        for (var i = 0; i < strArr.length; i++) {
            param = strArr[i].split('=');
            obj[param[0]] = param[1] || null;
        }

        return obj;
    }
};
/**
 * 数组方法扩展
 */
// 根据下标删除数组元素,可以有多个（按大小排序的）参数
Array.prototype.removeByInd = function () {
    var args = Array.prototype.slice.call(arguments, 0).reverse();
    var flag = false;
    for (var i = 0; i < args.length; i++) {
        if (isNaN(args[i]) || args[i] > this.length) continue;
        this.splice(args[i], 1);
        flag = true;
    }
    return flag;
};
/**
 * 对象工具
 */
var ObjectUtils = {
    //判断是否空对象
    isEmpty: function (obj) {
        if (!obj) return true;
        for (var prop in obj) {
            return false;
        }
        return true;
    },
    //判断两个对象是否相等
    compare: function (a, b) {
        if (typeof a != typeof b) return false;
        if (typeof a == 'object') {
            if (a instanceof Array) {
                if (!b instanceof Array) return false;
                if (a.length != b.length) return false;
                for (var i = 0; i < a.length; i++) {
                    if (!this.compare(a[i], b[i])) return false;
                }
            } else {
                for (var k in a) {
                    if (!b[k]) return false;
                    if (!this.compare(a[k], b[k])) return false;
                }
            }

            return true;
        } else {
            return String(a) === String(b);
        }
    },
    //从json获取指定路劲的值。如 getFromJson(data,"user.janz.like[0].ball");避免中途出现undefined而报错。
    //data为数据对象，param为路劲字符串
    getFromJson: function (data, param) {
        var param = param.split('.');
        var r = data
        for (var i = 0; i < param.length; i++) {
            var p = param[i];
            if (isEmpty(r) || this.isEmpty(r)) {
                return null;
            } else {
                var j = p.indexOf('[');
                if (j != -1) {
                    var index = StrUtils.searchFromLab(p, "[");
                    p = p.slice(0, j);
                    if (isEmpty(r[p]) || this.isEmpty(r[p])) {
                        return null;
                    } else {
                        r = r[p][index];
                    }
                } else {
                    r = r[p];
                }
            }
        }
        return r;
    }
};

/**
 * 时间工具
 */
var TimeUtils = {
    /**
     * 倒计时
     * @param selector
     * @param second
     * @param timeout
     */
    countDown: function (selector, second, timeout) {
        var $time = $(selector);
        var id = window.setInterval(function () {
            second--;
            if (second === 0) { //倒计时完成
                window.clearInterval(id);
                $time.text(0);
                if (timeout) {
                    timeout();
                }
            } else if (second <= 60) {
                $time.text(second);
            } else {
                $time.text(Math.floor(second / 60) + ":" + second % 60);
            }
        }, 1000);
    },
    timer: function (startTime, target) {
        var now = new Date().getTime();
        var min = parseInt((now - startTime) / 1000);
        $(target).text(TimeUtils.minToFormat(min));
        setInterval(function () {
            min++;
            $(target).text(TimeUtils.minToFormat(min));
        }, 1000);
    },
    //将相差秒数格式化成 hh:mm格式
    minToFormat: function (min) {
        var h = parseInt(min / 3600);
        var m = parseInt(min / 60 % 60);
        var s = (min % 60 / 100).toFixed(2).slice(-2);
        h = h < 10 ? "0" + h : h;
        m = m < 10 ? "0" + m : m;

        return h + ':' + m + ':' + s;
    }
};
/**
 * 日期工具
 */
var DateUtils = {
    now: function () {
        return new Date();
    },
    dateFormat: function (date, fmt) {
        var o = {
            "M+": date.getMonth() + 1, // 月份
            "d+": date.getDate(), // 日
            "h+": date.getHours(), // 小时
            "m+": date.getMinutes(), // 分
            "s+": date.getSeconds(), // 秒
            "q+": Math.floor((date.getMonth() + 3) / 3), // 季度
            "S": date.getMilliseconds() // 毫秒
        };
        if (/(y+)/.test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
        }
        for (var k in o) {
            if (new RegExp("(" + k + ")").test(fmt)) {
                fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
            }
        }
        return fmt;
    },
    //将 yyyy-MM-dd hh:mm:ss 格式转成正确的Date对象;
    dateToRegular: function (value) {
        var v = value.replace(/\D+/g, ",").split(',');
        v[1] = v[1] - 1;
        v = v.join(',');
        return eval("(new Date(" + v + "))");
    }
};
/**
 *  vue 插件扩展 *
 */




