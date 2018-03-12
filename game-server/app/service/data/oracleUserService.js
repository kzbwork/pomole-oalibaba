/**
 * 用户数据模块
 * Author: jxyi
 * Date: 2018-2-12
 */

'use strict';

let co = require('co');
let util = require('util');
let consts = require('../../consts/consts');
let OracleService = require('game-js-server-core').oracle.dataService;
let OracleUser = require('./oracleUser');

let app = require('pomelo').app;
let logger = app.logger.getGameLog(__filename);
let dataManager = require('../../libs/manager/dataManager');

let clientInterestedProper = ['credit'];

let OracleUserService = function (app, oraclePlugin) {
  this.app = app;
  this.constructor.super_.call(this, oraclePlugin, 'game_user', OracleUser);

  this.accIds = {};
};

util.inherits(OracleUserService, OracleService);

module.exports = function (app, oraclePlugin) {
  return new OracleUserService(app, oraclePlugin);
};

let pro = OracleUserService.prototype;

pro.init = function () {
  let self = this;
  return co(function *() {
    let conn = yield self.oraclePlugin.getClient();
    yield self.oraclePlugin.createTable(conn, self.tableName);
    yield self.oraclePlugin.closeClient(conn);
  });
};

pro.loadUser = function (uid) {
  let self = this;
  return co(function *() {
    let user = yield self.loadData({id: uid});

    if (user) {
      if (user.accType === consts.LOGIN_TYPE.NORMAL) {
        self.accIds[user.acc_type] = user.id;
      }

      self.checkUserProp(user);
    }

    return user;
  });
};

pro.checkUserProp = function (user) {

};

pro.getUser = function (uid) {
  return this.getData({id: uid});
};

/**
 * 更新玩家最后一次操作的时间
 * @param uid
 * @returns {*}
 */
pro.updateTime = function (uid) {
  let self = this;
  return co(function *() {
    let user = self.getUser(uid);
    if (user) {
      logger.debug(`oracleUserService updateTime: uid = ${uid}`);
      user.lastUpdateTime = new Date().getTime();
    }
  });
};

pro.findUidByAccId = function (accId) {
  accId = accId.toString();
  let self = this;
  return co(function *() {
    let uid = undefined;
    if (self.accIds.hasOwnProperty(accId)) {
      uid = self.accIds[accId];
    } else {
      let conn = yield self.oraclePlugin.getClient();
      let result = yield self.oraclePlugin.read(conn, self.tableName, {acc_id: accId});
      yield self.oraclePlugin.closeClient(conn);
      if (typeof result === 'object' && result.length > 0) {
        let userInfo = yield self.loadUser(result[0].id);
        uid = userInfo.id;
      }
    }

    return uid;
  });
};

/**
 * 玩家离开，将 sid 重置为 null，而不删除玩家信息，目的是玩家断线重连时能够继续之前的进度。sid 为 null 表示玩家离线,
 * 如果玩家是试玩模式，删除themeData。
 * @param uid
 */
pro.userLeave = function (uid) {
  let user = this.getData({uid: uid});
  if (user){
    user.sid = null;
    user.gameServerId = null;
    if (user.type === app.consts.USER_TYPE.FREE) {
      app.alibabaService.removeData({uid: uid});
    }
    logger.info('oracleUserService userLeave: uid = {0}'.format(uid));
  }
};

/**
 * 将玩家踢下线，并发送踢下线的原因
 * @param uid
 * @param reason
 * @returns {*}
 */
pro.kickUser = function(uid, reason){
  let self = this;
  return co(function*(){
    let user = self.getUser(uid);
    if (user && user.sid !== null){
      logger.info('oracleUserService kickUser: kickUser id is {0}'.format(uid));

      let promise = new Promise(function(resolve, reject){
        app.backendSessionService.kickByUid(user.sid, uid, reason, function(err){
          if (err){
            reject(err);
          } else {
            resolve(uid);
          }
        });
      });
      yield promise;
    } else {
      logger.info('oracleUserService kickUser: user is undefined or user.sid is null');
    }
  });
};

/**
 * 广播给所有用户
 * @param route
 * @param msg
 */
pro.broadcast = function(route, msg) {
  let channelService = app.channelService;
  let promise = new Promise(function(resolve, reject){
    channelService.broadcast(app.consts.SERVERS.CONNECTOR, route, msg, null, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(true);
      }
    });
  });

  return promise;
};

/**
 * 修改玩家数据
 * @param user
 * @param changeObj
 * @param reason
 */
pro.change = function(user, changeObj, reason) {
  let self = this;
  return co(function *() {
    let result = yield self.constructor.super_.prototype.change.call(self, {id: user.id}, changeObj, reason);
    self.onProperChange(user, result, reason);
    user.emit(app.consts.GLOBAL_EVENT.CHANGE, user, result);

    return result;
  });
};

/**
 * 玩家数据变化的收尾工作
 * @param user
 * @param changedObj
 */
pro.onProperChange = function (user, changedObj, reason) {
  if (!user || user.sid === null) {
    return;
  }

  let resultObj = {};
  for (let key in changedObj) {
    if (clientInterestedProper.indexOf(key) >= 0) {
      resultObj[key] = changedObj[key][1];
    }
  }

  if (Object.keys(resultObj).length > 0) {
    user.pushInfo(app.consts.PUSH_ROUTE.ON_PROPER_CHANGE, resultObj);
  }
};

/**
 * 检查玩家在线状态
 */
pro.checkUsersAlive = function () {
  let self = this;
  co(function *(){
    logger.info(`oracleUserService checkUsersAlive: do cron`);

    let users = self.datas;
    let user;

    let config = dataManager.getConfig();

    let nowTime = Date.now();
    let timeout = config.kickTime  * 1000;
    let maxOfflineTime = config.offlineDeleteTime * 1000;
    let onlineNum = 0;

    let uids = Object.keys(users);
    for(let key of uids) {
      user = users[key];
      if (user && user.sid) {
        if (nowTime - user.lastUpdateTime > timeout) {
          yield self.kickUser(user.id, app.consts.KICK_REASON.OPERATE_TIMEOUT);
          user.sid = null;
        } else {
          ++onlineNum;
        }
      } else if (user && user.sid === null && nowTime - user.offlineTime > maxOfflineTime) {
        delete self.datas[key];
      } else {
        // do nothing
      }
    }
  }).catch(function (err) {
    logger.error(err.message + err.stack);
  });
};

/**
 * 获取新的用户 id
 * @returns {*}
 */
pro.requestNextUserId = function () {
  let self = this;
  return co(function *() {
    let conn = yield self.oraclePlugin.getClient();
    let result = yield conn.execute(
      'select game_user_seq.nextval from dual'
    );
    yield self.oraclePlugin.closeClient(conn);
    if (result.rows && result.rows[0] && result.rows[0][0] !== undefined) {
      return result.rows[0][0];
    } else {
      return undefined;
    }
  });
};
