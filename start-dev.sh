#!/bin/bash
# LoRa Gateway UI — 本地开发环境启动脚本
# 用法:
#   ./start-dev.sh        启动
#   ./start-dev.sh stop   停止（读取 .dev-pids 文件）

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PID_FILE="$SCRIPT_DIR/.dev-pids"

stop_servers() {
  if [ -f "$PID_FILE" ]; then
    while IFS= read -r pid; do
      kill "$pid" 2>/dev/null && echo "Stopped PID $pid"
    done < "$PID_FILE"
    rm -f "$PID_FILE"
    echo "✅ Dev servers stopped"
  else
    echo "No running dev servers found (.dev-pids missing)"
  fi
  exit 0
}

[ "$1" = "stop" ] && stop_servers

echo "🚀 Starting LoRa Gateway UI dev environment..."
echo ""

# 启动 Mock RPC server
node "$SCRIPT_DIR/mock/server.mjs" > /tmp/lora-mock.log 2>&1 &
MOCK_PID=$!
echo "✅ Mock RPC server  PID=$MOCK_PID  →  http://localhost:3000"
sleep 0.5

# 启动 Vite dev server
cd "$SCRIPT_DIR/htdoc"
npx vite > /tmp/lora-vite.log 2>&1 &
VITE_PID=$!
echo "✅ Vite dev server  PID=$VITE_PID  →  http://localhost:5173"

# 保存 PID 便于后续停止
printf '%s\n%s\n' "$MOCK_PID" "$VITE_PID" > "$PID_FILE"

echo ""
echo "📡 Mock RPC : http://localhost:3000/oui-rpc"
echo "🌐 UI       : http://localhost:5173"
echo ""
echo "Logs : /tmp/lora-mock.log  /tmp/lora-vite.log"
echo "Stop : ./start-dev.sh stop"
