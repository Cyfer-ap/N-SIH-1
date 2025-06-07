from django.shortcuts import render
from django.conf import settings
from django.http import JsonResponse
import requests

def satellite_tracker_view(request):
    return render(request, 'isro/satellite_tracker.html', {
        'initial_lat': 28.6139,
        'initial_lon': 77.2090,
        'n2yo_api_key': settings.N2YO_API_KEY
    })

def get_satellite_position(request):
    try:
        satid = request.GET.get("satid")
        lat = request.GET.get("lat")
        lon = request.GET.get("lon")
        alt = request.GET.get("alt", 0)

        url = f"https://api.n2yo.com/rest/v1/satellite/positions/{satid}/{lat}/{lon}/{alt}/1/&apiKey={settings.N2YO_API_KEY}"
        response = requests.get(url)
        response.raise_for_status()
        return JsonResponse(response.json())
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

def get_satellite_path(request):
    try:
        satid = request.GET.get("satid")
        lat = request.GET.get("lat")
        lon = request.GET.get("lon")
        alt = request.GET.get("alt", 0)
        secs = request.GET.get("secs", 5400)

        url = f"https://api.n2yo.com/rest/v1/satellite/positions/{satid}/{lat}/{lon}/{alt}/{secs}/&apiKey={settings.N2YO_API_KEY}"
        response = requests.get(url)
        response.raise_for_status()
        return JsonResponse(response.json())
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

def get_passes(request):
    lat = request.GET.get("lat")
    lon = request.GET.get("lon")
    satid = request.GET.get("satid", "25544")  # Default to ISS

    if not lat or not lon:
        return JsonResponse({"error": "Missing lat/lon"}, status=400)

    try:
        lat = float(lat)
        lon = float(lon)
        satid = int(satid)

        api_key = settings.N2YO_API_KEY
        alt = 0
        days = 5
        min_elevation = 0

        url = (
            f"https://api.n2yo.com/rest/v1/satellite/radiopasses/"
            f"{satid}/{lat}/{lon}/{alt}/{days}/{min_elevation}/&apiKey={api_key}"
        )

        res = requests.get(url)
        res.raise_for_status()
        data = res.json()
        return JsonResponse(data)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


def missions_explorer(request):
    return render(request, 'isro/missions.html')


