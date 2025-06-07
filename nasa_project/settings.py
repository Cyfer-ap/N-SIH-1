import os
from pathlib import Path

# Base directory
BASE_DIR = Path(__file__).resolve().parent.parent

# Load .env manually
env_path = BASE_DIR / '.env'
if env_path.exists():
    with open(env_path) as f:
        for line in f:
            if line.strip() and not line.startswith('#'):
                try:
                    key, value = line.strip().split('=', 1)
                    os.environ[key] = value
                except ValueError:
                    raise RuntimeError(f"Invalid .env line: {line.strip()}")

# API Keys
NASA_API_KEY = os.environ.get("NASA_API_KEY")
if not NASA_API_KEY:
    raise RuntimeError("NASA_API_KEY not set in .env or environment")

N2YO_API_KEY = os.environ.get("N2YO_API_KEY")
if not N2YO_API_KEY:
    raise RuntimeError("N2YO_API_KEY not set in .env or environment")

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-(-_tnu^n%60#9(pjmoclap9(&7@y$$g4z(r*8%j+3r+bvzz3(v'

# Set to False in production
DEBUG = True

ALLOWED_HOSTS = ['n-sih-1.onrender.com', 'localhost', '127.0.0.1']

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'nasa_app.apps.NasaAppConfig',
    'isro',
]

MIDDLEWARE = [
    'whitenoise.middleware.WhiteNoiseMiddleware',  # 👈 Must be first
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'nasa_project.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'nasa_project.wsgi.application'

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files
STATIC_URL = '/static/'

STATICFILES_DIRS = [
    os.path.join(BASE_DIR, 'nasa_app/static'),
]

STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')  # for collectstatic

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
