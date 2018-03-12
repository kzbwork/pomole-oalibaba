#!/bin/sh

cd `dirname $0`
echo `pwd`
if [ ! -d "dbdata" ]; then
  mkdir dbdata
fi

if [ ! -d "dbdata/mongodb" ]; then
  mkdir dbdata/mongodb
fi

if [ ! -d "dbdata/redis" ]; then
  mkdir dbdata/redis
fi

ret_redis=`ps aux | grep 'redis-server' | grep -v grep`
if [ -n "$ret_redis" ]; then
  echo "redis已启动!"
else
  echo "正在启动redis"
  nohup redis-server &
fi


ret_mongo=`ps aux | grep 'mongod --config ./config/mongod.conf' | grep -v grep`
if [ -n "$ret_mongo" ]; then
  echo "mongodb已启动!"
else
  echo "正在启动mongod"
  mongod --config ./config/mongod.conf &
fi


