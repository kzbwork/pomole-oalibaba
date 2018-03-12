/**
 * Created by wyang on 16/9/9.
 * 时间计算
 */

var TimeUtils = function () {

};

var pro = TimeUtils.prototype;

/**
 * 判断是否到了刷新时间
 * @param lastTime    上次刷新时间
 * @param refreshTime {Date|String}每天的刷新时间 Date|"02:00:00"
 * @param now         现在时间
 */
pro.needRefresh = function (lastTime, refreshTime, now) {

  now = now || new Date();

  let nextRefreshTime = this.getNextRefresh(refreshTime, lastTime);

  if (now.getTime() >= nextRefreshTime) {
    return true
  }

  return false;
};

/**
 * 获得下次一天切换的时间
 * @param refreshTime {Date|string}
 * @param now         {Date}
 * @return {Number}
 */
pro.getNextRefresh = function(refreshTime, now) {
  now = now || new Date();

  if (typeof (refreshTime) === 'string') {
    var arr = refreshTime.split(':');
    refreshTime = new Date(now.getTime());
    refreshTime.setHours(parseInt(arr[0]));
    refreshTime.setMinutes(parseInt(arr[1]));
    refreshTime.setSeconds(parseInt(arr[2]));
    refreshTime.setMilliseconds(0);
  }

  let result = refreshTime.getTime();
  if (refreshTime < now) {
    result = result + 1000 * 24 * 3600;
  }

  return result;
};

/**
 *  检查时间是否是当天自然天
 *  @param time
 */
pro.checkToday = function(time){
  if(!(time instanceof Date)){
    console.error('Param error. Expected type Date, get:' + typeof(time));
    return false;
  }

  var localStr = time.toLocaleDateString();
  var nowStr = (new Date()).toLocaleDateString();

  if(localStr === nowStr){
    return true;
  }

  return false;
}

module.exports = new TimeUtils();
