/**
 * 处理运营操作相关请求
 * Author: jxyi
 * Date: 2017-10-12
 */

'use strict';

let co = require('co');
let pomelo = require('pomelo');
let app = pomelo.app;
let logger = app.logger.getGameLog(__filename);
let path = require('path');
let dataManager = require(path.join(app.base, 'app/libs/manager/dataManager'));

module.exports = function (app) {
  return new OtherRemote(app);
};

let OtherRemote = function (app) {
  this.app = app;
};

let pro = OtherRemote.prototype;


/**
 * 请求单次 spin 的详细信息
 * @param roundId
 * @param cb
 */
pro.requestDetailSpinInfo = function (roundId, cb) {
  co(function *() {
    logger.info(`otherRemote requestDetailSpinInfo: roundId = ${roundId}`);
    let result = yield app.spinRecordService.requestDetailSpinInfo(roundId);
    cb(null, result);
  }).catch(function (err) {
    logger.error(err.stack);
    cb(null, {code: app.consts.CODE.SERVER_ERROR});
  });
};





