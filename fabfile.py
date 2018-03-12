# coding=utf8
# ！！！注意：按照公司规定，外网测试服和正式服不允许使用 root 权限进行操作，所有脚本中不允许
# 使用 sudo 方式运行命令。如果因为权限问题导致脚本运行失败，发邮件申请，并联系运维协助解决。
# 开发不得擅自对外网测试服和正式服进行危险操作。！！！

import os
from tempfile import mkdtemp
from fabric.contrib.files import exists
from fabric.api import *

# 不同的服务器组定义
env.roledefs = {
    'development': ['172.18.255.186'],
    'localtest':['172.16.77.164'],
    'remotetest': ['121.41.4.17'],
    'production': ['52.65.157.131']
}

dep_dir = "game-server/node_modules/game-js-server-core"

# 本地项目路径
local_dir = None
# 本地core项目路径
local_core_dir = None

# 远程路径
remote_source_dir = "/data/source/"
remote_dir = "/data/source/game-js-slots-server"
remote_run_dir = "/data/slots/"
remote_core_dir = os.path.join("/data/source/game-js-slots-server/",dep_dir)

win_tmp_dir = os.path.join("..",'510ts_temp_nfuiawehb')

@task
def testLog():
    pass
    run("grep ERROR /tmp/screenlog_server.log|tail -n 5")


@task
def killall():
    """
    根据进程的运行路径,来关闭进程
    """
    pass

    scriptPath = os.path.join(remote_run_dir,"game-server/app.js")
    run("ps aux|grep " + scriptPath + "|grep -v grep|awk '{print $2}'|xargs kill -2")



@task
def deploy(**args):
    """
    仅部署代码到服务器
    """

    global local_dir, remote_dir, remote_run_dir, local_core_dir, remote_core_dir,dep_dir

    local_dir = args.get('dir') or os.getcwd()
    local_core_dir = os.path.join(local_dir, dep_dir)

    # 删除原先的文件
    sudo("rm -rdf {remote_dir}".format(**globals()))

    upload_project_with_ignore(local_dir, remote_dir)
    upload_project_with_ignore(local_core_dir, remote_core_dir)

    # 先同步到备份目录然后同步到运行目录
    sudo("chmod 775 -R {remote_dir}".format(**globals()))
    sudo("cp -R {remote_dir}/* {remote_run_dir}".format(**globals()))
    sudo("chmod 775 -R {remote_run_dir}".format(**globals()))

def start_mongo_redis():
    """
    启动服务器上的 mongod 和 redis,服务器上都已经配置为 service,
    配置文件在 /etc/mongod.conf /etc/redis.conf
    日志文件在 /var/log/mongod.log /var/log/redis-server.log
    :return:
    """

    sudo("/etc/init.d/mongod start")
    sudo("/etc/init.d/redis start")

def path_filter(pre_path):
    if (pre_path.find(':')!=-1):
        index = pre_path.find(':')
        pre_path = pre_path[:index] + pre_path[index + 1:]
        pre_path = '/' + pre_path
    if(pre_path.find('\\')!=-1) :
        pre_path = pre_path.replace("\\", '/')
    return pre_path

def win_mktmp():
    local('mkdir ' + win_tmp_dir)
    return win_tmp_dir


@task
def startServer(env="development"):
    """
    重启服务器
    """

    # 先删除日志文件
    with settings(warn_only=True):
        sudo("rm /tmp/screenlog_server.log")

    global remote_run_dir
    with cd(os.path.join(remote_run_dir, "game-server")):
        with settings(warn_only=True):
            run("pomelo kill && sleep 2", pty=False)
            # 每次启动修改所   有日志文件的权限,使组用户包含所有权限
            sudo("chmod -R 774 logs/")

            run("screen -L -t server -dmS server pomelo start -e {env} && sleep 2".format(**locals()), pty=False)
            # run("screen -L -t server -dmS server pomelo start -e {env} && sleep 2".format(**locals()), pty=False)
            # 打印最后的5个错误
            run("grep [ERROR] /tmp/screenlog_server.log|tail -n 5")

@task
def startAdmin(env="development"):
    global remote_run_dir
    with cd(os.path.join(remote_run_dir)):
        with settings(warn_only=True):
            run("ps aux|grep 'node game-admin/app.js'|grep -v grep|grep -v SCREEN|awk '{print $2}'|xargs kill")

        run("screen -L -t admin -dmS admin node game-admin/app.js {env} && sleep 1".format(**locals()), pty=False)

