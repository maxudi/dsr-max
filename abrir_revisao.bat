@echo off
cd /d "%~dp0"
start "DSR - Servidor local" cmd /c "py -m http.server 8000"
timeout /t 2 /nobreak >nul
start "" "http://localhost:8000/revisao_aulas_01_06.html"
