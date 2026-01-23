#!/bin/bash

echo "========================================"
echo "   FNPulse Admin Dashboard Starter"
echo "========================================"
echo ""

# Navigate to the script's directory
cd "$(dirname "$0")"

echo "[1/3] Checking for processes on port 3000..."
PORT_PID=$(lsof -ti:3000 2>/dev/null)

if [ ! -z "$PORT_PID" ]; then
    echo "      Found process $PORT_PID using port 3000"
    echo "      Killing process..."
    kill -9 $PORT_PID 2>/dev/null
    echo "      Process terminated"
else
    echo "      Port 3000 is available"
fi

echo ""
echo "[2/3] Navigating to admin directory..."
cd admin

echo ""
echo "[3/3] Starting admin server..."
echo ""
echo "=========================================="
echo "  Dashboard will be available at:"
echo "  http://localhost:3000"
echo "=========================================="
echo ""

# Start the server
npm start
