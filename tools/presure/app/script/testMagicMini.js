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

      request('connector.miniHandler.magicChoose', {gameId: 40002}, function (res) {
        cc.log('获得选择游戏数据:');
        cc.log(JSON.stringify(res));

        request('connector.miniHandler.miniMagic', {
          gameId: 40002, index: 1, gameType: 2
        }, function (res) {
          cc.log('获得魔法主题数据:');
          cc.log(JSON.stringify(res));
        });

        request('connector.miniHandler.miniMagic', {
          gameId: 40002, index: 2, gameType: 2
        }, function (res) {
          cc.log('获得魔法主题数据:');
          cc.log(JSON.stringify(res));
        });

        request('connector.miniHandler.miniMagic', {
          gameId: 40002, index: 3, gameType: 2
        }, function (res) {
          cc.log('获得魔法主题数据:');
          cc.log(JSON.stringify(res));
        });
      });
    });
  });
}


test(pomelo, 100000 + offset);

