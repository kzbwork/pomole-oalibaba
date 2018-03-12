/**
 * Created by wyang on 16/6/3.
 */

'use strict';

var utils = {};
var childProcess = require('child_process');

utils.exec = function (cmd) {

  var promise = new Promise(function (resolve, reject) {

    var allOutPut = '';

    var exec = childProcess.exec(cmd);
    exec.stdout.on('data', function (data) {
      allOutPut += data.toString();
    });

    exec.stderr.on('data', function (data) {
      allOutPut += data.toString();
    });

    exec.on('close', function (code) {
      var result = {code: code, output: allOutPut};
      resolve(result);
    });

  });

  return promise;

};

utils.getSvnData = function (mstr) {
  if (mstr.indexOf('--------') !== 0) {
    throw new Error(mstr);
  }
  var arr = mstr.split('\n');

  var verData = arr[1].split('|');
  var ver = verData[0].trim();
  var owner = verData[1].trim();
  var time = verData[2].trim();
  var comment = arr[3];

  var result = {
    ver: ver, owner: owner, time: time, comment: comment
  };

  return result;
};

utils.updateSVN = function (dirname) {

};


utils.spawn = function (file, args) {

};

module.exports = utils;