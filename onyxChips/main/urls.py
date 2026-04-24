from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('about/', views.about, name='about'),
    path('slots/', views.slots, name='slots'),
    path('profile/', views.profile, name='profile'),
    path('settings/', views.settings, name='settings'),
    path('register/', views.register_view, name='register'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('api/check-daily-bonus/', views.check_daily_bonus, name='check_daily_bonus'),
    path('api/claim-daily-bonus/', views.claim_daily_bonus, name='claim_daily_bonus'),
    path('api/game-result/', views.game_result, name='game_result'),
]
