import requests
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.http import require_GET
from django.shortcuts import render
from datetime import datetime, timedelta, date, timezone

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


def image_video_library_view(request):
    query = request.GET.get('q', '').strip()
    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        page = request.GET.get('page', '1')
        url = 'https://images-api.nasa.gov/search'
        params = {
            'q': query,
            'media_type': 'image,video',
            'page': page,
        }

        res = requests.get(url, params=params)
        data = res.json()

        items = []
        for item in data.get('collection', {}).get('items', []):
            data_block = item.get('data', [{}])[0]
            links = item.get('links', [])
            thumb_url = next((l['href'] for l in links if l.get('rel') == 'preview'), '')

            video_url = None
            if data_block.get('media_type') == 'video':
                # Find manifest JSON url from links or elsewhere
                manifest_url = next((l['href'] for l in links if l['href'].endswith('manifest.json')), None)
                if manifest_url:
                    video_url = get_video_mp4_url(manifest_url)

            items.append({
                'title': data_block.get('title', 'No Title'),
                'description': data_block.get('description', 'No description'),
                'media_type': data_block.get('media_type', 'unknown'),
                'nasa_id': data_block.get('nasa_id', ''),
                'thumb_url': thumb_url,
                'date_created': data_block.get('date_created', ''),
                'video_url': video_url,
            })

        return JsonResponse({'items': items})

    context = {
        'query': query,
        'items': [],
    }
    return render(request, 'nasa_app/library.html', context)



def get_video_mp4_url(manifest_url):
    try:
        r = requests.get(manifest_url)
        r.raise_for_status()
        manifest_data = r.json()

        # Look for mp4 files in manifest - example path in manifest JSON:
        # manifest_data['items'] list with 'href' keys ending with .mp4
        for item in manifest_data.get('items', []):
            href = item.get('href', '')
            if href.endswith('.mp4'):
                return href
    except Exception:
        pass
    return None


@require_GET
def earth_view(request):
    lat = request.GET.get('lat')
    lon = request.GET.get('lon')
    date = request.GET.get('date')  # Optional

    if not lat or not lon:
        # Just render the input page if no coordinates
        return render(request, 'nasa_app/earth.html')

    params = {
        'lat': lat,
        'lon': lon,
        'api_key': NASA_API_KEY,
    }
    if date:
        params['date'] = date

    try:
        res = requests.get('https://api.nasa.gov/planetary/earth/assets', params=params)
        res.raise_for_status()
        data = res.json()
        image_url = data.get('url')
    except Exception as e:
        image_url = None
        error_msg = str(e)
    else:
        error_msg = None

    context = {
        'image_url': image_url,
        'lat': lat,
        'lon': lon,
        'date': date,
        'error_msg': error_msg,
    }

    return render(request, 'nasa_app/earth.html', context)


@require_GET
def space_weather_view(request):
    start_date = request.GET.get('start')
    end_date = request.GET.get('end')

    if not start_date or not end_date:
        today = datetime.now(timezone.utc).date()
        seven_days_ago = today - timedelta(days=7)
        start_date = seven_days_ago.isoformat()
        end_date = today.isoformat()

    # If this is an AJAX fetch, call NASA API and return JSON data
    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        base_url = 'https://api.nasa.gov/DONKI'
        endpoints = {
            'solar_flares': '/FLR',
            'cmes': '/CME',
            'geomagnetic_storms': '/GSM',
            'seps': '/SEP',
            'ips': '/IPS',
        }

        results = {}

        for key, endpoint in endpoints.items():
            params = {
                'startDate': start_date,
                'endDate': end_date,
                'api_key': NASA_API_KEY
            }
            try:
                res = requests.get(f"{base_url}{endpoint}", params=params)
                res.raise_for_status()
                results[key] = res.json()
            except Exception as e:
                results[key] = {'error': str(e)}

        return JsonResponse(results)

    # Otherwise, just render the page without calling NASA API
    return render(request, 'nasa_app/space_weather.html', {
        'start_date': start_date,
        'end_date': end_date,
    })



