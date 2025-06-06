import requests
from django.conf import settings
from django.http import JsonResponse
from django.utils.safestring import mark_safe
from django.views.decorators.http import require_GET
from django.shortcuts import render, get_object_or_404
from datetime import datetime, timedelta, date, timezone
from nasa_project.settings import NASA_API_KEY
import logging
import json
from collections import defaultdict
logger = logging.getLogger(__name__)
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


def iss_tracker(request):
    try:
        res = requests.get("http://api.open-notify.org/iss-now.json").json()
        position = res["iss_position"]
        lat = float(position["latitude"])
        lon = float(position["longitude"])
        return render(request, "nasa_app/iss_tracker.html", {
            "lat": lat,
            "lon": lon
        })
    except Exception as e:
        return render(request, "nasa_app/iss_tracker.html", {
            "error_msg": "Could not fetch ISS data. Please try again later."
        })


def get_iss_passes(request):
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


def multi_sat_tracker_view(request):
    return render(request, 'nasa_app/iss_tracker.html', {
        'initial_lat': 28.6139,
        'initial_lon': 77.2090,
        'n2yo_api_key': settings.N2YO_API_KEY
    })


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


SATELLITES = {
    25544: "ISS (ZARYA)",
    33591: "NOAA 19",
    27424: "NOAA 18",
    25338: "NOAA 15",
    28654: "TERRA",
    25994: "AQUA",
    41765: "SUOMI NPP",
    43013: "JPSS-1",
    39469: "METOP-B",
    29499: "METOP-A",
    44387: "METOP-C",
    40069: "FENGYUN 3C",
    53454: "FENGYUN 3E",
    27607: "FENGYUN 1D",
    37849: "NPP",
    27698: "IKONOS 2",
    25994: "EOS-PM1 (AQUA)",
    39084: "METEOR M2",
    26407: "Landsat 7",
    39010: "Landsat 8",
    50171: "Landsat 9",
    41784: "WorldView-3",
    40099: "WorldView-2",
    32953: "WorldView-1",
    39450: "GeoEye-1",
    43015: "Sentinel-5P",
    42063: "Sentinel-2B",
    41335: "Sentinel-2A",
    39634: "Sentinel-1B",
    39422: "Sentinel-1A",
    51068: "Sentinel-6 Michael Freilich",
    48274: "Pléiades Neo 3",
    44932: "COSMO-SkyMed 2nd Gen",
    43089: "TanDEM-X",
    35681: "TerraSAR-X",
    25994: "Aqua",
    44238: "Starlink-1000",
    45258: "Starlink-2000",
    44914: "Starlink-3000",
    25338: "NOAA 15",
    41783: "CYGNSS FM1",
    41784: "CYGNSS FM2",
    41785: "CYGNSS FM3",
    41786: "CYGNSS FM4",
    41787: "CYGNSS FM5",
    41788: "CYGNSS FM6",
    41789: "CYGNSS FM7",
    41790: "CYGNSS FM8",
    28654: "Terra",
    44874: "Capella-3",
    44875: "Capella-4",
    48618: "OneWeb-0292",
    48623: "OneWeb-0297",
    43013: "JPSS-1",
    43743: "TESS",
    40379: "GPM Core Observatory",
    37820: "FLOCK 1B-13",
}


def satellite_above_view(request):
    passes = []
    error_msg = ''
    selected_satname = ''

    if request.GET.get("lat") and request.GET.get("lon") and request.GET.get("satid"):
        lat = request.GET["lat"]
        lon = request.GET["lon"]
        satid = request.GET["satid"]
        try:
            selected_satname = SATELLITES.get(int(satid), "Unknown Satellite")
            url = f"https://api.n2yo.com/rest/v1/satellite/visualpasses/{satid}/{lat}/{lon}/0/3/10?apiKey={settings.N2YO_API_KEY}"
            response = requests.get(url)
            response.raise_for_status()
            data = response.json()
            passes = data.get("passes", [])

            # ⬇️ Convert timestamps AFTER getting passes
            for p in passes:
                p["startUTC"] = datetime.fromtimestamp(p["startUTC"], tz=timezone.utc)
                p["endUTC"] = datetime.fromtimestamp(p["endUTC"], tz=timezone.utc)

        except Exception as e:
            error_msg = f"Failed to fetch satellite passes: {str(e)}"

    return render(request, 'nasa_app/satellite_above.html', {
        'passes': passes,
        'satellites': SATELLITES,
        'error_msg': error_msg,
        'selected_satname': selected_satname
    })


