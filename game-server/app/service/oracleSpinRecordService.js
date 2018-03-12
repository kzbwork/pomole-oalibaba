/**
 * 管理 spin 记录的类
 * Author: jxyi
 * Date: 2018-2-13
 */

'use strict';

let co = require('co');
let consts = require('../consts/consts');

let OracleSpinRecordService = function (app, oraclePlugin) {
  this.app = app;
  this.oraclePlugin = oraclePlugin;
  this.logger = app.logger.getGameLog(__filename);

  this._tableName = 'spin_record';
};

module.exports = function (app, oraclePlugin) {
  return new OracleSpinRecordService(app, oraclePlugin);
};

let pro = OracleSpinRecordService.prototype;

pro.init = function () {
  let self = this;
  return co(function *() {
    let conn = yield self.oraclePlugin.getClient();
    yield self.oraclePlugin.createTable(conn, self._tableName);
    yield self.oraclePlugin.closeClient(conn);
  });
};

/**
 * 请求历史数据
 * @param uid
 * @param gameId
 * @param startDate
 * @param endDate
 * @param startIndex
 * @param endIndex
 * @returns {*}
 */
pro.requestSpinHistory = function (uid, gameId, startDate, endDate, startIndex, endIndex) {
  let self = this;
  return co(function *() {
    let key = `spinRecord-${uid}-${gameId}-${startDate}-${endDate}`;
    let redisResult = yield self.app.redis.get(key);
    if (redisResult) {
      let dataArr = JSON.parse(redisResult);
      return {
        totalNum: dataArr.length,
        currentIndex: Math.min(startIndex, dataArr.length),
        list: dataArr.slice(startIndex, endIndex)
      }
    } else {
      let conn = yield self.oraclePlugin.getClient();
      let dataArr = yield conn.execute(
        `select round_id, time, type, bet, result from ${self._tableName} 
        where time >= :start_date and time <= :end_date and id = :id and game_id = :game_id`,
        {start_date: startDate, end_date: endDate, id: uid, game_id: gameId}
      );
      yield self.oraclePlugin.closeClient(conn);

      let pureList = [];
      for (let obj of dataArr.rows) {
        let pureObj = {};
        for (let index in dataArr.metaData) {
          if (dataArr.metaData[index].name === 'ROUND_ID') {
            pureObj.roundId = obj[index];
          }
          if (dataArr.metaData[index].name === 'TIME') {
            pureObj.time = obj[index];
          }
          if (dataArr.metaData[index].name === 'TYPE') {
            pureObj.type = obj[index];
          }
          if (dataArr.metaData[index].name === 'BET') {
            pureObj.bet = obj[index];
          }
          if (dataArr.metaData[index].name === 'RESULT') {
            pureObj.result = obj[index];
          }
        }
        pureList.push(pureObj);
      }

      pureList.sort(function (a, b) {
        return b.roundId - a.roundId;
      });

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
 * @param data
 * @returns {*}
 */
pro.insertSpinHistory = function (data) {
  let self = this;
  return co(function *() {
    let bindParams = {};
    for (let key in data) {
      bindParams[key] = data[key];
    }
    let conn = yield self.oraclePlugin.getClient();
    let result = yield conn.execute(
      `insert into ${self._tableName}(id, round_id, game_id, status, time, type, bet, result, bonus_result, bet_transaction_id,
      result_transaction_id, bonus_transaction_id) values (:id, :round_id, :game_id, :status, :time, :type, :bet, :result, :bonus_result,
      :bet_transaction_id, :result_transaction_id, :bonus_transaction_id) return round_id into :round_id`,
      bindParams
    );
    yield self.oraclePlugin.closeClient(conn);
    self.logger.debug(`oracleSpinRecordService insertSpinHistory: result = ${JSON.stringify(result)}`);
  });
};

pro.updateSpinHistoryBonus = function (roundId, uid, bonus_transaction_id) {
  let self = this;
  return co(function *() {
    let conn = yield self.oraclePlugin.getClient();
    let result = yield conn.execute(
      `update ${self._tableName} set bonus_transaction_id=:bonus_transaction_id, status=:status
      where id=:id and round_id=:round_id and status=:pre_status`,
      {
        id: uid,
        round_id: roundId,
        bonus_transaction_id: bonus_transaction_id,
        status: consts.SPIN_RECORD_STATUS.COMPLETE,
        pre_status: consts.SPIN_RECORD_STATUS.NOT_CONFIRM_MINI
      }
    );
    yield self.oraclePlugin.closeClient(conn);
    self.logger.debug(`oracleSpinRecordService updateSpinHistoryBonus: result = ${JSON.stringify(result)}`);
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
    let conn = yield self.oraclePlugin.getClient();
    let dataArr = yield conn.execute(
      `select (round_id, bet, result) from ${self._tableName} 
        where round_id = :round_id`,
      {round_id: roundId},
      {maxRows: 1}
    );
    yield self.oraclePlugin.closeClient(conn);
    return dataArr;
  });
};

/**
 * 获取新的局数 id
 * @returns {*}
 */
pro.requestNextRoundId = function () {
  let self = this;
  return co(function *() {
    let conn = yield self.oraclePlugin.getClient();
    let result = yield conn.execute(
      'select SPIN_RECORD_SEQ.nextval from dual'
    );
    yield self.oraclePlugin.closeClient(conn);
    if (result.rows && result.rows[0] && result.rows[0][0] !== undefined) {
      self.logger.warn(`roundId = ${result.rows[0][0]}`);
      return result.rows[0][0];
    } else {
      return undefined;
    }
  });
};




