/**
 * 用户数据列表
 * Created by jfxu on 27/12/2016.
 */

const STATUS_INTERVAL = 1;
const YAXIS_ARRAY = ['onlineCount', 'userCount'];
const YAXIS_ARRAY_ZH = ['在线人数', '用户数'];
const INTERVAL_ARRAY = [1, 2, 3, 4, 5, 10, 20];
const USER_STATE_TEXT = ['normal', 'banned'];
const LANG_ARRAY = ['en', 'zh'];
const STORE_TITLES = ['name', 'uid', 'coin', 'diamond', 'exp', 'level', 'ip', 'connectTime', 'loginAt', 'registerAt', 'state'];
const STORE_TITLES_ZH = ['昵称', 'uid', '金币', '钻石', '经验', '等级', 'ip', '连接市场', '登录时间', '注册时间', '状态'];

let _langYaxisArray = YAXIS_ARRAY;
let _userStore = null;  // 表格存储
let _chartStore = null; // 图表存储
let _chart; // 图表
let _cacheData = {
  onlineCount: [],
  userCount: []
}; // y轴数据
let _cacheTime = []; // x 轴时间数据
let _ymax = 0; // y轴最大值
let _userStates = {}; // 用户状态
let _specialStateUids = []; // 具有特殊状态的uid列表

let _intervalId = INTERVAL_ARRAY[0];
let _yaxisId = YAXIS_ARRAY[0];

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
    region: 'center',
    items: [
      langCom, langButton
    ]
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
      title: 'onlineCount'
    }, {
      type: 'Time',
      position: 'bottom',
      fields: ['data2'],
      title: 'time',
      dateFormat: 'G:i:s',
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

  _userStore = Ext.create('Ext.data.Store', {
    id: '_userStoreId',
    autoLoad: false,
    pageSize: 5,
    fields: ['name', 'uid', 'coin', 'diamond', 'exp', 'level', 'ip', 'connectTime', 'loginAt', 'registerAt', 'state'],
    proxy: {
      type: 'memory',
      reader: {
        type: 'json',
        root: 'requests'
      }
    }
  });

  /**
   * userGrid,detail users' message
   */
  let userGrid = Ext.create('Ext.grid.Panel', {
    id: 'userGridId',
    region: 'north',
    store: _userStore,
    autoScoll: true,
    height: 300,
    columns: [
      {xtype: 'rownumberer', width: 50, sortable: false},
      {text: 'name', dataIndex: 'name', width: 100},
      {text: 'uid', dataIndex: 'uid', width: 100},
      {text: 'coin', dataIndex: 'coin', width: 100},
      {text: 'diamond', dataIndex: 'diamond', width: 100},
      {text: 'exp', dataIndex: 'exp', width: 100},
      {text: 'level', dataIndex: 'level', width: 100},
      {text: 'ip', dataIndex: 'ip', width: 100},
      {text: 'connectTime', dataIndex: 'connectTime', width: 100},
      {text: 'loginAt', dataIndex: 'loginAt', width: 100},
      {text: 'registerAt', dataIndex: 'registerAt', width: 100},
      {text: 'isOnline', dataIndex: 'isOnline', width: 100},
      {text: 'state', dataIndex: 'state', width: 100},
    ]
  });


  let yaxisStore = Ext.create('Ext.data.Store', {
    fields: ['name', 'yaxis']
  });

  let yaxisCom = Ext.create('Ext.form.ComboBox', {
    id: 'yaxisComId',
    fieldLabel: 'Y Axis',
    labelWidth: 60,
    store: yaxisStore,
    queryMode: 'local',
    displayField: 'yaxis',
    valueField: 'name',
    margin: '8 0 0 10'
  });


  let intervalStore = Ext.create('Ext.data.Store', {
    fields: ['name', 'interval']
  });

  let intervalCom = Ext.create('Ext.form.ComboBox', {
    id: 'intervalComId',
    fieldLabel: 'Interval(m)',
    labelWidth: 120,
    store: intervalStore,
    queryMode: 'local',
    displayField: 'interval',
    valueField: 'name',
    margin: '8 0 0 10'
  });

  let chartPanel = Ext.create('Ext.panel.Panel', { id: 'chartPanelNode',
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
        margin: '10 0 0 10'
      },
        yaxisCom, intervalCom,  {
          id:'reloadButtonId',
          xtype: 'button',
          text: 'Reload Chart',
          handler: reloadHandler,
          width: 150,
          margin: '10 0 0 10'
        }, langPanel
      ]
    },
      _chart
    ]
  });

  let viewport = new Ext.Viewport({
    layout: 'border',
    items: [{
      region: 'north',
      height: 30
    }, userGrid, chartPanel]
  });


  init();
  run();
  updateState();
});

