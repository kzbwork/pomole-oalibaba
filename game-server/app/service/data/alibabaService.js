/**
 * 阿里巴巴与四十大盗算法类
 * Author: jxyi
 * Date: 2017-12-26
 */

'use strict';

let co = require('co');
let util = require('util');

let DataService = require('../dataService');

let app = require('pomelo').app;
let logger = app.logger.getGameLog(__filename);
let walletLogger = app.logger.getWalletLog();
let slotConsts = require('../slot/slotConsts');
let baseUtil = require('../../libs/slot/baseUtil');
let alibabaUtil = require('../../libs/slot/alibabaUtil');

let AlibabaTheme = require('../../game/alibabaTheme');

let AlibabaService = function () {
  if (app.sync) {
    this.constructor.super_.call(this, app.sync, 'alibabaTheme', AlibabaTheme);
  }

  this.baseConfig = alibabaUtil.buildConfig();
};

util.inherits(AlibabaService, DataService);

module.exports = AlibabaService;

let pro = AlibabaService.prototype;

pro.reloadConfig = function () {
  this.baseConfig = alibabaUtil.buildConfig();
};

/**
 * 读取内存中的值
 * @param uid
 * @returns {void|string|*}
 */
pro.getTheme = function (uid) {
  return this.getData({uid: uid});
};

/**
 * 加载数据库中的值，优先读内存
 * @param uid
 * @returns {*}
 */
pro.loadTheme = function (uid) {
  let self = this;
  return co(function *() {
    let themeData = yield self.loadData({uid: uid});
    if (themeData) {
      self.checkThemeProp(themeData);
    }
    return themeData;
  });
};

pro.checkThemeProp = function (themeData) {
  if (themeData.elementExtraFreeTimes === undefined) {
    themeData.elementExtraFreeTimes = 0;
  }
};

/**
 * 进入玩法
 * @param user
 * @return {*}
 */
pro.entry = function (user) {
  let self = this;
  return co(function *() {
    if (user === undefined) {
      return undefined;
    }

    let freespinConfig = [];
    for (let key in self.baseConfig.freespin) {
      freespinConfig.push({times: parseInt(key), free: self.baseConfig.freespin[key]});
    }

    let themeData = yield self.loadTheme(user.uid);

    if (!themeData) {
      themeData = self.newData({
        uid: user.uid,
        coinValue: self.baseConfig.coinValue[0],
        multiplier: self.baseConfig.multiplier[0],

        removeFreeTimes: 0,
        removeFreeWin: 0,

        miniGame: false,
        miniConfig: [],
        miniLife: 0,
        miniWin: 0,
        miniMultiple: 1,
        miniHistory: []
      });
    }
    themeData.type = user.type;

    let result = {
      eliminateConfig: freespinConfig,
      lastCoinValue: self.baseConfig.coinValue.indexOf(themeData.coinValue) >= 0 ? themeData.coinValue
        : self.baseConfig.coinValue[0],
      lastMultiplier: self.baseConfig.multiplier.indexOf(themeData.multiplier) >= 0 ? themeData.multiplier
        : self.baseConfig.multiplier[0],
      coinValue: self.baseConfig.coinValue,
      multiplier: self.baseConfig.multiplier,
      removeFreeTimes: themeData.removeFreeTimes,
      removeFreeWin: themeData.removeFreeWin,

      miniGame: themeData.miniGame ? 1 : 0,
      miniHistory: themeData.miniHistory,
      miniSelectedData: alibabaUtil.parseMiniHistory(themeData.miniConfig, themeData.miniHistory.length, self.baseConfig),
      miniLife: themeData.miniLife,
      miniWin: themeData.miniWin,
      miniMultiple: themeData.miniMultiple,

      reconnectData: (user.reconnectTheme === app.consts.THEME_NAME.ALIBABA ? user.reconnectData : {})
    };

    app.userService.change(user, {
      reconnectTheme: app.consts.THEME_NAME.NONE,
      reconnectData: {}
    });

    return result;
  });
};

/**
 * 一次 spin 计算结果
 * @param user
 * @param coinValue
 * @param multiplier
 * @param roundId
 */
