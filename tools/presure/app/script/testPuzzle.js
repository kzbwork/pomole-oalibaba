/**
 * Created by wyang on 16/6/12.
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
  uid = 5100084;

  var cc = {log: console.log};

  pomelo.init({host: 'localhost', port: 3201}, function () {

    pomelo.on('onUserChange', function (data) {
      cc.log('玩家数据修改:');
      cc.log(JSON.stringify(data));
    });

    pomelo.on('onPuzzleRefresh', function (data) {
      cc.log('拼图数据刷新:');
      cc.log(JSON.stringify(data));
    });

    pomelo.on('onPuzzleChange', function (data) {
      cc.log('奖券数量修改:');
      cc.log(JSON.stringify(data));
    });

    var entryObj = {"type":"imei","data":{"imei":"1234","imsi":"","mac":"","gamePackage":"","gameVersion":"","model":null,"osVersion":"","os":"android","firebase":"","ip":"::ffff:172.18.255.141","channel":"office_cn"}};

    // 进入游戏
    request('connector.entryHandler.entry', entryObj, function (res) {
      cc.log('进入游戏结果：');
      cc.log(JSON.stringify(res));

      for(let i=0;i<1000;i++) {

        // 获得在线奖励数据
        request('connector.puzzleHandler.entry', {}, function (res, reqId) {
          cc.log('获得拼图数据:');
          cc.log(JSON.stringify(res));
        });

        // 获得在线奖励数据
        request('connector.puzzleHandler.spin', {type: 1}, function (res, reqId) {
          cc.log('获得拼图spin1数据:');
          cc.log(JSON.stringify(res));
        });

        // 获得在线奖励数据
        request('connector.puzzleHandler.spin', {type: 2}, function (res, reqId) {
          cc.log('获得拼图spin2数据:');
          cc.log(JSON.stringify(res));
        });

        // 获得在线奖励数据
        request('connector.puzzleHandler.leave', {}, function (res, reqId) {
          cc.log('离开拼图:');
          cc.log(JSON.stringify(res));
        });
      }
    });

  });
}


test(pomelo, 100000 + offset);

