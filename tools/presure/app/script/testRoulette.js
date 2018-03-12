/**
 * Created by zhljian on 2016/10/9.
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

function test(pomelo, uid) {
  uid = 1000023;
  var token = 'TEST_TOKEN';

  var cc = {log: console.log};

  pomelo.init({host: 'localhost', port: '3010'}, function () {

    //进入游戏
    request('connector.entryHandler.entry', {uid: uid, token: token}, function (res) {
      cc.log('进入游戏结果：');
      cc.log(JSON.stringify(res));

      request('connector.miniHandler.minichinaenter', {gameId: 40003}, function (res) {
        cc.log('获得进入游戏数据:');
        cc.log(JSON.stringify(res));

        request('connector.miniHandler.minichina', {gameId: 40003, index: 0}, function (res) {
          cc.log('获得中国风主题数据:');
          cc.log(JSON.stringify(res));
        });

        request('connector.miniHandler.minichina', {gameId: 40003, index: 5}, function (res) {
          cc.log('获得中国风主题数据:');
          cc.log(JSON.stringify(res));
        });

        request('connector.miniHandler.minichina', {gameId: 40003, index: 13}, function (res) {
          cc.log('获得中国风主题数据:');
          cc.log(JSON.stringify(res));
        });
      });
    });
  });
}


test(pomelo, 100000 + offset);