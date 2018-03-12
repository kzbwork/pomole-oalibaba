#!/usr/bin/python
#coding:utf8

FILES = ["servers.json","database.json","master.json"]
TYPES = ["huawei","default"]

PATH_PREFIX = "./config/"

import argparse
import os
import shutil

def rename_to_default(mtype):
	for filename in FILES:
		filepath = os.path.join(PATH_PREFIX,filename)
		namearr = filename.split('.')
		newfilename = namearr[0] + '.' + mtype + '.' + namearr[1]
		newfilepath = os.path.join(PATH_PREFIX, newfilename)

		shutil.copy(newfilepath, filepath)
			

def remove_default():
	for filename in FILES:
		filepath = os.path.join(PATH_PREFIX,filename)
		if os.path.exists(filepath):
			os.remove(filepath)

def change_type(type):
	remove_default()
	rename_to_default(type)

def main():
	parser = argparse.ArgumentParser(description="选择一个服务器类型: huawei|default")
	parser.add_argument("type", help="服务器类型，可选值:huawei|default")

	args = parser.parse_args()
	mtype = args.type

	change_type(mtype)

if __name__ == "__main__":
	main()