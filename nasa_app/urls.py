from django.urls import path
from . import views
from .views import exoplanets_view, techtransfer_view, tech_detail_view
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('', views.home, name='home'),  # APOD homepage
    path('apod/', views.apod, name='apod'),  # Handles APOD view
    path('mars/', views.mars_rover_view, name='mars_rover'),
    path('library/', views.image_video_library_view, name='library'),
    # path('earth/', earth_view, name='earth'),
    path('earth/', views.earth_view, name='earth_view'),
    path('space-weather/', views.space_weather_view, name='space_weather_view'),
    path("iss-tracker/", views.iss_tracker, name="iss_tracker"),
    path("api/iss-passes/", views.get_iss_passes, name="get_iss_passes"),
    path("api/satellite-position/", views.get_satellite_position, name="satellite_position"),
    path("api/satellite-path/", views.get_satellite_path, name="satellite-path"),
    path('satellite/above/', views.satellite_above_view, name='satellite_above'),
    path("satellite/info/", views.satellite_info_view, name="satellite_info"),
    path('epic/', views.epic_view, name='epic'),
    path('exoplanets/', exoplanets_view, name='exoplanets'),
    path("neows/", views.neows_view, name="neows"),
    path("techtransfer/", techtransfer_view, name="techtransfer"),
    path("techtransfer/<str:tech_id>/", tech_detail_view, name="tech_detail"),
    path('launches/', views.launch_schedule_view, name='launch_schedule'),
]

urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
