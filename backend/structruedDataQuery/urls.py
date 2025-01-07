from django.urls import path
from .views import DataAnalysisAPIView, SaveResultsAPIView

urlpatterns = [
    path('analysis/', DataAnalysisAPIView.as_view(), name='data_analysis'),
    path('save-results/', SaveResultsAPIView.as_view(), name='save_results'),
]