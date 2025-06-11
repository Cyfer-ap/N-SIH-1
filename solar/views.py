import requests
from django.shortcuts import render
from django.http import JsonResponse

def known_body_counter(request):
    api_url = "https://api.le-systeme-solaire.net/rest/knowncount/"
    try:
        response = requests.get(api_url, timeout=10)
        full_data = response.json()
        known_counts = full_data.get('knowncount', [])
    except Exception as e:
        known_counts = []
        return render(request, 'solar/known_body_counter.html', {'data': [], 'error': str(e)})

    return render(request, 'solar/known_body_counter.html', {'data': known_counts})


def get_bodies_by_type(request):
    import requests
    from django.http import JsonResponse

    body_type = request.GET.get('type')
    page = int(request.GET.get('page', 1))
    limit = 20

    body_type_map = {
        'planet': 'Planet',
        'dwarfPlanet': 'Dwarf Planet',
        'asteroid': 'Asteroid',
        'comet': 'Comet',
        'moonsPlanet': 'Moon',
        'moonsDwarfPlanet': 'Moon',
        'moonsAsteroid': 'Moon',
    }

    if body_type not in body_type_map:
        return JsonResponse({'error': 'Invalid type'}, status=400)

    try:
        filter_val = body_type_map[body_type]
        url = (
            f"https://api.le-systeme-solaire.net/rest/bodies/"
            f"?filter[]=bodyType,eq,{filter_val}"
            f"&data=id,englishName"
            f"&page={page},{limit}"
        )

        res = requests.get(url, timeout=10)
        json_data = res.json()

        # HANDLE FORMAT WITH data[] AND records[] STRUCTURE
        table = json_data.get("bodies")
        if isinstance(table, dict) and "data" in table and "records" in table:
            keys = table["data"]
            records = [dict(zip(keys, row)) for row in table["records"]]
        else:
            records = json_data.get("bodies", [])

        has_more = len(records) == limit

    except Exception as e:
        return JsonResponse({'error': f"{type(e).__name__}: {str(e)}"}, status=500)

    return JsonResponse({'bodies': records, 'has_more': has_more})


def body_profile_view(request):
    body_id = request.GET.get('id')
    context = {}

    if body_id:
        url = f"https://api.le-systeme-solaire.net/rest/bodies/{body_id}"
        try:
            response = requests.get(url, timeout=10)
            if response.status_code == 200:
                context['body'] = response.json()
            else:
                context['error'] = f"Body not found: {body_id}"
        except Exception as e:
            context['error'] = f"Request failed: {e}"

    return render(request, 'solar/body_profile.html', context)


def ajax_get_body_details(request):
    body_id = request.GET.get('id')
    if not body_id:
        return JsonResponse({'error': 'Missing ID parameter.'}, status=400)

    url = f"https://api.le-systeme-solaire.net/rest/bodies/{body_id}"
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            return JsonResponse(response.json())
        else:
            return JsonResponse({'error': f'Body not found: {body_id}'}, status=404)
    except Exception as e:
        return JsonResponse({'error': f'Request failed: {str(e)}'}, status=500)


def celestial_by_type_view(request):
    return render(request, 'solar/celestial_by_type.html')

def ajax_celestial_by_type(request):
    body_type = request.GET.get('type', '')
    if not body_type:
        return JsonResponse({'error': 'No body type specified'}, status=400)

    api_url = f"https://api.le-systeme-solaire.net/rest/bodies?filter[]=bodyType,eq,{body_type}"
    try:
        res = requests.get(api_url)
        res.raise_for_status()
        data = res.json()
        return JsonResponse({'bodies': data.get('bodies', [])})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


