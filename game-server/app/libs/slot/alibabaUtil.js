/**
 * 阿里巴巴玩法算法类
 * author: jxyi
 * date: 2017-12-26
 */

'use strict';

let co = require('co');
let dataManager = require('../manager/dataManager');
let baseUtil = require('./baseUtil');
let consts = require('../../consts/consts');
let randomLib = require('../../libs/randomlib');
let slotConst = require('../../service/slot/slotConsts');

let AlibabaUtil = module.exports = {};

const MATRIX_SIZE = [3, 3, 3, 3, 3];
const MAX_ELIMINATE = 20;
const ALIBABA_ELEM = 1;

/**
 * 构建阿里巴巴玩法的配置数据结构
 * @returns {{}}
 */
AlibabaUtil.buildConfig = function () {
  let config = dataManager.getAlibabaConfig();
  let result = {};
  result.base = parseBase(config);
  result.element = parseElement(config);
  result.line = parseLine(config);
  result.coinValue = parseCoinValue(config);
  result.multiplier = parseMultiplier(config);
  result.reward = parseReward(config);
  result.freespin = parseFreeSpin(config);
  result.baseSpin = config.basespin;
  result.freeTest = config.freetest;
  result.bonusTest = config.bonustest;
  result.rewardFreeSpin = config.rewardfreespin;
  result.bonusType = config.bonustype;
  result.bonus = config.bonus;

  return result;
};

/**
 * 解析 base 配置
 * @param config
 */
let parseBase = function (config) {
  return config.base;
};

/**
 * 解析元素配置
 * @param config
 * @returns {{}}
 */
let parseElement = function (config) {
  let result = {};
  result.normal = config.element[consts.ELEMENT_TYPE.NORMAL];
  result.wild = config.element[consts.ELEMENT_TYPE.WILD];
  result.freespin = config.element[consts.ELEMENT_TYPE.FREESPIN];
  result.bonus = config.element[consts.ELEMENT_TYPE.BONUS];
  return result;
};

/**
 * 解析中奖线配置
 * @param config
 */
let parseLine = function (config) {
  let lineList = [];
  for (let line of config.line) {
    let tempLine = [];
    for (let pos of line) {
      tempLine.push({x: pos[0], y: pos[1]});
    }
    lineList.push(tempLine);
  }
  return lineList;
};

/**
 * 解析游戏币与货币换算比，即倍率
 * @param config
 * @returns {*}
 */
let parseCoinValue = function (config) {
  return config.coinvalue;
};

let parseMultiplier = function (config) {
  return config.multiplier;
};

/**
 * 解析中奖项配置
 * @param config
 * @returns {*}
 */
let parseReward = function (config) {
  let rewardConfig = {};
  for (let obj of config.reward) {
    rewardConfig[obj.elem] = rewardConfig[obj.elem] || {};
    rewardConfig[obj.elem][obj.num] = obj.mult;
  }
  return rewardConfig;
};

/**
 * 解析消除 freespin 配置
 * @param config
 * @returns {*}
 */
let parseFreeSpin = function (config) {
  return config.freespin;
};

/**
 * 解析元素 freespin 配置
 * @param config
 * @returns {*}
 */
let parseTurnTable = function (config) {
  return config.turntable;
};

/**
 * 构建初始的布局矩阵
 * @returns {Array}
 */
AlibabaUtil.buildElemMatrix = function (defaultElem) {
  defaultElem = defaultElem || -1;
  let result = [];
  for (let row of MATRIX_SIZE) {
    let list = [];
    for (let i = 0; i < row; ++i) {
      list.push(defaultElem);
    }
    result.push(list);
  }

  return result;
};

/**
 * 计算矩阵中 freespin 元素个数
 * @param matrix
 * @param config
 * @returns {number}
 */
