# idea_generator/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('generate_ideas/', views.generate_ideas, name='generate_ideas'),
    path('generate_product_image/', views.generate_product_image, name='generate_product_image'),
    path('regenerate_product_image/', views.regenerate_product_image, name='regenerate_product_image'),
    path('update_idea/', views.update_idea, name='update_idea'),
    path('delete_idea/', views.delete_idea, name='delete_idea'),
]