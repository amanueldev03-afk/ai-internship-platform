# Generated migration for VectorField conversion

from django.db import migrations, models
import pgvector.django


class Migration(migrations.Migration):

    dependencies = [
        ('internships', '0008_alter_internship_embedding'),
    ]

    operations = [
        # Create vector extension
        migrations.RunSQL(
            'CREATE EXTENSION IF NOT EXISTS vector;',
            reverse_sql='DROP EXTENSION IF EXISTS vector;'
        ),
        # First, drop the JSONField column
        migrations.RemoveField(
            model_name='internship',
            name='embedding',
        ),
        # Then, add the VectorField column
        migrations.AddField(
            model_name='internship',
            name='embedding',
            field=pgvector.django.VectorField(dimensions=1536, null=True, blank=True),
        ),
    ]
