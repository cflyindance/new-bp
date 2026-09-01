#!/bin/bash

DIR=`pwd`
yarn build
echo "打包文件拷贝到本机POS Server"
cd /c/Wisdomount/Menusifu/application/1.8.0.30.14/tomcat/webapps/kpos/emenu
rm -rf ** && cp -rf $DIR/build/** .
"C:\Program Files\Google\Chrome\Application\chrome.exe" http://localhost:22080/kpos/emenu --incognito
# echo "打包文件拷贝到192.168.0.168机器POS Server"
# cd /z/emenu
# rm -rf ** && cp -rf $DIR/build/** .
