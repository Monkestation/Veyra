@echo off
setlocal enabledelayedexpansion

REM Quick Add Verification Script for Windows
REM This script logs in and adds a test verification

set BASE_URL=http://localhost:3000
set TOKEN=

echo.
echo Test Add Verification
echo ============================

REM Check if curl is available
curl --version >nul 2>&1
if errorlevel 1 (
    echo Error: curl is not installed or not in PATH
    echo Please install curl or use Windows 10/11 which includes it
    pause
    exit /b 1
)

REM Get credentials or use defaults
set /p USERNAME="Enter username (default: admin): "
if "!USERNAME!"=="" set USERNAME=admin

set /p PASSWORD="Enter password (default: admin123): "
if "!PASSWORD!"=="" set PASSWORD=admin123

echo.
echo 🔑 Authenticating...

REM Login to get token
curl -X POST "%BASE_URL%/api/auth/login" ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"!USERNAME!\",\"password\":\"!PASSWORD!\"}" ^
  -s -o login_response.tmp -w "%%{http_code}" > http_status.tmp

REM Get HTTP status code
set /p HTTP_STATUS=<http_status.tmp
set /p LOGIN_RESPONSE=<login_response.tmp

echo HTTP Status: !HTTP_STATUS!
echo Login Response: !LOGIN_RESPONSE!

REM Check if login was successful (HTTP 200)
if not "!HTTP_STATUS!"=="200" (
    echo Login failed! HTTP Status: !HTTP_STATUS!
    echo Server response: !LOGIN_RESPONSE!
    echo.
    echo Possible fixes:
    echo   1. Make sure your server is running: npm start
    echo   2. Check server console for errors
    echo   3. Try restarting the server
    echo   4. Verify default credentials weren't changed
    del login_response.tmp >nul 2>&1
    del http_status.tmp >nul 2>&1
    pause
    exit /b 1
)

REM Extract token from successful response using a more robust method
REM Look for "token":"..." pattern
for /f "tokens=2 delims=:" %%a in ('echo !LOGIN_RESPONSE! ^| findstr /C:"token"') do (
    set TEMP_TOKEN=%%a
    REM Remove quotes and comma
    set TEMP_TOKEN=!TEMP_TOKEN:"=!
    for /f "tokens=1 delims=," %%b in ("!TEMP_TOKEN!") do set TOKEN=%%b
)

REM Clean up any remaining quotes or spaces
set TOKEN=!TOKEN: =!
set TOKEN=!TOKEN:"=!

if "!TOKEN!"=="" (
    echo Could not extract token from response!
    echo Response was: !LOGIN_RESPONSE!
    del login_response.tmp >nul 2>&1
    del http_status.tmp >nul 2>&1
    pause
    exit /b 1
)

REM Clean up temp files
del login_response.tmp >nul 2>&1
del http_status.tmp >nul 2>&1

echo Authenticated successfully!
del login_response.tmp >nul 2>&1

echo.
echo Enter verification details (or press Enter for defaults):

set /p DISCORD_ID="Discord ID (default: 123456789): "
if "!DISCORD_ID!"=="" set DISCORD_ID=123456789

set /p CKEY="Ckey/Username (default: testuser): "
if "!CKEY!"=="" set CKEY=testuser

set /p ROLE="Role (default: player): "
if "!ROLE!"=="" set ROLE=player

set /p METHOD="Verification Method (default: manual): "
if "!METHOD!"=="" set METHOD=manual

echo.
echo Adding verification...
echo Discord ID: !DISCORD_ID!
echo Ckey: !CKEY!
echo Role: !ROLE!
echo Method: !METHOD!

REM Add the verification
curl -X POST "%BASE_URL%/api/v1/verify" ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer !TOKEN!" ^
  -d "{\"discord_id\":\"!DISCORD_ID!\",\"ckey\":\"!CKEY!\",\"verified_flags\":{\"verified\":true,\"role\":\"!ROLE!\",\"added_via\":\"batch_script\",\"timestamp\":\"!DATE! !TIME!\"},\"verification_method\":\"!METHOD!\"}" ^
  -w "%%{http_code}" -s -o add_response.tmp

echo.
echo Server Response:
type add_response.tmp
echo.

REM Check if it was successful by trying to retrieve it
echo.
echo Verifying the addition...
curl -X GET "%BASE_URL%/api/v1/verify/!DISCORD_ID!" ^
  -H "Authorization: Bearer !TOKEN!" ^
  -w "%%{http_code}" -s -o verify_response.tmp

echo Verification Check:
type verify_response.tmp
echo.

REM Clean up
del add_response.tmp >nul 2>&1
del verify_response.tmp >nul 2>&1

echo.
echo Process complete!
echo.
echo Your token for manual testing: !TOKEN!
echo.
echo Check the dashboard at: %BASE_URL%
echo.

REM Ask if user wants to add another
set /p ANOTHER="Add another verification? (y/n): "
if /i "!ANOTHER!"=="y" goto :eof
if /i "!ANOTHER!"=="yes" goto :eof

echo.
pause