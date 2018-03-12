/**
 * 定时检查玩家在线状态，统计在线人数，清理不在线玩家的数据
 * Author: jxyi
 * Date: 2017-10-13
 */

'use strict';

let app = require('pomelo').app;
let logger = app.logger.getGameLog(__filename);

let Cron = function (app) {
  this.app = app;
};

/**
 * 检查玩家在线状态，统计在线人数，清理不在线玩家的数据
 */
Cron.prototype.checkUserAlive = function () {
  try {
    // this.app.userService.checkUsersAlive();
  } catch(err) {
    logger.error(err.message + err.stack);
  }
};

module.exports = function (app) {
  return new Cron(app);
};
