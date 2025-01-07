
from django.db import models
from django.utils import timezone

class ProductIdea2(models.Model):
    product = models.CharField(max_length=255)
    brand = models.CharField(max_length=255)
    category = models.CharField(max_length=255)
    dynamic_fields = models.JSONField(default=dict)
    number_of_ideas = models.IntegerField(default=1)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.brand} - {self.product}"
    class Meta:
        app_label = 'ideaGen'

class Idea(models.Model):
    product_idea = models.ForeignKey(ProductIdea2, related_name='ideas', on_delete=models.CASCADE)
    product_name = models.CharField(max_length=255)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.product_name
    class Meta:
        app_label = 'ideaGen'

class GeneratedImage2(models.Model):
    idea = models.ForeignKey(Idea, related_name='images', on_delete=models.CASCADE, null=True)
    prompt = models.TextField()
    image = models.ImageField(upload_to="generated_images/")
    created_at = models.DateTimeField(auto_now_add=True)
    parameters = models.JSONField(null=True, blank=True)
    generation_status = models.CharField(
        max_length=20,
        choices=[
            ('success', 'Success'),
            ('failed', 'Failed'),
            ('retried', 'Retried')
        ],
        default='success'
    )
    retry_count = models.IntegerField(default=0)
    original_parameters = models.JSONField(null=True, blank=True)
    final_parameters = models.JSONField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        app_label = 'ideaGen'

    def __str__(self):
        return f"Image for {self.idea.product_name if self.idea else 'Unknown'}"