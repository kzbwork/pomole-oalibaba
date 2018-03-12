/**
 * Created by wyang on 8/17/16.
 */

'use strict';

let path = require('path');
let loggerName = path.basename(__filename);
let logger = require('pomelo-logger').getLogger('game-log', loggerName);

let app = require('pomelo').app;

module.exports = function (app) {
  return new Handler(app);
};

let Handler = function (app) {
  this.app = app;
};

/**
 * 客户端ping 的接口,用来获得客户端当前的网络状态
 * 记录玩家每个时间点的网络状态
 * 返回多久后重新请求ping值
 *
 * @param  {Object}   msg     request message
 * @param  {Object}   session current session object
 * @param  {Function} next    next step callback
 * @return {Void}
 */
Handler.prototype.ping = function (msg, session, next) {
  next(null,1);
};

