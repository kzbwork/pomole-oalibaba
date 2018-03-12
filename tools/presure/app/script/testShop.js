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

  pomelo.init({host: '121.41.4.17', port: '3201'}, function () {

    pomelo.on('onUserChange', function (data) {
      cc.log('玩家数据修改:');
      cc.log(JSON.stringify(data));
    });

    // 在线奖励数据刷新
    pomelo.on('onOnlineRefresh', function (data) {
      cc.log('在线奖励数据刷新:' + JSON.stringify(data));
    });

    request('connector.entryHandler.entry', {uid: uid, token: token}, function (res) {
      cc.log('进入游戏结果：');
      cc.log(JSON.stringify(res));

      request('connector.shopHandler.getList', {
        uid: uid,
      }, function (res) {
        cc.log('获得商店列表:');
        cc.log(JSON.stringify(res));

      });

      request('connector.shopHandler.getBonus', {
        uid: uid,
      }, function (res) {
        cc.log('获得商店 bonus :');
        cc.log(JSON.stringify(res));

      });

      request('connector.shopHandler.getInfo', {
        uid: uid,
      }, function (res) {
        cc.log('获得商店 cd 时间 :');
        cc.log(JSON.stringify(res));

      });

      request('connector.shopHandler.buy', {
        uid: uid,
        id: 1
      }, function (res) {
        cc.log('购买第一个条目');
        cc.log(JSON.stringify(res));
      });
    });

  });
}


test(pomelo, 100000 + offset);