def satellite_info_view(request):
    info = {}
    tle_lines = []
    tle_data = {}
    error_msg = ''

    if request.GET.get("satid"):
        satid = request.GET["satid"]
        url = f"https://api.n2yo.com/rest/v1/satellite/tle/{satid}?apiKey={settings.N2YO_API_KEY}"

        try:
            response = requests.get(url)
            response.raise_for_status()
            data = response.json()
            info = data.get("info", {})
            tle = data.get("tle", "")
            tle_lines = tle.strip().splitlines()

            if len(tle_lines) == 2:
                line1 = tle_lines[0]
                line2 = tle_lines[1]
                # Extract and assign fields using slice positions based on TLE format
                tle_data = {
                    "Satellite Number": line1[2:7],
                    "Classification": line1[7],
                    "International Designator": line1[9:17],
                    "Epoch": line1[18:32],
                    "First Derivative of Mean Motion": line1[33:43],
                    "Second Derivative of Mean Motion": line1[44:52],
                    "BSTAR drag term": line1[53:61],
                    "Ephemeris type": line1[62],
                    "Element set number": line1[64:68],
                    "Inclination (deg)": line2[8:16],
                    "RAAN (deg)": line2[17:25],
                    "Eccentricity": "0." + line2[26:33].strip(),
                    "Argument of Perigee (deg)": line2[34:42],
                    "Mean Anomaly (deg)": line2[43:51],
                    "Mean Motion (rev/day)": line2[52:63],
                    "Revolution Number at Epoch": line2[64:68]
                }

        except Exception as e:
            error_msg = f"Failed to fetch data: {e}"

    return render(request, 'nasa_app/satellite_info.html', {
        'info': info,
        'tle_data': tle_data,
        'tle_raw': "\n".join(tle_lines),
        'error_msg': error_msg,
        'satellites': SATELLITES
    })

def epic_view(request):
    images = []
    error_msg = ''
    date = request.GET.get("date")

    if date:
        api_url = f"https://api.nasa.gov/EPIC/api/natural/date/{date}?api_key={settings.NASA_API_KEY}"
        try:
            response = requests.get(api_url)
            response.raise_for_status()
            raw_data = response.json()

            images = [{
                "url": f"https://epic.gsfc.nasa.gov/archive/natural/{date.replace('-', '/')}/png/{item['image']}.png",
                "caption": item['caption'],
                "date": item['date']
            } for item in raw_data]

        except Exception as e:
            error_msg = f"Failed to fetch EPIC data: {e}"

    return render(request, 'nasa_app/epic.html', {
        "images": images,
        "error_msg": error_msg,
        "date": date
    })


def exoplanets_view(request):
    host = request.GET.get("host", "")
    limit = int(request.GET.get("limit", 50))
    page = int(request.GET.get("page", 1))
    sort_by = request.GET.get("sort", "disc_year")
    sort_order = request.GET.get("order", "DESC")

    # Cap results fetched from API to 1000 or so
    max_results = 1000
    base_url = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync"

    # Construct ADQL query using TOP (NOT LIMIT/OFFSET)
    query = f"""
        SELECT TOP {max_results} pl_name, hostname, disc_year, pl_orbper, pl_radj, pl_bmassj
        FROM ps
        WHERE pl_name IS NOT NULL
    """

    if host:
        query += f" AND LOWER(hostname) LIKE '%{host.lower()}%'"

    query += f" ORDER BY {sort_by} {sort_order}"

    params = {
        "request": "doQuery",
        "lang": "ADQL",
        "format": "json",
        "query": query.strip()
    }

    exoplanets = []
    error_msg = ""
    try:
        response = requests.get(base_url, params=params)
        response.raise_for_status()
        all_results = response.json()

        # Manual pagination
        start_index = (page - 1) * limit
        end_index = start_index + limit
        exoplanets = all_results[start_index:end_index]

        total_results = len(all_results)
        total_pages = (total_results + limit - 1) // limit

    except Exception as e:
        error_msg = f"Failed to fetch data: {e}"
        total_pages = 1
        total_results = 0

    return render(request, "nasa_app/exoplanets.html", {
        "exoplanets": exoplanets,
        "error_msg": error_msg,
        "host": host,
        "limit": limit,
        "page": page,
        "total_pages": total_pages,
        "sort_by": sort_by,
        "sort_order": sort_order,
        "limit_options": [25, 50, 100, 200]
    })


def neows_view(request):
    start_date = request.GET.get("start_date", date.today().isoformat())
    end_date = request.GET.get("end_date", (date.today() + timedelta(days=1)).isoformat())

    try:
        start_dt = datetime.strptime(start_date, "%Y-%m-%d")
        end_dt = datetime.strptime(end_date, "%Y-%m-%d")
        if (end_dt - start_dt).days > 7:
            end_dt = start_dt + timedelta(days=7)
            end_date = end_dt.date().isoformat()
    except ValueError:
        # fallback in case of bad input
        start_date = date.today().isoformat()
        end_date = (date.today() + timedelta(days=1)).isoformat()

    api_url = "https://api.nasa.gov/neo/rest/v1/feed"
    params = {
        "start_date": start_date,
        "end_date": end_date,
        "api_key": settings.NASA_API_KEY  # Replace with your actual API key if available
    }

    neos = []
    error_msg = ""

    try:
        response = requests.get(api_url, params=params)
        response.raise_for_status()
        data = response.json()

        for date_str in data["near_earth_objects"]:
            for obj in data["near_earth_objects"][date_str]:
                approach = obj["close_approach_data"][0]
                neos.append({
                    "name": obj["name"],
                    "hazardous": obj["is_potentially_hazardous_asteroid"],
                    "diameter_min": obj["estimated_diameter"]["meters"]["estimated_diameter_min"],
                    "diameter_max": obj["estimated_diameter"]["meters"]["estimated_diameter_max"],
                    "velocity": float(approach["relative_velocity"]["kilometers_per_hour"]),
                    "miss_distance": float(approach["miss_distance"]["kilometers"]),
                    "close_approach_date": approach["close_approach_date"]
                })
        neos.sort(key=lambda x: x["close_approach_date"])
    except Exception as e:
        error_msg = f"Failed to fetch data: {e}"

    return render(request, "nasa_app/neows.html", {
        "neos": neos,
        "neos_json": mark_safe(json.dumps(neos)),
        "start_date": start_date,
        "end_date": end_date,
        "error_msg": error_msg,
        "today": date.today().isoformat()
    })




