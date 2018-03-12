/**
 *
 * author:
 * date:
 */

'use strict';

let xmlParser = require('xml2json');
let httpUtil = require('../httpUtil');
let querystring = require('querystring');
let co = require('co');
let https = require('https');
let consts = require('../../consts/consts');

let SingleWalletInterface = {};

module.exports = SingleWalletInterface;

let httpsRequest = function (url, port, route, msg) {
  let postData = querystring.stringify(msg);
  return new Promise((resolve, reject) => {
    const options = {
      host: url,
      port: port,
      path: route,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    };

    let req = https.request(options, (res) => {
      res.setEncoding('utf8');

      let rawData = '';
      res.on('data', (chunk) => {
        rawData += chunk;
      });
      res.on('end', () => {
        resolve(rawData);
      });
    }).on('error', function (e) {
      resolve(`<?xml version="1.0" encoding="UTF-8" ?>
        <RSP request="bet" rc="1000" msg="${e.message}">
        <APIVERSION>1.2</APIVERSION>
        </RSP>`);
    });

    req.write(postData);
    req.end();
  });
};

/**
 * 解析 xml，转换为 json 对象
 * @param xmlString
 * @returns {String|Object|json}
 */
let parseXml = function (xmlString) {
  return xmlParser.toJson(xmlString, {
    object: true,
    coerce: true
  });
};

/**
 * 解析错误信息
 * @param parsedObj
 * @returns {*}
 */
let parseErr = function (parsedObj) {
  return {
    request: parsedObj.RSP.request,
    responseCode: parsedObj.RSP.rc,
    msg: parsedObj.RSP.msg,
    apiVersion: parsedObj.RSP.APIVERSION
  };
};

/**
 * 请求钱包的账号信息
 * @param interfaceInfo   接口参数
 *                        {
 *                          host: string,         // 目标地址
 *                          port: int,            // 目标端口
 *                          loginName: string,    // 平台方登录名，30 字节
 *                          pwd: string,          // 密码，40 字节
 *                          gameProvider: string  // 游戏提供平台
 *                          apiversion: string    // api 版本
 *                        }
 * @param data  请求的参数
 *              {
 *                session: string,    // session， 36字节
 *                isMobile: bool      // 是否是手机
 *              }
 * @returns {*}
 */
SingleWalletInterface.getAccount = function (interfaceInfo, data) {
  return co(function *() {
    let respStr = yield httpsRequest(`${interfaceInfo.host}`
      , interfaceInfo.port
      , `/doBusinessHttps.${interfaceInfo.gameProvider}`
      , {
        request: 'getaccount',
        loginname: interfaceInfo.loginName,
        pwd: interfaceInfo.pwd,
        apiversion: interfaceInfo.apiVersion,
        session: data.session,
        mobile: data.isMobile ? 'y': 'n'
      });

    let parsedObj = parseXml(respStr);

    if (parsedObj.RSP.rc === consts.SINGLE_WALLET_CODE.OK) {
      return {
        request: parsedObj.RSP.request,         // 请求的接口
        responseCode: parsedObj.RSP.rc,         // 请求的返回码
        apiVersion: parsedObj.RSP.APIVERSION,   // 请求的 api 版本
        accountId: parsedObj.RSP.ACCOUNTID,     // 玩家平台方账号 id
        currency: parsedObj.RSP.CURRENCY,       // 货币缩写
        balance: parsedObj.RSP.BALANCE,         // 玩家持有的货币
        accountType: parsedObj.RSP.ACCOUNTTYPE  // 账号类型 Real/Test
      };
    } else {
      return parseErr(parsedObj);
    }
  });
};

/**
 * 请求玩家钱包金额
 * @param interfaceInfo   接口参数
 *                        {
 *                          host: string,         // 目标地址
 *                          port: int,            // 目标端口
 *                          loginName: string,    // 登录的用户名
 *                          pwd: string,          // 登录密码
 *                          gameProvider: string  // 游戏提供平台
 *                          apiversion: string    // api 版本
 *                        }
 * @param data          请求的参数
 *                      {
 *                        session: string,      // 客户端的 session
 *                        gameId: string,       // 玩法 id
 *                        isMobile: bool        // 是否是手机登录
 *                      }
 * @returns {*}
 */
