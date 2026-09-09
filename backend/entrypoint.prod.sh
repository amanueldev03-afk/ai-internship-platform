#!/bin/sh
set -e

echo "==> [Entrypoint] Running database migrations..."
python manage.py migrate --noinput

echo "==> [Entrypoint] Collecting static files..."
python manage.py collectstatic --noinput

echo "==> [Entrypoint] Starting Gunicorn application server..."
exec "$@"
