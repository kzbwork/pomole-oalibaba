/**
 * 主题数据模块
 * Author: jxyi
 * Date: 2018-3-4
 */

'use strict';

let co = require('co');

let ThemeRemote = function (app) {
  this.app = app;
  this.logger = app.logger.getDataCenterLog(__filename);
};

module.exports = function (app) {
  return new ThemeRemote(app);
};

let pro = ThemeRemote.prototype;

pro.requestSpinHistory = function (uid, gameId, startDate, endDate, startIndex, endIndex, cb) {
  let self = this;
  co(function *() {
    let user = self.app.userService.getUser(uid);
    if (!user) {
      cb(null, {code: self.app.consts.CODE.NOT_IN_GAME});
      return;
    }

    let result = yield self.app.spinRecordService.requestSpinHistory(user.id, gameId, startDate, endDate, startIndex, endIndex);
    cb(null, {code: self.app.consts.CODE.SUCCESS, data: result});
  }).catch(function (err) {
    self.logger.error(err.stack);
    cb(null, {code: self.app.consts.CODE.SERVER_ERROR});
  });
};

/**
 * 请求轮次 id
 * @param cb
 */
pro.requestRoundId = function (cb) {
  let self = this;
  co(function *() {
    let roundId = yield self.app.spinRecordService.requestNextRoundId();
    cb(null, {code: self.app.consts.CODE.SUCCESS, data: roundId});
  }).catch(function (err) {
    self.logger.error(err.stack);
    cb(null, {code: self.app.consts.CODE.SERVER_ERROR});
  });
};

/**
 * 客户端确认收到 spin 结果
 * @param uid
 * @param cb
 */
pro.confirmSpin = function (uid, cb) {
  this.logger.info(`themeRemote confirmSpin: uid = ${uid}`);

  let self = this;
  co(function *() {
    let user = self.app.userService.getUser(uid);
    if (!user) {
      logger.warn(`themeRemote confirmSpin: uid = ${uid}`);
      cb(null, {code: self.app.consts.CODE.NOT_IN_GAME});
      return ;
    }

    yield self.app.userService.change(user, {
      reconnect_theme: self.app.consts.THEME_NAME.NONE,
      reconnect_data: {}
    });
    cb(null, {code: self.app.consts.CODE.SUCCESS});
  }).catch(function (err) {
    self.logger.error(err.stack);
    cb(null, {code: self.app.consts.CODE.SERVER_ERROR});
  });
};

pro.requestInsertSpinHistory = function (spinData, cb) {
  let self = this;
  co(function *() {
    yield self.app.spinRecordService.insertSpinHistory(spinData);
    cb(null, {code: self.app.consts.CODE.SUCCESS});
  }).catch(function (err) {
    self.logger.error(err.stack);
    cb(null, {code: self.app.consts.CODE.SERVER_ERROR});
  });
};

pro.requestUpdateSpinHistoryBonus = function (roundId, uid, accountTransactionId, cb) {
  let self = this;
  co(function *() {
    yield self.app.spinRecordService.updateSpinHistoryBonus(roundId, uid, accountTransactionId);
    cb(null, {code: self.app.consts.CODE.SUCCESS});
  }).catch(function (err) {
    self.logger.error(err.stack);
    cb(null, {code: self.app.consts.CODE.SERVER_ERROR});
  });
};
