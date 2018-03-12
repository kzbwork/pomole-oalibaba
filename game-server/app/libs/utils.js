/**
 * 公共函数
 * author: jxyi
 * date; 2017-12-28
 */

'use strict';

let utils = {};

let crypto = require('crypto');
let consts = require('../consts/consts');
let dataManager = require('./manager/dataManager');

const TOKEN_PREFIX = 'aSdFavZixOag';

utils.merge = function (object, change) {
  if (typeof (object) === 'undefined' || typeof (change) === 'undefined') {
    return false;
  }

  for (let i in change) {
    if (typeof (change) !== 'function') {
      object[i] = change[i];
    }
  }
};

/**
 * 获取一个 object 的所有可枚举的 key 对应的值
 * @param obj
 * @returns {Array}
 */
utils.getValues = function(obj){
  let values = [];
  if (typeof obj === 'object'){
    let keys = Object.keys(obj);
    for (let key of keys){
      values.push(obj[key]);
    }
  }
  return values;
};

/**
 * 格式化数字，采用三位一个逗号的格式进行格式化。小数不会格式化
 * @param str
 * @return {string}
 */
utils.formatNum = function(str) {
  if (typeof str === 'number') {
    str = String(str);
  }

  let newStr = "";
  let count = 0;

  if(str.indexOf(".") === -1){
    for(let i = str.length - 1; i >= 0; --i){
      if(count % 3 === 0 && count !== 0){
        newStr = str.charAt(i) + "," + newStr;
      }else{
        newStr = str.charAt(i) + newStr;
      }
      count++;
    }
  } else {
    newStr = str;
  }
  return newStr;
};

/**
 * 获得 范围的 index
 * @param ranges {Array} [10, 20, 30, 40]
 * @param num {number} 数字
 */
utils.getRangeIndex = function(ranges, num) {
  if (num === ranges[ranges.length-1]) {
    return ranges.length-2;
  }

  for(let i=0;i<ranges.length-1;i++) {
    if (num >= ranges[i] && num < ranges[i + 1]) {
      return i;
    }
  }
  return -1;
};

utils.md5 = function (mstr) {
  let md5 = crypto.createHash('md5');
  return md5.update(mstr).digest('hex');
};

/**
 * 创建 token
 * @param seed
 */
utils.createToken = function (seed) {
  return utils.md5(Date.now().toString() + (seed === undefined ? TOKEN_PREFIX : seed));
};

/**
 * 按字符宽度计算字符串长度
 * @param str
 * @return {number}
 */
utils.getStringLength = function (str) {
  if (typeof str !== 'string') {
    return 0;
  }

  let count = 0;

  for (let i = 0; i < str.length; ++i) {
    let c = str[i];
    if (/^[\u0000-\u00ff]$/.test(c)) {
      ++count;
    } else {
      count += 2;
    }
  }

  return count;
};

/**
 * 解析属性字符串，格式为 'id|value,id|value'
 * @param propertyString
 * @return {*}
 */
utils.parsePropertyString = function (propertyString) {
  if (typeof propertyString !== 'string') {
    return undefined;
  }

  let properObj = {};

  let properList = propertyString.split(',');
  for (let proper of properList) {
    let item = proper.split('|');
    if (item.length < 2) {
      continue;
    }

    let id = parseInt(item[0]);
    if (isNaN(id) === true) {
      continue;
    }

    let value = parseInt(item[1]);
    if (isNaN(value) === true) {
      continue;
    }

    if (consts.ITEM_IDS.hasOwnProperty(id.toString()) === true) {
      let obj = consts.ITEM_IDS[id.toString()];
      properObj[obj.name] = properObj[obj.name] || 0;
      properObj[obj.name] += value;
    }
  }

  return properObj;
};

/**
 * 构建系统邮件数据结构
 * @param mailId
 * @param receiver
 * @return {{sender: number, receiver: *, title, content: (string|XML|*|void), property: string}}
 */
utils.getSystemMail = function (mailId, receiver) {
  let systemMail = dataManager.getSystemMailConfig();
  let targetMail = undefined;
  for (let mail of systemMail) {
    if (mailId === mail.id) {
      targetMail = mail;
      break;
    }
  }

  if (!targetMail) {
    return undefined;
  }

  let result = {
    sender: 0/*系统邮件*/,
    receiver: receiver,
    title: targetMail.title,
    content: targetMail.text.replace('[1]', targetMail.num),
    property: `1|${targetMail.num}`
  };

  return result;
};

module.exports = utils;
