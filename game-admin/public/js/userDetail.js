/**
 * 用户详情页
 * 包括用户数据图表，增加金币钻石，修改状态
 * Created by jfxu on 30/12/2016.
 */
const STATUS_INTERVAL = 1;
const YAXIS_ARRAY = ['coin',  'level', 'exp']; // y轴数据
const YAXIS_ARRAY_ZH = ['金币',  '等级', '经验'];
const INTERVAL_ARRAY = [1, 2, 3, 4, 5, 10, 20];
const STATE_ARRAY = ['normal', 'banned', 'slience']; // 用户状态分类
const STATE_ARRAY_ZH = ['正常', '封禁', '沉默'];
const LANG_ARRAY = ['en', 'zh'];

const ACTION_TYPE = {
  SET_PROPER: 0
};

let _lang = 'en';
let _langStateArray = STATE_ARRAY;
let _langYaxisArray = YAXIS_ARRAY;

let _chartStore = null; // 存储图表数据的结构
let _cacheData = {
  coin: [],
  level: [],
  exp: []
}; // y 轴数据

let _cacheTime = []; // x 轴数据

let _intervalId = 1; // interval combox 选择的值
let _yaxisId = YAXIS_ARRAY_ZH[0]; // yaxis combox 选择的值
let _uid = 100000;
let _ymax = 0; // y轴最大值
let _chart; // 图表
let seed; // setInterval 返回值

Ext.onReady(function () {

  Ext.BLANK_IMAGE_URL = '../ext-4.0.7-gpl/resources/themes/images/default/tree/s.gif';
  _chartStore = Ext.create('Ext.data.JsonStore', {
    fields: ['data1', 'data2'],
    data: []
  });

  var langStore = Ext.create('Ext.data.Store', {
    fields: ['name', 'lang']
  });

  var langCom = Ext.create('Ext.form.ComboBox', {
    id: 'langComId',
    fieldLabel: 'Lang',
    labelWidth: 60,
    store: langStore,
    queryMode: 'local',
    displayField: 'lang',
    valueField: 'name',
    margin: '8 0 0 10'
  });

  let langButton = Ext.create('Ext.button.Button', {
    id: 'langButtonId',
    xtype: 'button',
    text: 'Change Language',
    handler: changeLanguage,
    width: 150,
    margin: '10 0 0 10'
  });

  let langPanel = Ext.create('Ext.panel.Panel', {
    id: 'langPanelNode',
    layout: 'column',
    autoShow: true,
    region: 'center',
    items: [
      langCom, langButton
    ]
  });

  _chart = Ext.create('Ext.chart.Chart', { // 图表
    animate: true,
    shadow: true,
    store: _chartStore,
    width: 960,
    height: 280,
    axes: [{
      type: 'Numeric',
      minimum: 0,
      maximum: 1,
      position: 'left',
      fields: ['data1'],
      title: 'onlineCount'
    }, {
      type: 'Time',
      position: 'bottom',
      fields: ['data2'],
      title: 'time',
      dateFormat: 'M j G:i:s',
      step: [Ext.Date.MINUTE, 1],
      aggregateOp: 'sum',

      constrain: true,
      fromDate: new Date(Date.now()),
      toDate: new Date(Date.now() + 10 * 60 * 1000)
    }
    ],
    series: [{
      type: 'line',
      axis: ['left', 'bottom'],
      xField: 'data2',
      yField: 'data1',
      tips: {
        trackMouse: true,
        width: 258,
        height: 20,
        renderer: function (klass, item) {
          let storeItem = item.storeItem;

          this.setTitle(storeItem.get('data1'));
        }
      }
    }
    ]
  });

  var yaxisStore = Ext.create('Ext.data.Store', {
    fields: ['name', 'yaxis']
  });

  var yaxisCom = Ext.create('Ext.form.ComboBox', {
    id: 'yaxisComId',
    fieldLabel: 'Y Axis',
    labelWidth: 60,
    store: yaxisStore,
    queryMode: 'local',
    displayField: 'yaxis',
    valueField: 'name',
    margin: '8 0 0 10'
  });


  var intervalStore = Ext.create('Ext.data.Store', {
    fields: ['name', 'interval']
  });

  var intervalCom = Ext.create('Ext.form.ComboBox', {
    id: 'intervalComId',
    fieldLabel: 'Interval(m)',
    labelWidth: 120,
    store: intervalStore,
    queryMode: 'local',
    displayField: 'interval',
    valueField: 'name',
    margin: '8 0 0 10'
  });


  let uidTextField = Ext.create('Ext.form.field.Text', {
    id: 'uidTextId',
    xtype: 'textfield',
    name: 'uid',
    labelWidth: 30,
    fieldLabel: 'Uid',
    allowBlank: false,
    margin: '8 0 0 10'
  });

  //chart of nodes' detailed
  let chartPanel = Ext.create('Ext.panel.Panel', {
    id: 'chartPanelNode',
    autoScroll: true,
    autoShow: true,
    region: 'center',
    items: [{
      layout: 'column',
      border: false,
      anchor: '95%',
      items: [
        yaxisCom, intervalCom, uidTextField, {
          id: 'reloadButtonId',
          xtype: 'button',
          text: 'Reload Chart',
          handler: reloadHandler,
          width: 150,
          margin: '10 0 0 10'
        }
      ]
    },
      _chart
    ]
  });

  let coinTextField = Ext.create('Ext.form.field.Text', {
    id: 'coinTextId',
    xtype: 'textfield',
    name: 'coin',
    labelWidth: 60,
    margin: '8 0 0 10'
  });

  let coinButton = Ext.create('Ext.button.Button', {
    id: 'coinButtonId',
    xtype: 'button',
    text: 'Set Coin',
    handler: setCoin,
    width: 150,
    margin: '10 0 0 10'
  });

  let coinPanel = Ext.create('Ext.panel.Panel', {
    id: 'coinPanelNode',
    layout: 'column',
    autoShow: true,
    region: 'center',
    items: [
      coinTextField, coinButton
    ]
  });

  let stockTextField = Ext.create('Ext.form.field.Text', {
    id: 'stockTextId',
    xtype: 'textfield',
    name: 'stock',
    labelWidth: 60,
    margin: '8 0 0 10'
  });

  let stockButton = Ext.create('Ext.button.Button', {
    id: 'stockButtonId',
    xtype: 'button',
    text: 'Set stock',
    handler: setStock,
    width: 150,
    margin: '10 0 0 10'
  });

  let stockPanel = Ext.create('Ext.panel.Panel', {
    id: 'stockPanelNode',
    layout: 'column',
    autoShow: true,
    region: 'center',
    items: [
      stockTextField, stockButton
    ]
  });

  let levelTextField = Ext.create('Ext.form.field.Text', {
    id: 'levelTextId',
    xtype: 'textfield',
    name: 'level',
    labelWidth: 60,
    margin: '8 0 0 10'
  });

  let levelButton = Ext.create('Ext.button.Button', {
    id: 'levelButtonId',
    xtype: 'button',
    text: 'Set level',
    handler: setLevel,
    width: 150,
    margin: '10 0 0 10'
  });

  let levelPanel = Ext.create('Ext.panel.Panel', {
    id: 'levelPanelNode',
    layout: 'column',
    autoShow: true,
    region: 'center',
    items: [
      levelTextField, levelButton
    ]
  });

  let viewport = new Ext.Viewport({
    layout: 'vbox',
    items: [{
      region: 'north',
      height: 30
    }, langPanel, chartPanel, coinPanel, stockPanel, levelPanel]
  });

  init();
});

