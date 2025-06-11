from django.urls import path
from . import views

urlpatterns = [
    path('known-counts/', views.known_body_counter, name='known_body_counter'),
    path('api/get-bodies/', views.get_bodies_by_type, name='get_bodies_by_type'),
    path('body-profile/', views.body_profile_view, name='body_profile'),
    path('ajax/get-body-details/', views.ajax_get_body_details, name='ajax_get_body_details'),
    path('celestial-by-type/', views.celestial_by_type_view, name='celestial_by_type'),
    path('ajax/celestial-by-type/', views.ajax_celestial_by_type, name='ajax_celestial_by_type'),
    path('orbit-map/', views.orbit_map_view, name='orbit_map'),
    path("planet-hierarchy/", views.hierarchy_view, name="planet_hierarchy"),
    path("get-hierarchy/", views.hierarchy_data, name="get_hierarchy"),
    path("planet-sunburst/", views.sunburst_hierarchy_view, name="planet_sunburst"),
    path("get-sunburst-hierarchy/", views.sunburst_hierarchy_data, name="get_sunburst_hierarchy"),


]
