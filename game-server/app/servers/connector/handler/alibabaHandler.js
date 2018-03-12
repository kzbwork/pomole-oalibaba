/**
 * 处理阿里巴巴玩法内的协议
 * author: jxyi
 * date: 2017-12-27
 */

'use strict';

let co = require('co');

let app = require('pomelo').app;
let logger = app.logger.getGameLog(__filename);

let AlibabaHandler = function (app) {
  this.app = app;
};

module.exports = function (app) {
  return new AlibabaHandler(app);
};

let pro = AlibabaHandler.prototype;

/**
 * 请求滚动
 * @param msg
 * @param session
 * @param next
 */
pro.spin = function (msg, session, next) {
  let coinValue = msg.coinValue;
  let multiplier = msg.multiplier;

  if (multiplier === undefined || coinValue === undefined) {
    logger.warn(`alibabaHandler spin: multiplier = ${multiplier}, coinValue = ${coinValue}, invalid param`);
    next(null, {code: app.consts.CODE.PARAM_ERROR});
    return;
  }

  let uid = session.uid;
  if (uid === undefined) {
    logger.warn(`alibabaHandler spin: session not bind`);
    next(null, {code: app.consts.CODE.NOT_IN_GAME});
    return;
  }

  co(function *() {
    let promise = new Promise(function (resolve, reject) {
      app.rpc.game.alibabaRemote.spin(session, uid, coinValue, multiplier, function (err, res) {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      })
    });

    let result = yield promise;

    // 移除数值工具中使用的数据
    if (result.extraData) {
      result.extraData = undefined;
    }
    next(null, result);
  }).catch(function (err) {
    logger.error(err.stack);
    next(null, {code: app.consts.CODE.SERVER_ERROR});
  });
};

/**
 * 选择小游戏
 * @param msg
 * @param session
 * @param next
 */
pro.selectMini = function (msg, session, next) {
  let selectIndex = msg.index;

  if (selectIndex === undefined) {
    logger.warn(`alibabaHandler selectMini: selectIndex = ${selectIndex}, invalid param`);
    next(null, {code: app.consts.CODE.PARAM_ERROR});
    return;
  }

  let uid = session.uid;
  if (uid === undefined) {
    logger.warn(`alibabaHandler selectMini: session not bind`);
    next(null, {code: app.consts.CODE.NOT_IN_GAME});
    return;
  }

  co(function *() {
    let promise = new Promise(function (resolve, reject) {
      app.rpc.game.alibabaRemote.selectMini(session, uid, selectIndex, function (err, res) {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });

    let result = yield promise;
    next(null, result);
  }).catch(function (err) {
    logger.error(err.stack);
    next(null, {code: app.consts.CODE.SERVER_ERROR});
  });
};

/**
 * 请求阿里巴巴主题历史记录
 * @param msg
 * @param session
 * @param next
 */
pro.requestSpinHistory = function (msg, session, next) {
  let uid = session.uid;
  let startDate = msg.startDate;
  let endDate = msg.endDate;
  let startIndex = msg.startIndex;
  let endIndex = msg.endIndex;

  logger.info(`alibabaHandler requestSpinHistory: uid = ${uid}, startDate = ${startDate}, endDate = ${endDate}`
    + `, startIndex = ${startIndex}, endIndex = ${endIndex}`);
  if (!uid) {
    logger.warn(`alibabaHandler requestSpinHistory: session not bind uid`);
    next(null, {code: app.consts.CODE.NOT_IN_GAME});
    return;
  }

  if (typeof startDate !== 'number' || typeof endDate !== 'number' || typeof startIndex !== 'number'
    || typeof endIndex !== 'number') {
    logger.warn(`alibabaHandler requestSpinHistory: uid = ${uid}, startDate = ${startDate}, endDate = ${endDate}`
      + `, startIndex = ${startIndex}, endIndex = ${endIndex}, param error`);
    next(null, {code: app.consts.CODE.PARAM_ERROR});
    return;
  }

  co(function *() {
    let result = yield new Promise(function (resolve, reject) {
      app.rpc.dataCenter.themeRemote.requestSpinHistory('*', uid, app.consts.MODULES.ALIBABA, startDate, endDate, startIndex, endIndex, function (err, res) {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      })
    });

    next(null, result);
  }).catch(function (err) {
    logger.error(err.stack);
    next(null, {code: app.consts.CODE.SERVER_ERROR});
  });
};
