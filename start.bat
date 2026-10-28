@echo off
setlocal

rem Starts the Kontobuch backend (.NET API, http://localhost:5188) and frontend
rem (Angular dev server, http://localhost:4200), each in its own console window.
rem Use stop.bat to stop both again.

cd /d "%~dp0"

rem Angular 22 needs Node >= 22.22.3 / 24.15 / 26. If an nvm-managed Node of a suitable
rem version is installed, use it for this run (this does not change the system PATH).
if not defined NVM_HOME set "NVM_HOME=%APPDATA%\nvm"
set "NODE_DIR=%NVM_HOME%\v25.8.1"
if exist "%NODE_DIR%\node.exe" set "PATH=%NODE_DIR%;%PATH%"

where dotnet >nul 2>&1 || (echo FEHLER: dotnet wurde nicht gefunden. Bitte das .NET 8 SDK installieren. & pause & exit /b 1)
where node >nul 2>&1 || (echo FEHLER: node wurde nicht gefunden. Bitte Node.js installieren. & pause & exit /b 1)

powershell -NoProfile -Command "if (Get-NetTCPConnection -State Listen -LocalPort 5188,4200 -ErrorAction SilentlyContinue) { exit 1 }"
if errorlevel 1 (
  echo FEHLER: Port 5188 oder 4200 ist bereits belegt. Laeuft der Server schon? Dann zuerst stop.bat ausfuehren.
  pause
  exit /b 1
)

if not exist "frontend\node_modules" (
  echo Installiere Frontend-Abhaengigkeiten ...
  pushd frontend
  call npm install || (popd & echo FEHLER: npm install ist fehlgeschlagen. & pause & exit /b 1)
  popd
)

rem The JWT signing key lives in the user secrets and never in the repo. Create a random one on first run.
set "API_DIR=%~dp0backend\src\Kontobuch.Api"
dotnet user-secrets list --project "%API_DIR%" 2>nul | findstr /r /c:"^Jwt:SigningKey = ." >nul
if errorlevel 1 call :create_jwt_key || exit /b 1

rem Development enables the automatic database migration and the user-secrets JWT key.
set "ASPNETCORE_ENVIRONMENT=Development"

rem The ports are passed explicitly so stop.bat can recognise these windows by their command line.
echo Starte Backend  (http://localhost:5188) ...
start "Kontobuch Backend" /d "%~dp0backend\src\Kontobuch.Api" cmd /k dotnet run --urls http://localhost:5188

echo Starte Frontend (http://localhost:4200) ...
start "Kontobuch Frontend" /d "%~dp0frontend" cmd /k npm start -- --port 4200

echo.
echo Der erste Start dauert einen Moment. Danach ist die App unter http://localhost:4200 erreichbar.
echo Zum Beenden stop.bat ausfuehren.
exit /b 0

:create_jwt_key
rem A subroutine on purpose: inside a parenthesised block %JWT_KEY% would be expanded before it is set.
echo Erzeuge JWT-Schluessel fuer die Entwicklung ...
set "JWT_KEY="
for /f "delims=" %%k in ('powershell -NoProfile -Command "$b = New-Object byte[] 64; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); [Convert]::ToBase64String($b)"') do set "JWT_KEY=%%k"
if not defined JWT_KEY (
  echo FEHLER: JWT-Schluessel konnte nicht erzeugt werden.
  pause
  exit /b 1
)
dotnet user-secrets set "Jwt:SigningKey" "%JWT_KEY%" --project "%API_DIR%" >nul
if errorlevel 1 (
  echo FEHLER: JWT-Schluessel konnte nicht gespeichert werden.
  set "JWT_KEY="
  pause
  exit /b 1
)
set "JWT_KEY="
exit /b 0