SingleWalletInterface.getBalance = function (interfaceInfo, data) {
  return co(function *() {
    let respStr = yield httpsRequest(`${interfaceInfo.host}`
      , interfaceInfo.port
      , `/doBusinessHttps.${interfaceInfo.gameProvider}`
      , {
        request: 'getbalance',
        loginname: interfaceInfo.loginName,
        pwd: interfaceInfo.pwd,
        apiversion: interfaceInfo.apiVersion,
        session: data.session,
        accountid: data.accountId,
        gameid: data.gameId,
        mobile: data.isMobile ? 'y': 'n'
      });

    let parsedObj = parseXml(respStr);
    if (parsedObj.RSP.rc === consts.SINGLE_WALLET_CODE.OK) {
      return {
        request: parsedObj.RSP.request,         // 请求的接口
        responseCode: parsedObj.RSP.rc,         // 返回码
        apiVersion: parsedObj.RSP.APIVERSION,   // api 版本
        balance: parsedObj.RSP.BALANCE          // 玩家钱包的货币值
      }
    } else {
      return parseErr(parsedObj);
    }
  });
};

/**
 * 玩家下注
 * @param interfaceInfo   接口参数
 *                        {
 *                          host: string,         // 目标地址
 *                          port: int,            // 目标端口
 *                          loginName: string,    // 登录的平台方用户名
 *                          pwd: string,          // 登录密码
 *                          gameProvider: string  // 游戏提供平台
 *                          apiversion: string    // api 版本
 *                        }
 * @param data            请求的参数
 *                        {
 *                          session: string,        // 客户端的 session
 *                          accountId: string,      // 平台方用户 id
 *                          gameId: string,         // 玩法 id
 *                          amount: double,         // 下注总量
 *                          roundId: double,        // 本次 spin 的 id
 *                          transactionId: double,  // 本次数据变化的 id
 *                          isMobile: bool          // 是否是手机端
 *                        }
 * @returns {*}
 */
SingleWalletInterface.bet = function (interfaceInfo, data) {
  return co(function *() {
    let respStr = yield httpsRequest(`${interfaceInfo.host}`
      , interfaceInfo.port
      , `/doBusinessHttps.${interfaceInfo.gameProvider}`
      , {
        request: 'bet',
        loginname: interfaceInfo.loginName,
        pwd: interfaceInfo.pwd,
        apiversion: interfaceInfo.apiVersion,
        session: data.session,
        accountid: data.accountId,
        gameid: data.gameId,
        amount: data.amount,
        roundid: data.roundId,
        transactionid: data.transactionId,
        mobile: data.isMobile ? 'y': 'n',
        type: data.type,
        remarks: data.remarks
      });

    let parsedObj = parseXml(respStr);
    if (parsedObj.RSP.rc === consts.SINGLE_WALLET_CODE.OK) {
      return {
        request: parsedObj.RSP.request,
        responseCode: parsedObj.RSP.rc,
        apiVersion: parsedObj.RSP.APIVERSION,
        balance: parsedObj.RSP.BALANCE,
        accountTransactionId: parsedObj.RSP.ACCOUNTTRANSACTIONID
      };
    } else {
      return parseErr(parsedObj);
    }
  }).catch(function (err) {
		console.error(err.stack);
	});
};

/**
 * 发送玩家中奖结果，给玩家返还中奖的奖金
 * @param interfaceInfo   接口参数
 *                        {
 *                          host: string,         // 目标地址
 *                          port: int,            // 目标端口
 *                          loginName: string,    // 登录的平台方用户名
 *                          pwd: string,          // 登录密码
 *                          gameProvider: string  // 游戏提供平台
 *                          apiversion: string    // api 版本
 *                        }
 * @param data            请求的参数
 *                        {
 *                          session: string,        // 客户端的 session
 *                          accountId: string,      // 平台方用户 id
 *                          gameId: string,         // 玩法 id
 *                          roundId: string,        // 本次 spin 的 id
 *                          transactionId: double,  // 本次数据变化的 id
 *                          isMobile: bool,         // 是否是手机端
 *                          result: string          // 游戏结果
 *                        }
 * @returns {*}
 */