/**
 * 循环请求 userDetail model，将数据展示在图表中
 * @param interval
 */
function run(interval) {
  interval = interval || STATUS_INTERVAL;
  let time = interval * 1 * 1000;
  seed = setInterval(function () {
    window.parent.client.request('userDetail', {uid: _uid}, function (err, msg) {
      if (err) {
        return;
      }
      let user = msg;

      if (_uid !== user.uid) {
        return;
      }

      let __data = [];
      for (let i = 0; i < YAXIS_ARRAY.length; i++) {
        let id = YAXIS_ARRAY[i];
        _cacheData[id].push(user[id]);
      }
      _cacheTime.push(new Date());

      let cache = _cacheData[_yaxisId];

      for (let i = 0; i < cache.length; i++) {
        __data.push({
          data1: cache[i],
          data2: _cacheTime[i]
        });

        if (cache[i] > _ymax) {
          _ymax = cache[i];
        }
      }

      let yAxis = _chart.axes.get(0);
      yAxis.title = _yaxisId;
      yAxis.maximum = _ymax;

      _chartStore.loadData(__data);
    });
  }, time);
}

function init(lang) {
  let yaxis = [], interval = [], state = [], langs = [];
  switch (lang) {
    case 'zh':
      _langYaxisArray = YAXIS_ARRAY_ZH;
      _langStateArray = STATE_ARRAY_ZH;
      break;
    default:
      _langYaxisArray = YAXIS_ARRAY;
      _langStateArray = STATE_ARRAY;
      break;
  }
  for (let i = 0, l = _langYaxisArray.length; i < l; i++) {
    item = _langYaxisArray[i];
    yaxis.push({
      name: item,
      yaxis: item
    });
  }

  for (let i = 0, l = INTERVAL_ARRAY.length; i < l; i++) {
    item = INTERVAL_ARRAY[i];
    interval.push({
      name: item,
      interval: item
    });
  }

  for (let i = 0, l = _langStateArray.length; i < l; i++) {
    item = _langStateArray[i];
    state.push({
      name: item,
      state: item
    });
  }

  for (let i = 0, l = LANG_ARRAY.length; i < l; i++) {
    item = LANG_ARRAY[i];
    langs.push({
      name: item,
      lang: item
    });
  }

  Ext.getCmp('yaxisComId').getStore().loadData(yaxis);
  Ext.getCmp('yaxisComId').setValue(yaxis[0]['name']);
  Ext.getCmp('intervalComId').getStore().loadData(interval);
  Ext.getCmp('intervalComId').setValue(interval[0]['name']);
  Ext.getCmp('langComId').getStore().loadData(langs);
  Ext.getCmp('langComId').setValue(langs[0]['name']);
}

