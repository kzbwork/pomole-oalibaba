/**
 * 用户数据同步模块
 * Author: jxyi
 * Date: 2018-2-28
 */

'use strict';

let co = require('co');
let dataManager = require('../../../libs/manager/dataManager');

let UserRemote = function (app) {
  this.app = app;
  this.logger = app.logger.getDataCenterLog(__filename);
};

module.exports = function (app) {
  return new UserRemote(app);
};

let pro = UserRemote.prototype;


pro.requestLogin = function (sid, loginType, entryObj, cb) {
  let self = this;
  co(function *() {
    let res = undefined;
    if (loginType === self.app.consts.LOGIN_TYPE.NORMAL) {
      let accId = entryObj.accId;
      res = yield self._loginNormal(accId, entryObj);
    } else {
      self.logger.error(`userRemote login: loginType = ${loginType}, invalid login type`);
      cb(null, {code: self.app.consts.CODE.PARAM_ERROR});
      return;
    }

    if (res && res.code === self.app.consts.CODE.SUCCESS) {
      let uid = res.data.uid;

      let user = yield self.app.userService.loadUser(uid);
      yield self.kick(uid, self.app.consts.KICK_REASON.SAME_USER_LOGIN);

      user.type = entryObj.userFlag;
      if (self.app.walletService.isOpenForUser(user)) {
        user.walletInfo.session = entryObj.session;
        user.isMobile = !!entryObj.isMobile;
        let walletInfo = yield self.app.walletService.getAccount(user);

        if (walletInfo.responseCode !== self.app.consts.SINGLE_WALLET_CODE.OK) {
          cb(null, {code: walletInfo.responseCode});
          return;
        }

        user.credit = walletInfo.balance;
      } else {
        if (!entryObj.isReconnect) {
          user.credit = dataManager.getConfig().originCredit;
        }
      }

      user.lastLoginTime = new Date();
      user.sid = sid;

      if ([self.app.consts.ENVS.DEVELOPMENT].indexOf(self.app.get('env')) >= 0) {
        user.isDebug = entryObj.isDebug;
      } else {
        user.isDebug = false;
      }
      self.logger.debug(`userRemote add: user.id = ${user.id}, user.isDebug = ${user.isDebug}`);

      cb(null, {code: self.app.consts.CODE.SUCCESS, data: {
        uid: user.id,
        credit: user.credit,
        reconnectTheme: user.reconnect_theme
      }});
    } else {
      cb(null, res);
    }
  }).catch(function (err) {
    self.logger.error(err.stack);
    cb(null, {code: self.app.consts.CODE.SERVER_ERROR});
  });
};

/**
 * 默认登录方式，临时方案
 * @param accId
 * @param clientData
 * @returns {*}
 */
pro._loginNormal = function (accId, clientData) {
  let self = this;
  return co(function *() {
    if (!accId || accId === '') {
      self.logger.warn(`userRemote loginNormal: accId = ${accId}, accId invalid`);
      return {code: app.consts.CODE.PARAM_ERROR};
    }

    let uid = yield self.app.userService.findUidByAccId(accId);
    self.logger.debug(`userRemote loginNormal: uid = ${uid}, accId = ${accId}`);

    let user = undefined;
    if (uid) {
      user = yield self.app.userService.loadUser(uid);
    } else {
      user = yield self.createUser(clientData, self.app.consts.LOGIN_TYPE.NORMAL);
    }

    return {
      code: self.app.consts.CODE.SUCCESS,
      data: {
        uid: user.id
      }
    };
  });
};

/**
 * 获取登录需要的数据结构，
 * @param clientData 客户端发来的数据
 * @return {{}} 过滤过的需要存入数据库的数据
 * @private
 */
pro._getLoginObj = function(clientData) {
  let config = dataManager.getConfig();
  let loginObj = {
    name: clientData.name || 'name',
    acc_id: clientData.accId || '',
    acc_type: clientData.accType || this.app.consts.LOGIN_TYPE.NORMAL,
    credit: config.originCredit,

    reconnect_theme: this.app.consts.THEME_NAME.NONE,
    register_time: new Date(),
    last_login_time: new Date()
  };

  for(let i in loginObj){
    if(loginObj[i] === undefined){
      delete loginObj[i];
    }
  }

  return loginObj;
};

pro.createUser = function(clientData, accType) {
  let self = this;

  let loginObj = this._getLoginObj(clientData);
  loginObj.acc_type = accType;

  return co(function*() {
    loginObj.id = yield self.app.userService.requestNextUserId();
    self.logger.debug(`userRemote createUser: loginObj.id = ${loginObj.id}`);
    let user = yield self.app.userService.newData(loginObj);

    self.logger.info(`userRemote login: uid = ${user.id}, register newUser`);

    return user;
  });
};

