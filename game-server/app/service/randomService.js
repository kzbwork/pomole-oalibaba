/**
 *
 * Author:
 * Date:
 */

'use strict';

let co = require('co');
let net = require('net');

let RandomService = function (app) {
  this.app = app;

  this.randomCache = [];
  this.isRequesting = false;
};

module.exports = function (app) {
  return new RandomService(app);
};

let pro = RandomService.prototype;

pro.init = function () {
  let self = this;
  return co(function *() {
    let result = yield self.requireRandom();
    if (result && result.length > 0) {
      self.randomCache = self.randomCache.concat(result);
    }
  });
};

pro.requestRandomNum = function () {
  let self = this;
  return co(function *() {
    // return Math.random();
    if (self.randomCache.length > 250) {
      console.log(`customRandom: use cache, length = ${self.randomCache.length}`);
      return self.randomCache.pop();
    } else if (self.randomCache.length > 180) {
      if (!self.isRequesting) {
        self.isRequesting = true;
        self.requireRandom().then(function (result) {
          if (result && result.length > 0) {
            self.randomCache = self.randomCache.concat(result);
          }
        });
      }

      return self.randomCache.pop();
    } else {
      console.log('customRandom: request new random');
      let result = undefined;
      for (let i = 0; i < 3; ++i) {
        result = yield self.requireRandom();
        if (result) {
          break;
        }
      }
      if (result && result.length > 0) {
        self.randomCache = self.randomCache.concat(result);
        console.log(`customRandom: randomCache.length = ${self.randomCache.length}`);
        return self.randomCache.pop();
      } else {
        return Math.random();
      }
    }
  });
};

pro.requireRandom = function () {
  return new Promise(function (resolve, reject) {
    let client = net.connect({port: 8124}, function() { //'connect' listener
      console.log('connected to server!');
      client.write('random');
    });
    client.on('data', function(data) {
      try {
        let randomArr = JSON.parse(data);
        client.end();
        let result = [];
        for (let i = 0; i < randomArr.length; ++i) {
          if (randomArr[i] < 1) {
            result.push(randomArr[i]);
          }
        }
        client.end();
        console.log(`customRandom: randomArr.length = ${randomArr.length}, result.length = ${result.length}`);
        resolve(result);
      } catch(err) {
        console.log('data error');
        resolve(undefined);
      }
    });
    client.on('end', function() {
      console.log('disconnected from server');
    });
    client.on('error', function (err) {
      console.log('client error:' + err.message);
      resolve(undefined);
    });
    client.on('close', function () {
      console.log('client close');
    });
  });
};
