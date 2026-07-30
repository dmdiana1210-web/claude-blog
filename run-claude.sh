#!/usr/bin/env bash
# Запускает Claude Code с прогруженным .env (нужно для MCP-серверов).
set -a
source "$(dirname "$0")/.env"
set +a
exec claude "$@"
