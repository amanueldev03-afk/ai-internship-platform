# Generated migration for VectorField conversion (PostgreSQL only)

from django.db import migrations, models
import pgvector.django


def apply_migration(apps, schema_editor):
    """Apply pgvector migration only on PostgreSQL, skip on SQLite"""
    if schema_editor.connection.vendor != 'postgresql':
        return  # Skip on SQLite - keep embedding as JSONField
    
    # Create vector extension
    schema_editor.execute('CREATE EXTENSION IF NOT EXISTS vector;')
    
    # Manually alter the field for PostgreSQL
    with schema_editor.connection.cursor() as cursor:
        # Drop the old JSONField column
        cursor.execute('ALTER TABLE internships_internship DROP COLUMN embedding;')
        # Add the new VectorField column
        cursor.execute('ALTER TABLE internships_internship ADD COLUMN embedding vector(1536);')


def reverse_migration(apps, schema_editor):
    """Reverse pgvector migration only on PostgreSQL"""
    if schema_editor.connection.vendor != 'postgresql':
        return  # Skip on SQLite
    
    schema_editor.execute('DROP EXTENSION IF EXISTS vector;')
    
    with schema_editor.connection.cursor() as cursor:
        cursor.execute('ALTER TABLE internships_internship DROP COLUMN embedding;')
        cursor.execute('ALTER TABLE internships_internship ADD COLUMN embedding JSONB;')


class Migration(migrations.Migration):

    dependencies = [
        ('internships', '0008_alter_internship_embedding'),
    ]

    operations = [
        migrations.RunPython(apply_migration, reverse_migration),
    ]
