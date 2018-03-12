#!/usr/bin/python
#coding:utf8
"""
请先执行如下脚本 ubuntu 14.04 64 python 2.7.6 上测试
sudo apt-get install python-pip python-dev -y
sudo pip install numpy
sudp pip install pandas
"""

import pandas as pd
import time
import json
import argparse
import datetime
import re
import os
import sys

df = None
log = None

def output(msg):
    with open('quality.txt','a') as f:
        f.write(str(msg) + "\n")

def parse_line(line):
    timestr = line[1:20]
    jsonstr = line[47:]

    try:
        jsonobj = json.loads(jsonstr)
    except Exception as e:
        output(e.message + jsonstr)

    route = jsonobj.get("route")
    timeuse = jsonobj.get("timeUsed")

    return timestr,route,timeuse



def read_logfile(filepath):
    """
    读取一个日志进行分析
    """

    global df
    resultlist = []
    with open(filepath) as f:
        while True:
            data = f.readlines()
            if not data:
                break
            for linedata in data:
                timestr,route,timeuse = parse_line(linedata)
                resultlist.append([timestr,route,timeuse])

    return resultlist

def parse_logs(files):

    resultlist = []
    for filename in files:
        datalist = read_logfile(filename)
        resultlist.extend(datalist)

    df = pd.DataFrame(resultlist, columns=["time", "route", "cost"])

    # 数据分箱
    category = pd.cut(df["cost"], [0, 50, 80, 120, 200, 1000, 3000], right=False)
    df["category"] = category

    # output("df分箱之后")
    # output(df.head())

    adf = pd.DataFrame(df.groupby("category").size(),columns=["num"])
    adf["rate"] = adf["num"]/adf["num"].sum() * 100000

    ctab = pd.crosstab(df["route"], df["category"])

    # output(ctab)

    output(str(adf))

def get_filepaths(filepath):
    """
    从形如 path 的路径中得到路径list
    :param filepath: eg. /logs/forward-log-game-server-1-[2017-05-30,2017-06-05].log
    :return: list
    """
    pass

    if filepath.find("[") == -1 and filepath.find("]") == -1:
        return [filepath]

    dstartstr = filepath[filepath.find("[")+1:filepath.find(",")]
    dendstr = filepath[filepath.find(",")+1:filepath.find("]")]

    dstart = datetime.datetime.strptime(dstartstr, "%Y-%m-%d")
    dend = datetime.datetime.strptime(dendstr, "%Y-%m-%d")

    days = (dend-dstart).days + 1

    result = []
    oneday = datetime.timedelta(days=1)

    for i in range(days):
        date = dstart + oneday * i
        mstr = date.strftime("%Y-%m-%d")
        onefile = re.sub('\[.*?\]', mstr, filepath)

        result.append(onefile)

    return result

def main():
    global log

    parser = argparse.ArgumentParser(description="选择几天的forward-log 分析服务器运行质量")
    parser.add_argument("-i","--input", help="支持带有日期通配符的路径,如 '/logs/forward-log-1-[2017-05-30,2017-06-05].log|/logs/forward-log-1-[2017-05-30,2017-06-05].log'", default="")
    parser.add_argument("-l","--list", help="文件路径数组 , 分隔")
    parser.add_argument('--log', default=sys.stdout, type=argparse.FileType('w'), help='the file where the sum should be written')

    args = parser.parse_args()
    log = args.log

    logpathlist = args.input.split("|")

    logpaths = []
    if logpathlist:
        for logpathstr in logpathlist:
            logpaths.extend(get_filepaths(logpathstr))

    if args.list:
        listfilepath = args.list.split(",")
        logpaths.extend(listfilepath)

    filterlogpaths = []

    output("开始生成质量报告:" + time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(time.time())))
    if logpaths:
        for filepath in logpaths:
            if os.path.exists(filepath):
                filterlogpaths.append(filepath)
            else:
                output("文件不存在:" + filepath)

    if len(filterlogpaths) == 0:
        output('没有待处理的文件')


    output("处理文件:")
    for item in filterlogpaths:
        output(item)
    parse_logs(filterlogpaths)
    output("完成生成质量报告:" + time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(time.time())))
    output("---")
    output("")

if __name__ == "__main__":
    main()