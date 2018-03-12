/**
 * 阿里巴巴主题数据单元
 * Author: jxyi
 * Date: 2018-2-13
 */

'use strict';

let util = require('util');
let OracleData = require('game-js-server-core').oracle.baseData;
let consts = require('../../consts/consts');

let OracleAlibabaTheme = function () {
  this.constructor.super_.call(this);

  this.id = 0;
  this.round_id = 0;
  this.coin_value = 0;
  this.multiplier = 0;
  this.remove_free_times = 0;
  this.remove_free_win = 0;
  this.mini_game = 0;
  this.mini_config = [];
  this.mini_life = 0;
  this.mini_win = 0;
  this.mini_multiple = 0;
  this.mini_history = [];
};

util.inherits(OracleAlibabaTheme, OracleData);

module.exports = OracleAlibabaTheme;

let pro = OracleAlibabaTheme.prototype;

pro.serialize = function (obj) {
  obj = obj || this;
  let result = {};
  let keys = ['id', 'round_id', 'coin_value', 'multiplier', 'remove_free_times', 'remove_free_win'
    , 'mini_game', 'mini_config', 'mini_life', 'mini_win', 'mini_multiple', 'mini_history'];
  for (let key of keys) {
    if (obj.hasOwnProperty(key)) {
      if (key === 'mini_config' || key === 'mini_history') {
        result[key] = JSON.stringify(obj[key]);
      } else {
        result[key] = obj[key];
      }
    }
  }

  return result;
  // return {
  //   id: obj.id,
  //   round_id: obj.round_id,
  //   coin_value: obj.coin_value,
  //   multiplier: obj.multiplier,
  //   remove_free_times: obj.remove_free_times,
  //   remove_free_win: obj.remove_free_win,
  //   mini_game: obj.mini_game,
  //   mini_config: JSON.stringify(obj.mini_config),
  //   mini_life: obj.mini_life,
  //   mini_win: obj.mini_win,
  //   mini_multiple: obj.mini_multiple,
  //   mini_history: JSON.stringify(obj.mini_history)
  // };
};

/**
 * 合并数据库获取的数据
 * override
 * @param obj
 * @returns {boolean}
 */
pro.mergeData = function (obj) {
  if (typeof (obj) === 'undefined') {
    return false;
  }

  for (let i in obj) {
    if (typeof (obj) !== 'function') {
      if (obj[i]) {
        if (i === 'mini_history' || i === 'mini_config') {
          this[i] = JSON.parse(obj[i]);
        } else {
          this[i] = obj[i];
        }
      }
    }
  }
  return true;
};



