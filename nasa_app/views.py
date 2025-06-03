import requests
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.http import require_GET
from django.shortcuts import render
from datetime import datetime, timedelta, date

from nasa_project.settings import NASA_API_KEY

PHOTOS_PER_PAGE = 21

@require_GET
def apod(request):
    date = request.GET.get('date')

    if not date:
        now = datetime.now()
        if now.hour < 12:
            date = (now - timedelta(days=1)).strftime('%Y-%m-%d')
        else:
            date = now.strftime('%Y-%m-%d')

    params = {
        'api_key': settings.NASA_API_KEY,
        'date': date
    }

    try:
        response = requests.get('https://api.nasa.gov/planetary/apod', params=params)
        response.raise_for_status()
        data = response.json()
    except Exception as e:
        data = {'error': True, 'message': str(e), 'date': date}

    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        return JsonResponse(data)
    else:
        return render(request, 'nasa_app/apod.html', {'apod_data': data})


def home(request):
    return render(request, 'nasa_app/home.html')


def mars_rover_view(request):
    rover = request.GET.get('rover', 'curiosity')
    earth_date = request.GET.get('date')
    page = int(request.GET.get('page', 1))

    if not earth_date:
        # Default to some date or today if no date selected
        from datetime import date
        earth_date = date.today().isoformat()

    # Call NASA Mars Rover Photos API
    url = f'https://api.nasa.gov/mars-photos/api/v1/rovers/{rover}/photos'
    params = {
        'earth_date': earth_date,
        'api_key': NASA_API_KEY,
    }

    response = requests.get(url, params=params)
    data = response.json()

    photos = data.get('photos', [])

    # Pagination logic
    start_index = (page - 1) * PHOTOS_PER_PAGE
    end_index = start_index + PHOTOS_PER_PAGE
    page_photos = photos[start_index:end_index]

    has_more = end_index < len(photos)

    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        # Return JSON response with photos for AJAX requests
        photos_data = [
            {
                'id': p['id'],
                'img_src': p['img_src'].replace('http://', 'https://'),
                'camera': {'full_name': p['camera']['full_name']},
                'earth_date': p['earth_date'],
            } for p in page_photos
        ]

        return JsonResponse({
            'photos': photos_data,
            'has_more': has_more
        })

    # For normal page loads, render initial template with first page photos
    context = {
        'photos': [
            {
                'id': p['id'],
                'img_src': p['img_src'].replace('http://', 'https://'),
                'camera': {'full_name': p['camera']['full_name']},
                'earth_date': p['earth_date'],
            } for p in page_photos
        ],
        'rover': rover,
        'selected_date': earth_date,
    }

    return render(request, 'nasa_app/mars.html', context)


