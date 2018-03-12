/**
 * 阿里巴巴主题数据相关接口
 * Author:
 * Date:
 */

'use strict';

let co = require('co');

let AlibabaRemote = function (app) {
  this.app = app;
  this.logger = app.logger.getDataCenterLog(__filename);
};

module.exports = function (app) {
  return new AlibabaRemote(app);
};

let pro = AlibabaRemote.prototype;

/**
 * 请求进入阿里巴巴玩法
 * @param uid
 * @param cb
 */
pro.entryAlibaba = function (uid, cb) {
  this.logger.info(`hallRemote entryAlibaba: uid = ${uid}`);

  let self = this;
  co(function *() {
    let user = self.app.userService.getUser(uid);
    if (!user) {
      logger.warn(`hallRemote entryAlibaba: uid = ${uid}, user not found`);
      cb(null, {code: self.app.consts.CODE.NOT_IN_GAME});
      return undefined;
    }

    let result = yield self.app.alibabaService.entry(user);
    cb(null, {
      code: self.app.consts.CODE.SUCCESS,
      data: result
    });
  }).catch(function (err) {
    self.logger.error(err.stack);
    cb(null, {code: self.app.consts.CODE.SERVER_ERROR});
  });
};

/**
 * 请求阿里巴巴主题数据
 * @param uid
 * @param cb
 */
pro.requestAlibabaTheme = function (uid, cb) {
  let self = this;
  co(function *() {
    let user = self.app.userService.getUser(uid);
    let userInfo = undefined;
    if (user) {
      userInfo = {};
      for (let key in user) {
        if (typeof user[key] !== 'function') {
          userInfo[key] = user[key];
        }
      }
    } else {
      self.logger.info(`alibabaRemote requestAlibabaTheme: uid = ${uid}, user not found`);
      cb(null, {code: self.app.consts.CODE.NOT_IN_GAME});
      return;
    }

    let result = self.app.alibabaService.getTheme(uid);
    if (result === undefined) {
      cb(null, {code: self.app.consts.CODE.NEED_ENTRY_BEFORE});
      return;
    }
    let themeInfo = {};
    for (let key in result) {
      if (typeof result[key] !== 'function') {
        themeInfo[key] = result[key];
      }
    }

    let roundId = yield self.app.spinRecordService.requestNextRoundId();
    cb(null, {code: self.app.consts.CODE.SUCCESS, data: {
      userInfo: userInfo,
      themeInfo: themeInfo,
      roundId: roundId
    }});
  }).catch(function (err) {
    self.logger.error(err.stack);
    cb(null, {code: self.app.consts.CODE.SERVER_ERROR});
  });
};

/**
 * 请求修改阿里巴巴主题数据
 * @param uid
 * @param changeObj
 * @param cb
 */
pro.requestChangeAlibaba = function (uid, changeObj, cb) {
  let self = this;
  co(function *() {
    let themeData = self.app.alibabaService.getTheme(uid);
    yield self.app.alibabaService.change(themeData, changeObj);
    cb(null, {code: self.app.consts.CODE.SUCCESS});
  }).catch(function (err) {
    self.logger.error(err.stack);
    cb(null, {code: self.app.consts.CODE.SERVER_ERROR});
  });
};

pro.requestStoreSpinResult = function (uid, changedUserInfo, changeUserReason, changedThemeInfo, spinResult, cb) {
  let self = this;
  co(function *() {
    let user = self.app.userService.getUser(uid);
    if (user === undefined) {
      self.logger.warn(`userRemote requestChangeUser: uid = ${uid}, user not found`);
      cb(null, {code: self.app.consts.CODE.NOT_IN_GAME});
      return;
    }
    yield self.app.userService.change(user, changedUserInfo, changeUserReason);

    let themeData = self.app.alibabaService.getTheme(uid);
    yield self.app.alibabaService.change(themeData, changedThemeInfo);

    yield self.app.spinRecordService.insertSpinHistory(spinResult);
    cb(null, {code: self.app.consts.CODE.SUCCESS});
  }).catch(function (err) {
    self.logger.error(err.stack);
    cb(null, {code: self.app.consts.CODE.SERVER_ERROR});
  });
};