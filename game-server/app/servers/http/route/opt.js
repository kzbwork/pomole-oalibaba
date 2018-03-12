/**
 * 提供与 op 后台相关的接口，如补单等
 * Created by jxyi on 16/12/21.
 */

'use strict';

let express = require('express');
let router = express.Router();

let co = require('co');

let pomelo = require('pomelo');
let app = pomelo.app;
let logger = app.logger.getOptLog(__filename);
let dataManager = require('../../../libs/manager/dataManager');
let utils = require('../../../libs/utils');

let post = {};
let get = {};

/**
 * 检查 ip 是否可以执行命令
 * @return {Boolean} 若可用则为 true 否则为 false
 */
let checkIp = function(req, res, next) {
  if ([app.consts.ENVS.DEVELOPMENT, app.consts.ENVS.LOCAL_TEST].indexOf(app.get('env')) !== -1){
    return true;
  }

  return true;
};

/**
 * 踢掉所有用户,维护前处理
 * @param req
 * @param res
 * @param next
 */
get.kickAllUsers = function(req, res, next) {
  if (!checkIp(req, res, next)) {
    logger.warn(`opt kickAllUsers: ip = ${req.ip}, forbidden`);
    res.send({code: app.consts.CODE.INVALID, ip: req.ip});
    next();
    return;
  }

  logger.info('opt kickAllUsers: body is {0}'.format(JSON.stringify(req.body)));

  let reason = req.body.reason;

  let rpcKickAll = function(callback) {
    app.rpc.game.userRemote.kickAll('*', reason, function(err, res){
      callback(err, res);
    });
  };

  co(function*() {
    let result = yield rpcKickAll;
    res.send(result);
    next();
  }).catch(function(err){
    logger.error(err.message + err.stack);
    res.send({code: app.consts.CODE.SERVER_ERROR});
    next();
  });
};

/**
 * 推送通知更新
 * @param req
 * @param res
 * @param next
 */
get.pushCheckUpdate = function(req, res, next) {
  if (!checkIp(req, res, next)) {
    logger.warn(`opt pushCheckUpdate: ip = ${req.ip}, forbidden`);
    res.send({code: app.consts.CODE.INVALID, ip: req.ip});
    next();
    return;
  }

  logger.info('opt pushCheckUpdate: body is {0}'.format(JSON.stringify(req.body)));

  let route = app.consts.PUSH_ROUTE.ON_CHECK_UPDATE;
  let lobbyUpdate = parseInt(req.body.lobbyUpdate);

  let rpcPush = function(callback) {
    app.rpc.game.userRemote.broadcast('*', route, {lobbyUpdate}, function(err, res) {
      callback(err, res);
    });
  };

  co(function*() {
    let result = yield rpcPush;
    res.send(result);
    next();
  }).catch(function(err){
    logger.error(err.message + err.stack);
    res.send({code: app.consts.CODE.SERVER_ERROR});
  });
};

/**
 * 提示服务端
 * @param req
 * @param res
 * @param next
 */
get.broadcast = function(req, res, next) {
  if (!checkIp(req, res, next)) {
    logger.warn(`opt broadcast: ip = ${req.ip}, forbidden`);
    res.send({code: app.consts.CODE.INVALID, ip: req.ip});
    next();
    return;
  }

  logger.info('opt broadcast: body is {0}'.format(JSON.stringify(req.body)));

  let route = req.body.route;
  let msg = {};
  let regint = new RegExp('[\+\-\d]*');
  let regfloat = new RegExp('[\+\-\.\d]*');

  for(let key in req.body) {
    if (key !== 'route') {
      if (regint.test(req.body[key])) {
        msg[key] = parseInt(req.body[key]);
      } else if(regfloat.test(req.body[key])) {
        msg[key] = parseFloat(req.body[key]);
      } else {
        msg[key] = req.body[key];
      }
    }
  }

  let rpcPush = function(callback) {
    app.rpc.game.userRemote.broadcast('*', route, msg, function(err, res){
      callback(err, res);
    });
  };

  co(function*() {
    let result = yield rpcPush;
    res.send(result);
    next();
  }).catch(function(err){
    logger.error(err.message + err.stack);
    res.send({code: app.consts.CODE.SERVER_ERROR});
    next();
  });
};

/**
 * 设置模块开关
 * @param req
 * @param res
 * @param next
 * @return {*}
 */
post.setSwitcher = function (req, res, next) {
  if (!checkIp(req, res, next)) {
    logger.warn(`opt setSwitcher: ip = ${req.ip}, forbidden`);
    res.send({code: app.consts.CODE.INVALID, ip: req.ip});
    next();
    return;
  }

  let moduleId = req.body.moduleId;
  let isOpen = parseInt(req.body.isOpen);

  logger.info(`opt setSwitcher: moduleId = ${moduleId}, isOpen = ${isOpen}`);

  co(function *() {
    let promise = new Promise(function (resolve, reject) {
      app.rpc.game.otherRemote.setSwitcher('*', moduleId, isOpen, function (err, res) {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });

    let result = yield promise;
    res.send(result);
    next();
  }).catch(function(err) {
    logger.error(err.message + err.stack);
    res.send({code: app.consts.CODE.SERVER_ERROR});
    next();
  })
};

/**
 * 获取模块开关
 * @param req
 * @param res
 * @param next
 * @return {*}
 */
get.getSwitcher = function (req, res, next) {
  if (!checkIp(req, res, next)) {
    logger.warn(`opt getSwitcher: ip = ${req.ip}, forbidden`);
    res.send({code: app.consts.CODE.INVALID, ip: req.ip});
    next();
    return;
  }

  let moduleId = req.body.moduleId;

  logger.info(`opt getSwitcher: moduleId = ${moduleId}`);

  co(function *() {
    let promise = function (resolve, reject) {
      app.rpc.game.otherRemote.getSwitcher('*', moduleId, function (err, res) {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    };

    let result = yield promise;
    res.send(result);
    next();
  }).catch(function (err) {
    logger.error(err.message + err.stack);
    res.send({code: app.consts.CODE.SERVER_ERROR});
    next();
  });
};

for (let i in post) {
  router.post('/' + i, post[i]);
}

for (let i in get){
  router.get('/' + i, get[i]);
}

module.exports = function (app, express) {
  return {
    path: '/opt',
    router: router
  };
};