pro.spin = function (user, coinValue, multiplier, roundId) {
  let self = this;

  return co(function *() {
    let themeData = self.getTheme(user.uid);
    if (themeData === undefined) {
      logger.warn(`alibabaService spin: uid = ${user.uid}, need entry first`);
      return {
        code: app.consts.CODE.NEED_ENTRY_BEFORE
      };
    }

    if (themeData.miniGame === true) {
      logger.warn(`alibabaService spin: uid = ${user.uid}, has mini game unfinished`);
      return {
        code: app.consts.CODE.ALIBABA_MINI_NOT_FINISH
      }
    }

    if (coinValue <= 0) {
      logger.warn(`alibabaService spin: uid = ${user.uid}, coinValue = ${coinValue}, coinValue invalid`);
      return {
        code: app.consts.CODE.PARAM_ERROR
      };
    }

    if (multiplier <= 0) {
      logger.warn(`alibabaService spin: uid = ${user.uid}, multiplier = ${multiplier}, multiplier invalid`);
      return {
        code: app.consts.CODE.PARAM_ERROR
      };
    }

    let bet = multiplier * coinValue;
    let cost = self.baseConfig.line.length * bet;

    if (themeData.removeFreeTimes > 0) {
      bet = themeData.multiplier * themeData.coinValue;
      cost = 0;
    }

    if (user.credit < cost) {
      logger.warn(`alibabaService spin: uid = ${user.uid}, cost = ${cost}, user.credit = ${user.credit}, lack credit`);
      return {
        code: app.consts.CODE.LACK_CREDIT
      };
    }

    let extraData = {
      extraFreeTime: 0,
      rewardDetails: undefined
    };

    let result = {
      elements: [],                       // 元素布局
      lines: [],                          // 中奖的中奖线
      rsize: slotConsts.WIN_SIZE.NORMAL,  // 中奖类型，是否是大奖，用于客户端显示动画
      win: [],                            // 赢钱数
      cost: 0,                            // 消耗
      spinType: slotConsts.SPIN_TYPE.NORMAL,  // spin 的类型
      free: {
        removeFreeTimes: 0,                 // 剩余消除 free 次数
        removeFreeWin: 0,                   // 剩余消除 freespin 总赢钱数
        removeExtraFreeTimes: 0             // 新增的消除 freespin 次数
      },
      mini: {
        miniGame: 0,
        life: 0
      }
    };

    result.elements = alibabaUtil.buildElemMatrix();

    let fillResult = undefined;
    let spinType = slotConsts.SPIN_TYPE.NORMAL;
    let bonusNum = 0;
    let walletType = themeData.removeFreeTimes > 0 ? 'freerounds' : undefined;
    let walletRemarks = themeData.removeFreeTimes > 0 ? 'remarks' : undefined;
    if (themeData.removeFreeTimes > 0) {
      // 连消奖励的 spin
      fillResult = yield alibabaUtil.fillMatrixForElinimateFree(result.elements, self.baseConfig);
      spinType = slotConsts.SPIN_TYPE.ELIMINATE;
    } else {
      // 普通 spin
      fillResult = yield alibabaUtil.fillMatrixForNone(result.elements, self.baseConfig);
      result.cost = self.baseConfig.line.length * bet;
      self.change(themeData, {
        removeFreeTimes: 0,
        removeFreeWin: 0
      });
      spinType = slotConsts.SPIN_TYPE.NORMAL;

      bonusNum = baseUtil.calcElemNum(fillResult.eliminatedMatrix, app.consts.ELEMENT_NAME.BONUS, self.baseConfig);
      if (bonusNum >= self.baseConfig.base.bonuscount) {
        result.mini.miniGame = 1;
        result.mini.life = self.baseConfig.base.bonuslife;
      }
    }
    let totalEliminateTime = fillResult.totalEliminateTime;
    result.lines = fillResult.lines;
    fillResult.totalWin.forEach(function (win, index) {
      result.win.push(win * bet);
    });

    // 计算消除 freespin 的奖励，只在普通 spin 中出现连消奖励
    if (spinType === slotConsts.SPIN_TYPE.NORMAL) {
      result.free.removeExtraFreeTimes = alibabaUtil.calcEliminateFree(totalEliminateTime, self.baseConfig);
    }

    let newCredit = null;
    if (app.walletService.isOpenForUser(user)) {
      let betInfo = yield app.walletService.bet(user, 'SW01', result.cost, roundId, roundId, walletType, walletRemarks);

      if (betInfo.responseCode !== app.consts.SINGLE_WALLET_CODE.OK) {
        return {
          code: betInfo.responseCode
        }
      }
      newCredit = betInfo.balance;
    }

    if (result.cost > 0) {
      app.userService.change(user, {
        credit: newCredit === null ? user.credit - result.cost : newCredit
      }, app.consts.REASON.ALIBABA_COST);
    }

    let totalWin = 0;
    for (let win of result.win) {
      totalWin += win;
    }

    newCredit = null;
    if (app.walletService.isOpenForUser(user)) {
      let rewardInfo = yield app.walletService.result(user, 'SW01', totalWin, roundId, roundId * 10 + 1, '', walletType, walletRemarks);

      if (rewardInfo.responseCode !== app.consts.SINGLE_WALLET_CODE.OK) {
        if (walletType) {
          return {
            code: refundInfo.responseCode
          }
        }

        let refundInfo = yield app.walletService.refund(user, 'SW01', result.cost, roundId, roundId);

        if (refundInfo.responseCode !== app.consts.SINGLE_WALLET_CODE.OK) {
          logger.warn(`wallet refund fail, uid:${user.uid},amount:${result.cost},roundId;${roundId},transId:${roundId * 10 + 2}`);
          walletLogger.error(`uid:${user.uid},bet success but result and refund faild,amount:${result.cost},roundId;${roundId},transId:${roundId * 10 + 2}`);
          return {
            code: refundInfo.responseCode
          }
        }

        return {
          code: rewardInfo.responseCode
        }
      }
      newCredit = rewardInfo.balance;
    }

    if (result.win.length > 0) {
      app.userService.change(user, {
        credit: newCredit === null ? user.credit + totalWin : newCredit
      }, app.consts.REASON.ALIBABA_WIN);
    }
    result.rsize = alibabaUtil.calcRewardSize(totalWin, bet * self.baseConfig.line.length, self.baseConfig);

    result.free.removeFreeTimes = themeData.removeFreeTimes;
    result.free.removeFreeWin = themeData.removeFreeWin;

    result.spinType = spinType;

    self.change(themeData, {
      roundId: roundId,
      coinValue: coinValue,
      multiplier: multiplier,
      removeFreeTimes: themeData.removeFreeTimes + result.free.removeExtraFreeTimes
    });

    if (bonusNum >= self.baseConfig.base.bonuscount) {
      let mini = yield alibabaUtil.calcMiniGame(self.baseConfig);
      self.change(themeData, {
        miniGame: true,
        miniConfig: mini,
        miniLife: result.mini.life,
        miniWin: 0,
        miniHistory: []
      });
    }

    if (themeData.removeFreeTimes > 0) {
      self.change(themeData, {
        removeFreeTimes: themeData.removeFreeTimes - 1,
        removeFreeWin: themeData.removeFreeWin + fillResult.totalWin.sum() * bet
      });
    }

    app.spinRecordService.insertSpinHistory(user.uid, {
      roundId: roundId,
      gameId: app.consts.MODULES.ALIBABA,
      type: spinType === slotConsts.SPIN_TYPE.NORMAL ? app.consts.SPIN_RECORD_TYPE.NORMAL
        : app.consts.SPIN_RECORD_TYPE.FREE,
      bet: cost,
      result: totalWin,
      bonusResult: 0
    });

    extraData.rewardDetails = fillResult.rewardDetails;
    return {
      code: app.consts.CODE.SUCCESS,
      data: result,
      extraData: extraData
    };
  }).catch(function (err) {
    logger.error(err.stack);
    return {code: app.consts.CODE.SERVER_ERROR};
  });
};

