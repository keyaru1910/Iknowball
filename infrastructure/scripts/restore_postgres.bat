@echo off
REM ==============================================================================
REM Script Rollback / Restore Database PostgreSQL cho iKnowBall (Windows)
REM ==============================================================================

setlocal enabledelayedexpansion

if "%~1"=="" (
    echo [HUONG DAN] Vui long truyen duong dan file .dump can khoi phuc.
    echo Vi du: restore_postgres.bat "d:\iknowball project\infrastructure\backups\iknowball_backup_20260920.dump"
    exit /b 1
)

set DUMP_FILE=%~1

if not exist "%DUMP_FILE%" (
    echo [LOI] File khong ton tai: %DUMP_FILE%
    exit /b 1
)

if "%DB_HOST%"=="" set DB_HOST=localhost
if "%DB_PORT%"=="" set DB_PORT=5432
if "%DB_NAME%"=="" set DB_NAME=iknowball
if "%DB_USER%"=="" set DB_USER=postgres

echo ==========================================
echo Dang thuc hien Khoi Phuc (Rollback) DB: %DB_NAME%
echo File dump: %DUMP_FILE%
echo ==========================================

pg_restore -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% --clean --if-exists -v "%DUMP_FILE%"

if %ERRORLEVEL% equ 0 (
    echo [THANH CONG] Da hoan tat khoi phuc database tu file dump!
) else (
    echo [CANH BAO] Qua trinh pg_restore ket thuc voi ma loi %ERRORLEVEL%. Kiem tra lai logs.
)

endlocal
