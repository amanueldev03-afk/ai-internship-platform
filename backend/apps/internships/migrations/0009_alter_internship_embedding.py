# Generated migration for VectorField conversion (PostgreSQL only)
#
# The pgvector extension must be installed by a superuser BEFORE running
# migrations. Run once manually:
#   sudo -u postgres psql -d ai_internship -c "CREATE EXTENSION IF NOT EXISTS vector;"
# In Docker, the docker-compose.yml init script handles this automatically.

from django.db import migrations
import pgvector.django


def apply_migration(apps, schema_editor):
    """Apply pgvector migration only on PostgreSQL, skip on SQLite."""
    if schema_editor.connection.vendor != "postgresql":
        return  # Skip on SQLite — keep embedding as JSONField

    # Verify extension is installed before proceeding
    with schema_editor.connection.cursor() as cursor:
        cursor.execute(
            "SELECT 1 FROM pg_extension WHERE extname = 'vector';"
        )
        if not cursor.fetchone():
            raise RuntimeError(
                "pgvector extension is not installed. Run as superuser:\n"
                "  sudo -u postgres psql -d ai_internship "
                "-c \"CREATE EXTENSION IF NOT EXISTS vector;\""
            )

        # Drop old JSONField column and add new VectorField column
        cursor.execute(
            "ALTER TABLE internships_internship DROP COLUMN IF EXISTS embedding;"
        )
        cursor.execute(
            "ALTER TABLE internships_internship ADD COLUMN embedding vector(1536);"
        )


def reverse_migration(apps, schema_editor):
    """Reverse pgvector migration only on PostgreSQL."""
    if schema_editor.connection.vendor != "postgresql":
        return

    with schema_editor.connection.cursor() as cursor:
        cursor.execute(
            "ALTER TABLE internships_internship DROP COLUMN IF EXISTS embedding;"
        )
        cursor.execute(
            "ALTER TABLE internships_internship ADD COLUMN embedding JSONB;"
        )


class Migration(migrations.Migration):

    dependencies = [
        ("internships", "0008_alter_internship_embedding"),
    ]

    operations = [
        migrations.RunPython(apply_migration, reverse_migration),
    ]
