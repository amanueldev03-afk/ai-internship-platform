#!/bin/sh
set -e

echo "==> [Entrypoint] Checking database availability..."
python -c "
import time, os, sys
import psycopg2

db_url = os.getenv('DATABASE_URL')
if db_url:
    print('Checking database connection...')
    for attempt in range(1, 21):
        try:
            conn = psycopg2.connect(db_url, connect_timeout=3)
            conn.close()
            print('Database connection established successfully!')
            sys.exit(0)
        except Exception as err:
            print(f'Attempt {attempt}/20: Waiting for database... ({err})')
            time.sleep(2)
    print('Warning: Database did not respond within timeout, proceeding with startup...')
" || true

echo "==> [Entrypoint] Running database migrations..."
python manage.py migrate --noinput || {
    echo "==> [Entrypoint] Warning: Migration encountered an issue. Proceeding with application server..."
}

echo "==> [Entrypoint] Collecting static files..."
python manage.py collectstatic --noinput

echo "==> [Entrypoint] Starting Gunicorn application server..."
exec "$@"
