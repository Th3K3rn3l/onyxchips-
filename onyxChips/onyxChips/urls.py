"""
URL configuration for onyxChips project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf.urls.i18n import i18n_patterns
from main import views

# API endpoints без префикса языка
urlpatterns = [
    path('i18n/', include('django.conf.urls.i18n')),
    path('api/change-language/', views.change_language, name='change_language'),
    path('api/check-daily-bonus/', views.check_daily_bonus, name='check_daily_bonus'),
    path('api/claim-daily-bonus/', views.claim_daily_bonus, name='claim_daily_bonus'),
    path('api/game-result/', views.game_result, name='game_result'),
]

# Страницы с префиксом языка
urlpatterns += i18n_patterns(
    path('admin/', admin.site.urls),
    path('', include('main.urls')),
)
