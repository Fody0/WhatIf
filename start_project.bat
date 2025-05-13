@echo off
REM Скрипт для автоматической проверки зависимостей и запуска проекта
echo Starting project setup...

setlocal enabledelayedexpansion

REM Capture --api.base.url argument from command line
set NEW_API_URL=%2

REM Use delayed expansion to access the variable
echo The extracted URL is: !NEW_API_URL!

if "!NEW_API_URL!"=="" (
    echo [ERROR] --api.base.url parameter is required!
    echo Example: start_project.bat --api.base.url=https://your-api-url.com    
    pause
    exit /b 1
) else (
    echo URL is valid: !NEW_API_URL!
)

REM Проверка Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js не установлен!
    echo Скачайте с https://nodejs.org     и установите
    pause
    exit /b 1
)

REM Проверка Java JDK
where javac >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Java JDK не установлен!
    echo Скачайте с https://adoptium.net/     и установите
    pause
    exit /b 1
)

REM Проверка Maven
where mvn >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Maven не установлен!
    echo Скачайте с https://maven.apache.org/install.html     и установите
    pause
    exit /b 1
)

REM Проверка структуры папок
if not exist "frontend\" (
    echo [ERROR] Папка frontend не найдена!
    pause
    exit /b 1
)

if not exist "backend\" (
    echo [ERROR] Папка backend не найдена!
    pause
    exit /b 1
)

REM Установка зависимостей
echo Installing dependencies...
start "NPM Install" cmd /k "cd frontend && npm install"
start "Maven Build" cmd /k "cd backend && mvn clean install"

REM Ожидание завершения установки
echo Wait for dependencies installation...
timeout /t 20 /nobreak

REM Проверка PostgreSQL
where psql >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] PostgreSQL не установлен!
    echo Скачайте с https://www.postgresql.org/download/     и установите
    echo Обязательно отметьте "Add PostgreSQL to PATH" при установке
    pause
    exit /b 1
)

REM Проверка работы PostgreSQL сервиса
pg_isready -U postgres
if %ERRORLEVEL% neq 0 (
    echo [ERROR] PostgreSQL сервис не запущен!
    echo Попробуйте запустить командой: net start postgresql-x64-16
    echo Или через Services.msc
    pause
    exit /b 1
)

REM Проверка существования базы данных
echo Checking for 'whatif_db' database...
psql -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='whatif_db'" | findstr /C:"1" >nul
if %ERRORLEVEL% neq 0 (
    echo [WARNING] Database 'whatif_db' не найдена!
    echo Создание базы данных...
    
    set /p pg_username="Введите PostgreSQL username (по умолчанию postgres): "
    if "!pg_username!"=="" set pg_username=postgres
    
    set /p pg_password="Введите пароль для !pg_username!: "
    
    psql -U !pg_username! -c "CREATE DATABASE whatif_db;" -w !pg_password!
    
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Не удалось создать базу данных!
        echo Создайте вручную командой:
        echo psql -U postgres -c "CREATE DATABASE whatif_db;"
        pause
        exit /b 1
    )
    echo База данных 'whatif_db' успешно создана!
)

REM Запуск серверов
echo Starting servers...
start "Spring Boot Server" cmd /k "cd backend && mvn spring-boot:run -Dspring-boot.run.jvmArguments='-Dapi.base.url=!NEW_API_URL!'"
timeout /t 5 /nobreak
start "React App" cmd /k "cd frontend && npm start"

echo Project started successfully!
endlocal