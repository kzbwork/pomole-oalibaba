/**
 * 数据对象基类
 * Author: jxyi
 * Date: 2017-10-7
 */

let path = require('path');
let loggerName = path.basename(__filename);
let logger = require('pomelo-logger').getLogger('game-log', loggerName);

let consts = require('../consts/consts');

let BaseData = function () {
};

let pro = BaseData.prototype;

pro.setService = function (service) {
  this.service = service;
};

/**
 * 是否需要保存到数据库
 * @returns {boolean}
 */
pro.needSave = function() {
  return true;
};

/**
 * 改变属性
 * @param obj，变化内容，格式为：
 *  {
 *    diamond: 100
 *  }
 * @param reason
 */
pro.change = function (obj, reason) {

  // 真正变化的内容
  let result = {};
  for (let i in obj) {

    if (!this.hasOwnProperty(i)) {
      logger.error('has no property named:' + i);
      continue;
    }

    // 不改变方法
    if (typeof (this[i]) === 'function'
      || typeof (obj[i]) === 'function') {

      logger.error('modify function property:' + i);
    } else {

      if (this[i] !== obj[i]){
        result[i] = [this[i], obj[i]];
      }
      this[i] = obj[i];
    }
  }

  this._save();

  return result;
};

/**
 * 从数据源合并数据
 * @param change
 * @returns {boolean}
 */
pro.mergeData = function (change) {
  if (typeof (change) === 'undefined') {
    return false;
  }

  let arr = this.service.getKeys();

  for (let item of arr) {
    if (change[item] !== undefined) {
      this[item] = change[item];
    }
  }

  return true;
};

/**
 * @arr 键的数组
 * 使用一个键的数组,获得数据
 */
pro.getDataByKeys = function (arr) {
  if (!arr || !arr.length) {
    return {};
  }

  let result = {};
  for (let item of arr) {
    if (this.hasOwnProperty(item)) {
      result[item] = this[item];
    }
  }
  return result;
};

/**
 * 返回需要存的数据,并不是所有的数据都需要存
 * 默认去 schema.json 中定义过,而且又使用的数据
 */
pro.strip = function () {
  let arr = this.service.getKeys();

  return this.getDataByKeys(arr);
};

/**
 * 数据从数据库中加载完成
 */
pro.onLoad = function () {
  
};

pro._save = function () {
  if (this.needSave()) {
		this.service.save(this);
  }
};

module.exports = BaseData;