#!/bin/sh
set -e

echo "[playmoney] Running database migrations..."
node node_modules/prisma/build/index.js migrate deploy

echo "[playmoney] Starting application..."
exec node server.js
