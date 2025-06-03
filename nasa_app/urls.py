from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),  # APOD homepage
    path('apod/', views.apod, name='apod'),  # Handles APOD view
    path('mars/', views.mars_rover_view, name='mars_rover'),

]
from django.conf import settings
from django.conf.urls.static import static

urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
