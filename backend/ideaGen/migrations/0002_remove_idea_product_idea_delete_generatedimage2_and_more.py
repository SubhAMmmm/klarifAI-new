# Generated by Django 5.1.4 on 2025-01-05 18:27

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("ideaGen", "0001_initial"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="idea",
            name="product_idea",
        ),
        migrations.DeleteModel(
            name="GeneratedImage2",
        ),
        migrations.DeleteModel(
            name="Idea",
        ),
        migrations.DeleteModel(
            name="ProductIdea2",
        ),
    ]
