/**
 * 管理 spin 记录的类
 * author: jxyi
 * date: 2018-1-24
 */

'use strict';

let co = require('co');
let consts = require('../consts/consts');

let SpinRecordService = function (app) {
  this.app = app;
  this.logger = app.logger.getGameLog(__filename);
};

module.exports = function (app) {
  return new SpinRecordService(app);
};

let pro = SpinRecordService.prototype;

/**
 * 请求历史数据
 * @param uid
 * @param startDate
 * @param endDate
 * @param startIndex
 * @param endIndex
 * @returns {*}
 */
pro.requestSpinHistory = function (uid, startDate, endDate, startIndex, endIndex) {
  let self = this;
  return co(function *() {
    let key = `spinRecord-${uid}-${startDate}-${endDate}`;
    let redisResult = yield self.app.redis.get(key);
    if (redisResult) {
      let dataArr = JSON.parse(redisResult);
      return {
        totalNum: dataArr.length,
        currentIndex: Math.min(startIndex, dataArr.length),
        list: dataArr.slice(startIndex, endIndex)
      }
    } else {
      let model = self.app.sync.getModel('spinRecord');
      let dataArr = yield model.find({
        uid: uid,
        time: {
          $gte: startDate,
          $lte: endDate
        }
      }, {
        _id: 0,
        roundId: 1,
        time: 1,
        type: 1,
        bet: 1,
        result: 1
      }).sort({roundId: -1});

      let collection = self.app.sync.getCollection('spinRecord');
      let pureList = [];
      for (let data of dataArr) {
        pureList.push(collection.filterRes(data));
      }

      yield self.app.redis.set(key, JSON.stringify(pureList));
      yield self.app.redis.expire(key, 300);

      return {
        totalNum: pureList.length,
        currentIndex: Math.min(startIndex, pureList.length),
        list: pureList.slice(startIndex, endIndex)
      };
    }
  });
};

/**
 * 插入历史数据
 * @param uid
 * @param data
 * @returns {*}
 */
pro.insertSpinHistory = function (uid, data) {
  let self = this;
  return co(function *() {
    let SpinRecord = self.app.sync.getModel('spinRecord');
    let info = new SpinRecord({
      roundId: data.roundId,
      uid: uid,
      gameId: data.gameId,
      status: consts.SPIN_RECORD_STATUS.NOT_CONFIRM_BET,
      time: Date.now(),
      type: data.type,
      bet: data.bet,
      result: data.result,
      bonusResult: data.bonusResult,
      betTransactionId: '',
      resultTransactionId: '',
      bonusTransactionId: ''
    });

    yield info.save();
  });
};

/**
 * 请求单次 spin 的详细信息
 * @param roundId
 * @returns {*}
 */
pro.requestDetailSpinInfo = function (roundId) {
  let self = this;
  return co(function *() {
    let SpinRecord = self.app.sync.getModel('spinRecord');
    let info = yield SpinRecord.findOne({
      roundId: roundId
    }, {
      _id: 0,
      roundId: 1,
      bet: 1,
      result: 1
    });
    return info;
  });
};












