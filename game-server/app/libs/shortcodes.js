/**
 * 工具函数
 * author: jxyi
 * date; 2017-12-27
 */

'use strict';

Array.prototype.sum = function () {
  let result = 0;
  for (let item of this) {
    result += item;
  }

  return result;
};

Array.prototype.copy = function () {

  let result = [];

  for (let item of this) {
    result.push(item);
  }

  return result;
};

Array.prototype.max = function () {
  let maxIndex = 0;
  let max = 0;

  for (let i = 0; i < this.length; i++) {
    if (max < this[i]) {
      max = this[i];
      maxIndex = i;
    }
  }

  return maxIndex;
};

Array.prototype.min = function () {
  let minIndex = 0;
  let min = Infinity;

  for (let i = 0; i < this.length; i++) {
    if (min > this[i]) {
      min = this[i];
      minIndex = i;
    }
  }

  return minIndex;
};

Array.prototype.remove = function (item) {
  let index = this.indexOf(item);
  if (index === -1) {
    return ;
  }

  this.splice(index, 1);
};

String.prototype.format = function () {
  let args = arguments;
  return this.replace(/\{(\d+)\}/g,
    function (m, i) {
      return args[i];
    });
};

String.prototype.trim = function () {
  return this.replace(/^\s*|\s*$/g, '');
};

Math.floorMod = function (num, mod, type) {
  type = type || -1;
  let resultNum = 0;
  switch (type) {
    case -1:
      resultNum = this.floor(num / mod) * mod;
      break;
    case 0:
      resultNum = this.round(num / mod) * mod;
      break;
    case 1:
      resultNum = this.ceil(num / mod) * mod;
      break;
    default:
      break;
  }
  return resultNum;
};

