/**
 * Created by wyang on 16/6/12.
 */

var cwd = process.cwd();

var factory = require(cwd + '/lib/pomelo');
var http = require('http');
var https = require('https');

var debug = require('debug')('tools:presure');

var START = 'start';  // 开始(action,reqId)
var END = 'end';      // 结束(action,reqId)
var incr = 'incr';    // 增加(action)
var decr = 'decr';    // 减少(action)

var offset = 1;

var host = '172.16.77.164';

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
let imei = 'pt' + Math.random().toString().substring(2, 13);
function start(themeId, name) {
  http.get({
    hostname: host,
    port: 3101,
    rejectUnauthorized: false,
    path: '/gate/entry?src=' + imei
  }, (res) => {
    var body = '';
    res.on('data', function (d) {
      body += d;
    });
    res.on('end', function () {

      // Data reception is done, do whatever with it!
      console.log(body);
      var data = JSON.parse(body);
      console.log('请求gate结果：');
      console.log(data);
      login(data.data.http.host, data.data.http.port, data.data.http.useSSL, function (uid, token) {
        startGame(data.data.tcp.host, data.data.tcp.port, uid, token, themeId, name);
      });
    });
  });
  // login();
}

function login(host, port, useSSL, callback) {
  var request = (useSSL == 'true' || useSSL == true) ? https : http;
  request.get({
    hostname: host,
    rejectUnauthorized: false,
    port: port,
    path: '/users/loginimei?imei=' + imei
  }, (res) => {
    var body = '';
    res.on('data', function (d) {
      body += d;
    });
    res.on('end', function () {

      // Data reception is done, do whatever with it!
      var data = JSON.parse(body);
      console.log('登录结果:');
      console.log(data);
      callback(data.uid, data.token);
    });
  });
}


function startGame(host, port, uid, token, themeId, name) {
  pomelo.init({host: host, port: port}, function () {

    pomelo.on('onUserChange', function (data) {
      console.log('玩家数据修改:');
      console.log(JSON.stringify(data));
    });

    // 进入游戏
    request('connector.entryHandler.entry', {uid: uid, token: token}, function (res) {
      console.log('进入游戏结果：');
      console.log(JSON.stringify(res));

      // 保存一个主题是否下载
      request('connector.earthHandler.getRankList',
        {}, function (res, reqId) {
          console.log('获得七大洲数据:');
          console.log(JSON.stringify(res));
        });

      // 保存一个主题是否下载
      request('connector.hallHandler.setDownload',
        {themeId: 10001, download: 1}, function (res, reqId) {
          console.log('保存下载状态结果:');
          console.log(JSON.stringify(res));
        });

      // 解锁一个主题
      request('connector.hallHandler.unlock', {themeId: 10001}, function (res, reqId) {
        console.log('解锁主题结果:');
        console.log(JSON.stringify(res));
      });

      // 获得主题列表
      request('connector.hallHandler.getList', {type: 0}, function (res, reqId) {
        console.log('获得大厅结果');
        console.log(JSON.stringify(res));
      });

      // 获得在线奖励数据
      request('connector.onlineHandler.onlineInfo', {}, function (res, reqId) {
        console.log('获得在线奖励数据:');
        console.log(JSON.stringify(res));
        let smallRewardData = res.data["1"];
        let bigRewardData = res.data["2"];
        if (smallRewardData.cd > 0) {
          request('connector.onlineHandler.onlineCD', {
            type: 1,
            cd: smallRewardData.cd
          }, function (res, reqId) {
            console.log('在线奖励秒小奖cd:');
            console.log(JSON.stringify(res));
            lineReward(1);
          });
        } else {
          lineReward(1);
        }

        if (bigRewardData.cd > 0) {
          request('connector.onlineHandler.onlineCD', {
            type: 2,
            cd: bigRewardData.cd
          }, function (res, reqId) {
            console.log('在线奖励秒大奖cd:');
            console.log(JSON.stringify(res));
            lineReward(2);
          });
        } else {
          lineReward(2);
        }
      });

      play(themeId, name);
    });
  });
}

function lineReward(type) {
  request('connector.onlineHandler.onlineReward', {type: 1}, function (res, reqId) {
    console.log('领取在线' + ['0', '小奖', '大奖'][type] + '奖励:');
    console.log(JSON.stringify(res));
  });
}

function play(themeId, name) {
  request('connector.themeHandler.entry', {
    themeId: themeId
  }, function (res, reqId) {

    console.log(themeId, name);
    console.log('进入' + name + '主题:');
    console.log(JSON.stringify(res));
    var maxLine = res.data.maxline;
    setInterval(function () {
      request('connector.spinHandler.' + name + 'Spin', {
        themeid: themeId, numline: Math.floor(Math.random() * maxLine) + 1, bet: 1
      }, function (res, reqId) {
        console.log(name + ' 主题玩游戏:');
        console.log(JSON.stringify(res));
      });
    }, 3000 + Math.random() * 200);
  });
}

var types = 4;
var themeIds = [10001, 10002, 10003, 11001];
var names = ['farm', 'magic', 'china', 'social'];
var i = Math.floor(Math.random() * types);
//i = 0;
start(themeIds[i], names[i]);
