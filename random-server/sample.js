//range of addons.random() is [0,1]
var addons = require('./randomAPI');
// var myRandomNumber = addons.random();

var net = require('net');

var server = net.createServer(function(socket) { //'connection' listener
  console.log('client connected');
  socket.on('end', function() {
    console.log('client disconnected');
  });
  socket.on('error', function (err) {
    console.log(err.message);
  });
  socket.on('data', function (data) {
    console.log('socket data: ' + data.toString());
    var list = [];
    for (var i = 0; i < 300; ++i) {
      list.push(addons.random());
    }
    socket.write(JSON.stringify(list));
  });
  socket.on('close', function (data) {
    console.log('socket close: ' + data.toString());
  });
});

server.listen(8124, function() { //'listening' listener
  console.log('server bound');
});

