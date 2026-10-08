@echo off
chcp 65001 >nul
cd /d "%~dp0"
set "PY="
where py >nul 2>nul && set "PY=py -3"
if not defined PY where python >nul 2>nul && set "PY=python"
if not defined PY (
  echo Python 3.10 이상이 필요합니다. https://www.python.org/downloads/ 에서 설치한 뒤 다시 실행하세요.
  pause & exit /b 1
)
if not exist ".venv\Scripts\python.exe" (
  echo 처음 실행: 필요한 패키지를 설치합니다...
  %PY% -m venv .venv || goto err
)
".venv\Scripts\python.exe" -m pip install -q -r requirements.txt || goto err
start "" cmd /c "timeout /t 2 >nul & start http://127.0.0.1:8765"
echo.
echo 인재추천 워크룸 실행 중 - 이 창을 닫으면 종료됩니다.
".venv\Scripts\python.exe" server.py
pause & exit /b 0
:err
echo 설치 또는 실행에 실패했습니다. 위 메시지를 확인하세요.
pause & exit /b 1
