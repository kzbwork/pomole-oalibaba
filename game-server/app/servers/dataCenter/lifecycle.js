/**
 * Created by wyang on 17/5/11.
 */

var co = require('co');

/**
 * 关闭进程之前处理函数
 * 详细参见 application.js stop 函数
 * @param app                 application instance
 * @param shutDown            stop all components and then process exit
 * @param cancelShutDownTimer cancel shut down after 3 seconds
 */
module.exports.beforeShutdown = function(app, shutDown, cancelShutDownTimer) {
  let logger = app.logger.getDataCenterLog(__filename);
  let sync = app.sync;

  if (!shutDown) {
    shutDown = function(){
      logger.info('no shutdown function');
    };
  }

  if (!cancelShutDownTimer) {
    cancelShutDownTimer = function(){
      logger.info('no cancelShutDownTimer function');
    };
  }

  cancelShutDownTimer();

  co(function*(){
    // if (sync) {
    //   logger.info('同步数据开始');
    //   let length = yield sync.sync();
    //   logger.info('同步数据结束结束:' + length);
    //
    //   shutDown();
    // } else {
    //   logger.error('no sync');
    // }
    let oracle = app.oracle;
    if (oracle) {
      logger.info('正在同步数据...');
      let result = yield oracle.flush();
      logger.info('同步数据结束结束');
      shutDown();
    } else {
      logger.error('no flush');
    }
  });
};