0.0.1 / 2016-7-22
================
  * pomelo 项目的既有功能
  * 扩展插件 http 服务器,基于 express 4.x 纳入管理体系,分布式启动,可以和游戏服务器之间 RPC,支付系统必须
  * 数据扩展组件和样例,基于 pomelo-sync 扩展,内存数据修改后,先写 AOF 文件,定时或者定量同步到 REDIS
  * 定义数据同步服务器,定时把 Redis 数据同步到 Mongodb
  * 基于 pomelo-admin-web 的后台管理服务器,单独运行,不纳入管理功能
  * 在 pomelo 的两个运行环境,development,production 基础上增加 testing,增加测试流程
