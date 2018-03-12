/**
 * 随机相关的工具函数
 * author: jxyi
 * date; 2017-12-26
 */

'use strict';

require('./shortcodes');
let co = require('co');
let pomelo = require('pomelo');

let randomLib = {};

randomLib.random = function () {
  return co(function *() {
    return yield pomelo.app.randomService.requestRandomNum();
  });
};

/**
 * 随机排序
 * @param arr
 */
randomLib.randomSort = function (arr) {
  arr.sort(function (a, b) {
    return randomLib.random() < 0.5 ? 1 : -1;
  });
};

/**
 * 从一个范围中随机一个整数
 * @param start，起始值（包含）
 * @param end，结束值（不包含）
 * @returns {*}
 */
randomLib.randomInt = function (start, end) {
  return co(function *() {
    let diff = end - start;
    let randomNum = yield randomLib.random();
    let diffRandom = Math.floor(randomNum * diff);

    let result = start + diffRandom;

    return result;
  });
};

/**
 * 随机选取范围内多个整数
 * @param start，起始值（包含）
 * @param end，结束值（不包含）
 * @param num，选取个数
 * @param repeated，是否允许选取值重复
 * @returns {Array}
 */
randomLib.randomInts = function (start, end, num, repeated) {
  let diff = end - start;
  let diffRandom = start - 1;
  let randomResult = start - 1;
  let result = [];

  for (let i = 0; i < num; i++) {
    diffRandom = Math.floor(randomLib.random() * diff);
    randomResult = start + diffRandom;
    if (repeated) {
      result.push(randomResult);
    } else {
      if (-1 === result.indexOf(randomResult)) {
        result.push(randomResult);
      }
    }
  }

  return result;
};

randomLib.randomNum = function (array, num, repeated) {
  repeated = repeated || true;

  let tmpArray = array.copy();
  let result = [];

  if (num >= tmpArray.length) {
    return tmpArray;
  }

  for (let i = 0; i < num; i++) {
    let value = this.randomOne(tmpArray);
    result.push(value);
    if (!repeated) {
      let index = tmpArray.indexOf(value);
      tmpArray.splice(index, 1);
    }
  }

  return result;
};

randomLib.randomOne = function (array) {
  return co(function *() {
    if (array === undefined || array.length === 0) {
      return undefined;
    }

    let randomNum = yield randomLib.random();
    let randomIndex = Math.floor(array.length * randomNum);

    return array[randomIndex];
  });
};

/**
 * 根据一堆权重和对应数量的结果,随机得到一个结果
 * @param ratios 权重列表
 * @param results 结果列表
 * @param total 权重和,不传则为所有权重相加
 */
randomLib.randomSelect = function (results, ratios, total) {
  return co(function *() {
    if (ratios.length !== results.length) {
      throw new Error('error_length');
    }
    total = total || ratios.sum();

    let index = -1;

    let sum = 0;
    let randomNum = yield randomLib.random();
    let temp = total * randomNum;
    for (let i = 0, length = ratios.length; i < length; ++i) {
      sum += ratios[i];
      if (temp < sum) {
        index = i;
        break;
      }
    }

    if (index < results.length && index >= 0) {
      return results[index];
    } else {
      return null;
    }
  });
};


/**
 * 随机取出几个
 * @param elems
 * @param ratios ratios 为 undefined 则完全随机取
 * @param num 要取的个数
 */
randomLib.randomSample = function (elems, ratios, num) {
  let results = [];
  let elemType = typeof 1;

  if (num > elems.length) {
    throw new Error('randomLib randomSample: elems = {0}, ratios = {1}, num = {2}, num > elems.length'.format(
      JSON.stringify(elems), JSON.stringify(ratios), num
    ));
  }

  if (ratios && ratios.length !== elems.length) {
    throw new Error('randomLib randomSample: elems = {0}, ratios = {1}, num = {2}, ratios.length !== elems.length'.format(
      JSON.stringify(elems), JSON.stringify(ratios), num
    ));
  }

  if (elems[0]) {
    elemType = typeof elems[0];
  }

  // 合并重复的元素，并将概率也进行合并
  let elemsDict = {};
  for (let i = 0; i < elems.length; ++i) {
    if (ratios) {
      if (elemsDict[elems[i]]) {
        elemsDict[elems[i]] += ratios[i];
      } else {
        elemsDict[elems[i]] = ratios[i];
      }
    } else {
      if (elemsDict[elems[i]]) {
        elemsDict[elems[i]] += 1;
      } else {
        elemsDict[elems[i]] = 1;
      }
    }
  }

  let elemArr = [];
  let elemRatio = [];
  for (let i in elemsDict) {
    elemArr.push(i);
    elemRatio.push(elemsDict[i]);
  }

  for (let i = 0; i < num; ++i) {
    let temp = randomLib.randomSelect(elemArr, elemRatio);

    if (elemType === (typeof 1)) {
      results.push(Number(temp));
    } else {
      results.push(temp);
    }

    let index = elemArr.indexOf(temp);

    if (index >= 0 && index <= elemArr.length - 1) {
      elemArr.splice(index, 1);
      elemRatio.splice(index, 1);
    }
  }

  return results;
};


module.exports = randomLib;