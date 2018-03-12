/**
 * 阿里巴巴玩法逻辑
 * author: jxyi
 * date: 2017-12-27
 */

'use strict';

let co = require('co');

let app = require('pomelo').app;
let logger = app.logger.getGameLog(__filename);
let models = require('../../../libs/models');

let baseUtil = require('../../../libs/slot/baseUtil');
let slotConsts = require('../../../service/slot/slotConsts');

let AlibabaRemote = function (app) {
  this.app = app;
};

module.exports = function (app) {
  return new AlibabaRemote(app);
};

let pro = AlibabaRemote.prototype;

/**
 * 请求滚动开奖
 * @param uid
 * @param coinValue
 * @param multiplier
 * @param cb
 */
pro.spin = function (uid, coinValue, multiplier, cb) {
  logger.info(`alibabaRemote spin: uid = ${uid}, coinValue = ${coinValue}, multiplier = ${multiplier}`);
  co(function *() {
    let result = yield app.alibabaCalculator.spin(uid, coinValue, multiplier);
    logger.debug(`alibabaRemote spin: uid = ${uid}, result = ${JSON.stringify(result)}`);
    cb(null, result);
  }).catch(function (err) {
    logger.error(err.stack);
    cb(null, {code: app.consts.CODE.SERVER_ERROR});
  });
};

/**
 * 请求选择小游戏的罐子
 * @param uid
 * @param index
 * @param cb
 */
pro.selectMini = function (uid, index, cb) {
  logger.info(`alibabaRemote selectMini: uid = ${uid}, index = ${index}`);
  co(function *() {
    let result = yield app.alibabaCalculator.selectMini(uid, index);
    cb(null, result);
  }).catch(function (err) {
    logger.error(err.stack);
    cb(null, {code: app.consts.CODE.SERVER_ERROR});
  })
};