/**
 * 玩家选择小游戏的奖励
 * @param user
 * @param index
 * @returns {{code: number}}
 */
pro.selectMini = function (user, index) {
  let self = this;

  return co(function *() {
    let themeData = self.getTheme(user.uid);
    if (themeData === undefined) {
      logger.warn(`alibabaService selectMini: uid = ${user.uid}, need entry first`);
      return {
        code: app.consts.CODE.NEED_ENTRY_BEFORE
      };
    }

    if (themeData.miniGame !== true) {
      logger.warn(`alibabaService selectMini: uid = ${user.uid}, no mini game`);
      return {
        code: app.consts.CODE.ALIBABA_NO_MINI
      };
    }

    if (themeData.miniHistory.indexOf(index) >= 0) {
      logger.warn(`alibabaService selectMini: uid = ${user.uid}, index = ${index}`
        + `, miniHistory = ${JSON.stringify(themeData.miniHistory)}, index has been selected`);
      return {
        code: app.consts.CODE.ALIBABA_MINI_INDEX_EXISTED
      };
    }

    if (themeData.miniHistory.length >= themeData.miniConfig.length || themeData.miniLife <= 0) {
      logger.warn(`alibabaService selectMini: uid = ${user.uid}, index = ${index}, mini has over`);
      self.change(themeData, {
        miniGame: false
      });
      return {
        code: app.consts.CODE.ALIBABA_NO_MINI
      };
    }

    let result = {
      life: themeData.miniLife,
      win: themeData.miniWin,
      multiple: themeData.miniMultiple,
      currentSelect: {
        type: 0,
        num: 0
      },
      isFinished: 0
    };

    let newResult = themeData.miniConfig[themeData.miniHistory.length];
    themeData.miniHistory.push(index);

    let rewardObj = self.baseConfig.bonusType[newResult];
    if (rewardObj === undefined) {
      logger.error(`alibabaService selectMini: uid = ${user.uid}, newResult = ${newResult}, invalid config`);
      return {
        code: app.consts.CODE.SERVER_ERROR
      };
    }

    switch (rewardObj.type) {
      case slotConsts.ALIBABA_MINI_REWARD_TYPE.GAIN_LIFE:
        result.life += rewardObj.value;
        break;
      case slotConsts.ALIBABA_MINI_REWARD_TYPE.LOST_LIFE:
        result.life -= rewardObj.value;
        break;
      case slotConsts.ALIBABA_MINI_REWARD_TYPE.MULTIPLE:
        result.multiple = Math.max(result.multiple, rewardObj.value);
        break;
      case slotConsts.ALIBABA_MINI_REWARD_TYPE.WIN:
        result.win += rewardObj.value;
        break;
      default:
        logger.error(`alibabaService selectMini: uid = ${user.uid}, rewardObj = ${JSON.stringify(rewardObj)}, invalid rewardObj`);
        return {
          code: app.consts.CODE.SERVER_ERROR
        };
    }
    result.currentSelect.type = rewardObj.type;
    result.currentSelect.num = rewardObj.value;

    if (themeData.miniHistory.length >= themeData.miniConfig.length || result.life <= 0) {
      result.isFinished = 1;
    }

    if (app.walletService.isOpenForUser(user)) {
      let roundId = themeData.roundId;
      let walletInfo = yield app.walletService.result(user, 'SW01', result.win * result.multiple, roundId, roundId * 10 + 3, '', 'jackpot', 'remarks');

      if (walletInfo.responseCode !== app.consts.SINGLE_WALLET_CODE.OK) {
        return {code: walletInfo.responseCode};
      }
    }

    self.change(themeData, {
      miniGame: result.isFinished === 0,
      miniLife: result.life,
      miniWin: result.win,
      miniMultiple: result.multiple,
      miniHistory: themeData.miniHistory
    });

    if (result.isFinished !== 0) {
      app.userService.change(user, {
        credit: user.credit + result.win * result.multiple
      }, app.consts.REASON.ALIBABA_MINI);
    }

    return {
      code: app.consts.CODE.SUCCESS,
      data: result
    };
  }).catch(function (err) {
    logger.error(err.stack);
    return {code: app.consts.CODE.SERVER_ERROR};
  });

};






