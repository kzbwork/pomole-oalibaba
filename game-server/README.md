
## 约定

1. 配置文件都放在 app/config/ 目录

    app/config/data/ 游戏配置数据
    app/config/strings.json 本地化数据
    app/config/log4js.json 日志配置
    app/config/dictionary.json 推送的接口数组,用来做接口压缩

2. 游戏服务器数据都放在 app/servers/ 目录

3. 插件开发支持 component,请放到 game-js-server-core 库中

4. 常量放在 app/consts.js

5. 其他游戏逻辑,按照模块,放在 app/ 下

6. 日志会放在logs/ 目录下

7. 后续功能会写在 Roadmap.md

8. 数据字段命名,id不要只叫id,可以叫做 uid,eventId,themeId 等

9. 服务器需要统计的信息,写成module,放在modules文件夹中,web页面在 pomelo-admin-web 中实现


## 运行环境

运行环境有: development,localtest,remotetest,production

## 定时任务

1. 定时任务定义在 config/crons.json 中，定义服务器类型和对应的时间配置
2. 定时任务的执行程序在 app/servers/{serverType}/cron/ 文件夹下

## 后台脚本

1. 后台脚本放在 scripts 目录
2. 后台脚本在 `管理服务器` 中可以修改、保存和运行
3. 后台脚本可以访问任何业务
4. 注意线上服务器后台脚本的安全性

## 测试覆盖率

    istanbul cover _mocha
