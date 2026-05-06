@echo off
echo Starting SB-DSS...
cd backend
if not exist "node_modules" npm install
node server.js
pause
