/**
 * 测试模块，用于测试数值
 * author: jxyi
 * date: 2018-1-8
 */

'use strict';

let fs = require('fs');

let co = require('co');
let app = require('pomelo').app;
let thunkify = require('thunkify');

let express = require('express');
let router = express.Router();
let httpUtil = require('../../../libs/httpUtil');

let logger = app.logger.getGameLog(__filename);
let slotsConsts = require('../../../service/slot/slotConsts');

let singleWalletInterface = require('../../../libs/singleWallat/singleWalletInterface');

const robotId = 'spinTester1';
// const baseDir = '/Users/jxyi/workspace/spinData';
const baseDir = '/home/game/spinData';

const MAX_TIMES = 100000000;
const FLOW_NUM = 10000;

let post = {};
let get = {};

let parseMatrix = function (totalMatrixInfo, matrixResult) {
  for (let i = 0; i < matrixResult.length; ++i) {
    let columnInfo = matrixResult[i].noname;
    for (let elem of columnInfo) {
      totalMatrixInfo[i][elem] = totalMatrixInfo[i][elem] || 0;
      ++totalMatrixInfo[i][elem];
    }
  }
};

/**
 * 合并中奖元素详情数据
 * @param totalRewardDetails
 * @param rewardDetails
 */
let mergeRewardDetail = function (totalRewardDetails, rewardDetails) {
  for (let key in rewardDetails) {
    if (totalRewardDetails[key] === undefined) {
      totalRewardDetails[key] = 0;
    }
    totalRewardDetails[key] += rewardDetails[key];
  }
};

/**
 * 在线模式玩阿里巴巴玩法，spin 结束后返回结果。需要注意超时
 * @param req
 * @param res
 * @param next
 */
post.alibabaSpinOnline = function (req, res, next) {
  if ([app.consts.ENVS.DEVELOPMENT, app.consts.ENVS.LOCAL_TEST].indexOf(app.get('env')) < 0) {
    res.send({code: app.consts.CODE.INVALID});
    next();
    return;
  }

  co(function *() {
    let times = req.body.times;
    logger.debug(`game alibabaSpinOnline: times = ${times}`);

    let result = yield alibabaAutoSpin(times);

    res.send(result);
    next();
  }).catch(function (err) {
    logger.error(err.stack);
    res.send({code: app.consts.CODE.SERVER_ERROR});
    next();
  });
};

/**
 * 离线模式玩阿里巴巴玩法，结果会保存到文件中
 * @param req
 * @param res
 * @param next
 */
post.alibabaSpinOffline = function (req, res, next) {
  if ([app.consts.ENVS.DEVELOPMENT, app.consts.ENVS.LOCAL_TEST].indexOf(app.get('env')) < 0) {
    res.send({code: app.consts.CODE.INVALID});
    next();
    return;
  }

  co(function *() {
    let times = req.body.times;
    let loops = req.body.loops;
    logger.debug(`game alibabaSpinOffline: times = ${times}`);
    res.send({code: app.consts.CODE.SUCCESS});
    next();

    let startTime = new Date();
    for (let i = 0; i < loops; ++i) {
      let result = yield alibabaAutoSpin(times);
      yield saveSpinData(result, 'alibaba');
    }
    let endTime = new Date();
    yield httpUtil.httpsRequest("hook.bearychat.com", "/=bwCkZ/incoming/ZOaeofzN7Y57mcF22HMy8eqUAu025A3t6IP-nQXkBOs=", {
      text: `数据已生成，开始时间 ${startTime.toString()}, 结束时间 ${endTime.toString()}，每轮 ${times} 次，总共${loops}轮，么么哒！`
    });
  }).catch(function (err) {
    logger.error(err.stack);
    res.send({code: app.consts.CODE.SERVER_ERROR});
    next();
  });
};

/**
 * 阿里巴巴自动 spin 指定次数
 * @param times
 * @returns {*}
 */
