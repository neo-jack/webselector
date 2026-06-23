@echo off
setlocal
set "BUILD_CMD=%~dp0build.cmd"
set "INTERVAL=60"

:loop
call "%BUILD_CMD%" %*
if defined WATCHBUILD_ONCE goto done
timeout /t %INTERVAL% /nobreak >nul 2>&1
goto loop

:done
endlocal
