/**
 * 阿里巴巴主题数据管理类
 * Author: jxyi
 * Date: 2018-2-13
 */

'use strict';

let co = require('co');
let util = require('util');

let OracleService = require('game-js-server-core').oracle.dataService;
let OracleAlibabaTheme = require('./oracleAlibabaTheme');

let app = require('pomelo').app;
let alibabaUtil = require('../../libs/slot/alibabaUtil');

let OracleAlibabaService = function (app, oraclePlugin) {
  this.app = app;
  this.logger = app.logger.getGameLog(__filename);
  this.constructor.super_.call(this, oraclePlugin, 'alibaba_theme', OracleAlibabaTheme);

  this.baseConfig = alibabaUtil.buildConfig();
};

util.inherits(OracleAlibabaService, OracleService);

module.exports = function (app, oraclePlugin) {
  return new OracleAlibabaService(app, oraclePlugin);
};

let pro = OracleAlibabaService.prototype;

pro.init = function () {
  let self = this;
  return co(function *() {
    let conn = yield self.oraclePlugin.getClient();
    yield self.oraclePlugin.createTable(conn, self.tableName);
    yield self.oraclePlugin.closeClient(conn);
  });
};

pro.reloadConfig = function () {
  this.baseConfig = alibabaUtil.buildConfig();
};

pro.getTheme = function (uid) {
  return this.getData({id: uid});
};

pro.loadTheme = function (uid) {
  let self = this;
  return co(function *() {
    return yield self.loadData({id: uid});
  });
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

    let themeData = yield self.loadTheme(user.id);
    if (!themeData) {
      self.logger.info(`oracleAlibabaService entry: user.id = ${user.id}, new themeData`);
      themeData = yield self.newData({
        id: user.id,
        coin_value: self.baseConfig.coinValue[0],
        multiplier: self.baseConfig.multiplier[0],

        remove_free_times: 0,
        remove_free_win: 0,

        mini_game: false,
        mini_config: '[]',
        mini_life: 0,
        mini_win: 0,
        mini_multiple: 1,
        mini_history: '[]'
      });
    }
    themeData.type = user.type;

    let result = {
      eliminateConfig: freespinConfig,
      lastCoinValue: self.baseConfig.coinValue.indexOf(themeData.coin_value) >= 0 ? themeData.coin_value
        : self.baseConfig.coinValue[0],
      lastMultiplier: self.baseConfig.multiplier.indexOf(themeData.multiplier) >= 0 ? themeData.multiplier
        : self.baseConfig.multiplier[0],
      coinValue: self.baseConfig.coinValue,
      multiplier: self.baseConfig.multiplier,
      removeFreeTimes: themeData.remove_free_times,
      removeFreeWin: themeData.remove_free_win,

      miniGame: themeData.mini_game ? 1 : 0,
      miniHistory: themeData.mini_history,
      miniSelectedData: alibabaUtil.parseMiniHistory(themeData.mini_config, themeData.mini_history.length, self.baseConfig),
      miniLife: themeData.mini_life,
      miniWin: themeData.mini_win,
      miniMultiple: themeData.mini_multiple,

      reconnectData: (user.reconnect_theme === app.consts.THEME_NAME.ALIBABA ? user.reconnect_data : {})
    };

    if (user.reconnect_theme !== app.consts.THEME_NAME.NONE) {
      yield app.userService.change(user, {
        reconnect_theme: app.consts.THEME_NAME.NONE,
        reconnect_data: {}
      });
    }

    return result;
  });
};