@task
def startPresure(type="master"):
    global remote_run_dir
    with cd(os.path.join(remote_run_dir, "tools/presure")):
        pid = run("ps aux|grep 'node presure.js'|grep -v grep|grep -v SCREEN|awk '{print $2}'")

        if pid:
            print('presure master is running!')
        else:
            run("screen -L -t admin -dmS presure node presure.js {type} && sleep 1".format(**locals()), pty=False)

@task
def stopPresure():
    global remote_run_dir
    with cd(os.path.join(remote_run_dir, "tools/presure")):
        with settings(warn_only=True):
            run("ps aux|grep 'node presure.js'|grep -v grep|grep -v SCREEN|awk '{print $2}'|xargs kill")

@task
def startPresureClient():
    local("cd tools/presure/ && node presure.js client")

@task
def startTest(file):
    local("cd tools/presure/ && node app/script/{file}.js".format(**locals()))
    pass

@task
def unittest():
    local("cd game-server/ && istanbul cover _mocha")


@task
def dependency():
    run("npm config set registry https://registry.npm.taobao.org/")

    with cd(os.path.join(remote_run_dir,'game-server')):
        run('npm install -d')

    with cd(os.path.join(remote_run_dir,'game-admin')):
     run('npm install -d')

@task
def install_env():
    """
    安装部署环境
    """
    pwd = local("pwd");
    sudo("mkdir -p /data/source/")
    sudo("chown -R wyang:slotsdev /data/source/")
    put("bin/ubuntu_env.sh",remote_source_dir)

    with cd(os.path.join(remote_source_dir)):
        sudo("bash {remote_source_dir}/ubuntu_env.sh")

    run("npm config set registry https://registry.npm.taobao.org")

@task
def createGroup(groupName):
    """
    创建用户组
    eg. fab -R localtest -u baina -p 123456 createGroup:groupName=slotstest
    """

    sudo("groupadd {groupName}".format(**locals()))
    pass

@task
def createAccount(userName,group):
    """

    :return:
    """

    # fexpect need
    # if group:
    #     sudo("adduser –home /home/{userName}/ –shell /bin/bash –ingroup {group} {userName}".format(**locals()))
    # else:
    #     sudo("adduser –home /home/{userName}/ –shell /bin/bash {userName} ".format(**locals()))
    pass

@task
def makeKeyLogin(keyfile):
    """
    使用公钥登录
    :param keyfile:
    :return:
    """
    pass


def upload_project_with_ignore(local_dir=None, remote_dir="", ignore_file=".gitignore", use_sudo=False):
    """
    压缩文件并上传到远程解压缩
    :param local_dir: 本地文件夹
    :param remote_dir: 远程文件夹
    :param ignore_file: 排除文件
    :param use_sudo: 是否使用 sudo,False 会使用 run
    :return: None
    """

    # 判断 sudo 权限
    runner = use_sudo and sudo or run

    local_dir = local_dir or os.getcwd()
    local_dir = local_dir.rstrip(os.sep)

    if not os.path.isabs(ignore_file):
        ignore_file = os.path.join(local_dir, ignore_file)

    local_path, local_name = os.path.split(local_dir)
    # local_path = path_filter(local_path);
    tar_file = "%s.tar.gz" % local_name

    # 没有远程文件夹则新建
    if not exists(remote_dir):
        run('mkdir -p %s' % remote_dir)

    # 创建临时压缩文件
    target_tar = os.path.join(remote_dir, tar_file)
    tmp_folder = win_mktmp()


    try:
        tar_path = os.path.join(tmp_folder, tar_file)

        ignore = ""
        # 使用.gitignore作为排除文件来压缩工程
        if os.path.exists(ignore_file):
            ignore_file = path_filter(ignore_file)
            ignore = "-X {ignore_file}".format(**locals())

        # cmd = "ls {local_dir}|xargs tar -C {local_dir} {ignore}  -czf {tar_path}"
        # local(cmd.format(**locals()))
        cmd = "ls %s|xargs tar -C %s %s  -czf %s" % \
              (path_filter(local_dir), path_filter(local_dir), ignore, path_filter(tar_path))
        local(cmd.format(**locals()))

        # 上传文件
        put(path_filter(tar_path), path_filter(target_tar), use_sudo=use_sudo)

        with cd(remote_dir):
            try:
                runner("tar -xzf %s" % path_filter(tar_file))
            finally:
                runner("rm -f %s" % path_filter(tar_file))
    finally:
        # 删除本地临时文件
        local("rm -rf %s" % path_filter(tmp_folder))
