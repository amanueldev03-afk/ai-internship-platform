from django.urls import path
from .views import TrackApplicationView

app_name = "applications"

urlpatterns = [
    path("track/", TrackApplicationView.as_view(), name="track-application"),
]
