/**
 * Created by wyang on 8/17/16.
 */

'use strict';

let co = require('co');

let app = require('pomelo').app;
let logger = app.logger.getGameLog(__filename);

module.exports = function (app) {
  return new Handler(app);
};

let Handler = function (app) {
  this.app = app;
};

let pro = Handler.prototype;

/**
 * 客户端获取静态配置表
 * @param msg
 * @param session
 * @param next
 */
pro.fetchConfigList = function (msg, session, next) {
  let uid = session.uid;

  logger.info(`hallHandler fetchConfigList: uid = ${uid}`);

  if (!uid) {
    logger.warn(`hallHandler fetchConfigList: session not bind uid`);
    next(null, {code: app.consts.CODE.NOT_IN_GAME});
    return;
  }

  co(function *() {
    let promise = new Promise(function (resolve, reject) {
      app.rpc.game.hallRemote.fetchConfigList(session, uid, function (err, res) {
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
  })
};

/**
 * 玩家请求 spin 的历史记录
 * @param msg
 * @param session
 * @param next
 */
// pro.requestSpinHistory = function (msg, session, next) {
//   let uid = session.uid;
//   let startDate = msg.startDate;
//   let endDate = msg.endDate;
//   let startIndex = msg.startIndex;
//   let endIndex = msg.endIndex;
//
//   logger.info(`hallHandler requestSpinHistory: uid = ${uid}, startDate = ${startDate}, endDate = ${endDate}`
//     + `, startIndex = ${startIndex}, endIndex = ${endIndex}`);
//   if (!uid) {
//     logger.warn(`hallHandler requestSpinHistory: session not bind uid`);
//     next(null, {code: app.consts.CODE.NOT_IN_GAME});
//     return;
//   }
//
//   if (typeof startDate !== 'number' || typeof endDate !== 'number' || typeof startIndex !== 'number'
//     || typeof endIndex !== 'number') {
//     logger.warn(`hallHandler requestSpinHistory: uid = ${uid}, startDate = ${startDate}, endDate = ${endDate}`
//     + `, startIndex = ${startIndex}, endIndex = ${endIndex}, param error`);
//     next(null, {code: app.consts.CODE.PARAM_ERROR});
//     return;
//   }
//
//   co(function *() {
//     let result = yield new Promise(function (resolve, reject) {
//       app.rpc.dataCenter.themeRemote.requestSpinHistory('*', uid, startDate, endDate, startIndex, endIndex, function (err, res) {
//         if (err) {
//           reject(err);
//         } else {
//           resolve(res);
//         }
//       })
//     });
//
//     next(null, result);
//   }).catch(function (err) {
//     logger.error(err.stack);
//     next(null, {code: app.consts.CODE.SERVER_ERROR});
//   });
// };

/**
 * 请求进入阿里巴巴玩法
 * @param msg
 * @param session
 * @param next
 */
pro.entryAlibaba = function (msg, session, next) {
  let uid = session.uid;

  logger.info(`hallHandler entryAlibaba: uid = ${uid}`);
  if (!uid) {
    logger.warn(`hallHandler entryAlibaba: session not bind uid`);
    next(null, {code: app.consts.CODE.NOT_IN_GAME});
    return;
  }

  co(function *() {
    let promise = new Promise(function (resolve, reject) {
      app.rpc.dataCenter.alibabaRemote.entryAlibaba(session, uid, function (err, res) {
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









