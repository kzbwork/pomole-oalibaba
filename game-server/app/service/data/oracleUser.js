/**
 * 用户数据
 * Author: jxyi
 * Date: 2018-2-12
 */

'use strict';

let util = require('util');
let OracleData = require('game-js-server-core').oracle.baseData;
let consts = require('../../consts/consts');
let EventEmitter = require('events');
let app = require('pomelo').app;
let logger = app.logger.getGameLog(__filename);

let OracleUser = function () {
  this.constructor.super_.call(this);

  this._emitter = new EventEmitter();

  this.id = 0;
  this.name = '';
  this.acc_type = consts.LOGIN_TYPE.NORMAL;
  this.credit = 999;
  this.acc_id = '';
  this.register_time = new Date();
  this.last_login_time = new Date();
  this.reconnect_theme = consts.THEME_NAME.NONE;
  this.reconnect_data = {};

  this.gameServerId = null;   // 后台服务器 id
  this.sid = null;            // 前台服务器 id
  this.lastUpdateTime = null; // 最后更新时间，用来超时断线
  this.offlineTime = undefined;
  this.isMobile = false;
  this.type = undefined;

  this.isDebug = false;

  //---------- Wallet info ----------------
  this.walletInfo = {
    session : '',       // 钱包session
    accountId : '',     // 钱包用户名
  };
  //---------------------------------------
};

util.inherits(OracleUser, OracleData);

module.exports = OracleUser;

let pro = OracleUser.prototype;

/**
 * 数据序列化，用于插入数据库
 * @returns {{name: *, accType: *, accId: *, registerTime: *, lastLoginTime: *, reconnectTheme: *, reconnectData}}
 */
pro.serialize = function (obj) {
  obj = obj || this;
  let result = {};
  let keys = ['id', 'name', 'acc_type', 'acc_id', 'register_time', 'last_login_time'
    , 'reconnect_theme', 'reconnect_data'];
  for (let key of keys) {
    if (obj.hasOwnProperty(key)) {
      if (key === 'reconnect_data') {
        result[key] = JSON.stringify(obj[key]);
      } else {
        result[key] = obj[key];
      }
    }
  }

  return result;
  // return {
  //   id: this.id,
  //   name: this.name,
  //   acc_type: this.acc_type,
  //   acc_id: this.acc_id,
  //   register_time: this.register_time,
  //   last_login_time: this.last_login_time,
  //   reconnect_theme: this.reconnect_theme,
  //   reconnect_data: JSON.stringify(this.reconnect_data)
  // };
};

pro.needSave = function () {
  return this.type === app.consts.USER_TYPE.CREDIT;
};

pro.onLeave = function () {
  this.offlineTime = Date.now();
};

pro.on = function () {
  this._emitter.on.apply(this._emitter, arguments);
};

pro.emit = function () {
  this._emitter.emit.apply(this._emitter, arguments);
};

pro.removeListener = function () {
  this._emitter.removeListener.apply(this._emitter, arguments);
};

pro.removeAllListeners = function () {
  this._emitter.removeAllListeners();
};

/**
 * 向玩家推送消息
 * @param route{string}, 路由
 * @param obj，推送的消息
 * @return {Promise|*} 返回推送消息的 promise
 */
pro.pushInfo = function (route, obj) {
  let channelService = app.channelService;
  let self = this;
  let promise = new Promise(function(resolve, reject) {
    if (self.sid) {
      channelService.pushMessageByUids(route, obj,
        [{uid: self.id, sid: self.sid}],
        function (err, failIds) {
          logger.info('oracleUser pushInfo: push message to user, id = {0}, route = {1}, info = {2}'.format(
            self.id, route, JSON.stringify(obj)
          ));
          if (err) {
            reject(err);
          } else {
            resolve(failIds);
          }
        });
    } else {
      logger.warn('user pushInfo: user {0} not online'.format(self.id));
      resolve([self.id]);
    }
  });

  return promise;
};
