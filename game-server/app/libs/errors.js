/**
 * Created by wyang on 16/6/2.
 */

'use strict';

var util = require('util');

/**
 * 逻辑错误,不应该输出到日志
 * @param msg
 * @constructor
 */
var LogicError = function (msg) {
  LogicError.super_.call(this, msg);
  this.message = msg;
};

util.inherits(LogicError, Error);
LogicError.prototype.name = 'LogicError';