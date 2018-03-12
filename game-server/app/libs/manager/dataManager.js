/**
 * Created by wyang on 16/4/24.
 * 管理数据,提供获得数据,清除数据的接口
 */
'use strict';

let dataManager = {};
let path = require('path');
let dataDir = path.join(__dirname, '../../../config/data/');
let constDir = path.join(__dirname, '../../../config/constConfig');

/**
 * 获取通用配置
 * @returns {*}
 */
dataManager.getConfig = function () {
  let filename = path.join(dataDir, 'config.json');
  return require(filename);
};

/**
 * 清除所有的数据
 * delete require.cache[]
 */
dataManager.clearAllData = function () {
  let keys = Object.keys(require.cache);

  for(let item of keys){
    if (item.indexOf(dataDir) === 0){
      console.log('clear data:' + require.resolve(item));
      delete require.cache[require.resolve(item)];
    }
  }

  for(let item of keys){
    if (item.indexOf(constDir) === 0){
      console.log('clear data:' + require.resolve(item));
      delete require.cache[require.resolve(item)];
    }
  }
};

/**
 * 获取系统邮件配置
 * @return {Object|*}
 */
dataManager.getSystemMailConfig = function () {
  let filename = path.join(dataDir, 'systemMail.json');
  return require(filename);
};

/**
 * 获取阿里巴巴玩法配置
 * @returns {Object|*}
 */
dataManager.getAlibabaConfig = function () {
  let filename = path.join(dataDir, 'alibaba.json');
  return require(filename);
};

module.exports = dataManager;