/**
 * 如果 uid 或 interval 变了就重新拉数据
 */
function reloadHandler() {
  if (_uid !== Ext.getCmp('uidTextId').getValue()) {
    _uid = Ext.getCmp('uidTextId').getValue();
    clearInterval(seed);
    _cacheTime = [];
    for (let pro in _cacheData) {
      _cacheData[pro] = [];
    }
    _intervalId = Ext.getCmp('intervalComId').getValue();
    clearInterval(seed);
    run(_intervalId);
  }
  if (_intervalId !== Ext.getCmp('intervalComId').getValue()) { // 改变更新频率
    _intervalId = Ext.getCmp('intervalComId').getValue();
    clearInterval(seed);
    run(_intervalId);
  }
  _yaxisId = YAXIS_ARRAY[_langYaxisArray.indexOf(Ext.getCmp('yaxisComId').getValue())];
  _ymax = 0;
  let __data = [];
  let cache = _cacheData[_yaxisId];

  for (let i = 0; i < cache.length; i++) {
    __data.push({
      data1: cache[i],
      data2: _cacheTime[i]
    });

    if (cache[i] > _ymax) {
      _ymax = cache[i];
    }
  }

  let timeAxis = _chart.axes.get(1);
  let yAxis = _chart.axes.get(0);
  yAxis.title = _yaxisId;
  yAxis.maximum = _ymax;

  timeAxis.step = [Ext.Date.MINUTE, _intervalId];
  timeAxis.toDate = new Date(timeAxis.fromDate.getTime() + _intervalId * 10 * 60 * 1000);
  _chart.redraw();
  _chart.redraw();
  _chartStore.loadData(__data);
}

function setCoin() {
  let coin = Ext.getCmp('coinTextId').getValue();
  let uid = Ext.getCmp('uidTextId').getValue();
  if (isNaN(coin) || Number(coin) <= 0 || coin.indexOf('.') > -1) {
    let msg;
    switch (_lang) {
      case 'zh':
        msg = '无效数字';
        break;
      default:
        msg = 'invalid number';
        break;
    }
    alert(msg);
    return;
  }
  window.parent.client.request('userChange', {
    type: ACTION_TYPE.SET_PROPER,
    data: {
      uid: uid,
      proper: {coin: Number(coin)}
    }
  }, function (err, msg) {

  });
}

function setStock() {
  let stock = Ext.getCmp('stockTextId').getValue();
  let uid = Ext.getCmp('uidTextId').getValue();
  if (isNaN(stock) || Number(stock) <= 0 || stock.indexOf('.') > -1) {
    let msg = '无效数字，请使用正整数！';
    alert(msg);
    return;
  }
  window.parent.client.request('userChange', {
    type: ACTION_TYPE.SET_PROPER,
    data: {
      uid: uid,
      proper:{stock: Number(stock)}
    }
  }, function(err, msg) {

  });
}

function setLevel() {
  let level = Ext.getCmp('levelTextId').getValue();
  let uid = Ext.getCmp('uidTextId').getValue();
  if (isNaN(level) || Number(level) <= 0 || level.indexOf('.') > -1) {
    let msg = '无效数字，请使用正整数！';
    alert(msg);
    return;
  }
  window.parent.client.request('userChange', {
    type: ACTION_TYPE.SET_PROPER,
    data: {
      uid: uid,
      proper:{level: Number(level)}
    }
  }, function(err, msg) {

  });
}

function changeLanguage() {

  let lang = Ext.getCmp('langComId').getValue();
  _lang = lang;
  switch (lang) {
    case 'en' :
      Ext.getCmp('langButtonId').setText('Change Language');
      Ext.getCmp('coinButtonId').setText('Add Coin');
      Ext.getCmp('stateButtonId').setText('Change State');
      Ext.getCmp('reloadButtonId').setText('Reload Chart');
      Ext.getCmp('langComId').labelEl.update('Language');
      Ext.getCmp('yaxisComId').labelEl.update('Y Axis');
      Ext.getCmp('intervalComId').labelEl.update('Interval(m)');
      Ext.getCmp('stateTextId').labelEl.update('Reason: ');
      Ext.getCmp('continueTextId').labelEl.update('Continue Time(h): ');
      init('en');
      break;
    case 'zh' :
      Ext.getCmp('langButtonId').setText('修改语言');
      Ext.getCmp('coinButtonId').setText('设置金币');
      Ext.getCmp('stateButtonId').setText('修改状态');
      Ext.getCmp('reloadButtonId').setText('更新图表');
      Ext.getCmp('langComId').labelEl.update('语言');
      Ext.getCmp('yaxisComId').labelEl.update('Y 轴');
      Ext.getCmp('intervalComId').labelEl.update('间隔（分钟）');
      Ext.getCmp('stateTextId').labelEl.update('原因');
      Ext.getCmp('continueTextId').labelEl.update('持续时间(h): ');
      init('zh');
      break;
  }
}