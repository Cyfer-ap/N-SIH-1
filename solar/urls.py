from django.urls import path
from . import views

urlpatterns = [
    path('known-counts/', views.known_body_counter, name='known_body_counter'),
    path('api/get-bodies/', views.get_bodies_by_type, name='get_bodies_by_type'),
    path('body-profile/', views.body_profile_view, name='body_profile'),
    path('ajax/get-body-details/', views.ajax_get_body_details, name='ajax_get_body_details'),
    path('celestial-by-type/', views.celestial_by_type_view, name='celestial_by_type'),
    path('ajax/celestial-by-type/', views.ajax_celestial_by_type, name='ajax_celestial_by_type'),

]
