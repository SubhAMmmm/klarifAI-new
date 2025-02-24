# Generated by Django 5.1.4 on 2025-01-05 19:06

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("ideaGen", "0003_initial"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="generatedimage2",
            options={"ordering": ["-created_at"]},
        ),
        migrations.AddField(
            model_name="generatedimage2",
            name="final_parameters",
            field=models.JSONField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="generatedimage2",
            name="generation_status",
            field=models.CharField(
                choices=[
                    ("success", "Success"),
                    ("failed", "Failed"),
                    ("retried", "Retried"),
                ],
                default="success",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="generatedimage2",
            name="original_parameters",
            field=models.JSONField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="generatedimage2",
            name="parameters",
            field=models.JSONField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="generatedimage2",
            name="retry_count",
            field=models.IntegerField(default=0),
        ),
    ]