SingleWalletInterface.result = function (interfaceInfo, data) {
  return co(function *() {
    let respStr = yield httpsRequest(`${interfaceInfo.host}`
      , interfaceInfo.port
      , `/doBusinessHttps.${interfaceInfo.gameProvider}`
      , {
        request: 'result',
        loginname: interfaceInfo.loginName,
        pwd: interfaceInfo.pwd,
        apiversion: interfaceInfo.apiVersion,
        session: data.session,
        accountid: data.accountId,
        gameid: data.gameId,
        roundid: data.roundId,
        transactionid: data.transactionId,
        mobile: data.isMobile ? 'y': 'n',
        result: data.result,
        amount: data.amount,
				type: data.type,
				remarks: data.remarks
      });

    let parsedObj = parseXml(respStr);
    if (parsedObj.RSP.rc === consts.SINGLE_WALLET_CODE.OK) {
      return {
        request: parsedObj.RSP.request,
        responseCode: parsedObj.RSP.rc,
        apiVersion: parsedObj.RSP.APIVERSION,
        balance: parsedObj.RSP.BALANCE,
        accountTransactionId: parsedObj.RSP.ACCOUNTTRANSACTIONID
      };
    } else {
      return parseErr(parsedObj);
    }
  });
};

/**
 * 退款，返还玩家下注的钱
 * @param interfaceInfo   接口参数
 *                        {
 *                          host: string,         // 目标地址
 *                          port: int,            // 目标端口
 *                          loginName: string,    // 玩家平台方登录名
 *                          pwd: string,          // 登录密码
 *                          gameProvider: string  // 游戏提供平台
 *                          apiversion: string    // api 版本
 *                        }
 * @param data            请求的数据
 *                        {
 *                          session: string,        // 客户端 session
 *                          accountId: string,      // 玩家平台方 id
 *                          gameId: string,         // 玩法 id
 *                          amount: double,         // 退款总额
 *                          roundId: double,        // 本次 spin 的 id
 *                          transactionId: double,  // 需要退款的下注变化 id
 *                          isMobile: bool          // 是否是手机端
 *                        }
 * @returns {*}
 * @constructor
 */
SingleWalletInterface.refund = function (interfaceInfo, data) {
  return co(function *() {
    let respStr = yield httpsRequest(`${interfaceInfo.host}`
      , interfaceInfo.port
      , `/doBusinessHttps.${interfaceInfo.gameProvider}`
      , {
        request: 'refund',
        loginname: interfaceInfo.loginName,
        pwd: interfaceInfo.pwd,
        apiversion: interfaceInfo.apiVersion,
        session: data.session,
        accountid: data.accountId,
        gameid: data.gameId,
        amount: data.amount,
        roundid: data.roundId,
        transactionid: data.transactionId,
        mobile: data.isMobile ? 'y': 'n',
      });

    let parsedObj = parseXml(respStr);
    if (parsedObj.RSP.rc === consts.SINGLE_WALLET_CODE.OK) {
      return {
        request: parsedObj.RSP.request,
        responseCode: parsedObj.RSP.rc,
        apiVersion: parsedObj.RSP.APIVERSION,
        balance: parsedObj.RSP.BALANCE,
        accountTransactionId: parsedObj.RSP.ACCOUNTTRANSACTIONID
      };
    } else {
      return parseErr(parsedObj);
    }
  });
};

/**
 * 测试连接是否通畅
 * @param interfaceInfo   接口参数
 *                        {
 *                          host: string,         // 目标地址
 *                          port: int,            // 目标端口
 *                          oginName: string,     // 平台方的玩家登录名
 *                          pwd: string           // 玩家登录密码
 *                          gameProvider: string  // 游戏提供平台
 *                          apiversion: string    // api 版本
 *                        }
 * @param data            请求的数据
 *                        {
 *                        }
 * @returns {*}
 */
SingleWalletInterface.ping = function (interfaceInfo, data) {
  return co(function *() {
    let respStr = yield httpsRequest(`${interfaceInfo.host}`
      , interfaceInfo.port
      , `/doBusinessHttps.${interfaceInfo.gameProvider}`
      , {
        gameprovider: interfaceInfo.gameProvider,
        request: 'ping',
        loginname: interfaceInfo.loginName,
        pwd: interfaceInfo.pwd,
        apiversion: interfaceInfo.apiVersion
      });

    console.log(`respStr = ${respStr}`);
    let parsedObj = parseXml(respStr);
    if (parsedObj.RSP.rc === consts.SINGLE_WALLET_CODE.OK) {
      return {
        request: parsedObj.RSP.request,
        responseCode: parsedObj.RSP.rc,
        apiVersion: parsedObj.RSP.APIVERSION,
      };
    } else {
      return parseErr(parsedObj);
    }
  });
};






