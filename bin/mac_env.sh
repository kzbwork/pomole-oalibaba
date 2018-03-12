#!/usr/bin/env bash

##################### install node 6.2.2 ############################

wget https://nodejs.org/dist/v6.2.2/node-v6.2.2.tar.gz
tar -xf node-v6.2.2.tar.gz
cd node-v6.2.2
./configure
make
sudo make install

sudo npm install -g pm2

##################### end node ############################


##################### install zeromq 4.1.5 ############################

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

npm install pomelo@1.2.3 -g