pro.requestUserInfo = function (uid, cb) {
  let self = this;
  co(function *() {
    let user = yield self.app.userService.loadUser(uid);
    if (user) {
      let obj = {};
      for (let key in user) {
        if (typeof user[key] !== 'function') {
          obj[key] = user[key];
        }
      }
      cb(null, {code: self.app.consts.CODE.SUCCESS, data: obj});
    } else {
      self.logger.info(`userRemote requestUserInfo: uid = ${uid}, user not found`);
      cb(null, {code: self.app.consts.CODE.NOT_IN_GAME});
    }
  }).catch(function (err) {
    self.logger.error(err.stack);
    cb(null, {code: self.app.consts.CODE.SERVER_ERROR});
  });
};

/**
 * 请求修改用户数据
 * @param uid
 * @param changeObj
 * @param reason
 * @param cb
 */
pro.requestChangeUser = function (uid, changeObj, reason, cb) {
  let self = this;
  co(function *() {
    let user = self.app.userService.getUser(uid);
    if (user === undefined) {
      self.logger.warn(`userRemote requestChangeUser: uid = ${uid}, user not found`);
      cb(null, {code: self.app.consts.CODE.NOT_IN_GAME});
      return;
    }
    let result = yield self.app.userService.change(user, changeObj, reason);
    cb(null, {code: self.app.consts.CODE.SUCCESS, data: result});
  }).catch(function (err) {
    self.logger.error(err.stack);
    cb(null, {code: self.app.consts.CODE.SERVER_ERROR});
  });
};

/**
 * 移除用户
 * @param uid
 * @param cb
 */
pro.remove = function (uid, cb) {
  let user = this.app.userService.getUser(uid);

  if (!user) {
    return cb(null, true);
  }

  this.logger.info(`entryRemote remove: uid = ${user.id}`);

  user.onLeave();

  this.app.userService.userLeave(uid);

  cb(null, true);
};

/**
 * 将玩家踢下线
 * @param uid
 * @param reason，踢下线的原因，app.consts.KICK_REASON
 */
pro.kick = function(uid, reason){
  let self = this;
  return co(function*(){
    let user = self.app.userService.getUser(uid);

    self.logger.info(`entryRemote kick: uid = ${uid}`);
    if (user && user.sid !== null){
      self.logger.info(`entryRemote kick: kick user ${uid} for reason ${reason}`);
      yield self.app.userService.kickUser(uid, reason);
      self.app.userService.userLeave(uid);
    }
    return true;
  });
};

/**
 * 给用户发送消息
 * @param uid
 * @param route
 * @param obj
 * @param cb
 */
pro.pushMessage = function(uid, route, obj, cb){
  let user = this.app.userService.getUser(uid);
  if(user){
    user.pushInfo(route, obj);
    cb(null, true);
  } else {
    cb(null, false);
  }
};

/**
 * 更新玩家操作时间
 * @param uid
 * @param cb
 */
pro.userAction = function (uid, cb) {
  let self = this;
  co(function *() {
    yield self.app.userService.updateTime(uid);
    cb(null, {code: self.app.consts.CODE.SUCCESS});
  }).catch(function (err) {
    cb(err, {code: self.app.consts.CODE.SERVER_ERROR});
  });
};

/**
 * 踢掉所有用户
 * @param reason
 * @param cb
 */
pro.kickAll = function(reason, cb) {
  let users = this.app.userService.datas;

  reason = reason || this.app.consts.KICK_REASON.SERVER_CLOSE;

  let self = this;
  co(function*() {
    let promises = [];
    let user;
    let uid;
    let uids = [];
    for(let key in users) {
      user = users[key];
      if (user) {
        uid = user.uid;
        uids.push(uid);
        let promise = self.app.userService.kickUser(uid, reason);
        promises.push(promise);
      }
    }

    let result = yield promises;
    cb(null, {code: self.app.consts.CODE.SUCCESS, uids: uids});
  }).catch(function(err) {
    logger.error(err.message + err.stack);
    cb(null, {code: self.app.consts.CODE.SERVER_ERROR});
  });
};

/**
 * 广播消息
 * @param route
 * @param data
 * @param cb
 */
pro.broadcast = function(route, data, cb) {
  let self = this;
  co(function*() {
    yield self.app.userService.broadcast(route, data);
    cb(null, {code: self.app.consts.CODE.SUCCESS});
  }).catch(function(err) {
    cb(err);
  });
};

/**
 * 给玩家增加游戏币，专用于数值测试
 * @param uid
 * @param credit
 * @param cb
 */
pro.addCredit = function (uid, credit, cb) {
  let self = this;
  co(function *() {
    if ([self.app.consts.ENVS.DEVELOPMENT, self.app.consts.ENVS.LOCAL_TEST].indexOf(self.app.get('env')) < 0) {
      logger.warn(`userRemote addCredit: env = ${self.app.get('env')}, forbidden`);
      cb(null, {code: self.app.consts.CODE.INVALID});
      return;
    }

    let user = yield self.app.userService.loadUser(uid);
    if (!user) {
      logger.warn(`userRemote addCredit: uid = ${uid}, user not found`);
      cb(null, {code: self.app.consts.CODE.NO_USER});
      return;
    }

    yield self.app.userService.change(user, {
      credit: user.credit + credit
    }, self.app.consts.REASON.TEST_ADD);

    cb(null, {code: self.app.consts.CODE.SUCCESS});
  }).catch(function (err) {
    cb(err);
  });
};






