/**
 * 后台查询历史记录
 * author: jxyi
 * date: 2018-1-26
 */

'use strict';

let express = require('express');
let router = express.Router();

let co = require('co');

let pomelo = require('pomelo');
let app = pomelo.app;

let checkIp = function (req, res, next) {
  if ([app.consts.ENVS.DEVELOPMENT, app.consts.ENVS.LOCAL_TEST].indexOf(app.get('env')) >=0) {

  }


  next();
};

router.use(checkIp);

router.param('roundId', function (req, res, next, val) {
  console.log(`param roundId = ${val}`);
  if (isNaN(val) === true) {
    res.sendStatus(400);
    res.end();
  } else {
    next();
  }
});

router.get('/spin/:roundId', function (req, res, next) {
  console.log(`history: roundId = ${req.params.roundId}`);
  co(function *() {
    let roundId = parseInt(req.params.roundId);
    if (typeof roundId === 'number') {
      let spinInfo = yield new Promise(function (resolve, reject) {
        app.rpc.dataCenter.otherRemote.requestDetailSpinInfo('*', roundId, function (err, res) {
          if (err) {
            reject(err);
          } else {
            resolve(res);
          }
        });
      });

      let param = {};
      if (spinInfo) {
        param = {
          roundId: spinInfo.roundId,
          bet: spinInfo.bet,
          result: spinInfo.result
        };
        res.render('history', param);
      } else {
        res.render('historyNotFound');
      }
    } else {
      res.sendStatus(400);
    }
    next();
  }).catch(function (err) {
    res.sendStatus(500);
    res.end();
  });
});

router.get('/hello', function (req, res, next) {
  res.render('history');
  next();
});

module.exports = function (app, express) {
  return {
    path: '/history',
    router: router
  };
};
