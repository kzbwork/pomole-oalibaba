'use strict';

require('./app/libs/shortcodes');

let utils = require('./app/libs/utils');
let consts = require('./app/consts/consts');
let config = require('./config/data/config.json');


let pomelo = require('pomelo');
let path = require('path');
let httpPlugin = require('game-js-server-core').plugins.http;
let syncPlugin = require('game-js-server-core').plugins.docSync;
let redisPlugin = require('game-js-server-core').plugins.redisSync;
let oraclePlugin = require('game-js-server-core').plugins.oracleSync;

let updateFilter = require('./app/filter/updateFilter.js');

let gameUtil = require('./app/libs/gameUtil');

let app = pomelo.createApp();

let pomeloLogger = require('pomelo-logger');

app.configureLogger(pomeloLogger);

app.set('name', 'game-js-server-core');

let logger = pomeloLogger.getLogger('game-log', __filename);
app.logger = require('./app/libs/logger');

// connector server
app.configure('development|localtest|remotetest|tokyo|production', 'connector', function () {

  app.set('connectorConfig',
    {
      connector: pomelo.connectors.hybridconnector,
      heartbeat: 120,
      useDict: true,
      useProtobuf: true,
      disconnectOnTimeout: true,
      handshake: function (msg, cb) {
        cb(null, {});
      }
    });
});

// http server
app.configure('development|localtest|remotetest|tokyo|production', 'http|gate', function () {
  app.use(httpPlugin, {viewEngine: 'jade'});
  app.components.__http__.setOrigin('*');
});

// db plugin
app.configure('development|localtest|remotetest|tokyo|production', 'dataCenter', function () {
  let env = this.get('env');

  logger.info('run env:' + env);
  let schemas = require(path.join(app.base, 'config/schemas.json'));
  let database = require(path.join(app.base, 'config/database.json'))[env];
  let oracleSchemas = require(path.join(app.base, 'config/oracleSchemas'));

  database.schemas = schemas;

  // app.use(syncPlugin, {docSync: database});
  // app.set('sync', app.components.__docSync__, true);

  let oracleOpts = database.oracle;
  oracleOpts.schema = oracleSchemas;
  app.use(oraclePlugin, {oracle: oracleOpts});
  app.set('oracle', app.components.__oracle__, true);

  app.use(redisPlugin, {redis: database.redis});
  app.set('redis', app.components.__redis__, true);
});

app.configure('production|development|localtest|tokyo|remotetest', 'connector', function () {
  // app.before(updateFilter());
});

app.consts = consts;
app.config = config;
app.utils = utils;

// 开启后台管理系统
// app.enable('systemMonitor');

// 开启 rpc 日志
app.rpcFilter(pomelo.rpcFilters.rpcLog());

app.start(function(){
  gameUtil.loadForApp(app, function() {
    logger.info('开服成功:' + app.getServerId());
  });
});

process.on('uncaughtException', function (err) {
  logger.error('uncaughtException:' + err.message + err.stack);

  let sync = app.sync;

  if (sync) {
    sync.sync().then(
      function (res) {
        logger.info('sync done.reason exception.');
      },
      function (err) {
        logger.error(err.message + err.stack);
      });
  }
});

// promise 中错误未捕获,不需要退出,但发现后需要处理
process.on('unhandledRejection', function (err) {
  logger.error('unhandledRejection:' + err.stack);
});

// kill -2 关闭进程会回调
// process.on('SIGINT', function () {
//   //服务器已经关闭
//   app.closed = true;
//   let sync = app.sync;
//   if (sync) {
//     logger.info('正在同步数据...');
//     sync.sync().then(
//       function (res) {
//         logger.info('同步数据完成.exit');
//         process.exit(0);
//       },
//       function (err) {
//         logger.error(err.message + err.stack);
//         process.exit(1);
//       }
//     );
//   } else {
//     process.exit(0);
//   }
// });

// kill -2 关闭进程会回调
process.on('SIGINT', function () {
  //服务器已经关闭
  let oracle = app.oracle;
  if (oracle) {
    logger.info('正在同步数据...');
    oracle.flush().then(
      function (res) {
        logger.info('同步数据完成.exit');
        process.exit(0);
      },
      function (err) {
        logger.error(err.message + err.stack);
        process.exit(1);
      }
    );
  } else {
    process.exit(0);
  }
});

// master 进程关闭,也会发送此事件
process.on('SIGTERM', function () {
  console.log('SIGTERM');
  logger.error('SIGTERM exit 0');
  process.exit(0);
});
