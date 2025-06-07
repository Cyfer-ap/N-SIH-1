# 📡 N-SIH: NASA–ISRO Satellite Explorer 🚀🛰️

A web-based Django application that combines real-time satellite tracking, mission data, and Earth observation tools from **NASA** and **ISRO** using open APIs and geospatial services.

---

## 🌍 Features

| Module | Description |
|--------|-------------|
| **🌌 APOD Viewer** | Shows NASA’s Astronomy Picture of the Day with description |
| **🛰️ Mars Rover Gallery** | Explore images from Perseverance, Curiosity, Spirit |
| **🔍 NASA Media Search** | Search and preview media from NASA’s public archive |
| **🌐 Earth Imagery Viewer** | Fetch satellite images for specific coordinates/dates |
| **📡 Satellite Tracker** | Track multiple NASA/ISRO satellites in real time (N2YO API) |
| **🌦️ Space Weather Dashboard** | View solar activity, geomagnetic storms, flare data |
| **🇮🇳 ISRO Missions Explorer** | Explore static JSON-based data for ISRO satellite missions |
| **🇮🇳 ISRO Tracker** | Track ISRO satellites using their NORAD IDs via N2YO |

---

## 🛠️ Tech Stack

- **Backend:** Django 4.x
- **Frontend:** HTML, CSS, JavaScript (Vanilla)
- **APIs Used:**
  - NASA APOD API
  - NASA Mars Rover API
  - NASA Image & Video Library API
  - NASA Earth Imagery API
  - N2YO Satellite Tracking API
- **Static Mission Data:** JSON (`isro_missions.json`)
- **Deployment Ready With:**
  - `gunicorn`
  - `whitenoise`
  - `python-dotenv` for `.env` config

---

## 🚀 How to Run Locally

```bash
# 1. Clone the repo
git clone https://github.com/Cyfer-ap/N-SIH-1.git
cd N-SIH-1

# 2. Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# 3. Install requirements
pip install -r requirements.txt

# 4. Run the server
python manage.py runserver
```

---

## 🔐 API Keys Setup

Create a `.env` file in the root directory and add:

```env
N2YO_API_KEY=your_n2yo_api_key_here
NASA_API_KEY=your_nasa_api_key_here
```

These keys are used in the view functions to fetch satellite and image data.

---

## 📁 Project Structure

```
nasa_project/
├── nasa_app/          # Core NASA APIs and templates
├── isro/              # ISRO tracker, JSON missions, map tools
├── static/            # JS, CSS, JSON data
├── templates/         # HTML views (nasa_app and isro)
├── .env               # API keys
├── requirements.txt
└── manage.py
```

---

## 🌐 Live Demo (Coming Soon)

This project will be deployed on **Render.com** or **PythonAnywhere**. Stay tuned for the demo link.

---

## 📜 License

MIT License © 2025 [Abhinav Pathak](https://github.com/Cyfer-ap)
