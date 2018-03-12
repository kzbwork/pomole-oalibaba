/**
 * Created by wyang on 16/8/30.
 */

'use strict';

let path = require('path');

let logger = {};

/**
 * 返回游戏模块的日志对象
 * @param fileName
 * @return {*}
 */
logger.getGameLog = function (fileName) {
  fileName = fileName || '';

  let loggerName = path.basename(fileName);
  let logger = require('pomelo-logger').getLogger('game-log', loggerName);

  return logger;
};

/**
 * 返回数据管理模块的日志对象
 * @param fileName
 * @return {*}
 */
logger.getDataCenterLog = function (fileName) {
  fileName = fileName || '';

  let loggerName = path.basename(fileName);
  let logger = require('pomelo-logger').getLogger('dataCenter-log', loggerName);

  return logger;
};

/**
 * 返回运维模块的日志对象
 * @param fileName
 * @return {*}
 */
logger.getOptLog = function (fileName) {
  fileName = fileName || '';

  let loggerName = path.basename(fileName);
  return require('pomelo-logger').getLogger('opt-log', loggerName);
};

/**
 * 返回钱包模块的日子对象
 * @param fileName
 */
logger.getWalletLog = function(fileName) {
  fileName = fileName || 'wallet';

  let loggerName = path.basename(fileName);
  return require('pomelo-logger').getLogger('wallet-log', loggerName);
};

module.exports = logger;