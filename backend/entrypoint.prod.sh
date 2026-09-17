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
python manage.py migrate --noinput --verbosity 2 || {
    echo "==> [Entrypoint] Migration failed! Printing details:"
    python manage.py migrate --noinput -v 3 || true
}

echo "==> [Entrypoint] Initializing Django Site..."
python -c "
import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.production')
django.setup()
try:
    from django.contrib.sites.models import Site
    site, created = Site.objects.get_or_create(id=1, defaults={'domain': 'onrender.com', 'name': 'AI Internship Platform'})
    print('Django Site initialized successfully!')
except Exception as e:
    print(f'Site initialization notice: {e}')
" || true

echo "==> [Entrypoint] Seeding initial internships if database is empty..."
python -c "
import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.production')
django.setup()
from apps.internships.models import Internship
if Internship.objects.count() == 0:
    from django.core.management import call_command
    print('Empty database detected. Seeding live internships...')
    call_command('fetch_live_data', '--sources', 'github,remoteok,arbeitsagentur')
" || true

echo "==> [Entrypoint] Collecting static files..."
python manage.py collectstatic --noinput

echo "==> [Entrypoint] Starting Gunicorn application server..."
exec "$@"
