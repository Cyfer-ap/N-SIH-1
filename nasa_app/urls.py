from django.urls import path
from . import views
from .views import earth_view

urlpatterns = [
    path('', views.home, name='home'),  # APOD homepage
    path('apod/', views.apod, name='apod'),  # Handles APOD view
    path('mars/', views.mars_rover_view, name='mars_rover'),
    path('library/', views.image_video_library_view, name='library'),
    # path('earth/', earth_view, name='earth'),
    path('earth/', views.earth_view, name='earth_view'),

]
from django.conf import settings
from django.conf.urls.static import static

urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
