/**
 * Created by wyang on 16/8/4.
 */

'use strict';

let app = require('pomelo').app;
let User = require('../game/user');
let logger = app.logger.getGameLog(__filename);
let dataManager = require('../libs/manager/dataManager');

let DataService = require('./dataService');
let util = require('util');
let co = require('co');

let clientInterestedProper = ['credit'];

let UserService = function () {
  if (app.sync) {
    this.constructor.super_.call(this, app.sync, 'user', User);
  }

  // 内存中所有默认用户 accId 到 uid 的映射表
  this.accIds = {};
};

util.inherits(UserService, DataService);

let pro = UserService.prototype;

pro.getUser = function (uid) {
  return this.getData({uid: uid});
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
      logger.debug(`userService updateTime: uid = ${uid}`);
      user.lastUpdateTime = new Date().getTime();
    }
  });
};

/**
 * 没有则加载用户数据
 * @param uid
 * @returns {Promise}
 */
pro.loadUser = function (uid) {
  let self = this;
  return co(function *(){
    let user = yield self.loadData({uid: uid});

    if (user) {
      if (user.accType === app.consts.LOGIN_TYPE.NORMAL) {
        self.accIds[user.accId] = user.uid;
      }

      self.checkUserProp(user);
    }

    return user;
  });
};

/**
 * 确保玩家属性存在。新加字段时，老玩家的数据是没有新字段的，需要手动添加
 * @param user
 */
pro.checkUserProp = function (user) {
  if (user.reconnectTheme === undefined) {
    user.reconnectTheme = app.consts.THEME_NAME.NONE;
  }

  if (user.reconnectData === undefined) {
    user.reconnectData = {};
  }
};

/**
 * 根据 accId 查找用户 id，只会查找使用 normal 方式登录的账号
 * @param accId
 * @returns {*}
 */
pro.findUidByAccId = function (accId) {
  accId = accId.toString();
  let self = this;
  return co(function *() {
    let uid = undefined;

    if (self.accIds.hasOwnProperty(accId)) {
      uid = self.accIds[accId];
    } else {
      let userModel = app.sync.getModel('user');
      let userData = yield userModel.findOne({
        accId: accId,
        accType: app.consts.LOGIN_TYPE.NORMAL
      });
      if (userData) {
        let user = yield self.loadUser(userData.uid);
        uid = user.uid;
        self.accIds[accId] = uid;
      }
    }

    logger.info(`userService findUidByAccId: uid = ${uid}`);
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
    if (user.type === app.consts.USER_TYPE.FREE) {
      app.alibabaService.removeData({uid: uid});
    }
    logger.info('userService userLeave: uid = {0}'.format(uid));
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
      logger.info('userService kickUser: kickUser id is {0}'.format(uid));

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
      logger.info('userService kickUser: user is undefined or user.sid is null');
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
 * @param obj
 * @param reason
 */
pro.change = function(user, obj, reason) {
  let result = this.constructor.super_.prototype.change.call(this, user, obj, reason);
  this.onProperChange(user, result, reason);
  user.emit(app.consts.GLOBAL_EVENT.CHANGE, user, result);

  return result;
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
    logger.info(`userService checkUsersAlive: do cron`);

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
          yield self.kickUser(user.uid, app.consts.KICK_REASON.OPERATE_TIMEOUT);
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

module.exports = UserService;
