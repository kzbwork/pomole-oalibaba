/**
 *
 * Author:
 * Date:
 */

'use strict';

let co = require('co');

let slotConsts = require('./slotConsts');
let baseUtil = require('../../libs/slot/baseUtil');
let alibabaUtil = require('../../libs/slot/alibabaUtil');

let AlibabaCalculator = function (app) {
  this.app = app;
  this.logger = app.logger.getGameLog(__filename);
  this.walletLogger = app.logger.getWalletLog(__filename);

  this.baseConfig = alibabaUtil.buildConfig();
};

module.exports = function (app) {
  return new AlibabaCalculator(app);
};

let pro = AlibabaCalculator.prototype;

pro.spin = function (uid, coinValue, multiplier) {
  let self = this;
  return co(function *() {
    let themeInfoRes = yield new Promise(function (resolve, reject) {
      self.app.rpc.dataCenter.alibabaRemote.requestAlibabaTheme(uid, uid, function (err, res) {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      })
    });
    if (themeInfoRes.code !== self.app.consts.CODE.SUCCESS || themeInfoRes.data === undefined) {
      self.logger.warn(`alibabaCalculator spin: uid = ${uid}, themeData not found`);
      return {code: self.app.consts.CODE.NEED_ENTRY_BEFORE};
    }
    let userInfo = themeInfoRes.data.userInfo;
    let themeInfo = themeInfoRes.data.themeInfo;
    let roundId = themeInfoRes.data.roundId;

    let changedUserInfo = {}; // 用户数据修改后的总结果，用于一次性向数据服务器发送 rpc 请求
    let changedThemeInfo = {};

    if (themeInfo.mini_game === true) {
      self.logger.warn(`alibabaCalculator spin: uid = ${userInfo.id}, has mini game unfinished`);
      return {
        code: self.app.consts.CODE.ALIBABA_MINI_NOT_FINISH
      }
    }

    if (coinValue <= 0) {
      self.logger.warn(`alibabaCalculator spin: uid = ${userInfo.id}, coinValue = ${coinValue}, coinValue invalid`);
      return {
        code: self.app.consts.CODE.PARAM_ERROR
      };
    }

    if (multiplier <= 0) {
      self.logger.warn(`alibabaCalculator spin: uid = ${userInfo.id}, multiplier = ${multiplier}, multiplier invalid`);
      return {
        code: self.app.consts.CODE.PARAM_ERROR
      };
    }

    let bet = multiplier * coinValue;
    let cost = self.baseConfig.line.length * bet;

    if (themeInfo.remove_free_times > 0) {
      bet = themeInfo.multiplier * themeInfo.coin_value;
      cost = 0;
    }

    if (userInfo.credit < cost) {
      self.logger.warn(`alibabaCalculator spin: uid = ${userInfo.id}, cost = ${cost}, user.credit = ${userInfo.credit}, lack credit`);
      return {
        code: self.app.consts.CODE.LACK_CREDIT
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
    let walletType = themeInfo.remove_free_times > 0 ? 'freerounds' : undefined;
    let walletRemarks = themeInfo.remove_free_times > 0 ? 'remarks' : undefined;
    if (themeInfo.remove_free_times > 0) {
      // 连消奖励的 spin
      fillResult = yield alibabaUtil.fillMatrixForElinimateFree(result.elements, self.baseConfig);
      spinType = slotConsts.SPIN_TYPE.ELIMINATE;
    } else {
      // 普通 spin
      if (userInfo.isDebug) {
        self.logger.warn(`OracleAlibabaService spin: user.id = ${userInfo.id}, spin for debug mode`);
        if (Math.random() < 0.5) {
          fillResult = yield alibabaUtil.fillMatrixForTestFree(result.elements, self.baseConfig);
        } else {
          fillResult = yield alibabaUtil.fillMatrixForTestBonus(result.elements, self.baseConfig);
        }
      } else {
        fillResult = yield alibabaUtil.fillMatrixForNone(result.elements, self.baseConfig);
      }

      result.cost = self.baseConfig.line.length * bet;

      themeInfo.remove_free_times = 0;
      themeInfo.remove_free_win = 0;

      changedThemeInfo.remove_free_times = 0;
      changedThemeInfo.remove_free_win = 0;

      spinType = slotConsts.SPIN_TYPE.NORMAL;

      bonusNum = baseUtil.calcElemNum(fillResult.eliminatedMatrix, self.app.consts.ELEMENT_NAME.BONUS, self.baseConfig);
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
    let roundStatus = self.app.consts.SPIN_RECORD_STATUS.NOT_CONFIRM_BET;
    let bet_transaction_id = '';
    if (self.app.walletService.isOpenForUser(userInfo)) {
      let betInfo = yield self.app.walletService.bet(userInfo, 'SW01', result.cost, roundId, roundId * 10, walletType, walletRemarks);

      if (betInfo.responseCode !== self.app.consts.SINGLE_WALLET_CODE.OK) {
        return {
          code: betInfo.responseCode
        }
      } else {
        bet_transaction_id = betInfo.accountTransactionId;
        roundStatus = self.app.consts.SPIN_RECORD_STATUS.NOT_CONFIRM_RESULT;
      }
      newCredit = betInfo.balance;
    }

    if (result.cost > 0) {
      changedUserInfo.credit = (newCredit === null ? userInfo.credit - result.cost : newCredit);
      userInfo.credit = (newCredit === null ? userInfo.credit - result.cost : newCredit);
    }

    let totalWin = 0;
    for (let win of result.win) {
      totalWin += win;
    }

    newCredit = null;

    let result_transaction_id = '';
    if (self.app.walletService.isOpenForUser(userInfo)) {
      let rewardInfo = yield self.app.walletService.result(userInfo, 'SW01', totalWin, roundId, roundId * 10 + 1, ''
        , walletType, walletRemarks);

      if (rewardInfo.responseCode !== self.app.consts.SINGLE_WALLET_CODE.OK) {
        if (walletType) {
          return {
            code: rewardInfo.responseCode
          }
        }

        let refundInfo = yield self.app.walletService.refund(userInfo, 'SW01', result.cost, roundId, roundId);

        if (refundInfo.responseCode !== self.app.consts.SINGLE_WALLET_CODE.OK) {
          self.logger.warn(`wallet refund fail, uid = ${userInfo.id}, amount = ${result.cost}, roundId = ${roundId}`
            + `,transId = ${roundId * 10 + 2}`);
          self.walletLogger.error(`uid = ${userInfo.id}, bet success but result and refund faild, amount = ${result.cost},`
            + `roundId = ${roundId}, transId = ${roundId * 10 + 2}`);
          return {
            code: refundInfo.responseCode
          }
        } else {
          result_transaction_id = refundInfo.transactionid;
          roundStatus = self.app.consts.SPIN_RECORD_STATUS.REFUND;
        }

        return {
          code: rewardInfo.responseCode
        }
      } else {
        result_transaction_id = rewardInfo.accountTransactionId;
        roundStatus = self.app.consts.SPIN_RECORD_STATUS.NOT_CONFIRM_MINI;
      }
      newCredit = rewardInfo.balance;
    }

    if (result.win.length > 0) {
      changedUserInfo.credit = (newCredit === null ? userInfo.credit + totalWin : newCredit);
      userInfo.credit = (newCredit === null ? userInfo.credit + totalWin : newCredit);
    }
    result.rsize = alibabaUtil.calcRewardSize(totalWin, bet * self.baseConfig.line.length, self.baseConfig);

    result.free.removeFreeTimes = themeInfo.remove_free_times;
    result.free.removeFreeWin = themeInfo.remove_free_win;

    result.spinType = spinType;

    changedThemeInfo.round_id = roundId;
    changedThemeInfo.coin_value = coinValue;
    changedThemeInfo.multiplier = multiplier;
    changedThemeInfo.remove_free_times = themeInfo.remove_free_times + result.free.removeExtraFreeTimes;
    themeInfo.round_id = roundId;
    themeInfo.coin_value = coinValue;
    themeInfo.multiplier = multiplier;
    themeInfo.remove_free_times = themeInfo.remove_free_times + result.free.removeExtraFreeTimes;

    if (bonusNum >= self.baseConfig.base.bonuscount) {
      let mini = yield alibabaUtil.calcMiniGame(self.baseConfig);
      changedThemeInfo.mini_game = true;
      changedThemeInfo.mini_config = mini;
      changedThemeInfo.mini_life = result.mini.life;
      changedThemeInfo.mini_win = 0;
      changedThemeInfo.mini_history = [];
      themeInfo.mini_game = true;
      themeInfo.mini_config = mini;
      themeInfo.mini_life = result.mini.life;
      themeInfo.mini_win = 0;
      themeInfo.mini_history = [];
    } else {
      roundStatus = Math.max(roundStatus, self.app.consts.SPIN_RECORD_STATUS.COMPLETE);
    }

    if (spinType === slotConsts.SPIN_TYPE.ELIMINATE && themeInfo.remove_free_times > 0) {
      changedThemeInfo.remove_free_times = themeInfo.remove_free_times - 1;
      changedThemeInfo.remove_free_win = themeInfo.remove_free_win + fillResult.totalWin.sum() * bet;
      themeInfo.remove_free_times = themeInfo.remove_free_times - 1;
      themeInfo.remove_free_win = themeInfo.remove_free_win + fillResult.totalWin.sum() * bet
    }

    result.elements = baseUtil.parseMatrix(result.elements);
    result.lines = baseUtil.parseMatrix(result.lines);
    changedUserInfo.reconnect_theme = self.app.consts.THEME_NAME.ALIBABA;
    changedUserInfo.reconnect_data = result;

    yield requestStoreSpinResult(self.app, userInfo.id
      , changedUserInfo, self.app.consts.REASON.ALIBABA_WIN
      , changedThemeInfo
      , {
        id: userInfo.id,
        round_id: roundId,
        game_id: self.app.consts.MODULES.ALIBABA,
        status: roundStatus,
        time: Date.now(),
        type: spinType === slotConsts.SPIN_TYPE.NORMAL ? self.app.consts.SPIN_RECORD_TYPE.NORMAL
          : self.app.consts.SPIN_RECORD_TYPE.FREE,
        bet: cost,
        result: totalWin,
        bonus_result: self.app.consts.SPIN_RECORD_STATUS.NOT_CONFIRM_BET,
        bet_transaction_id: bet_transaction_id,
        result_transaction_id: result_transaction_id,
        bonus_transaction_id: ''
      });

    extraData.rewardDetails = fillResult.rewardDetails;
    return {
      code: self.app.consts.CODE.SUCCESS,
      data: result,
      extraData: extraData
    };
  });
};

/**
 * 玩家选择小游戏的奖励
 * @param uid
 * @param index
 * @returns {{code: number}}
 */
pro.selectMini = function (uid, index) {
  let self = this;

  return co(function *() {
    let themeInfoRes = yield new Promise(function (resolve, reject) {
      self.app.rpc.dataCenter.alibabaRemote.requestAlibabaTheme(uid, uid, function (err, res) {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      })
    });
    if (themeInfoRes.code !== self.app.consts.CODE.SUCCESS || themeInfoRes.data === undefined) {
      self.logger.warn(`alibabaCalculator spin: uid = ${uid}, themeData not found`);
      return {code: self.app.consts.CODE.NEED_ENTRY_BEFORE};
    }
    let userInfo = themeInfoRes.data.userInfo;
    let themeInfo = themeInfoRes.data.themeInfo;
    let miniRoundId = themeInfoRes.data.roundId;

    if (themeInfo.mini_game !== true) {
      self.logger.warn(`alibabaCalculator selectMini: uid = ${userInfo.id}, no mini game`);
      return {
        code: self.app.consts.CODE.ALIBABA_NO_MINI
      };
    }

    if (themeInfo.mini_history.indexOf(index) >= 0) {
      self.logger.warn(`alibabaCalculator selectMini: uid = ${userInfo.id}, index = ${index}`
        + `, miniHistory = ${JSON.stringify(themeInfo.mini_history)}, index has been selected`);
      return {
        code: self.app.consts.CODE.ALIBABA_MINI_INDEX_EXISTED
      };
    }

    if (themeInfo.mini_history.length >= themeInfo.mini_config.length || themeInfo.mini_life <= 0) {
      self.logger.warn(`alibabaCalculator selectMini: uid = ${userInfo.id}, index = ${index}, mini has over`);
      let changeThemeResult = yield requestChangeThemeData(self.app, userInfo.id, {
        mini_game: false
      });
      if (changeThemeResult.code !== self.app.consts.CODE.SUCCESS) {
        self.logger.warn(`alibabaCalculator selectMini: uid = ${userInfo.id}, change themeData failed`);
        return changeThemeResult;
      }
      return {
        code: self.app.consts.CODE.ALIBABA_NO_MINI
      };
    }

    let result = {
      life: themeInfo.mini_life,
      win: themeInfo.mini_win,
      multiple: themeInfo.mini_multiple,
      currentSelect: {
        type: 0,
        num: 0
      },
      isFinished: 0
    };

    let newResult = themeInfo.mini_config[themeInfo.mini_history.length];
    themeInfo.mini_history.push(index);

    let rewardObj = self.baseConfig.bonusType[newResult];
    if (rewardObj === undefined) {
      self.logger.error(`alibabaCalculator selectMini: uid = ${userInfo.id}, newResult = ${newResult}, invalid config`);
      return {
        code: self.app.consts.CODE.SERVER_ERROR
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
        self.logger.error(`alibabaCalculator selectMini: uid = ${userInfo.id}, rewardObj = ${JSON.stringify(rewardObj)}, invalid rewardObj`);
        return {
          code: self.app.consts.CODE.SERVER_ERROR
        };
    }
    result.currentSelect.type = rewardObj.type;
    result.currentSelect.num = rewardObj.value;

    if (themeInfo.mini_history.length >= themeInfo.mini_config.length || result.life <= 0) {
      result.isFinished = 1;

      yield new Promise(function (resolve, reject) {
        self.app.rpc.dataCenter.themeRemote.requestInsertSpinHistory(userInfo.id, {
          id: userInfo.id,
          round_id: miniRoundId,
          game_id: self.app.consts.MODULES.ALIBABA,
          status: self.app.consts.SPIN_RECORD_STATUS.COMPLETE,
          time: Date.now(),
          type: self.app.consts.SPIN_RECORD_TYPE.MINI,
          bet: 0,
          result: result.win * result.multiple,
          bonus_result: self.app.consts.SPIN_RECORD_STATUS.NOT_CONFIRM_BET,
          bet_transaction_id: '',
          result_transaction_id: '',
          bonus_transaction_id: ''
        }, function (err, res) {
          if (err) {
            reject(err);
          } else {
            resolve(res);
          }
        });
      });

      if (self.app.walletService.isOpenForUser(userInfo)) {
        let roundId = themeInfo.round_id;
        let walletInfo = yield self.app.walletService.result(userInfo, 'SW01', result.win * result.multiple, roundId, roundId * 10 + 3, '', 'jackpot', 'remarks');

        if (walletInfo.responseCode !== self.app.consts.SINGLE_WALLET_CODE.OK) {
          return {code: walletInfo.responseCode};
        } else {
          yield new Promise(function (resolve, reject) {
            self.app.rpc.dataCenter.themeRemote.requestUpdateSpinHistoryBonus(userInfo.id, roundId, userInfo.id
              , walletInfo.accountTransactionId
              , function (err, res) {
              if (err) {
                reject(err);
              } else {
                resolve(res);
              }
            });
          });
        }
      }
    }

    let changeThemeResult = yield requestChangeThemeData(self.app, userInfo.id, {
      mini_game: result.isFinished === 0,
      mini_life: result.life,
      mini_win: result.win,
      mini_multiple: result.multiple,
      mini_history: themeInfo.mini_history
    });
    if (changeThemeResult.code !== self.app.consts.CODE.SUCCESS) {
      self.logger.error(`alibabaCalculator selectMini: uid = ${userInfo.id}, change themeData failed`);
      return changeThemeResult;
    }

    if (result.isFinished !== 0) {
      let changeUserResult = yield requestChangeUserData(self.app, userInfo.id, {
        credit: userInfo.credit + result.win * result.multiple
      }, self.app.consts.REASON.ALIBABA_MINI);
      if (changeUserResult.code !== self.app.consts.CODE.SUCCESS) {
        self.logger.error(`alibabaCalculator selectMini: uid = ${userInfo.id}, change userData failed`);
        return changeUserResult;
      }
    }

    return {
      code: self.app.consts.CODE.SUCCESS,
      data: result
    };
  }).catch(function (err) {
    self.logger.error(err.stack);
    return {code: self.app.consts.CODE.SERVER_ERROR};
  });
};

let requestChangeThemeData = function (app, uid, changeObj) {
  return new Promise(function (resolve, reject) {
    app.rpc.dataCenter.alibabaRemote.requestChangeAlibaba(uid, uid, changeObj, function (err, res) {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
};

let requestChangeUserData = function (app, uid, changeObj, reason) {
  return new Promise(function (resolve, reject) {
    app.rpc.dataCenter.userRemote.requestChangeUser(uid, uid, changeObj, reason, function (err, res) {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
};

let requestStoreSpinResult = function (app, uid, changedUserInfo, changeUserReason, changedThemeInfo, spinResult) {
  return new Promise(function (resolve, reject) {
    app.rpc.dataCenter.alibabaRemote.requestStoreSpinResult(uid, uid, changedUserInfo, changeUserReason, changedThemeInfo
      , spinResult, function (err, res) {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
};
