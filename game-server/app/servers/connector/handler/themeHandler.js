/**
 * 玩法相关的协议，所有玩法通用
 * author: jxyi
 * date: 2018-1-3
 */

'use strict';

let co = require('co');

let app = require('pomelo').app;
let logger = app.logger.getGameLog(__filename);

let ThemeHandler = function (app) {
  this.app = app;
};

module.exports = function (app) {
  return new ThemeHandler(app);
};

let pro = ThemeHandler.prototype;

pro.confirmSpin = function (msg, session, cb) {
  let uid = session.uid;
  if (uid === undefined) {
    logger.warn(`themeHandler confirmSpin: session not bind`);
    cb(null, {code: app.consts.CODE.NOT_IN_GAME});
    return;
  }

  co(function *() {
    let promise = new Promise(function (resolve, reject) {
      app.rpc.dataCenter.themeRemote.confirmSpin(session, uid, function (err, res) {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });

    let result = yield promise;
    cb(null, result);
  }).catch(function (err) {
    logger.error(err.stack);
    cb(null, {code: app.consts.CODE.SERVER_ERROR});
  });
};




