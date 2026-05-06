#!/bin/bash
echo "Starting SB-DSS..."
cd backend
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies (first time only)..."
  npm install
fi
node server.js
