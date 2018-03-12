#!/usr/bin/env bash

# 工作目录
workdir=/data/source/
groupName=slotsdev
userName=wyang

if [ ! -d ${workdir} ]; then
  sudo mkdir -p ${workdir}
  echo "======================"
  echo "mkdir ${workdir}"
  echo "======================"
fi

dbdir=/data/db/
logdir=/data/log/

if [ ! -d ${dbdir}/mongodb/ ]; then
    sudo mkdir -p ${dbdir}/mongodb/
fi

if [ ! -d ${dbdir}/redis/ ]; then
    sudo mkdir -p ${dbdir}/redis/
fi

if [ ! -d ${logdir} ]; then
    sudo mkdir -p ${logdir}
fi


sudo chown -R $userName:$groupName /data/

sudo apt-get update
sudo apt-get install g++ curl libssl-dev apache2-utils git-core make sysstat -y

##################### install mongodb 3.2 ############################

# First import public key of MongoDB apt repository in our system using following command.
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv EA312927

# 增加软件源
echo "deb http://repo.mongodb.org/apt/ubuntu "$(lsb_release -sc)"/mongodb-org/3.2 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb.list

sudo apt-get update

sudo apt-get install mongodb-org=3.2.0 mongodb-org-server=3.2.0 mongodb-org-shell=3.2.0 mongodb-org-mongos=3.2.0 mongodb-org-tools=3.2.0 -y

# 更改系统配置
if test -f /sys/kernel/mm/transparent_hugepage/enabled; then
   echo never > /sys/kernel/mm/transparent_hugepage/enabled
fi
if test -f /sys/kernel/mm/transparent_hugepage/defrag; then
   echo never > /sys/kernel/mm/transparent_hugepage/defrag
fi

##################### end  mongodb 3.2 ############################


##################### install redis 2.8.19 ############################

# redis 2.8.19 为阿里云兼容版本

cd ${workdir}

wget http://download.redis.io/releases/redis-2.8.19.tar.gz
tar xzf redis-2.8.19.tar.gz
cd redis-2.8.19
sudo make && sudo make install

sudo apt-get install tcl -y
sudo make test

#####################  end  redis 2.8.19   ############################


##################### install node 6.2.2 ############################

cd ${workdir}

apt-get update
sudo apt-get install g++ curl libssl-dev apache2-utils git-core make -y

wget https://nodejs.org/dist/v6.2.2/node-v6.2.2.tar.gz
tar -xf node-v6.2.2.tar.gz
cd node-v6.2.2
./configure
make
sudo make install

sudo npm install -g pm2

##################### end node ############################


##################### install zeromq 4.1.5 ############################

cd ${workdir}

wget https://github.com/zeromq/zeromq4-1/releases/download/v4.1.5/zeromq-4.1.5.tar.gz
tar -xf zeromq-4.1.5.tar.gz
cd zeromq-4.1.5
./configure
make
sudo make install

# ubuntu 系统需要 export LD_LIBRARY_PATH=/usr/local/lib/
if [ `uname`='Linux' ];then
    echo 'export LD_LIBRARY_PATH=/usr/local/lib/' > sudo /etc/profile.d/ld.sh
    source /etc/profile
fi
##################### end zeromq ############################