let alibabaAutoSpin = function (times) {
  return co(function *() {
    let totalInfo = {
      totalBet: 0,
      normalWin: 0,
      eliminateFreeWin: 0,
      totalWin: 0,

      miniTimes: 0,
      miniWin: 0,

      normalTimes: 0,             // 普通 spin 次数
      normalWinTimes: 0,          // 普通 spin 中奖次数

      eliminateFreeTimes: 0,      // 消除 freespin 次数
      eliminateFreeWinTimes: 0,   // 消除 freespin 中奖次数

      eliminate2: 0,              // 普通 spin 中消除 2 次的次数
      eliminate2Win: 0,           // 普通 spin 中消除第二次的返还
      eliminate3: 0,              // 普通 spin 中消除 3 次的次数
      eliminate3Win: 0,           // 普通 spin 中消除第三次的返还
      eliminate4: 0,              // 普通 spin 中消除 4 次的次数
      eliminate4Win: 0,           // 普通 spin 中消除第四次的返还
      eliminate5: 0,              // 普通 spin 中消除 5 次的次数
      eliminate5Win: 0,           // 普通 spin 中消除第五次的返还
      eliminate6: 0,              // 普通 spin 中消除 6 次及以上的次数
      eliminate6Win: 0,           // 普通 spin 中消除第六次及以上的返还

      winDetails: {               // 所有中奖情况的详情，key 的格式为 "elemId-num"
        normal: {},
        eliminate: {}
      },

      normalSpinMatrixInfo: [{}, {}, {}, {}, {}],
      eliminateFreeMatrixInfo: [{}, {}, {}, {}, {}]
    };

    let loginResult = yield new Promise(function (resolve, reject) {
      app.rpc.game.entryRemote.login('*', null, app.consts.LOGIN_TYPE.NORMAL, {accId: Date.now()}, function (err, res) {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });

    yield new Promise(function (resolve, reject) {
      app.rpc.game.userRemote.addCredit('*', loginResult.data.uid, 27 * times, function (err, res) {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });

    yield new Promise(function (resolve, reject) {
      app.rpc.game.hallRemote.entryAlibaba('*', loginResult.data.uid, function (err, res) {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });

    let respData = [];
    let step = Math.floor(times / FLOW_NUM);
    step = Math.max(1, step);
    for (let i = 0, round = times; i < round; ++i) {
      if (i > MAX_TIMES) {
        throw new Error('game alibabaAutoSpin: reach the MAX_TIMES');
      }
      let result = yield new Promise(function (resolve, reject) {
        app.rpc.game.alibabaRemote.spin('*', loginResult.data.uid, 1, 1, function (err, res) {
          if (err) {
            reject(err);
          } else {
            resolve(res);
          }
        });
      });

      if (result.code === app.consts.CODE.SUCCESS) {
        if (result.data.mini.miniGame === 1) {
          for (let i = 0; i < 12; ++i) {
            let bonusResult = yield new Promise(function (resolve, reject) {
              app.rpc.game.alibabaRemote.selectMini('*', loginResult.data.uid, i, function (err, res) {
                if (err) {
                  reject(err);
                } else {
                  resolve(res);
                }
              })
            });
            if (bonusResult.code === app.consts.CODE.SUCCESS && bonusResult.data.isFinished === 1) {
              ++totalInfo.miniTimes;
              totalInfo.miniWin += bonusResult.data.win * bonusResult.data.multiple;
              totalInfo.totalWin += bonusResult.data.win * bonusResult.data.multiple;
              break;
            }
          }
        }

        totalInfo.totalBet += result.data.cost;
        totalInfo.normalWin += (result.data.spinType === slotsConsts.SPIN_TYPE.NORMAL
          ? result.data.win.sum() : 0);
        totalInfo.eliminateFreeWin += (result.data.spinType === slotsConsts.SPIN_TYPE.ELIMINATE
          ? result.data.win.sum() : 0);
        totalInfo.totalWin += result.data.win.sum();

        switch (result.data.spinType) {
          case slotsConsts.SPIN_TYPE.NORMAL:
            parseMatrix(totalInfo.normalSpinMatrixInfo, result.data.elements);
            mergeRewardDetail(totalInfo.winDetails.normal, result.extraData.rewardDetails);

            ++totalInfo.normalTimes;
            if (result.data.lines.length > 0) {
              ++totalInfo.normalWinTimes;
            }

            let linesLength = result.data.lines.length;
            if (linesLength >= 6) {
              ++totalInfo.eliminate6;
              for (let i = 5; i < result.data.win.length; ++i) {
                totalInfo.eliminate6Win += result.data.win[i];
              }
            } else {
              switch (linesLength) {
                case 2:
                  ++totalInfo.eliminate2;
                  totalInfo.eliminate2Win += result.data.win[1];
                  break;
                case 3:
                  ++totalInfo.eliminate3;
                  totalInfo.eliminate3Win += result.data.win[2];
                  break;
                case 4:
                  ++totalInfo.eliminate4;
                  totalInfo.eliminate4Win += result.data.win[3];
                  break;
                case 5:
                  ++totalInfo.eliminate5;
                  totalInfo.eliminate5Win += result.data.win[4];
                  break;
                default:
                  break;
              }
            }
            break;
          case slotsConsts.SPIN_TYPE.ELIMINATE:
            ++round;
            parseMatrix(totalInfo.eliminateFreeMatrixInfo, result.data.elements);
            mergeRewardDetail(totalInfo.winDetails.eliminate, result.extraData.rewardDetails);

            ++totalInfo.eliminateFreeTimes;
            if (result.data.lines.length > 0) {
              ++totalInfo.eliminateFreeWinTimes;
            }
            break;
          default:
            logger.warn(`game alibabaAutoSpin: spinType = ${result.data.spinType}, type wrong`);
            break;
        }

        if (i % step === 0) {
          let data = {
            times: i,
            totalBet: totalInfo.totalBet,
            normalWin: totalInfo.normalWin,
            eliminateFreeWin: totalInfo.eliminateFreeWin,
            bonusWin: totalInfo.miniWin,
            totalWin: totalInfo.totalWin,
            normalWinRatio: (totalInfo.totalBet > 0 ? totalInfo.normalWin / totalInfo.totalBet : 0),
            eliminateWinRatio: (totalInfo.totalBet > 0 ? totalInfo.eliminateFreeWin / totalInfo.totalBet : 0),
            bonusWinRatio: (totalInfo.totalBet > 0 ? totalInfo.miniWin / totalInfo.totalBet : 0),
            totalRatio: (totalInfo.totalBet > 0 ? totalInfo.totalWin / totalInfo.totalBet : 0)
          };
          respData.push(data);
        }
      } else {
        logger.warn(`game alibabaAutoSpin: result = ${JSON.stringify(result)}`);
        break;
      }
    }

    return {
      totalInfo: totalInfo,
      flowInfo: respData
    };
  });
};

/**
 * 保存 spin 的数据
 * @param data
 * @param themeName
 * @returns {*}
 */
let saveSpinData = function (data, themeName) {
  return co(function *() {
    if ([app.consts.ENVS.DEVELOPMENT, app.consts.ENVS.LOCAL_TEST].indexOf(app.get('env')) < 0) {
      logger.warn(`game saveSpinData: env = ${app.get('env')}, env error`);
      return false;
    }

    let date = new Date();
    let dataDir = `${baseDir}/${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

    let isDataDirExist = yield function (callback) {
      fs.access(dataDir, function (err) {
        callback(null, !err);
      });
    };
    if (isDataDirExist === false) {
      yield thunkify(fs.mkdir)(dataDir);
    }

    fs.writeFile(`${dataDir}/${themeName}-${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}.json`
      , JSON.stringify(data)
      , function (err) {
        if (err) {
          logger.error(err.stack);
        }
      }
    );
  });
};

/**
 * 获取按日期分组的数据所在文件夹列表
 * @param req
 * @param res
 * @param next
 */
post.fetchDataDir = function (req, res, next) {
  co(function *() {
    if ([app.consts.ENVS.DEVELOPMENT, app.consts.ENVS.LOCAL_TEST].indexOf(app.get('env')) < 0) {
      res.send({code: app.consts.CODE.INVALID});
      next();
      return;
    }

    let isBaseDirExist = yield function (callback) {
      fs.access(baseDir, function (err) {
        callback(null, !err);
      });
    };
    if (isBaseDirExist === false) {
      yield function (callback) {
        fs.mkdir(baseDir, function (err) {
          callback(null, !err);
        });
      }
    }

    let result = [];
    let files = yield thunkify(fs.readdir)(baseDir);
    for (let val of files) {
      let fPath = `${baseDir}/${val}`;
      let stats = yield thunkify(fs.stat)(fPath);
      if (stats.isDirectory()) {
        result.push(val);
      }
    }

    res.send({
      code: app.consts.CODE.SUCCESS,
      data: result
    });
    next();
  }).catch(function(err) {
    logger.error(err.stack);
    res.send({code: app.consts.CODE.SERVER_ERROR});
    next();
  });
};

/**
 * 获取指定文件夹下的 spin 数据
 * @param req
 * @param res
 * @param next
 */
post.fetchDataList = function (req, res, next) {
  co(function* () {
    if ([app.consts.ENVS.DEVELOPMENT, app.consts.ENVS.LOCAL_TEST].indexOf(app.get('env')) < 0) {
      res.send({code: app.consts.CODE.INVALID});
      next();
      return;
    }

    let dateStr = req.body.dateStr;
    if (dateStr === undefined) {
      logger.warn(`game fetchDataList: dateStr is missing`);
      res.send({code: app.consts.CODE.PARAM_ERROR});
      next();
      return;
    }

    dateStr = dateStr.replace(/\//g, '');
    let dataDir = `${baseDir}/${dateStr}`;
    let isFileExist = yield function (callback) {
      fs.access(dataDir, function (err) {
        callback(null, !err);
      });
    };
    if (false === isFileExist) {
      res.send({code: app.consts.CODE.PARAM_ERROR});
      next();
      return;
    }

    let result = [];
    let files = yield thunkify(fs.readdir)(dataDir);
    for (let val of files) {
      let fPath = `${dataDir}/${val}`;
      let stats = yield thunkify(fs.stat)(fPath);
      if (stats.isFile() && (/.json$/.test(val)) === true) {
        result.push(val);
      }
    }

    res.send({
      code: app.consts.CODE.SUCCESS,
      data: result
    });
    next();
  }).catch(function (err) {
    logger.error(err.stack);
    res.send({code: app.consts.CODE.SERVER_ERROR});
    next();
  });
};

/**
 * 获取指定文件的数据内容
 * @param req
 * @param res
 * @param next
 */
post.downloadHistoryData = function (req, res, next) {
  co(function *() {
    if ([app.consts.ENVS.DEVELOPMENT, app.consts.ENVS.LOCAL_TEST].indexOf(app.get('env')) < 0) {
      res.send({code: app.consts.CODE.INVALID});
      next();
      return;
    }

    let dateStr = req.body.dateStr;
    if (dateStr === undefined) {
      logger.warn(`game downHistoryData: dateStr is missing`);
      res.send({code: app.consts.CODE.PARAM_ERROR});
      next();
      return;
    }

    let fileStr = req.body.fileStr;
    if (fileStr === undefined) {
      logger.warn(`game downHistoryData: fileStr is missing`);
      res.send({code: app.consts.CODE.PARAM_ERROR});
      next();
      return;
    }

    let filePath = `${baseDir}/${dateStr}/${fileStr}`;
    let isFileExist = yield function (callback) {
      fs.access(filePath, function (err) {
        callback(null, !err);
      });
    };
    if (isFileExist === false) {
      logger.warn(`game downHistoryData: file not exists`);
      res.send({code: app.consts.CODE.PARAM_ERROR});
      next();
      return;
    }

    let content = yield thunkify(fs.readFile)(filePath);
    res.send(content);
    next();
  }).catch(function (err) {
    logger.error(err.stack);
    res.send({});
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
  return {path: '/game', router: router};
};




