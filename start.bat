@echo off
title STATECH Website
cd /d "%~dp0"

if not exist node_modules (
    echo Installing dependencies...
    call npm install
)

if not exist .env (
    echo Creating .env from .env.example...
    copy .env.example .env
    echo.
    echo IMPORTANT: Edit .env and set ADMIN_PASSWORD and SESSION_SECRET before going live.
    echo.
)

echo Starting STATECH website...
echo Open http://localhost:3000 in your browser
echo Admin login: http://localhost:3000/login
echo.
call npm start
