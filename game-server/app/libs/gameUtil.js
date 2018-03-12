/**
 * Created by wyang on 16/9/27.
 */

let co = require('co');

let path = require('path');
let loggerName = path.basename(__filename);
let logger = require('pomelo-logger').getLogger('game-log', loggerName);
let consts = require('../consts/consts');

let logic = {};
/**
 * 加载属性到 app 上,以方便开发
 */
logic.loadForApp = function (app, done) {
  co(function*(){
    if ([consts.SERVERS.GAME].indexOf(app.serverType) >= 0) {
      app.walletService = require('../service/walletService');
      app.randomService = require('../service/randomService')(app);
      app.alibabaCalculator = require('../service/slot/alibabaCalculator')(app);

      yield app.randomService.init();
    }

    if ([consts.SERVERS.DATA_CENTER].indexOf(app.serverType) >= 0) {
      console.log(`serverType = ${app.serverType}`);
      app.userService = require('../service/data/oracleUserService')(app, app.oracle);
      app.alibabaService = require('../service/data/oracleAlibabaService')(app, app.oracle);
      app.spinRecordService = require('../service/oracleSpinRecordService')(app, app.oracle);
      app.walletService = require('../service/walletService');

      // app.userService = new (require('../service/userService'))();
      // app.alibabaService = new (require('../service/slot/alibabaService'))();
      // app.spinRecordService = require(`../service/spinRecordService`)(app);

      yield app.userService.init();
      yield app.alibabaService.init();
      yield app.spinRecordService.init();
    }

    done();
  }).catch(function(err) {
    logger.error(`gameUtil loadForApp: ${err.stack}`);
  });
};

module.exports = logic;
