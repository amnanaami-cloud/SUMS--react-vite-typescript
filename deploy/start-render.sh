#!/bin/sh
set -eu

PUBLIC_PORT="${PORT:?Render must provide the public PORT environment variable}"
case "$PUBLIC_PORT" in
  *[!0-9]*|'')
    echo "PORT must be a numeric TCP port" >&2
    exit 1
    ;;
esac

export RENDER_PUBLIC_PORT="$PUBLIC_PORT"

cd /app

echo "Applying Prisma migrations..."
./node_modules/.bin/prisma migrate deploy --schema server/prisma/schema.prisma

if [ "${SEED_ON_START:-false}" = "true" ]; then
  echo "SEED_ON_START=true; loading the development seed..."
  NODE_ENV=development ./node_modules/.bin/tsx server/prisma/seed.ts
fi

envsubst '${RENDER_PUBLIC_PORT}' \
  < /app/deploy/nginx.render.conf.template \
  > /etc/nginx/http.d/default.conf

API_PID=''
NGINX_PID=''

stop_processes() {
  trap - EXIT INT TERM
  if [ -n "$NGINX_PID" ]; then
    kill -TERM "$NGINX_PID" 2>/dev/null || true
  fi
  if [ -n "$API_PID" ]; then
    kill -TERM "$API_PID" 2>/dev/null || true
  fi
  if [ -n "$NGINX_PID" ]; then
    wait "$NGINX_PID" 2>/dev/null || true
  fi
  if [ -n "$API_PID" ]; then
    wait "$API_PID" 2>/dev/null || true
  fi
}

trap stop_processes EXIT INT TERM

echo "Starting NestJS API on internal port 3000..."
PORT=3000 node server/dist/main.js &
API_PID=$!

echo "Starting Nginx on public port $RENDER_PUBLIC_PORT..."
nginx -g 'daemon off;' &
NGINX_PID=$!

while kill -0 "$API_PID" 2>/dev/null && kill -0 "$NGINX_PID" 2>/dev/null; do
  sleep 1
done

if ! kill -0 "$API_PID" 2>/dev/null; then
  API_STATUS=0
  wait "$API_PID" || API_STATUS=$?
  echo "NestJS API exited with status $API_STATUS; stopping the container." >&2
  exit "$API_STATUS"
fi

NGINX_STATUS=0
wait "$NGINX_PID" || NGINX_STATUS=$?
echo "Nginx exited with status $NGINX_STATUS; stopping the container." >&2
exit "$NGINX_STATUS"
