@echo off
title 쿠팡 순위 체킹기 v1.0
echo.
echo ========================================
echo    쿠팡 순위 체킹기 v1.0 - 최종 완성체
echo ========================================
echo.
echo 🎯 새로운 3개 상품 순위 체킹을 시작합니다...
echo.
echo 📋 검색할 상품:
echo    1. 이동식 트롤리 (상품번호: 8473798698)
echo    2. 자전거 자물쇠 (상품번호: 7446595001)
echo    3. 자전거 라이트 (상품번호: 8188782600)
echo.
echo 🚀 시작하려면 아무 키나 누르세요...
pause >nul
echo.
echo ⚡ 순위 체킹을 시작합니다...
echo.

cd /d "%~dp0"
node optimized_fast_checker_gui.js

echo.
echo 🏁 순위 체킹이 완료되었습니다!
echo.
echo 결과를 확인하려면 아무 키나 누르세요...
pause >nul
