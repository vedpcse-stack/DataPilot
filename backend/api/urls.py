from django.urls import path

from api import views

urlpatterns = [
    path("dataset/analyze/", views.DatasetAnalyzeView.as_view()),
    path("dataset/target-analysis/", views.TargetAnalyzeView.as_view()),
    path("model/available/", views.available_models),
    path("model/train/", views.TrainModelView.as_view()),
    path("model/predict/", views.PredictView.as_view()),
    path("model/download/", views.DownloadModelView.as_view()),
    path("report/download/", views.DownloadReportView.as_view()),
]
