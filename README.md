## 开发环境部署 Mac 版

1. 运行 ./bin/mac_env.sh 
    
    注意,会下载文件编译,选择你希望的路径后执行
    
    可以设置 npm 源为淘宝源:
    
    npm config set registry https://registry.npm.taobao.org
    
2. cd 到 game-js-slots-server
    
    ./npm-install.sh


## 部署和启动游戏服务器和管理服务器

项目目录下面有 fabfile.py,是 fabric 文件

若没有安装 fabric, 执行

    sudo pip install fabric

即可使用:

    # 部署
    fab -R localtest deploy

    # 重启
    fab -R localtest startServer:env=localtest

    # 部署并重启游戏服务器
    fab -R localtest deploy startServer:env=localtest
    
    # 部署并重启游戏服务器和管理服务器
    fab -R localtest deploy startServer:env=localtest startAdmin:env=localtest

    # 查看所有支持的命令
    fab -l
    
说明:

1. `fab -R localtest` 此处 localtest 为 fabfile.py 中定义的 role
2. `fab -R testing deploy startServer:env=localtest` 后面的 localtest 为环境变量，切换数据库等配置



## game-server

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
9. 运行环境有三个 development,testing,production

## game-admin

目前是 pomelo-admin-web,后面会扩展,GM 工具等.

## tools

存放数据转换等工具

## bin

存放启动服务器,测试服启动 mongodb 等脚本,部署脚本

## config

存放 redis,mongodb 等游戏服务器之外的启动配置

## 具体代码编写和要注意的问题

1. 要熟悉 Node.js 写法,熟悉 co + generator 函数的写法
2. 注意 catch 到所有的错误

## 运行环境

运行环境有: development,localtest,remotetest,production

## 定时任务

1. 定时任务定义在 game-server/config/crons.json 中，定义服务器类型和对应的时间配置
2. 定时任务的执行程序在 app/servers/{serverType}/cron/ 文件夹下

## 后台脚本

1. 后台脚本放在 game-server/scripts 目录
2. 后台脚本在 `管理服务器` 中可以修改、保存和运行
3. 后台脚本可以访问任何业务
4. 注意线上服务器后台脚本的安全性

## 测试覆盖率

    istanbul cover _mocha
    
## 压力测试

1. 压测基于 pomelo-robot,
2. 工具在 tools/presure/
3. 此工具可以选择运行 client or master,master 提供统计的web服务,client 生成压力
4. 可以运行多个 client
5. client 压力来自于 config/{env}/config.json
6. 在 tools/presure/ 目录下,执行 `node presure master` 可运行 master
7. 访问 `http://localhost:7777` 可以打开统计页面
8. 在 tools/presure/ 目录下,执行 `node presure client` 可运行 clint


## 数值测试工具

1. 数值测试工具是自动玩游戏,写入日志,分析日志的一套工具
2. 自动玩游戏的调用入口代码在 http 进程中,`game.js pulltodie` 方法
3. 自动玩游戏的具体实现在 slots 进程, `spinRemote.js spinToDie` 方法
4. 统计页面在 http 进程中 `chart.html` 使用了百度 ECharts
5. 日志存在 `gamelog` collection 中,具体可参考 `schemas.json`
 


## 配置转换工具

1. 我们有一套配置 excel 转换成 json 的工具,可以是默认的 obj 数组,可以是自定义的格式,
2. 自定义格式使用 ejs 库生成
3. 转换的数据会存在 app/config/data/ 目录
4. app/config/data/ 目录中的配置文件会被热更


## 数据库访问

1. 数据库访问操作都在 models.js, 包括登录,注册,邮箱,充值, 数据库的访问走 docSync
2. 其他的数据都使用 docSync 插件来管理

## 内存缓存

1. 内存数据使用 baseData.js + dataService.js 的方式来组织
2. baseData 为数据类的实例
3. dataService 为数据管理类,包含baseData 的引用
4. 数据结构的定义遵循 schemas.json 配置
5. 具体参考 game-js-server-core 文档。

## 目前服务器地址和端口

外网测试服: 121.41.4.17
内网测试服: 172.16.77.164
悉尼正式服: 52.65.157.131

3001-3005 web端口，http 请求用
3101-3105 网关端口
3201-3205 游戏 tcp 端口

7777 后台端口
3005 master 端口
32311-32315 可能用到的remote 调试端口 对公司ip开
3301-3399 内部端口不需要暴露

