/**
 * Created by wyang on 16/9/5.
 * 数据管理器
 */

let util = require('util');
let EventEmitter = require('events').EventEmitter;
let BaseData = require('./baseData');

let DataService = function (docSync, name, dataClass) {
  this.CHANGED = 'changed';
  this.docSync = docSync;
  this.name = name;
  this.dataClass = dataClass;

  if (this.docSync) {
    this.collection = docSync.getCollection(name);
    this.keys = Object.keys(this.collection.schema);
    // 必须的键
    this.keysMust = this.collection.getKeyNames();
  }

  // 存数据的对象
  this.datas = {};

};

util.inherits(DataService, EventEmitter);

let pro = DataService.prototype;

module.exports = DataService;

/**
 *  加载或者获得数据,如果内存有则以内存为准
 * @param obj 参数参考 config/schemas.json
 */
pro.loadData = function (obj) {

  let self = this;
  let resultPromise = new Promise(function (resolve, reject) {
    let key = self.collection.getKey(obj);
    let memeryData = self.datas[key];

    if (memeryData) {
      resolve(memeryData);
    } else {
      let promise = self.docSync.get(self.name, obj);
      promise.then(function (res) {
        if (res) {

          if (self.dataClass) {
            let data = new self.dataClass();
            if (data.setService) {
              data.setService(self);
            }
            if (data.mergeData) {
              data.mergeData(res);
            }
            self.addData(data);
            if (data.onLoad) {
              data.onLoad();
            }
            resolve(data);
          } else {
            resolve(res);
          }

        } else {
          resolve(undefined);
        }

      }, function (err) {
        reject(err);
      });
    }
  });

  return resultPromise;
};

/**
 * 重置到默认数据
 * @param BaseData
 * @return BaseData
 */
pro.setDefault = function (baseData) {
  if(!baseData){
    return baseData;
  }

  let schema = this.collection.schema;
  let keys = this.keys;
  
  for (let item of keys) {
    baseData[item] = schema[item]['default'];
  }

  return baseData;
};

/**
 * 检查是否包含必须的键
 * @param obj
 * @return Boolean 是否包含必须的键
 */
pro.checkKeysMust = function (obj) {
  let keysMust = this.keysMust;

  for (let item of keysMust) {
    if (obj[item] === undefined) {
      return false;
    }
  }

  return true;
};

/**
 * 创建数据实例
 * @obj
 * @return {*}
 */
pro.newData = function (obj) {
  let result;

  if (!this.checkKeysMust(obj)) {
    throw new Error('obj must has key data:' + this.keysMust);
  }

  if (this.dataClass) {
    result = new this.dataClass();
    if (!(result instanceof BaseData)) {
      throw new Error('dataClass must be subdDclass of BaseData');
    }

    if (result.setService) {
      result.setService(this);
    }
    result.mergeData(obj);

    this.addData(result);
  }
  return result;
};

/**
 * 从内存获得数据,内存没有则为空
 */
pro.getData = function (obj) {
  let key = this.collection.getKey(obj);
  let memoryData = this.datas[key];

  return memoryData;
};

/**
 * 获得所有数据
 */
pro.getDatas = function () {
  return this.datas;
};

/**
 * 增加一条数据到内存
 */
pro.addData = function (baseData) {
  let key = this.collection.getKey(baseData);
  if (!this.datas.hasOwnProperty(key)) {
    this.datas[key] = baseData;
  } else {
    return false;
  }

  return true;
};

/**
 * 移除数据
 */
pro.removeData = function (obj) {
  let key = this.collection.getKey(obj);
  delete this.datas[key];
};

pro.deleteData = function (obj) {
  let key = this.collection.getKey(obj);
  delete this.datas[key];

  this.docSync.del(this.name, obj);
};

/**
 * 获得所有数据的键
 */
pro.getKeys = function () {
  return this.keys;
};

/**
 * 使用default数据还原
 */
pro.resetData = function () {

};

/**
 * 修改内存数据
 * @param baseData
 * @param obj
 * @param reason    原因
 */
pro.change = function(baseData, obj, reason){
  let result = baseData.change(obj, reason);
  return result;
};

/**
 * 保存数据
 * @param data
 */
pro.save = function (data) {
  this.docSync.exec(this.name, data.strip());
};


