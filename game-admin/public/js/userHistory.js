/**
 * 用户历史数据展示
 * Created by jfxu on 30/12/2016.
 */
const TIME_OFFSET = 8 * 60 * 60 * 1000;
const YAXIS_ARRAY = ['coin', 'level'];
const YAXIS_ARRAY_ZH = ['金币', '等级'];
const LANG_ARRAY = ['en', 'zh'];

let _langYaxisArray = YAXIS_ARRAY;

let _chartStore = null; // 图表存储结构
let _chart; // 图表
let _uid = 100000;
let _cacheData;
let seed;

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

  _chart = Ext.create('Ext.chart.Chart', {
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
      title: 'y'
    }, {
      type: 'Time',
      position: 'bottom',
      fields: ['data2'],
      title: 'time',
      dateFormat: 'M j G:i:s',
      step: [Ext.Date.HOUR, 1],
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

  let uidTextField = Ext.create('Ext.form.field.Text', {
    id: 'uidTextId',
    xtype: 'textfield',
    name: 'uid',
    fieldLabel: 'Uid',
    labelWidth: 30,
    allowBlank: false,
    margin: '8 0 0 10'
  });

  let startTimeField = Ext.create('Ext.form.field.Text', {
    id: 'startTimeId',
    xtype: 'textfield',
    labelWidth: 200,
    name: 'startTime',
    fieldLabel: 'StartTime (e: 2016-01-03T8:11)',
    allowBlank: false,
    margin: '8 0 0 10'
  });

  let stopTimeField = Ext.create('Ext.form.field.Text', {
    id: 'stopTimeId',
    xtype: 'textfield',
    name: 'stopTime',
    labelWidth: 60,
    fieldLabel: 'StopTime',
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
      items: [{
        xtype: 'label',
        text: 'Chart:',
        margin: '10 10 10 10'
      },
        yaxisCom, uidTextField, startTimeField, stopTimeField, {
          id: 'loadButtonId',
          xtype: 'button',
          text: 'Load',
          handler: loadData,
          width: 150,
          margin: '10 0 0 10'
        }, {
          id: 'refreshButtonId',
          xtype: 'button',
          text: 'Refresh Data',
          handler: refreshData,
          width: 150,
          margin: '10 0 0 10'
        }
      ]
    },
      _chart
    ]
  });

  var viewport = new Ext.Viewport({
    layout: 'vbox',
    items: [{
      region: 'north',
      height: 30
    }, langPanel, chartPanel]
  });

  init();
});

function run() {
  let data;

  let isForce = true;

  seed = setInterval(function () {
    if (isForce) {
      data = {
        uid: _uid,
        force: true
      };
    } else {
      data = {
        uid: _uid
      };
    }
    window.parent.client.request('userHistory', data, function (err, msg) {

      isForce = false;
      if (err) {
        return;
      }

      let history = msg;
      let length = history.length;

      if (!history || length == 0) {
        return;
      }

      if (history[0].uid != _uid) {
        return;
      }

      clearInterval(seed); // 因为服务端获取数据有延迟，所以多次重复获取直到获取到了数据停止
      _cacheData = history;
      loadData();
    });
  }, 3000);
}

function init(lang) {
  let yaxis = [], langs = [];
  switch (lang) {
    case 'zh':
      _langYaxisArray = YAXIS_ARRAY_ZH;
      break;
    default:
      _langYaxisArray = YAXIS_ARRAY;
      break;
  }

  for (let i = 0, l = _langYaxisArray.length; i < l; i++) {
    item = _langYaxisArray[i];
    yaxis.push({
      name: item,
      yaxis: item
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
  Ext.getCmp('langComId').getStore().loadData(langs);
  Ext.getCmp('langComId').setValue(langs[0]['name']);
}


function refreshData() {
  _uid = Ext.getCmp('uidTextId').getValue();
  clearInterval(seed);
  run();
}

/**
 * 将_cacheData显示出来
 */
function loadData() {
  if (!_cacheData || _cacheData.length === 0) {
    return;
  }
  let length = _cacheData.length;
  let startDate = new Date(Ext.getCmp('startTimeId').getValue());
  let stopDate = new Date(Ext.getCmp('stopTimeId').getValue());

  let startTime = startDate === 'Invalid Date' ? new Date(_cacheData[0].time).getTime() : startDate.getTime() - TIME_OFFSET;
  let stopTime = stopDate === 'Invalid Date' ? new Date(_cacheData[length - 1].time).getTime() : stopDate.getTime() - TIME_OFFSET;


  if (startTime > new Date(_cacheData[length - 1].time).getTime() || stopTime < new Date(_cacheData[0].time).getDate()) {
    return;
  }

  startTime = Math.max(startTime, new Date(_cacheData[0].time).getTime());
  stopTime = Math.min(stopTime, new Date(_cacheData[length - 1].time).getTime());

  let yId = YAXIS_ARRAY[_langYaxisArray.indexOf(Ext.getCmp('yaxisComId').getValue())];

  let data = [];
  let ymax = 0;
  for (let item of _cacheData) {
    let time = new Date(item.time).getTime();
    if (time < startTime || time > stopTime) {
      continue;
    }
    if (ymax < item[yId]) {
      ymax = item[yId];
    }
    data.push({
      data1: item[yId],
      data2: new Date(item.time)
    });
  }
  redraw(startTime, stopTime, data, ymax);
}

/**
 * 重画表格
 * @param startTime
 * @param stopTime
 * @param data
 * @param ymax
 */
function redraw(startTime, stopTime, data, ymax) {

  let timeAxis = _chart.axes.get(1);
  let yAxis = _chart.axes.get(0);
  yAxis.title = Ext.getCmp('yaxisComId').getValue();
  yAxis.maximum = ymax;

  timeAxis.fromDate = new Date(startTime);
  timeAxis.toDate = new Date(stopTime);
  _chart.redraw();
  _chartStore.loadData(data);
}

function changeLanguage() {
  let lang = Ext.getCmp('langComId').getValue();
  switch (lang) {
    case 'en' :
      Ext.getCmp('langButtonId').setText('Change Language');
      Ext.getCmp('loadButtonId').setText('Load Data');
      Ext.getCmp('refreshButtonId').setText('Refresh Data');
      Ext.getCmp('langComId').labelEl.update('Language');
      Ext.getCmp('yaxisComId').labelEl.update('Y Axis');
      Ext.getCmp('startTimeId').labelEl.update('StartTime (e: 2016-01-03T8:11)');
      Ext.getCmp('stopTimeId').labelEl.update('StopTime');
      init('en');
      break;
    case 'zh' :
      Ext.getCmp('langButtonId').setText('修改语言');
      Ext.getCmp('loadButtonId').setText('加载数据');
      Ext.getCmp('refreshButtonId').setText('刷新数据');
      Ext.getCmp('langComId').labelEl.update('语言');
      Ext.getCmp('yaxisComId').labelEl.update('Y轴');
      Ext.getCmp('startTimeId').labelEl.update('开始时间 (e: 2016-01-03T8:11)');
      Ext.getCmp('stopTimeId').labelEl.update('终止时间');
      init('zh');
      break;
  }
}