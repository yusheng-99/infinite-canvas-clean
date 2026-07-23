@echo off
setlocal
cd /d "%~dp0web"
if errorlevel 1 (
  echo [error] cannot enter web/
  exit /b 1
)

where bun >nul 2>&1
if %errorlevel%==0 (
  set "PM=bun"
) else (
  where npm >nul 2>&1
  if errorlevel 1 (
    echo [error] need bun or npm in PATH
    exit /b 1
  )
  set "PM=npm"
)

if not exist "node_modules\" (
  echo [install] %PM% install ...
  call %PM% install
  if errorlevel 1 exit /b 1
)

echo [dev] http://localhost:3000
call %PM% run dev
