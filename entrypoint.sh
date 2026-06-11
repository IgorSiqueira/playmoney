#!/bin/sh
set -e

echo "[playmoney] Running database migrations..."
node_modules/.bin/prisma migrate deploy

echo "[playmoney] Starting application..."
exec node server.js
