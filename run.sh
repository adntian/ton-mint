#!/bin/bash

# 判断是否存在node_modules目录，如果存在不安装依赖
if [ ! -d "./node_modules" ]; then
  echo "**********"
  echo "开始安装依赖"
  npm install @ton/ton @ton/crypto @ton/core buffer
  echo "依赖安装完成"
  echo "**********"
fi
nohup node index.js >> mint.log 2>&1 &
pid=$!

# ctrl + c 退出时，杀死子进程，不要中断后台任务
echo "如果要关闭任务，请执行 ./kill.sh"
echo "#!/bin/bash" > kill.sh
echo "kill $pid" >> kill.sh
echio "rm kill.sh" >> kill.sh
chmod +x kill.sh
echo "****************"
echo "当前程序输出的最新日志："
tail -n 10 mint.log
echo "****************"
echo "程序已经开始执行，查看日志输出请执行以下命令："
echo "tail -f mint.log"