AlibabaUtil.calcFreeElementNum = function (matrix, config) {
  let elemList = config.element[consts.ELEMENT_NAME.FREESPIN];
  let freeNum = 0;
  for (let column of matrix) {
    for (let elem of column) {
      if (elemList.indexOf(elem) >= 0) {
        ++freeNum;
      }
    }
  }

  return freeNum;
};

/**
 * 计算中奖的线
 * @param matrix
 * @param config
 */
AlibabaUtil.calcRewardLines = function (matrix, config) {
  // 中奖的线 id
  let rewardLines = [];

  // 遍历每一条线
  for (let index = 0; index < config.line.length; ++index) {
    let line = config.line[index];

    // 遍历线上的每个点
    let rewardElem = -1;
    for (let pos = 0; pos < line.length; ++pos) {
      if (0 === pos) {
        rewardElem = matrix[line[pos].x][line[pos].y];
      } else {
        let newRewardElem = baseUtil.getRewardElement(rewardElem, matrix[line[pos].x][line[pos].y]);
        if (newRewardElem < 0) {
          if (config.reward[rewardElem] !== undefined && config.reward[rewardElem][pos] !== undefined) {
            rewardLines.push({lineId: index + 1, num: pos, element: rewardElem, reward: config.reward[rewardElem][pos]});
          }
          break;
        } else if (pos === line.length - 1) {
          rewardElem = newRewardElem;
          if (config.reward[rewardElem] !== undefined && config.reward[rewardElem][pos] !== undefined) {
            rewardLines.push({lineId: index + 1, num: pos + 1, element: rewardElem, reward: config.reward[rewardElem][pos + 1]});
          }
          break;
        } else {
          rewardElem = newRewardElem;
        }
      }
    }
  }

  return rewardLines;
};

/**
 * 计算元素 freespin 数据
 * @param matrix
 * @param config
 * @returns {{freeTime: number, optionTimes: Array}}
 */
AlibabaUtil.calcElemFree = function (matrix, config) {
  return co(function *() {
    let freeNum = 0;
    for (let x = 0; x < MATRIX_SIZE.length; ++x) {
      for (let y = 0, maxY = MATRIX_SIZE[x]; y < maxY; ++y) {
        let elementList = config.element[consts.ELEMENT_NAME.FREESPIN];
        if (elementList.indexOf(matrix[x][y]) >= 0) {
          ++freeNum;
        }
      }
    }

    let result = {
      freeTime: 0,
      optionTimes: []
    };

    if (freeNum >= config.base.freespincount) {
      result.freeTime = yield randomLib.randomSelect(config.turnTable.time, config.turnTable.weight);
      result.optionTimes = config.turnTable.weight.copy();
    }

    return result;
  });
};

/**
 * 计算消除 freespin 数据
 * @param eliminateTime
 * @param config
 */
AlibabaUtil.calcEliminateFree = function (eliminateTime, config) {
  let maxEliminateTime = 0;
  for (let key in config.freespin) {
    if (isNaN(key) === false) {
      let num = parseInt(key);
      maxEliminateTime = Math.max(num, maxEliminateTime);
    }
  }

  eliminateTime = Math.min(maxEliminateTime, eliminateTime);

  return config.freespin[eliminateTime] === undefined ? 0 : config.freespin[eliminateTime];
};

/**
 * 普通模式获取每一列的随机元素
 * @param column
 * @param spinType
 * @param config
 * @returns {*}
 */
AlibabaUtil.getRandomElem = function (column, spinType, config) {
  return co(function *() {
    if (column < 0 || column > MATRIX_SIZE.length - 1 ) {
      return -1;
    }

    let elemConfig = config.baseSpin;
    switch (spinType) {
      case slotConst.SPIN_TYPE.NORMAL:
        elemConfig = config.baseSpin;
        break;
      case slotConst.SPIN_TYPE.ELIMINATE:
        elemConfig = config.rewardFreeSpin;
        break;
      default:
        break;
    }

    let elemList = [];
    let ratioList = [];
    for (let key in elemConfig) {
      elemList.push(parseInt(key));
      ratioList.push(elemConfig[key][column]);
    }

    return yield randomLib.randomSelect(elemList, ratioList);
  });
};

