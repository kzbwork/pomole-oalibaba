/**
 * slot 基础算法类
 * author: jxyi
 * date: 2017-12-26
 */

'use strict';

let co = require('co');
let consts = require('../../consts/consts');
let randomLib = require('../../libs/randomlib');

let BaseUtil = module.exports = {};

/**
 * 将二维矩阵转化为可以协议压缩的结构
 * @param matrix
 * @returns {Array}
 */
BaseUtil.parseMatrix = function (matrix) {
  let result = [];

  for (let column of matrix) {
    let temp = [];
    for (let elem of column) {
      temp.push(elem);
    }
    result.push({
      noname: temp
    });
  }

  return result;
};

/**
 * 获取有效的元素列表
 * @param config
 * @param typeList
 * @returns {Array}
 */
BaseUtil.getValidElements = function (config, typeList) {
  let tempTypeList = Array.isArray(typeList) ? typeList : [];

  let validList = [];
  for (let type of tempTypeList) {
    if (config.element.hasOwnProperty(type)) {
      validList = validList.concat(config.element[type].slice(0));
    }
  }

  return validList;
};

/**
 * 填充矩阵，会修改原始矩阵
 * @param matrix
 * @param elemTypeList
 * @param config
 * @returns {*}
 */
BaseUtil.fillMatrix = function (matrix, elemTypeList, config) {
  return co(function *() {
    let validElem = BaseUtil.getValidElements(config, elemTypeList);

    let filledMatrix = [];

    for (let x = 0, maxColumn = matrix.length; x < maxColumn; ++x) {
      filledMatrix.push([]);
      let list = matrix[x];
      for (let y = 0, maxRow = list.length; y < maxRow; ++y) {
        if (list[y] === -1) {
          list[y] = yield randomLib.randomOne(validElem);
          filledMatrix[x].push(list[y]);
        }
      }
    }

    return filledMatrix;
  });
};

/**
 * 创建卷轴结束位置的标记数据
 * @param matrix
 * @param reelConfig
 */
BaseUtil.buildEndIndex = function (matrix, reelConfig) {
  return co(function *() {
    let keyList = ['reel1', 'reel2', 'reel3', 'reel4', 'reel5'];
    let endIndex = [];
    for (let i = 0; i < matrix.length; ++i) {
      let key = keyList[i];
      let randomNum =  yield randomLib.randomInt(0, reelConfig[key].length);
      endIndex.push(randomNum);
    }
    return endIndex;
  });
};

/**
 * 以滚轮方式填充矩阵，会全覆盖矩阵
 * @param matrix
 * @param endIndex
 * @param reelConfig
 * @returns {*}
 */
BaseUtil.fillMatrixWithWheel = function (matrix, endIndex, reelConfig) {
  let keyList = ['reel1', 'reel2', 'reel3', 'reel4', 'reel5'];
  for (let x = 0; x < keyList.length && x < matrix.length; ++x) {
    let key = keyList[x];
    let reel = reelConfig[key];
    let startIndex = endIndex[x];
    for (let y = 0; y < matrix[x].length; ++y) {
      matrix[x][y] = reel[(startIndex + y) % reel.length];
    }
    endIndex[x] = (startIndex + matrix[x].length) % reel.length;
  }

  return matrix;
};

/**
 * 克隆矩阵
 * @param matrix
 * @returns {*}
 */
BaseUtil.cloneMatrix = function (matrix) {
  if (Array.isArray(matrix)) {
    let tempMatrix = [];
    for (let column of matrix) {
      let arr = [];
      for (let elem of column) {
        arr.push(elem);
      }
      tempMatrix.push(arr);
    }
    return tempMatrix;
  } else {
    return undefined;
  }
};

/**
 * 连接两个矩阵，将额外矩阵按列叠加到目标矩阵上
 * @param matrix
 * @param extMatrix
 */
BaseUtil.concatMatrix = function (matrix, extMatrix) {
  for (let x = 0; x < matrix.length && x < extMatrix.length; ++x) {
    for (let y = 0; y < extMatrix[x].length; ++y) {
      if (Array.isArray(matrix[x]) === false) {
        matrix[x] = [];
      }
      matrix[x].push(extMatrix[x][y]);
    }
  }

  return matrix;
};

/**
 * 计算新的中奖元素
 * @param originRewardElem
 * @param nextElem
 * @returns {*}
 */
BaseUtil.getRewardElement = function (originRewardElem, nextElem) {
  if (originRewardElem === consts.SPECIAL_ELEMENT.WILD) {
    return nextElem;
  } else if (nextElem === consts.SPECIAL_ELEMENT.WILD) {
    return originRewardElem;
  } else {
    return originRewardElem === nextElem ? originRewardElem : -1
  }
};

/**
 * 布局矩阵消除
 * @param matrix
 * @param rewardLines
 * @param config
 * @returns {*}
 */
BaseUtil.eliminateMatrix = function (matrix, rewardLines, config) {
  for (let lineInfo of rewardLines) {
    let line = config.line[lineInfo.lineId - 1];
    for (let i = 0; i < lineInfo.num; ++i) {
      let pos = line[i];
      matrix[pos.x][pos.y] = -1;
    }
  }

  return matrix;
};

/**
 * 布局矩阵下落
 * @param matrix
 */
BaseUtil.fallMatrix = function (matrix) {
  for (let x = 0; x < matrix.length; ++x) {
    let column = matrix[x];
    let emptyY = 0;
    for (let y = 0; y < column.length; ++y) {
      if (column[y] >= 0 && column[emptyY] < 0) {
        let temp = column[y];
        column[y] = column[emptyY];
        column[emptyY] = temp;
      }

      if (column[emptyY] >= 0) {
        ++emptyY;
      }
    }
  }
};

/**
 * 计算某一类元素的个数
 * @param matrix
 * @param elemType
 * @param config
 * @returns {number}
 */
BaseUtil.calcElemNum = function (matrix, elemType, config) {
  let elemList = config.element[elemType];
  if (elemList === undefined) {
    return 0;
  }

  let num = 0;
  for (let x = 0; x < matrix.length; ++x) {
    for (let y = 0; y < matrix[x].length; ++y) {
      if (elemList.indexOf(matrix[x][y]) >= 0) {
        ++num;
      }
    }
  }

  return num;
};

/**
 * 计算某一种元素的个数
 * @param matrix
 * @param elemId
 * @returns {number}
 */
BaseUtil.calcExactElemNum = function (matrix, elemId) {
  let num = 0;
  for (let x = 0; x < matrix.length; ++x) {
    for (let y = 0; y < matrix[x].length; ++y) {
      if (matrix[x][y] === elemId) {
        ++num;
      }
    }
  }

  return num;
};



















