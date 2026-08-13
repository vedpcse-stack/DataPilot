from django.urls import include, path
import api


urlpatterns = [
    path("api/", include('api.urls')),
]