/**
 * 计算中奖线信息
 * @param matrix
 * @param config
 * @returns {{lines: Array, totalWin: number}}
 */
AlibabaUtil.calcRewardInfo = function (matrix, config) {
  let rewardLines = AlibabaUtil.calcRewardLines(matrix, config);
  let lines = [];
  let rewardDetails = {};
  let totalWin = 0;
  for (let lineInfo of rewardLines) {
    lines.push({lineId: lineInfo.lineId, num: lineInfo.num});
    totalWin += lineInfo.reward;
    let key = `${lineInfo.element}-${lineInfo.num}`;
    if (rewardDetails[key] === undefined) {
      rewardDetails[key] = 0;
    }
    ++rewardDetails[key];
  }

  return {
    lines: lines,
    totalWin: totalWin,
    rewardDetails: rewardDetails
  };
};

/**
 * 填充落下的矩阵
 * @param matrix
 * @param endIndex
 * @param reelConfig
 * @returns {Array}
 */
AlibabaUtil.fillMatrix = function (matrix, endIndex, reelConfig) {
  let extraMatrix = [];

  let keyList = ['reel1', 'reel2', 'reel3', 'reel4', 'reel5'];
  for (let x = 0, maxColumn = matrix.length; x < maxColumn; ++x) {
    extraMatrix.push([]);

    let list = matrix[x];
    let key = keyList[x];
    for (let y = 0, maxRow = list.length; y < maxRow; ++y) {
      if (list[y] === -1) {
        list[y] = reelConfig[key][endIndex[x] % reelConfig[key].length];
        endIndex[x] = (endIndex[x] + 1) % reelConfig[key].length;
        extraMatrix[x].push(list[y]);
      }
    }
  }

  return extraMatrix;
};

/**
 * 普通 spin，可以出现 freespin 元素和消除
 * @param matrix
 * @param config
 * @returns {{totalWin: number, lines: Array, eliminatedMatrix: undefined, totalEliminateTime: number}}
 */
AlibabaUtil.fillMatrixForNone = function (matrix, config) {
  return co(function *() {
    let result = {
      totalWin: [],
      lines: [],
      eliminatedMatrix: undefined,
      totalEliminateTime: 0,
      rewardDetails: {}
    };

    let endIndex = yield baseUtil.buildEndIndex(matrix, config.baseSpin);
    baseUtil.fillMatrixWithWheel(matrix, endIndex, config.baseSpin);

    // 计算矩阵布局
    let eliminatedMatrix = baseUtil.cloneMatrix(matrix);
    for (let eliminateTimes = 0; eliminateTimes < MAX_ELIMINATE; ++eliminateTimes) {
      let rewardInfo = AlibabaUtil.calcRewardInfo(eliminatedMatrix, config);
      result.totalWin.push(rewardInfo.totalWin);

      for (let key in rewardInfo.rewardDetails) {
        if (result.rewardDetails[key] === undefined) {
          result.rewardDetails[key] = 0;
        }
        result.rewardDetails[key] += rewardInfo.rewardDetails[key];
      }

      if (rewardInfo.lines.length > 0) {
        result.lines.push(rewardInfo.lines);
        baseUtil.eliminateMatrix(eliminatedMatrix, rewardInfo.lines, config);
        baseUtil.fallMatrix(eliminatedMatrix);
        let extMatrix = AlibabaUtil.fillMatrix(eliminatedMatrix, endIndex, config.baseSpin);
        baseUtil.concatMatrix(matrix, extMatrix);
        ++result.totalEliminateTime;
      } else {
        break;
      }
    }

    result.eliminatedMatrix = eliminatedMatrix;

    return result;
  });
};

