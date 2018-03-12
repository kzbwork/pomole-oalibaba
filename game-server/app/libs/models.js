/**
 * Created by wyang on 16/4/2.
 */

'use strict';

let co = require('co');

let strings = require('../../config/strings.json');

let dataManager = require('./manager/dataManager');
let app = require('pomelo').app;
let logger = app.logger.getGameLog(__filename);
let utils = require('./utils');
let consts = require('../consts/consts');

let models = {};

models.startIDs = {
  user: 100000,
  payment_order: 1,
  mail: 1,
  spinRecord: 1
};

/**
 * 获得表的自增id
 * @param name
 */
models.getNewId = function (name) {
  return co(function*() {
    let option = {
      upsert: true,
      setDefaultsOnInsert: true
    };

    let model = app.sync.getModel('id');
    let idDoc = yield model.findOneAndUpdate({name: name}, {$inc: {id: 1}}, option);
    if (!idDoc) {
      idDoc = yield model.findOneAndUpdate({name: name}, {$inc: {id: 1}}, option);
    }
    return idDoc.id + models.startIDs[name];
  });
};

/**
 * 获得新的 uid
 * uid 计算方法,
 * 1. 自增获得基础 uid
 * 2. 基础 uid 前增加一位表示服务器地址 1-悉尼 2-美国
 *
  100001 => 1100001 悉尼
  100001 => 2100001 美国
 */
models.getNewUid = function() {
  return co(function*() {
    let uid = yield models.getNewId('user');
    let env = app.get('env');
    let envPrefix = app.consts.ENV_UID_PREFIX[env];

    if (envPrefix === undefined) {
      logger.error('no envPrefix for env:' + env);
    }

    envPrefix = envPrefix || 0;

    return parseInt(envPrefix.toString() + uid);
  });
};

/**
 * 创建账号,注意,只创建,不保存
 * @param uid 传入 uid,没有就会生成一个
 * @return {*}
 */
models.realCreateUser = function (uid) {
  let User = app.sync.getModel('user');
  return co(function *() {
    let user = new User({
      uid: uid || (yield models.getNewUid())
    });

    return user;
  });
};

/**
 * 获得玩家数据
 */
models.getUser = function (uid) {
  let User = app.sync.getModel('user');

  return co(function*() {
    return yield User.findOne({uid: uid});
  }).catch(function (err) {
    logger.error(err.message + err.stack);
  });
};

/**
 * 检查登录参数,若没有则设置默认值
 * @param obj
 */
models.getLoginObj = function (obj) {
  let clientData = {};

  for(let i in clientData){
    if(clientData[i] === undefined){
      delete clientData[i];
    }
  }

  return clientData;
};

/**
 * 批量设置属性
 * @param doc
 * @param obj
 */
models.mergeObj = function (doc, obj) {
  for (let i in obj) {
    if (typeof(obj[i]) !== 'function') {
      doc[i] = obj[i];
    }
  }
};

models.storeSpinResult = function (uid, times, detail) {
  return co(function *() {
    let Game = app.sync.getModel('game');
    let newData = new Game({
      uid: uid,
      times: times,
      totalBet: detail.totalBet,
      totalNormalWin: detail.totalNormalWin,
      totalElementWin: detail.totalElementWin,
      totalEliminateWin: detail.totalEliminateWin,
      totalWin: detail.totalWin,
      spinType: detail.spinType,
      matrixInfo: detail.matrixInfo
    });

    yield newData.save();
  });
};

module.exports = models;