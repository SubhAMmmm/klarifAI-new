# structruedDataQuery/models.py

from django.db import models

class UploadedData(models.Model):
    file_name = models.CharField(max_length=255)
    table_name = models.CharField(max_length=255)
    upload_date = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        app_label = 'structruedDataQuery'  # This routes to data_analysis database
        db_table = 'uploaded_data'
        
    def __str__(self):
        return f"{self.file_name} - {self.upload_date}"

class QueryHistory(models.Model):
    question = models.TextField()
    sql_query = models.TextField()
    results = models.JSONField()
    execution_time = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        app_label = 'structruedDataQuery'  # This routes to data_analysis database
        db_table = 'query_history'
        
    def __str__(self):
        return f"Query: {self.question[:50]}... - {self.created_at}"