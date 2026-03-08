#!/bin/bash
# BlogOS — Script de inicio robusto con auto-restart
set -e

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
PORT=3200
LOG_DIR="$APP_DIR/.logs"
mkdir -p "$LOG_DIR"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🚀 BlogOS — Iniciando..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Matar procesos existentes en el puerto
lsof -ti :$PORT | xargs kill -9 2>/dev/null || true
pkill -f "cloudflared tunnel" 2>/dev/null || true
sleep 1

# Función que inicia el servidor con auto-restart
start_server() {
  while true; do
    echo "[$(date '+%H:%M:%S')] ▶ Iniciando servidor Next.js en :$PORT"
    cd "$APP_DIR" && node_modules/.bin/next start -p $PORT >> "$LOG_DIR/server.log" 2>&1 || true
    echo "[$(date '+%H:%M:%S')] ⚠ Servidor caído, reiniciando en 3s..."
    sleep 3
  done
}

# Función que inicia el tunnel con auto-restart
start_tunnel() {
  sleep 4  # Esperar a que el server esté listo
  while true; do
    echo "[$(date '+%H:%M:%S')] 🌐 Iniciando cloudflare tunnel..."
    cloudflared tunnel --url http://localhost:$PORT 2>&1 | tee "$LOG_DIR/tunnel.log" | grep -E "(trycloudflare|INF Registered|ERR)" || true
    echo "[$(date '+%H:%M:%S')] ⚠ Tunnel caído, reiniciando en 5s..."
    sleep 5
  done
}

# Arrancar ambos en background
start_server &
SERVER_PID=$!

start_tunnel &
TUNNEL_PID=$!

echo "  Server PID: $SERVER_PID"
echo "  Tunnel PID: $TUNNEL_PID"
echo ""
echo "  Logs:"
echo "    Servidor: $LOG_DIR/server.log"
echo "    Tunnel:   $LOG_DIR/tunnel.log"
echo ""
echo "  Para detener: kill $SERVER_PID $TUNNEL_PID"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

wait
