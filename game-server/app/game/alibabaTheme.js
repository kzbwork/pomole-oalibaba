/**
 * alibabaTheme 表对应的数据结构
 * author: jxyi
 * date: 2017-12-28
 */

'use strict';

let util = require('util');

let BaseData = require('../service/baseData');

let app = require('pomelo').app;

let logger = app.logger.getGameLog(__filename);

let AlibabaTheme = function () {
  this.constructor.super_.call(this);

  //------------ START schema info ----------
  this.type = 0;
  this.uid = 0;
  this.roundId = 0;
  this.coinValue = 0;
  this.multiplier = 0;

  this.removeFreeTimes = 0;
  this.removeFreeWin = 0;

  this.miniGame = false;
  this.miniConfig = [];
  this.miniLife = 0;
  this.miniWin = 0;
  this.miniMultiple = 1;
  this.miniHistory = [];
  //------------ END schema info ------------
};

util.inherits(AlibabaTheme, BaseData);

let pro = AlibabaTheme.prototype;

pro.needSave = function () {
  return this.type === app.consts.USER_TYPE.CREDIT;
};

module.exports = AlibabaTheme;


