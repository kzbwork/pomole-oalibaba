/**
 * Created by wyang on 16/5/24.
 *
 * 转换数据表
 * 数据表分为一下这些
 * themes.xlsx 所有主题的配置表
 * levels.xlsx 级别的表
 * 10001.xlsx id为10001的主题的表
 * 40001.xlsx 小游戏的表(每个小游戏的数据表可能不一样)
 *
 * 数据表如何扩展:
 * 如果新增加主题扩展玩法,分两种情况,
 *
 * 1. 如果这个玩法是增加参数,而且这个参数其他主题可能会用到,则增加数据表,修改总逻辑,
 * 2. 如果增加的参数只是这个主题特有的,则另外增加一个表,比如 10001_addon.xlsx
 *
 */

'use strict';

require('../../game-server/app/libs/shortcodes');

var xlsx = require('node-xlsx');
var fs = require('fs');
var path = require('path');
var ejs = require('ejs');
var program = require('commander');

var tool = {};

/**
 * 处理得到一个数据表的有效数据
 * @param sheetData
 */
tool.deal_sheet = function (sheetData) {
  var resultArr = [];

  if (sheetData.length === 0) {
    return resultArr;
  }
  var nameData = sheetData[1];

  var numColumn = sheetData[0].length;
  var length = sheetData.length;
  var numRow = length;

  var firstCell;

  for (let r = 0; r < length; r++) {
    firstCell = sheetData[r][0];
    if ('' === firstCell || undefined === firstCell) {
      numRow = r;
      break;
    }
  }

  for (let i = 2; i < numRow; i++) {
    var obj = {};

    for (let j = 0; j < numColumn; j++) {
      obj[nameData[j]] = sheetData[i][j];
    }
    resultArr.push(obj);
  }

  return resultArr;
};

/**
 * 保存文件
 * @param data
 * @param path
 */
tool.saveFile = function (filePath, data) {
  var dirName = path.dirname(filePath);

  if(fs.existsSync(dirName)) {
    fs.writeFileSync(filePath, data);
  }
};

/**
 * 将excel转换成配置
 * @param path,xlsx文件路径
 * @param sheets,工作簿名称
 * @param templatePaths,模板路径
 * @param savePath,保存路径
 */
tool.convertXlsxToConfig = function (path, sheets, templatePaths, savePath) {
  console.log('开始转换:' + path);
  if (!fs.existsSync(path)) {
    console.warn('{0} does not exist.'.format(path));
    return ;
  }

  var arr = xlsx.parse(path);
  var sheetObj = {};
  var resultObj = {};

  if (sheets.length > 0) {
    for (let item of arr) {
      sheetObj[item.name] = item;
    }
    for (let i = 0; i < sheets.length; i++) {
      let name = sheets[i];
      let templatePath = templatePaths[i];

      if (!sheetObj[name]) {
        continue;
      }
      let sheetData = sheetObj[name].data;

      if (templatePath && fs.existsSync(templatePath)) {
        let template = fs.readFileSync(templatePath, 'utf8');
        let resultStr = ejs.render(template, {data: this.deal_sheet(sheetData)});

        resultStr = resultStr.replace(/\r\n/g, '\n');
        resultObj[name] = resultStr;
      } else {
        resultObj[name] = JSON.stringify(this.deal_sheet(sheetData, null, 2));
      }
    }

    let result = '{';

    for (let i in resultObj) {
      result += '\n' + '\"' + i + '\"' + ':';
      result += resultObj[i];
      result += ',';
    }

    result = result.substr(0, result.length - 1);
    result += '\n' + '}';

    this.saveFile(savePath, result);
  } else {
    let templatePath = templatePaths[0];
    let sheetData = arr[0].data;
    let result;

    if (templatePath && fs.existsSync(templatePath)) {
      let template = fs.readFileSync(templatePath, 'utf8');

      result = ejs.render(template, {data: this.deal_sheet(sheetData)});
    } else {
      result = JSON.stringify(this.deal_sheet(sheetData), null, 2);
    }

    console.log('转换成功:' + savePath);
    this.saveFile(savePath, result);
  }
};

function main () {
  program
    .version('1.1.0')
    .parse(process.argv);

  let xlsxDir = '../../../game-doc/config/';
  let templateDir = 'data_template/';
  let saveDir = '../../game-server/config/data';


  // 数据转换工具的目录
  var convertConfig = require('./config');
  //var clientConfig = convertConfig.client || [];
  var serverConfig = convertConfig.server;

  // 服务端配置
  for (let i = 0; i < serverConfig.length; i++) {
    let config = serverConfig[i];
    let xlsxPath = path.join(xlsxDir, config.xlsxfile);
    let sheets = config.sheets;
    let savePath = path.join(saveDir, config.savefile);
    let templatePaths = [];

    for (let j = 0; j < config.templates.length; j++) {
      let template = config.templates[j];

      if (template) {
        templatePaths.push(path.join(templateDir, template));
      } else {
        templatePaths.push(null);
      }
    }

    tool.convertXlsxToConfig(xlsxPath, sheets, templatePaths, savePath);
  }

  // 客户端配置
  // for (let i = 0; i < clientConfig.length; i++) {
  //   let config = clientConfig[i];
  //   let xlsxPath = path.join(xlsxDir, config.xlsxfile);
  //   let sheets = config.sheets;
  //   let savePath = path.join(clientSaveDir, config.savefile);
  //   let templatePaths = [];
  //
  //   for (let j = 0; j < config.templates.length; j++) {
  //     let template = config.templates[j];
  //
  //     if (template) {
  //       templatePaths.push(path.join(clientTemplateDir, template));
  //     } else {
  //       templatePaths.push(null);
  //     }
  //   }
  //
  //   tool.convertXlsxToConfig(xlsxPath, sheets, templatePaths, savePath);
  // }

  console.log('Done!');
  process.exit(0);
}

main();