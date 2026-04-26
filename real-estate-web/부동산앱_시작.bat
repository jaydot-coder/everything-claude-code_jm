@echo off
chcp 65001 > nul
title 부동산 대출 분석기

echo 서버 시작 중...
start "" "http://localhost:3000"
node server.js
pause
