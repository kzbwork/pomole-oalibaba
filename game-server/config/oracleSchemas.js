/**
 * oracle 数据库相关配置
 * Author: jxyi
 * Date: 2018-2-12
 */

'use strict';

module.exports = {
  game_user: {
    createSql: [
      `create table game_user (
        id number primary key not null,
        name varchar2(30) default '' not null,
        acc_type varchar2(20) not null,
        acc_id varchar2(30) not null,
        register_time date not null,
        last_login_time date not null,
        reconnect_theme varchar2(30) not null,
        reconnect_data clob default ''
      )`,
      `CREATE SEQUENCE game_user_seq MINVALUE 100000 CACHE  5`
    ],
    schema: {
      id: {primaryKey: true, desc: "玩家id"},
      name: {desc: "玩家名称"},
      acc_type: {desc: "账号登录方式，可选值为 normal"},
      acc_id: {desc: "钱包账号 id"},
      register_time: {desc: "注册时间"},
      last_login_time: {desc: "用户最后一次登录的时间"},
      reconnect_theme: {desc: "玩家断线时，未展示结果的主题名称"},
      reconnect_data: {desc: "玩家最后一次 spin 的返回结果"}
    }
  },
  alibaba_theme: {
    createSql: [
      `create table alibaba_theme (
        id number primary key not null,
        round_id number not null,
        coin_value number default 0 not null,
        multiplier number default 0 not null,
        remove_free_times number default 0 not null,
        remove_free_win number default 0 not null,
        mini_game number default 0 not null,
        mini_config clob default '[]' not null,
        mini_life number default 0 not null,
        mini_win number default 0 not null,
        mini_multiple number default 0 not null,
        mini_history clob default '[]' not null
      )`
    ],
    schema: {
      id: {primaryKey: true, desc: "玩家 id"},
      round_id: {desc: "轮次 id"},
      coin_value: {desc: "spin 的倍率"},
      multiplier: {desc: "游戏币对应的价值"},
      remove_free_times: {desc: "剩余的消除 free 次数"},
      remove_free_win: {desc: "消除 free 当前赢的总钱数"},
      mini_game: {desc: "是否有未完成的小游戏"},
      mini_config: {desc: "小游戏的配置"},
      mini_life: {desc: "小游戏剩余生命值"},
      mini_win: {desc: "累积的奖励"},
      mini_multiple: {desc: "翻倍的最大数量"},
      mini_history: {desc: "已经选过的罐子序号"}
    }
  },
  spin_record: {
    createSql: [
      `create table spin_record (
        round_id number primary key not null,
        id number not null,
        game_id varchar2(20) not null,
        status number default 0 not null,
        time number not null,
        type number default 0 not null,
        bet number default 0 not null,
        result number default 0 not null,
        bonus_result number default 0 not null,
        bet_transaction_id varchar2(60) default '',
        result_transaction_id varchar2(60) default '',
        bonus_transaction_id varchar2(60) default ''
      )`,
      `create sequence spin_record_seq minvalue 1`
    ],
    schema: {
      round_id: {primaryKey: true, desc: "轮次 id"},
      id: {desc: "玩家 id"},
      game_id: {desc: "玩法 id"},
      status: {desc: "该局的状态，0 表示spin未确认，1 表示spin已确认，2 表示spin撤销"},
      time: {desc: "记录的时间"},
      type: {desc: "spin 类型，0 表示普通 spin，1 表示 free spin"},
      bet: {desc: "总投注数"},
      result: {desc: "赢钱数"},
      bonus_result: {desc: "小游戏赢钱数"},
      bet_transaction_id: {desc: "下注的变化 id"},
      result_transaction_id: {desc: "结果的变化 id"},
      bonus_transaction_id: {desc: "小游戏的变化 id"}
    }
  }
};

