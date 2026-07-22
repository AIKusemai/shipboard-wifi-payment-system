#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUNTIME_DIR="$ROOT_DIR/.runtime"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
BACKEND_LOG="$RUNTIME_DIR/backend.log"
FRONTEND_LOG="$RUNTIME_DIR/frontend.log"
BACKEND_PID_FILE="$RUNTIME_DIR/backend.pid"
FRONTEND_PID_FILE="$RUNTIME_DIR/frontend.pid"

mkdir -p "$RUNTIME_DIR"

cleanup() {
  if [[ -f "$FRONTEND_PID_FILE" ]]; then
    FRONTEND_PID="$(cat "$FRONTEND_PID_FILE" 2>/dev/null || true)"
    if [[ -n "${FRONTEND_PID:-}" ]] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
      kill "$FRONTEND_PID" 2>/dev/null || true
    fi
    rm -f "$FRONTEND_PID_FILE"
  fi

  if [[ -f "$BACKEND_PID_FILE" ]]; then
    BACKEND_PID="$(cat "$BACKEND_PID_FILE" 2>/dev/null || true)"
    if [[ -n "${BACKEND_PID:-}" ]] && kill -0 "$BACKEND_PID" 2>/dev/null; then
      kill "$BACKEND_PID" 2>/dev/null || true
    fi
    rm -f "$BACKEND_PID_FILE"
  fi
}

trap cleanup EXIT INT TERM

echo "Starting backend..."
(
  cd "$BACKEND_DIR"
  ./mvnw spring-boot:run -Dspring-boot.run.profiles=local-verification
) >"$BACKEND_LOG" 2>&1 &
echo $! > "$BACKEND_PID_FILE"

sleep 5

if ! kill -0 "$(cat "$BACKEND_PID_FILE")" 2>/dev/null; then
  echo "Backend failed to start. Check $BACKEND_LOG"
  exit 1
fi

echo "Starting frontend..."
(
  cd "$FRONTEND_DIR"
  if command -v nvm >/dev/null 2>&1; then
    nvm use 22 >/dev/null
  elif [[ -s "$HOME/.nvm/nvm.sh" ]]; then
    # shellcheck disable=SC1090
    . "$HOME/.nvm/nvm.sh"
    nvm use 22 >/dev/null
  fi
  npx vite --port 5173 --host 0.0.0.0
) >"$FRONTEND_LOG" 2>&1 &
echo $! > "$FRONTEND_PID_FILE"

sleep 3

if ! kill -0 "$(cat "$FRONTEND_PID_FILE")" 2>/dev/null; then
  echo "Frontend failed to start. Check $FRONTEND_LOG"
  exit 1
fi

echo "ShipTourWifi is running."
echo "Frontend: http://localhost:5173"
echo "Backend:  http://localhost:8080/api"
echo "Logs:"
echo "  $BACKEND_LOG"
echo "  $FRONTEND_LOG"
echo
echo "Press Ctrl+C to stop both services."

wait "$(cat "$BACKEND_PID_FILE")" "$(cat "$FRONTEND_PID_FILE")"
