@echo off
setlocal

rem Stops the Kontobuch backend (port 5188) and frontend (port 4450) started by start.bat.

echo Beende Kontobuch ...

rem Close the console windows opened by start.bat. They are recognised by their command line
rem (the console title can't be relied on: npm and dotnet overwrite it). /T also ends the
rem server processes running inside them.
powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'cmd.exe' -and $_.CommandLine -match '/k (dotnet run --urls http://localhost:5188|npm start -- --port 4450)' } | ForEach-Object { taskkill /PID $_.ProcessId /T /F | Out-Null }"

rem Fallback: end whatever still listens on the app's ports (e.g. servers started another way).
powershell -NoProfile -Command "Get-NetTCPConnection -State Listen -LocalPort 5188,4450 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { taskkill /PID $_ /T /F | Out-Null }"

echo Fertig.
