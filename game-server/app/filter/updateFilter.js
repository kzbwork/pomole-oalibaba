let pomelo = require('pomelo');
let co = require('co');

module.exports = function() {
  return new Filter();
};

let Filter = function() {

};

Filter.prototype.before = function (msg, session, next) {
  if (!session.uid || msg.__route__ === `connector.pingHandler.ping`) {
    next();
    return;
  }

  let rpcPromise = function (callback) {
    pomelo.app.rpc.dataCenter.userRemote.userAction(session, session.uid, function (err, res) {
      callback(err, res);
    });
  };
  co(function *() {
    yield rpcPromise;
    next();
  });
};