/**
 * 测试 freespin
 * @param matrix
 * @param config
 * @returns {*}
 */
AlibabaUtil.fillMatrixForTestFree = function (matrix, config) {
  return co(function *() {
    let result = {
      totalWin: [],
      lines: [],
      eliminatedMatrix: undefined,
      totalEliminateTime: 0,
      rewardDetails: {}
    };

    let endIndex = yield baseUtil.buildEndIndex(matrix, config.freeTest);
    baseUtil.fillMatrixWithWheel(matrix, endIndex, config.freeTest);

    // 计算矩阵布局
    let eliminatedMatrix = baseUtil.cloneMatrix(matrix);
    for (let eliminateTimes = 0; eliminateTimes < MAX_ELIMINATE; ++eliminateTimes) {
      let rewardInfo = AlibabaUtil.calcRewardInfo(eliminatedMatrix, config);
      result.totalWin.push(rewardInfo.totalWin);

      for (let key in rewardInfo.rewardDetails) {
        if (result.rewardDetails[key] === undefined) {
          result.rewardDetails[key] = 0;
        }
        result.rewardDetails[key] += rewardInfo.rewardDetails[key];
      }

      if (rewardInfo.lines.length > 0) {
        result.lines.push(rewardInfo.lines);
        baseUtil.eliminateMatrix(eliminatedMatrix, rewardInfo.lines, config);
        baseUtil.fallMatrix(eliminatedMatrix);
        let extMatrix = AlibabaUtil.fillMatrix(eliminatedMatrix, endIndex, config.freeTest);
        baseUtil.concatMatrix(matrix, extMatrix);
        ++result.totalEliminateTime;
      } else {
        break;
      }
    }

    result.eliminatedMatrix = eliminatedMatrix;

    return result;
  });
};

/**
 * 测试 bonus
 * @param matrix
 * @param config
 * @returns {*}
 */
AlibabaUtil.fillMatrixForTestBonus = function (matrix, config) {
  return co(function *() {
    let result = {
      totalWin: [],
      lines: [],
      eliminatedMatrix: undefined,
      totalEliminateTime: 0,
      rewardDetails: {}
    };

    let endIndex = yield baseUtil.buildEndIndex(matrix, config.bonusTest);
    baseUtil.fillMatrixWithWheel(matrix, endIndex, config.bonusTest);

    // 计算矩阵布局
    let eliminatedMatrix = baseUtil.cloneMatrix(matrix);
    for (let eliminateTimes = 0; eliminateTimes < MAX_ELIMINATE; ++eliminateTimes) {
      let rewardInfo = AlibabaUtil.calcRewardInfo(eliminatedMatrix, config);
      result.totalWin.push(rewardInfo.totalWin);

      for (let key in rewardInfo.rewardDetails) {
        if (result.rewardDetails[key] === undefined) {
          result.rewardDetails[key] = 0;
        }
        result.rewardDetails[key] += rewardInfo.rewardDetails[key];
      }

      if (rewardInfo.lines.length > 0) {
        result.lines.push(rewardInfo.lines);
        baseUtil.eliminateMatrix(eliminatedMatrix, rewardInfo.lines, config);
        baseUtil.fallMatrix(eliminatedMatrix);
        let extMatrix = AlibabaUtil.fillMatrix(eliminatedMatrix, endIndex, config.bonusTest);
        baseUtil.concatMatrix(matrix, extMatrix);
        ++result.totalEliminateTime;
      } else {
        break;
      }
    }

    result.eliminatedMatrix = eliminatedMatrix;

    return result;
  });
};

/**
 * 将指定元素扩展到整列
 * @param matrix
 * @param targetElem
 * @returns {*}
 */
