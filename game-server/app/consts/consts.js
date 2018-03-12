/**
 * 静态常量
 * Author: jxyi
 * Date:  2017-12-26
 */

'use strict';

module.exports = {

  CODE: {
    SUCCESS: 0,                           // 正常
    LOGIC_ERROR: 1,                       // 计算过程逻辑错误
    PARAM_ERROR: 2,                       // 参数错误,缺少参数,或参数规格错误
    INVALID: 3,                           // 无效操作,如cd已经结束,秒cd则为无效操作
    NO_USER: 4,                           // 没有这个玩家
    NOT_IN_GAME: 5,                       // 玩家未登录
    SERVER_ERROR: 6,                      // 服务器内部错误
    SERVER_CLOSE: 7,                      // 已关服,仅仅是不提供服务,进程等数据刷回数据库后关闭
    LACK_CREDIT: 8,                       // 货币不足
    UNKNOWN_REQUEST: 9,                   // 未知的请求
    ENTRY_CLOSE: 10,                      // 玩法已经关闭

    ACC_ACCOUNT_LOGINED: 20,              // 账号已登录，不需要重复登录

    NEED_ENTRY_BEFORE: 50,                // 需要先进入主题
    ALIBABA_MINI_NOT_FINISH: 51,          // 有未结算的 mini game
    ALIBABA_NO_MINI: 52,                  // 没有未结算的 mini game
    ALIBABA_MINI_INDEX_EXISTED: 53,       // mini game 选择的序号已经选择过了

    //-------------- wallet error code -----------------
    TECHNICAL_ERROR: 101,
    BET_NOT_FOUND: 102,
    SESSION_INVALID: 103,
    AUTHENTICATION_FAILED: 104,
    OUT_OF_MONEY: 105,
    PARAMETER_REQUIRED: 106,
    WRONG_API_VERSION: 107,
    //-------------- wallet error code -----------------


    //-------------- wallet error code -----------------
    HTTPS_ERROR: 1000
    //-------------- wallet error code -----------------
  },

  SERVERS: {
    CONNECTOR: 'connector',
    GAME: 'game',
    DATA_CENTER: 'dataCenter',
    HTTP: 'http'
  },

  ENVS: {
    DEVELOPMENT: 'development',
    LOCAL_TEST: 'localtest',
    REMOTE_TEST: 'remotetest',
    TOKYO: 'tokyo',
    PRODUCTION: 'production'
  },

  GLOBAL_EVENT: {
    CHANGE: 'change'
  },

  // 模块ID
  MODULES: {
    ALIBABA: '10001'
  },
  
  ENV_UID_PREFIX: {
    development: 5,
    localtest: 4,
    remotetest: 3,
    tokyo: 2,
    production: 1
  },

  THEME_NAME: {
    NONE: 'none',
    ALIBABA: 'alibaba'
  },

  ITEM_IDS: {
    '1': {id: 1, name: 'credit'}     // 游戏币
  },

  KICK_REASON: {            // 必须是字符串
    SERVER_CLOSE: '1',      // 服务器关闭，所有用户踢下线
    USER_BLOCKED: '2',      // 用户账号被封，强制下线
    SAME_USER_LOGIN: '3',   // 同一个账号在其他设备登录，当前账号被挤下线
    OPERATE_TIMEOUT: '4'    // 长时间未操作
  },

  // 变化原因,和统计对应
  REASON: {
    ALIBABA_COST: 'alibabaCost',
    ALIBABA_WIN: 'alibabaWin',
    ALIBABA_MINI: 'alibabaMini',

    SPIN_FINISH: 'spin_finish',

    ENTRY_LOGIN: 'entry_login',

    TEST_ADD: 'testAdd'
  },

  LOGIN_TYPE: {
    NORMAL: 'normal'
  },

  ELEMENT_TYPE: {
    NORMAL: 1,
    WILD: 2,
    FREESPIN: 4,
    BONUS: 8
  },

  ELEMENT_NAME: {
    NORMAL: 'normal',
    WILD: 'wild',
    FREESPIN: 'freespin',
    BONUS: 'bonus'
  },

  SPECIAL_ELEMENT: {
    WILD: 21,
    FREESPIN: 22
  },

  MAIL_STATUS: {
    UNREAD: 0,
    READ: 1
  },

  SYSTEM_MAIL_ID: {
    InviteBindGift: 1001,
    ShareInviteIdGift: 1002,
    BeGuildInfo: 1003,
    BeAgentInfo: 1004
  },

  // 数字的字面值
  NUMBERS: {
    ONE_DAY: 86400,
    MAX_TIMEOUT: 2116800000
  },

  PUSH_ROUTE: {
    ON_NEW_MAIL: 'onNewMail',                             // 有新邮件
    ON_RECHARGE_FINISHED: 'onRechargeFinished',           // 玩家充值成功
    ON_PROPER_CHANGE: 'onProperChange',                   // 玩家属性变化
    ON_NEW_BROADCAST: 'onNewBroadcast',                   // 通知新的广播
    ON_CHECK_UPDATE: 'onCheckUpdate',                     // 推送客户端检查更新
  },

  SINGLE_WALLET_CODE: {
    OK: 0,
    TECHNICAL_ERROR: 101,
    BET_NOT_FOUND: 102,
    SESSION_INVALID: 103,
    AUTHENTICATION_FAILED: 104,
    OUT_OF_MONEY: 105,
    PARAMETER_REQUIRED: 106,
    WRONG_API_VERSION: 107,

    HTTPS_ERROR: 1000
  },

  SPIN_RECORD_STATUS: {
    NOT_CONFIRM_BET: 0,
    NOT_CONFIRM_RESULT: 1,
    NOT_CONFIRM_MINI: 2,
    COMPLETE: 10,
    REFUND: 11
  },

  SPIN_RECORD_TYPE: {
    NORMAL: 0,
    FREE: 1,
    MINI: 2
  },

  // 玩家类型
  USER_TYPE: {
    CREDIT: 0,    // 真钱玩家
    FREE: 1,      // 试玩玩家
  }
};
