
var WebSocket = require('ws');

var WS_CONNECTING = 0;  // ws 已经连接
var WS_OPEN = 1;        // ws 已经打开
var WS_CLOSING = 2;     // ws 正在关闭
var WS_CLOSED = 3;      // ws 已经关闭

var Events = {
  'ERROR': 'error',                           // 错误
  'IOERROR': 'ioError',                       // io错误
  'RECONNECT': 'reconnect',                   // 尝试重连
  'RECONNECTED': 'reconnected',               // 重连成功
  'HEARTBEAT_TIMEOUT': 'heartbeatTimeout',    // 心跳超时
  'RECONNECT_TIMEOUT': 'reconnectTimeout',    // 重连超时
  'CLOSE': 'close',                           // 断开连接，onKick,服务端关闭，disconnect都会触发
  'ONKICK': 'onKick'                          // 被踢出，业务逻辑中被踢后重连
};

var EventEmitter = require('events').EventEmitter;
var protobuf = require('pomelo-protobuf');

var pfunction = (function () {
  var JS_WS_CLIENT_TYPE = 'js-websocket';
  var JS_WS_CLIENT_VERSION = '0.0.1';

  var Protocol = require('pomelo-protocol');
  var Package = Protocol.Package;
  var Message = Protocol.Message;

  var RES_OK = 200;
  var RES_FAIL = 500;
  var RES_OLD_CLIENT = 501;

  if (typeof Object.create !== 'function') {
    Object.create = function (o) {
      function F () {}
      F.prototype = o;
      return new F();
    };
  }

  var pomelo = Object.create(EventEmitter.prototype); // object extend from object

  pomelo.Events = Events;
  var socket = null;
  var reqId = 0;
  var callbacks = {};
  var handlers = {};
  // Map from request id to route
  var routeMap = {};
  var dict = {};    // route string to code
  var abbrs = {};   // code to route string
  var serverProtos = {};
  var clientProtos = {};
  var protoVersion = 0;

  var heartbeatInterval = 0;
  var heartbeatTimeout = 0;
  var nextHeartbeatTimeout = 0;
  var gapThreshold = 100;   // heartbeat gap threashold
  var heartbeatId = null;
  var heartbeatTimeoutId = null;

  var handshakeCallback = null;

  var decode = null;
  var encode = null;

  var handshakeBuffer = {'sys': {type: JS_WS_CLIENT_TYPE,
      version: JS_WS_CLIENT_VERSION},
    'user': {}};

  var initCallback = null;

  // add for reconnect
  var ws_url = '';
  var reconnectTimeoutId = 0;
  var reconnectIndex = 0;

  /**
   * 发现连接断开的处理函数
   */
  var dealOnClose = function () {
    var url = socket.url;

    if (!reconnectTimeoutId) {
      reconnectTimeoutId = setTimeout(reconnect, 1000);
    }
  };

  /**
   * 重新连接
   */
  var reconnect = function () {
    pomelo.emit(Events.RECONNECT, reconnectIndex);

    reconnectIndex++;
    reconnectTimeoutId = 0;

    initWebSocket(ws_url, function () {
      pomelo.emit(Events.RECONNECTED, reconnectIndex);
      reconnectIndex = 0;
    });
  };

  // end add for reconnect

  /**
   * 初始化连接的函数
   * @param params{Object}  eg.{host:"localhost",port:"3010"}
   * @param cb{Function}    初始化完成后回调
   */
  pomelo.init = function (params, cb) {

    // 如果已经调用连接，则不重连了
    if (reconnectTimeoutId) {
      clearTimeout(reconnectTimeoutId);
    }

    var host = params.host;
    var port = params.port;

    encode = params.encode || defaultEncode;
    decode = params.decode || defaultDecode;

    console.log('encode: ' + !!params.encode);

    var url = 'ws://' + host;
    if (port) {
      url += ':' + port;
    }

    ws_url = url;

    handshakeBuffer.user = params.user;
    handshakeCallback = params.handshakeCallback;
    initWebSocket(url, cb);
  };

  /**
   * 断开连接的函数
   */
  pomelo.disconnect = function () {
    if (socket) {
      if (socket.disconnect) socket.disconnect();
      if (socket.close) socket.close();
      console.log('disconnect');

      socket.onopen = null;
      socket.onmessage = null;
      socket.onerror = null;
      socket.onclose = null;

      socket = null;
    }

    if (heartbeatId) {
      clearTimeout(heartbeatId);
      heartbeatId = null;
    }
    if (heartbeatTimeoutId) {
      clearTimeout(heartbeatTimeoutId);
      heartbeatTimeoutId = null;
    }
  };

  /**
   * 发送请求，会有结果返回
   * @param route{String} 协议路由
   * @param msg{Object}   消息,如果定义了protobuf，则require字段必须有数据
   * @param cb{Function}  消息处理函数,参数是json数据 cb(json)
   */
  pomelo.request = function (route, msg, cb) {
    if (arguments.length === 2 && typeof msg === 'function') {
      cb = msg;
      msg = {};
    } else {
      msg = msg || {};
    }
    route = route || msg.route;
    if (!route) {
      return;
    }

    reqId++;
    sendMessage(reqId, route, msg);

    callbacks[reqId] = cb;
    routeMap[reqId] = route;

    return reqId;
  };

  /**
   * 给服务端发送通知
   * @param route{String} 协议路由
   * @param msg{Object}   消息,如果定义了protobuf，则require字段必须有数据
   */
  pomelo.notify = function (route, msg) {
    msg = msg || {};
    sendMessage(0, route, msg);
  };


  var defaultDecode = pomelo.decode = function (data) {
    // probuff decode
    var msg = Message.decode(data);

    if (msg.id > 0) {
      msg.route = routeMap[msg.id];
      delete routeMap[msg.id];
      if (!msg.route) {
        return;
      }
    }

    msg.body = deCompose(msg);
    return msg;
  };


  var defaultEncode = pomelo.encode = function (reqId, route, msg) {
    var type = reqId ? Message.TYPE_REQUEST : Message.TYPE_NOTIFY;

    // compress message by protobuf
    if (clientProtos && clientProtos[route]) {
      msg = protobuf.encode(route, msg);
    } else {
      msg = Protocol.strencode(JSON.stringify(msg));
    }

    var compressRoute = 0;
    if (dict && dict[route]) {
      route = dict[route];
      compressRoute = 1;
    }

    return Message.encode(reqId, type, compressRoute, route, msg);
  };

  var clearSocket = function (socket) {
    socket.onopen = null;
    socket.onmessage = null;
    socket.onerror = null;
    socket.onclose = null;
  };

  var initWebSocket = function (url, cb) {
    initCallback = cb;

    console.log('connect to ' + url);
    // Add protobuf version
    // if(localStorage && localStorage.getItem('protos') && protoVersion === 0){
    //   var protos = JSON.parse(localStorage.getItem('protos'));
    //
    //   protoVersion = protos.version || 0;
    //   serverProtos = protos.server || {};
    //   clientProtos = protos.client || {};
    //
    //   if(protobuf) protobuf.init({encoderProtos: clientProtos, decoderProtos: serverProtos});
    // }
    // Set protoversion
    handshakeBuffer.sys.protoVersion = protoVersion;

    var onopen = function (event) {
      var obj = Package.encode(Package.TYPE_HANDSHAKE, Protocol.strencode(JSON.stringify(handshakeBuffer)));
      send(obj);
    };


    var onmessage = function (event) {
      processPackage(Package.decode(event.data), cb);
      // new package arrived, update the heartbeat timeout
      if (heartbeatTimeout) {
        nextHeartbeatTimeout = Date.now() + heartbeatTimeout;
      }
    };


    var onerror = function (event) {
      pomelo.emit(Events.IOERROR, event);
      // console.error('socket error: ', event);
    };


    var onclose = function (event) {
      pomelo.emit(Events.CLOSE, event);
      dealOnClose();
    };

    if (socket) {
      clearSocket(socket);
    }

    socket = new WebSocket(url);
    socket.binaryType = 'arraybuffer';
    socket.onopen = onopen;
    socket.onmessage = onmessage;
    socket.onerror = onerror;
    socket.onclose = onclose;
  };


  var sendMessage = function (reqId, route, msg) {
    if (encode) {
      msg = encode(reqId, route, msg);
    }

    var packet = Package.encode(Package.TYPE_DATA, msg);
    send(packet);
  };

  var send = function (packet) {
    socket.send(packet);
  };

  var handler = {};

  var heartbeat = function (data) {
    if (!heartbeatInterval) {
      // no heartbeat
      return;
    }

    var obj = Package.encode(Package.TYPE_HEARTBEAT);
    if (heartbeatTimeoutId) {
      clearTimeout(heartbeatTimeoutId);
      heartbeatTimeoutId = null;
    }

    if (heartbeatId) {
      // already in a heartbeat interval
      return;
    }

    heartbeatId = setTimeout(function () {
      heartbeatId = null;
      send(obj);

      nextHeartbeatTimeout = Date.now() + heartbeatTimeout;
      heartbeatTimeoutId = setTimeout(heartbeatTimeoutCb, heartbeatTimeout);
    }, heartbeatInterval);
  };

  var heartbeatTimeoutCb = function () {
    var gap = nextHeartbeatTimeout - Date.now();
    if (gap > gapThreshold) {
      heartbeatTimeoutId = setTimeout(heartbeatTimeoutCb, gap);
    } else {
      pomelo.emit(Events.HEARTBEAT_TIMEOUT);
      pomelo.disconnect();
    }
  };

  var handshake = function (data) {
    data = JSON.parse(Protocol.strdecode(data));
    if (data.code === RES_OLD_CLIENT) {
      pomelo.emit(Events.ERROR, 'client version not fullfill');
      return;
    }

    if (data.code !== RES_OK) {
      pomelo.emit(Events.ERROR, 'handshake fail');
      return;
    }

    handshakeInit(data);

    var obj = Package.encode(Package.TYPE_HANDSHAKE_ACK);
    send(obj);
    if (initCallback) {
      initCallback(socket);
      initCallback = null;
    }
  };

  var onData = function (data) {
    var msg = data;
    if (decode) {
      msg = decode(msg);
    }
    processMessage(pomelo, msg);
  };

  var onKick = function (data) {
    pomelo.emit(Events.ONKICK);
  };

  handlers[Package.TYPE_HANDSHAKE] = handshake;
  handlers[Package.TYPE_HEARTBEAT] = heartbeat;
  handlers[Package.TYPE_DATA] = onData;
  handlers[Package.TYPE_KICK] = onKick;

  var processPackage = function (msg) {
    handlers[msg.type](msg.body);
  };

  var processMessage = function (pomelo, msg) {
    if (!msg.id) {
      // server push message
      pomelo.emit(msg.route, msg.body);
      return;
    }

    // if have a id then find the callback function with the request
    var cb = callbacks[msg.id];

    delete callbacks[msg.id];
    if (typeof cb !== 'function') {
      return;
    }

    cb(msg.body, msg.id);
    return;
  };

  var processMessageBatch = function (pomelo, msgs) {
    for (var i = 0, l = msgs.length; i < l; i++) {
      processMessage(pomelo, msgs[i]);
    }
  };

  var deCompose = function (msg) {
    var route = msg.route;

    // Decompose route from dict
    if (msg.compressRoute) {
      if (!abbrs[route]) {
        return {};
      }

      route = msg.route = abbrs[route];
    }
    if (serverProtos && serverProtos[route]) {
      console.log('use protobuf');
      return protobuf.decode(route, msg.body);
    } else {
      return JSON.parse(Protocol.strdecode(msg.body));
    }

    return msg;
  };

  var handshakeInit = function (data) {
    if (data.sys && data.sys.heartbeat) {
      heartbeatInterval = data.sys.heartbeat * 1000;   // heartbeat interval
      heartbeatTimeout = heartbeatInterval * 2;        // max heartbeat timeout
    } else {
      heartbeatInterval = 0;
      heartbeatTimeout = 0;
    }

    initData(data);

    if (typeof handshakeCallback === 'function') {
      handshakeCallback(data.user);
    }
  };

  // Initilize data used in pomelo client
  var initData = function (data) {
    if (!data || !data.sys) {
      return;
    }
    dict = data.sys.dict;
    var protos = data.sys.protos;

    // Init compress dict
    if (dict) {
      dict = dict;
      abbrs = {};

      for (var route in dict) {
        abbrs[dict[route]] = route;
      }
    }

    // Init protobuf protos
    if (protos) {
      protoVersion = protos.version || 0;
      serverProtos = protos.server || {};
      clientProtos = protos.client || {};
      if (protobuf) {
        protobuf.init({encoderProtos: protos.client, decoderProtos: protos.server});
      }

      // Save protobuf protos to localStorage
      if (typeof(localStorage) !== 'undefined') {
        localStorage.setItem('protos', JSON.stringify(protos));
      }
    }
  };

  return pomelo;
});

module.exports = pfunction;