AlibabaUtil.extendTargetElem = function (matrix, targetElem) {
  let clonedMatrix = baseUtil.cloneMatrix(matrix);
  for (let x = 0; x < clonedMatrix.length; ++x) {
    let column = clonedMatrix[x];
    let hasTarget = false;
    for (let y = 0; y < column.length; ++y) {
      if (column[y] === targetElem) {
        hasTarget = true;
        break;
      }
    }

    if (hasTarget === true) {
      for (let y = 0; y < column.length; ++y) {
        column[y] = targetElem;
      }
    }
  }

  return clonedMatrix;
};

/**
 * 消除奖励的 freespin
 * @param matrix
 * @param config
 * @returns {{totalWin: number, lines: Array, eliminatedMatrix: undefined, totalEliminateTime: number}}
 */
AlibabaUtil.fillMatrixForElinimateFree = function (matrix, config) {
  return co(function *() {
    let result = {
      totalWin: [],
      lines: [],
      eliminatedMatrix: undefined,
      totalEliminateTime: 0,
      rewardDetails: {}
    };

    let endIndex = yield baseUtil.buildEndIndex(matrix, config.rewardFreeSpin);
    AlibabaUtil.fillMatrix(matrix, endIndex, config.rewardFreeSpin);

    // 计算矩阵布局
    let eliminatedMatrix = baseUtil.cloneMatrix(matrix);
    let rewardInfo = AlibabaUtil.calcRewardInfo(eliminatedMatrix, config);
    result.totalWin.push(rewardInfo.totalWin);

    if (rewardInfo.lines.length > 0) {
      result.lines.push(rewardInfo.lines);
    }

    for (let key in rewardInfo.rewardDetails) {
      if (result.rewardDetails[key] === undefined) {
        result.rewardDetails[key] = 0;
      }
      result.rewardDetails[key] += rewardInfo.rewardDetails[key];
    }

    let alibabaNum = baseUtil.calcExactElemNum(eliminatedMatrix, ALIBABA_ELEM);
    if (rewardInfo.lines.length > 0 && alibabaNum > 0) {
      eliminatedMatrix = AlibabaUtil.extendTargetElem(eliminatedMatrix, ALIBABA_ELEM);
      let extendRewardInfo = AlibabaUtil.calcRewardInfo(eliminatedMatrix, config);
      result.totalWin.push(extendRewardInfo.totalWin);
      if (extendRewardInfo.lines.length > 0) {
        result.lines.push(extendRewardInfo.lines);
      }

      for (let key in extendRewardInfo.rewardDetails) {
        if (result.rewardDetails[key] === undefined) {
          result.rewardDetails[key] = 0;
        }
        result.rewardDetails[key] += extendRewardInfo.rewardDetails[key];
      }
    }

    result.eliminatedMatrix = matrix;

    return result;
  });
};

/**
 * 计算小游戏使用的配置
 * @param config
 * @returns {*}
 */
AlibabaUtil.calcMiniGame = function (config) {
  return co(function *() {
    let bonusConfig = config.bonus;
    let index = yield randomLib.randomInt(0, bonusConfig.length);
    return bonusConfig[index];
  });
};

/**
 * 解析玩家选择的小游戏选项
 * @param miniConfig
 * @param length
 * @param config
 * @returns {*}
 */
AlibabaUtil.parseMiniHistory = function (miniConfig, length, config) {
  let history = [];
  for (let i = 0; i < length; ++i) {
    let obj = config.bonusType[miniConfig[i]];
    if (obj) {
      history.push({
        type: obj.type,
        num: obj.value
      });
    } else {
      return undefined;
    }
  }

  return history;
};

/**
 * 计算中奖的规模，用于播放对应动画
 * @param win
 * @param bet
 * @param config
 * @returns {number}
 */
AlibabaUtil.calcRewardSize = function (win, bet, config) {
  let size = slotConst.WIN_SIZE.NORMAL;
  if (win >= config.base.bigwin * bet) {
    size = slotConst.WIN_SIZE.BIG_WIN;
  }
  return size;
};

