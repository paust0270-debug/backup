@echo off
title 쿠팡 순위 체킹기 GUI v1.0
echo.
echo ========================================
echo  쿠팡 순위 체킹기 GUI v1.0 - 최종 완성체
echo ========================================
echo.
echo 🎯 GUI 버전을 시작합니다...
echo.
echo 📋 검색할 상품:
echo    1. 이동식 트롤리 (상품번호: 8473798698)
echo    2. 자전거 자물쇠 (상품번호: 7446595001)
echo    3. 자전거 라이트 (상품번호: 8188782600)
echo.
echo 🚀 GUI를 시작하려면 아무 키나 누르세요...
pause >nul
echo.
echo ⚡ GUI 애플리케이션을 시작합니다...
echo.

cd /d "%~dp0"
npm start

echo.
echo 🏁 GUI 애플리케이션이 종료되었습니다!
echo.
echo 결과를 확인하려면 아무 키나 누르세요...
pause >nul