def techtransfer_view(request):
    search_term = request.GET.get("search", "").lower()
    api_url = f"https://api.nasa.gov/techtransfer/patent/?engine&api_key={NASA_API_KEY}"

    patents = []
    full_patent_map = {}
    error_msg = ""

    try:
        response = requests.get(api_url)
        response.raise_for_status()
        records = response.json().get("results", [])

        for record in records:
            title = record[2]
            if search_term in title.lower():
                tech = {
                    "id": record[0],
                    "title": title or "Untitled",
                    "url": f"https://technology.nasa.gov/patent/{record[1]}",
                    "image": record[10] or "",
                    "desc": record[3] or "No description available.",
                    "center": record[4] or "N/A",
                    "application": record[5] or "N/A",
                    "benefit": record[6] or "N/A",
                    "categories": (
                        record[7] if isinstance(record[7], list)
                        else ([record[7]] if record[7] else ["N/A"])
                    ),
                    "trl": record[8] or "N/A"
                }
                patents.append(tech)
                full_patent_map[record[0]] = tech

        request.session['tech_patents'] = full_patent_map

    except Exception as e:
        error_msg = f"Failed to fetch data: {e}"

    return render(request, "nasa_app/techtransfer.html", {
        "patents": patents,
        "search": search_term,
        "error_msg": error_msg
    })


def tech_detail_view(request, tech_id):
    tech = {}
    error_msg = ""

    tech_patents = request.session.get("tech_patents", {})

    if tech_id in tech_patents:
        tech = tech_patents[tech_id]
    else:
        error_msg = "No data found for this patent."

    return render(request, "nasa_app/tech_detail.html", {
        "tech": tech,
        "error_msg": error_msg
    })



def launch_schedule_view(request):
    today = datetime.utcnow().date()
    default_start = today - timedelta(days=180)
    default_end = today + timedelta(days=180)

    search_query = request.GET.get('search', '').lower()
    start_date_str = request.GET.get('start')
    end_date_str = request.GET.get('end')

    try:
        start_date = datetime.fromisoformat(start_date_str).date() if start_date_str else default_start
    except ValueError:
        start_date = default_start

    try:
        end_date = datetime.fromisoformat(end_date_str).date() if end_date_str else default_end
    except ValueError:
        end_date = default_end

    api_url = (
        f"https://ll.thespacedevs.com/2.2.0/launch/?limit=100&ordering=window_start"
        f"&window_start__gte={start_date.isoformat()}&window_start__lte={end_date.isoformat()}"
    )

    grouped_launches = defaultdict(list)
    error_msg = ""

    try:
        response = requests.get(api_url)
        response.raise_for_status()
        data = response.json()

        for item in data.get("results", []):
            name = item.get("name", "Unknown")
            date_str = item.get("window_start")
            if not date_str:
                continue

            try:
                launch_date = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
            except ValueError:
                continue

            if launch_date.date() < start_date or launch_date.date() > end_date:
                continue

            if search_query and search_query not in name.lower():
                continue

            pad = item.get("pad") or {}
            pad_location = pad.get("location") or {}
            rocket = item.get("rocket") or {}
            configuration = rocket.get("configuration") or {}
            mission = item.get("mission") or {}
            status_data = item.get("status") or {}
            status = status_data.get("name", "Unknown")

            badge_color = {
                "Go": "green",
                "Success": "blue",
                "Hold": "orange",
                "Failure": "red"
            }.get(status, "gray")

            grouped_launches[launch_date.strftime("%B %Y")].append({
                "name": name,
                "date": launch_date.strftime("%Y-%m-%d"),
                "rocket": configuration.get("name", "Unknown"),
                "location": pad_location.get("name", "Unknown"),
                "pad": pad.get("name", "Unknown"),
                "mission": mission.get("description", "No mission details."),
                "image": item.get("image"),
                "video": (item.get("vidURLs") or [None])[0],
                "status": status,
                "badge_color": badge_color
            })

    except Exception as e:
        error_msg = f"Failed to load launch data: {e}"

    return render(request, "nasa_app/launch_schedule.html", {
        "grouped_launches": dict(grouped_launches),
        "search": search_query,
        "start": start_date.strftime('%Y-%m-%d'),
        "end": end_date.strftime('%Y-%m-%d'),
        "error_msg": error_msg
    })
