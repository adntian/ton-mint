#!/bin/bash

npm install @ton/ton @ton/crypto @ton/core buffer && nohup node index.js 2>&1 & >> mint.log