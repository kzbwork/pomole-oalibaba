/**
 * author: jxyi
 * date: 2017-12-26
 */

'use strict';

let co = require('co');

let app = require('pomelo').app;
let logger = app.logger.getGameLog(__filename);

module.exports = function (app) {
  return new Handler(app);
};

let Handler = function (app) {
  this.app = app;
};

let onUserLeave = function (app, session) {

  logger.info('entryHandler onUserLeave: uid is {0}'.format(session.uid));
  if ((!session || !session.uid)) {
    return;
  }

  let rpcFunc = function(callback){
    app.rpc.dataCenter.userRemote.remove(session, session.uid, function (err, res) {
      callback(err, res);
    });
  };

  co(function*(){
    yield rpcFunc;
    session.unbind();
  }).catch(function(err){
    logger.error(err.message + err.stack);
  });
};

/**
 * 请求登录，用于将所有登录方式进行统一处理
 * @param handler
 * @param session
 * @param loginType
 * @param entryObj
 * @param next
 */
let login = function (handler, session, loginType, entryObj, next) {
  session.on('closed', onUserLeave.bind(null, handler.app));

  let address = app.sessionService.getClientAddressBySessionId(session.id);
  if (address && address.ip) {
    entryObj.ip = address.ip;
  }

  co(function*() {

    // 必须先检查是否有相同玩家在线，并将同账号踢下线。之后才能绑定 uid 到 session，
    // 否则会将新登录的玩家一同踢下线。

    logger.debug(`entryHandler login: session.uid = ${session.uid}`);

    if (session.uid !== null) {
      next(null, {code: app.consts.CODE.ACC_ACCOUNT_LOGINED});
      return undefined;
    }

    let sid = app.getServerId();
    let rpcEntry = function(callback) {
      handler.app.rpc.dataCenter.userRemote.requestLogin(session, sid, loginType, entryObj, function (err, res) {
        callback(err, res);
      });
    }.bind(handler);

    let entryRes = yield rpcEntry;

    if (entryRes.code === app.consts.CODE.SUCCESS) {
      let uid = entryRes.data.uid;
      session.bind(uid);
    }

    next(null, entryRes);
  }.bind(handler)).catch(function (err) {
    logger.error(err.message + err.stack);
    next(null,{code: app.consts.CODE.SERVER_ERROR});
  });
};

let pro = Handler.prototype;

/**
 * 普通登录方式，用户信息对接方案确定之前使用
 * @param msg
 * @param session
 * @param next
 */
pro.normalLogin = function (msg, session, next) {
  console.log(`normalLogin msg = ${JSON.stringify(msg)}`);
  let entryObj = {
    accId: msg.name,
    session: msg.token,
    gameId: msg.gameId,
    userFlag: parseInt(msg.userFlag),
		isMobile: msg.isMobile,
    isReconnect: msg.isReconnect,
    isDebug: msg.isDebug === 1
  };
  login(this, session, app.consts.LOGIN_TYPE.NORMAL, entryObj, next);
};



