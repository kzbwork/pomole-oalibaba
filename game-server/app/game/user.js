/**
 * Created by wyang on 16/8/4.
 */

'use strict';

let BaseData = require('../service/baseData');
let EventEmitter = require('events');

let util = require('util');

let consts = require('../consts/consts');
let pomelo = require('pomelo');
let app = pomelo.app;
let logger = app.logger.getGameLog(__filename);

require('../libs/shortcodes');

let User = function () {

  this.constructor.super_.call(this);

  this._emitter = new EventEmitter();

  this.sid = null; // serverId，当用户离线时，sid 将重置为 null，否则为 connector 对应的 id
  this.lastUpdateTime = null; // 最后更新时间，用来超时断线

  //---------- START schema info ---------------
  this.uid = 0;
  this.credit = 0;

  this.accType = consts.LOGIN_TYPE.NORMAL;
  this.accId = "";

  this.registerTime = undefined;
  this.lastLoginTime = undefined;

  this.reconnectTheme = app.consts.THEME_NAME.NONE;
  this.reconnectData = {};
  //---------- END schema info -----------------

  this.offlineTime = undefined;
  this.isMobile = false;
  this.type = undefined;

  //---------- Wallet info ----------------
  this.walletInfo = {
	  session : '',       // 钱包session
	  accountId : '',     // 钱包用户名
  }
	//---------------------------------------
};

util.inherits(User, BaseData);

let pro = User.prototype;

/**
 * 向玩家推送消息
 * @param route{string}, 路由
 * @param obj，推送的消息
 * @return {Promise|*} 返回推送消息的 promise
 */
pro.pushInfo = function (route, obj) {
  let app = require('pomelo').app;
  let channelService = app.channelService;

  let self = this;

  let promise = new Promise(function(resolve, reject) {
    if (self.sid) {
      channelService.pushMessageByUids(route, obj,
        [{uid: self.uid, sid: self.sid}],
        function (err, failIds) {
          logger.info('user pushInfo: push message to user, uid = {0}, route = {1}, info = {2}'.format(
            self.uid, route, JSON.stringify(obj)
          ));
          if (err) {
            reject(err);
          } else {
            resolve(failIds);
          }
        });
    } else {
      logger.warn('user pushInfo: user {0} not online'.format(self.uid));
      resolve([self.uid]);
    }
  });

  return promise;
};

/**
 * 重写钻石change函数，保证钻石不为负
 * @param obj，变化内容，格式为：
 *  {
 *    diamond: 100
 *  }
 * @param reason
 */
pro.change = function(obj, reason) {
  if (obj.hasOwnProperty('diamond') && obj.diamond < 0) {
    logger.error(`try to change user:${this.uid} diamond:${obj.diamond} < 0 reason:${JSON.stringify(reason)}`);
    obj.diamond = 0;
  }

  return this.constructor.super_.prototype.change.call(this, obj, reason);
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

module.exports = User;
