from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('nasa_app.urls')),  # Route root URL to your app
    path('isro/', include('isro.urls')),
    path('solar/', include('solar.urls')),
]
