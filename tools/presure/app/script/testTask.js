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
  uid = 100001;
  var token = 'TEST_TOKEN';

  var cc = {log: console.log};

  pomelo.init({host: 'localhost', port: '3201'}, function () {

    pomelo.on('onUserChange', function (data) {
      cc.log('玩家数据修改:');
      cc.log(JSON.stringify(data));
    });

    var entryObj = {"type":"imei","data":{"imei":"testrobot","imsi":"","mac":"","gamePackage":"","gameVersion":"","model":null,"osVersion":"","os":"android","firebase":"","ip":"::ffff:172.18.255.141","channel":"office_cn"}};

    // 进入游戏
    request('connector.entryHandler.entry', entryObj, function (res) {
      cc.log('进入游戏结果：');
      cc.log(JSON.stringify(res));

      // 获得在线奖励数据
      request('connector.taskHandler.getList', {}, function (res, reqId) {
        cc.log('获得任务数据:');
        cc.log(JSON.stringify(res));
      });

      // 获得在线奖励数据
      request('connector.taskHandler.getTask', {taskId: 'm01001'}, function (res, reqId) {
        cc.log('获得任务数据:');
        cc.log(JSON.stringify(res));
      });

      // 获得在线奖励数据
      request('connector.taskHandler.getTaskReward', {taskId: 'm01001'}, function (res, reqId) {
        cc.log('获得任务奖励:');
        cc.log(JSON.stringify(res));
      });
    });

  });
}


test(pomelo, 100000 + offset);

