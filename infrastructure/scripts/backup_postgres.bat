@echo off
REM ==============================================================================
REM Script Backup Database PostgreSQL cho iKnowBall (Môi trường Windows)
REM ==============================================================================

setlocal enabledelayedexpansion

REM Lấy ngày giờ định dạng YYYYMMDD_HHMMSS
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set TIMESTAMP=%datetime:~0,8%_%datetime:~8,6%

REM Cấu hình thông tin kết nối (Có thể truyền qua biến môi trường)
if "%DB_HOST%"=="" set DB_HOST=localhost
if "%DB_PORT%"=="" set DB_PORT=5432
if "%DB_NAME%"=="" set DB_NAME=iknowball
if "%DB_USER%"=="" set DB_USER=postgres

REM Thư mục lưu file sao lưu
set BACKUP_DIR=d:\iknowball project\infrastructure\backups
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

set BACKUP_FILE=%BACKUP_DIR%\iknowball_backup_%TIMESTAMP%.sql.gz

echo ==========================================
echo Dang thuc hien Backup Database: %DB_NAME%
echo Thoi gian: %TIMESTAMP%
echo Host: %DB_HOST%:%DB_PORT%
echo File dich: %BACKUP_FILE%
echo ==========================================

REM Thực hiện pg_dump
pg_dump -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -F c -b -v -f "%BACKUP_DIR%\iknowball_backup_%TIMESTAMP%.dump" %DB_NAME%

if %ERRORLEVEL% equ 0 (
    echo [THANH CONG] Da tao ban sao luu database tai: %BACKUP_DIR%\iknowball_backup_%TIMESTAMP%.dump
) else (
    echo [LOI] Qua trinh backup database that bai. Vui long kiem tra pg_dump va thong tin xac thuc.
)

endlocal