function run(interval) {
  interval = interval | STATUS_INTERVAL;
  let time = interval * 1 * 1000;

  seed = setInterval(function () {
    window.parent.client.request('users', null, function (err, msg) { // 用户信息
      if (err) {
        return;
      }
      window.parent.client.request('onlineUser', null, function (err, msgOnline) { // 在线用户

        if (err) {
          return;
        }

        if (!msg) {
          return;
        }
        let onlineUids = [];
        for (let sid in msgOnline) {
          let lists = msgOnline[sid].loginedList;
          for (let i = 0; i < lists.length; i++) {
            onlineUids.push(lists[i].uid);
          }
        }

        let allUsers = msg[0];

        for (let i = 0, l = allUsers.length; i < l; i++) {
          let user = allUsers[i];
          if (onlineUids.indexOf(user.uid) > -1) {
            user.isOnline = 'Y';
          } else {
            user.isOnline = 'N';
          }
          user.state = _specialStateUids.indexOf(user.uid) == -1 ? 'normal' : USER_STATE_TEXT[_userStates[user.uid]];
        }

        _cacheData.onlineCount.push(onlineUids.length);
        _cacheData.userCount.push(allUsers.length);
        _cacheTime.push(new Date());

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

        let yAxis = _chart.axes.get(0);
        yAxis.maximum = _ymax;

        _chartStore.loadData(__data);

        _userStore.loadData(allUsers);
        updateCount(allUsers.length, onlineUids.length);
      });
    });
  }, time);
}

/**
 * 循环从 userState module 中获取数据
 */
function updateState() {
  setInterval(function () {
   window.parent.client.request('userState', null, function (err, msg) { // 用户状态
     if (!msg) {
       return;
     }
     _specialStateUids = [];
     _userStates = {};
     for (let item of msg[0]) {
       _specialStateUids.push(item.uid);
       _userStates[item.uid] = item.state;
     }
   });
  }, 2000)
}

function init(lang) {
  let yaxis = [], interval = [], langs = [];

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

  for (let i = 0, l = INTERVAL_ARRAY.length; i < l; i++) {
    item = INTERVAL_ARRAY[i];
    interval.push({
      name: item,
      interval: item
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

function reloadHandler() {
  if (_intervalId != Ext.getCmp('intervalComId').getValue()) {
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
  yAxis.title = Ext.getCmp('yaxisComId').getValue();
  yAxis.maximum = _ymax;

  timeAxis.step = [Ext.Date.MINUTE, _intervalId];
  timeAxis.toDate = new Date(timeAxis.fromDate.getTime() + _intervalId * 10 * 60 * 1000);
  _chart.redraw();
  _chartStore.loadData(__data);
}

function updateCount(totalConnCount, loginedCount) {
  document.getElementById("userCount").innerHTML = totalConnCount;
  document.getElementById("onlineCount").innerHTML = loginedCount;
}

function changeLanguage() {
  let lang = Ext.getCmp('langComId').getValue();
  switch (lang) {
    case 'en' :
      Ext.getCmp('langButtonId').setText('Change Language');
      Ext.getCmp('reloadButtonId').setText('Reload Chart');
      Ext.getCmp('langComId').labelEl.update('Language');
      Ext.getCmp('yaxisComId').labelEl.update('Y Axis');
      Ext.getCmp('intervalComId').labelEl.update('Interval(m)');
      init('en');
      break;
    case 'zh' :
      Ext.getCmp('langButtonId').setText('切换语言');
      Ext.getCmp('reloadButtonId').setText('重载表格');
      Ext.getCmp('langComId').labelEl.update('语言');
      Ext.getCmp('yaxisComId').labelEl.update('Y轴');
      Ext.getCmp('intervalComId').labelEl.update('间隔（分）');
      init('zh');
      break;
  }
}


