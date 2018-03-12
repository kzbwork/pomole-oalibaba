/**
 * Created by wyang on 16/9/27.
 */

var cwd = process.cwd();

var factory = require(cwd + '/lib/pomelo');

var debug = require('debug')('tools:presure');

var START = 'start';  // 开始(action,reqId)
var END = 'end';      // 结束(action,reqId)
var incr = 'incr';    // 增加(action)
var decr = 'decr';    // 减少(action)

var offset = 1;

// 如果在 vm 里面运行,会有 actor.id
if (typeof actor !== 'undefined') {
  offset = actor.id;
}


var monitor = function (type, name, reqId) {
  if (typeof actor !== 'undefined') {
    actor.emit(type, name, reqId);
  } else {
    // console.log(Array.prototype.slice.call(arguments, 0));
  }
};

var request = function (route, data, cb) {
  var reqId = pomelo.request(route, data, function (res, reqId) {
    monitor(END, route, reqId);
    cb(res, reqId);
  });

  monitor(START, route, reqId);
};

// --------------------

var pomelo = factory();

function test (pomelo, uid) {
  uid = 100001;
  var token = 'TEST_TOKEN';

  var cc = {log: console.log};

  pomelo.init({host: 'localhost', port: '3010'}, function () {

    pomelo.on('onUserChange', function (data) {
      cc.log('玩家数据修改:');
      cc.log(JSON.stringify(data));
    });

    // 在线奖励数据刷新
    pomelo.on('onOnlineRefresh', function (data) {
      cc.log('在线奖励数据刷新:' + JSON.stringify(data));
    });

    // 进入游戏
    request('connector.entryHandler.entry', {uid: uid, token: token}, function (res) {
      cc.log('进入游戏结果：');
      cc.log(JSON.stringify(res));

      // 获得小游戏状态
      request('connector.miniHandler.miniFarmInfo',
        {
          uid: uid, gameId: 40001
        }, function (res, reqId) {
          cc.log('获得小游戏状态:');
          cc.log(JSON.stringify(res));

        });

      // 获得在线奖励数据
      request('connector.miniHandler.minifarm',
        {
          uid: uid, themeId: 10001, token: token, gameId: 40001, index: 1
        }, function (res, reqId) {
          cc.log('获得小游戏数据:');
          cc.log(JSON.stringify(res));

        });

      // 获得在线奖励数据
      request('connector.miniHandler.minifarm',
        {
          uid: uid, themeId: 10001, token: token, gameId: 40001, index: 2
        }, function (res, reqId) {
          cc.log('获得小游戏数据:');
          cc.log(JSON.stringify(res));

        });

      // 获得在线奖励数据
      request('connector.miniHandler.minifarm',
        {
          uid: uid, themeId: 10001, token: token, gameId: 40001, index: 3
        }, function (res, reqId) {
          cc.log('获得小游戏数据:');
          cc.log(JSON.stringify(res));

        });

      // 获得在线奖励数据
      request('connector.miniHandler.minifarm',
        {
          uid: uid, themeId: 10001, token: token, gameId: 40001, index: 4
        }, function (res, reqId) {
          cc.log('获得小游戏数据:');
          cc.log(JSON.stringify(res));

        });

      // 获得在线奖励数据
      request('connector.miniHandler.minifarm',
        {
          uid: uid, themeId: 10001, token: token, gameId: 40001, index: 5
        }, function (res, reqId) {
          cc.log('获得小游戏数据:');
          cc.log(JSON.stringify(res));

        });

      // 获得在线奖励数据
      request('connector.miniHandler.minifarm',
        {
          uid: uid, themeId: 10001, token: token, gameId: 40001, index: 6
        }, function (res, reqId) {
          cc.log('获得小游戏数据:');
          cc.log(JSON.stringify(res));

        });

      // 获得在线奖励数据
      request('connector.miniHandler.minifarm',
        {
          uid: uid, themeId: 10001, token: token, gameId: 40001, index: 7
        }, function (res, reqId) {
          cc.log('获得小游戏数据:');
          cc.log(JSON.stringify(res));

        });

      // 获得在线奖励数据
      request('connector.miniHandler.minifarm',
        {
          uid: uid, themeId: 10001, token: token, gameId: 40001, index: 8
        }, function (res, reqId) {
          cc.log('获得小游戏数据:');
          cc.log(JSON.stringify(res));

        });

      // 获得在线奖励数据
      request('connector.miniHandler.minifarm',
        {
          uid: uid, themeId: 10001, token: token, gameId: 40001, index: 9
        }, function (res, reqId) {
          cc.log('获得小游戏数据:');
          cc.log(JSON.stringify(res));

        });

      // 获得在线奖励数据
      request('connector.miniHandler.minifarm',
        {
          uid: uid, themeId: 10001, token: token, gameId: 40001, index: 10
        }, function (res, reqId) {
          cc.log('获得小游戏数据:');
          cc.log(JSON.stringify(res));

        });
    });

  });
}


test(pomelo, 100000 + offset);

