/**
 * Created by wyang on 16/11/1.
 */

'use strict';

let crc = require('crc');
let express = require('express');
let router = express.Router();
let co = require('co');

let pomelo = require('pomelo');
let app = pomelo.app;
let dataManager = require('../../../libs/manager/dataManager');

let logger = app.logger.getGameLog(__filename);

app.maintain = {};
app.maintain.isMaintain = [app.consts.ENVS.REMOTE_TEST, app.consts.ENVS.TOKYO, app.consts.ENVS.PRODUCTION].indexOf(app.get('env')) >= 0;   // 是否在维护
app.maintain.time = undefined;    // 维护截止时间

module.exports = function (app, express) {
  return {path: '/gate',
    router: router};
};

let logic = {};

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

let dispatch = function(servers, src) {
  src = src || '';
  let index = Math.abs(crc.crc32(src)) % servers.length;
  return servers[index];
};

/**
 * 进入游戏,返回

 {
  code: 0,
  data:{
    tcp:{host:'wss://127.0.0.1',port:3201,useSSL: false},
    maintain:{value:1, msg: '服务器正在维护中'}
  }
 }

 * @param req
 * @param res
 * @param next
 */
logic.entry = function(req, res, next){

  logger.info('gate.entry:' + JSON.stringify(req.body));

  let src = req.body.src;

  if(!src) {
    logger.info('gate entry: param_error');
    res.send({code: app.consts.CODE.PARAM_ERROR});
    next();
    return;
  }

  let connectors = app.getServersByType('connector');
  if(!connectors || connectors.length === 0) {
    logger.info('gate entry: connectors missing');
    res.send({code: app.consts.CODE.SERVER_CLOSE});
    next();
    return;
  }

  let httpConfigs = app.getServersByType('http');
  if (!httpConfigs || httpConfigs.length === 0) {
    logger.error('gate entry: https missing');
    res.send({code: app.consts.CODE.SERVER_ERROR});
    next();
    return;
  }

  let tcp = dispatch(connectors, src);
  logger.info('gate entry: tcp = ' + JSON.stringify(tcp));

  let http = dispatch(httpConfigs, src);
  logger.info('gate entry: http = ' + JSON.stringify(http));

  let data = {
    tcp:{
      host: tcp.clientHost,
      port: tcp.clientPort,
      useSSL: (tcp.useSSL === 'true')
    },
    http:{
      host: http.clientHost,
      port: http.httpPort,
      useSSL: (http.useSSL === 'true')
    },
    maintain: {
      value: 0,
    }
  };

  if (app.maintain.isMaintain) {
    // let whitelistIMEI = dataManager.getWhitelistIMEI();
    //
    // if (whitelistIMEI.indexOf(src) === -1) {
    //   data.maintain.value = 1;
    //   data.maintain.msg = '服务器正在维护中';
    // }
  }

  logger.info('gate entry: data = {0}'.format(JSON.stringify(data)));

  res.send({code: app.consts.CODE.SUCCESS, data: data});
  return next();
};


/**
 * 设定维护结束之间
 * @param req
 * @param res
 * @param next
 */
logic.setMaintain = function(req, res, next) {
  if (!checkIp(req, res, next)) {
    res.send({code: app.consts.CODE.INVALID, ip: req.ip});
    return next();
  }

  logger.info('gate setMaintain: body is {0}'.format(JSON.stringify(req.body)));

  app.maintain.time = new Date(req.body.time);
  app.maintain.isMaintain = Boolean(parseInt(req.body.isMaintain));

  logger.info('gate setMaintain:' + JSON.stringify(app.maintain));

  let rpcSetMaintain = function(callback) {
    app.rpc.game.otherRemote.setMaintain('*', app.maintain, function(err, res){
      callback(err, res);
    });
  };

  co(function *(){
    let result = null;
    if (app.rpc.game) {
      result = yield rpcSetMaintain;
    } else {
      result = {code: 200, msg: 'no slots process'};
    }

    res.send(result);
    return next();
  });
};

/**
 * 查询维护时间
 * @param req
 * @param res
 * @param next
 */
logic.getMaintain = function(req, res, next) {
  let mtime = app.maintain.time;

  let timeStr;

  if (mtime) {
    timeStr = mtime.toLocaleString();
  } else {
    timeStr = '';
  }

  res.send({time:timeStr, isMaintain: app.maintain.isMaintain});
  return next();
};


for (let i in logic) {
  router.get('/' + i, logic[i]);
}

