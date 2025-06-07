from django.conf import settings
from django.urls import path
from . import views
from django.conf.urls.static import static

urlpatterns = [
    path('tracker/', views.satellite_tracker_view, name='satellite_tracker'),
    path('api/satellite-position/', views.get_satellite_position, name='satellite_position'),
    path('api/satellite-path/', views.get_satellite_path, name='satellite_path'),
    path('api/satellite-passes/', views.get_passes, name='satellite_passes'),
    path('missions/', views.missions_explorer, name='isro_missions'),
]


