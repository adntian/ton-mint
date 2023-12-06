#!/bin/bash

# 判断是否存在node_modules目录，如果存在不安装依赖
if [ ! -d "./node_modules" ]; then
  echo "**********"
  echo "开始安装依赖"
  npm install @ton/ton @ton/crypto @ton/core buffer
  echo "依赖安装完成"
  echo "**********"
fi
nohup node index.js 2>&1 >> mint.log &
echo "程序已经开始执行，以下内容是日志输出，可以直接ctrl+c退出查看日志"
tail -f mint.log
