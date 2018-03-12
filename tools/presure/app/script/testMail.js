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
  uid = 100002;
  var token = 'TEST_TOKEN';

  var cc = {log: console.log};

  pomelo.init({host: 'localhost', port: '3201'}, function () {

    pomelo.on('onUserChange', function (data) {
      cc.log('玩家数据修改:');
      cc.log(JSON.stringify(data));
    });

    pomelo.on('onMailNotRead', function (data) {
      cc.log('未读邮件数量修改:');
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

      // request('connector.mailHandler.getList', {},  function(res){
      //   console.log('邮件数量:' + res.data.length);
      //   console.log('邮件列表:' + JSON.stringify(res));
      // });

      request('connector.mailHandler.send', {},  function(res){
        console.log(res);
      });

      // request('connector.mailHandler.collect', {mailId: '582ac3a2b07f86d15044b967'}, function(res){
      //   console.log('collect 结果:' + JSON.stringify(res));
      //
      //   request('connector.mailHandler.collectAll', {}, function(res){
      //     console.log('collectAll 结果:' + JSON.stringify(res));
      //   });
      //
      // });
    });

  });
}


test(pomelo, 100000 + offset);

