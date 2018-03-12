/**
 * Created by wyang on 16/8/4.
 */

'use strict';

let co = require('co');
let path = require('path');
let loggerName = path.basename(__filename);
let logger = require('pomelo-logger').getLogger('game-log', loggerName);
let app = require('pomelo').app;

module.exports = function (app) {
  return new HallRemote(app);
};

let HallRemote = function (app) {
  this.app = app;
};

let pro = HallRemote.prototype;

/**
 * 客户端获取静态配置表
 * @param uid
 * @param cb
 */
pro.fetchConfigList = function (uid, cb) {
  let self = this;

  co(function *() {
    let result = {

    };

    cb(null, {code: app.consts.CODE.SUCCESS, data: result});
  }).catch(function (err) {
    logger.error(err.stack);
    cb(null, {code: app.consts.CODE.SERVER_ERROR});
  });
};





