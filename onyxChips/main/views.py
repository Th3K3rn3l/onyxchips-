from django.shortcuts import render, redirect
from django.contrib.auth import login, authenticate, logout
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.utils import translation
from django.utils.translation import gettext as _
from .models import User

# Create your views here.

def index(request):
    # Если пользователь не авторизован, редиректим на страницу входа
    if not request.user.is_authenticated:
        return redirect('login')
    return render(request, 'main/index.html')

def about(request):
    return render(request, 'main/about.html')

@login_required
def slots(request):
    return render(request, 'main/slots.html')

@login_required
def profile(request):
    return render(request, 'main/profile.html')

@login_required
def settings(request):
    return render(request, 'main/settings.html')

def register_view(request):
    if request.user.is_authenticated:
        return redirect('index')

    if request.method == 'POST':
        username = request.POST.get('username')
        email = request.POST.get('email')
        password1 = request.POST.get('password1')
        password2 = request.POST.get('password2')

        # Валидация
        if password1 != password2:
            messages.error(request, _('Пароли не совпадают!'))
            return render(request, 'main/register.html')

        if User.objects.filter(username=username).exists():
            messages.error(request, _('Имя пользователя уже занято!'))
            return render(request, 'main/register.html')

        if User.objects.filter(email=email).exists():
            messages.error(request, _('Email уже зарегистрирован!'))
            return render(request, 'main/register.html')

        # Создание пользователя
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password1,
            balance=1000,
            level=1,
            experience=0
        )

        login(request, user)
        messages.success(request, _('Добро пожаловать, %(username)s! Вы получили 1000 фишек!') % {'username': username})
        return redirect('index')

    return render(request, 'main/register.html')

def login_view(request):
    if request.user.is_authenticated:
        return redirect('index')

    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')

        user = authenticate(request, username=username, password=password)

        if user is not None:
            login(request, user)
            messages.success(request, _('С возвращением, %(username)s!') % {'username': username})
            return redirect('index')
        else:
            messages.error(request, _('Неверное имя пользователя или пароль!'))

    return render(request, 'main/login.html')

@login_required
def logout_view(request):
    logout(request)
    messages.success(request, _('Вы успешно вышли из системы!'))
    return redirect('login')

@login_required
def check_daily_bonus(request):
    """API endpoint для проверки доступности ежедневного бонуса"""
    can_claim = request.user.can_claim_daily_bonus()
    return JsonResponse({'can_claim': can_claim})

@login_required
@require_POST
def claim_daily_bonus(request):
    """API endpoint для получения ежедневного бонуса"""
    if not request.user.can_claim_daily_bonus():
        return JsonResponse({'success': False, 'error': 'Бонус уже получен сегодня'})

    amount = request.user.claim_daily_bonus()
    return JsonResponse({
        'success': True,
        'amount': amount,
        'streak': request.user.daily_bonus_streak,
        'new_balance': request.user.balance
    })

@login_required
@require_POST
def slots_spin(request):
    """
    API endpoint для игры в слоты - ВСЯ ЛОГИКА НА СЕРВЕРЕ!
    Клиент отправляет ТОЛЬКО ставку, сервер сам генерирует результат
    """
    import json
    from main.logic.slots_machine import SlotsEngine
    
    # Получаем ставку от клиента
    try:
        data = json.loads(request.body)
        bet_amount = int(data.get('bet', 0))
    except:
        return JsonResponse({'success': False, 'error': 'Неверный запрос'}, status=400)
    
    user = request.user
    
    # 1. ВАЛИДАЦИЯ ставки на сервере
    if bet_amount <= 0:
        return JsonResponse({'success': False, 'error': 'Ставка должна быть больше 0'}, status=400)
    
    if bet_amount < 5:
        return JsonResponse({'success': False, 'error': 'Минимальная ставка: 5'}, status=400)
    
    if user.balance < bet_amount:
        return JsonResponse({'success': False, 'error': 'Недостаточно средств'}, status=400)
    
    # 2. РАСЧЁТ выигрыша на сервере (клиент не участвует!)
    engine = SlotsEngine()
    result = engine.spin(bet_amount)
    
    # 3. ИЗМЕНЕНИЕ БАЛАНСА на сервере
    old_balance = user.balance
    net_change = result['payout'] - bet_amount
    user.balance += net_change
    
    # 4. ЛОГГИРОВАНИЕ транзакции
    from .models import Transaction
    Transaction.objects.create(
        user=user,
        amount=net_change,
        transaction_type='GAME',
        comment=f"Spin: {'Win' if result['is_win'] else 'Loss'} - {result['payout']}"
    )
    
    # 5. ОБНОВЛЕНИЕ статистики игрока
    old_level = user.level
    
    user.total_games += 1
    if result['is_win']:
        user.total_wins += 1
        if result['payout'] > user.biggest_win:
            user.biggest_win = result['payout']
    else:
        user.total_losses += 1
    
    # Начисляем опыт (10 опыта за игру, +5 за выигрыш)
    exp_gained = 10 + (5 if result['is_win'] else 0)
    user.add_experience(exp_gained)
    
    # Сохраняем все изменения
    user.save()
    
    # Проверяем повышение уровня
    level_up = user.level > old_level
    level_up_reward = user.level * 50 if level_up else 0
    
    # 6. ФОРМАТИРУЕМ результат для отправки клиенту
    # Преобразуем сетку символов для отображения
    formatted_grid = [[cell for cell in row] for row in result['grid']]
    
    # Форматируем выигрышные линии для подсветки
    formatted_wins = []
    for win in result['wins']:
        formatted_wins.append({
            'line': win['line'],
            'symbol': win['symbol'],
            'mult': win['mult'],
            'positions': []
        })
    
    # Отправляем результат клиенту
    return JsonResponse({
        'success': True,
        'grid': formatted_grid,
        'wins': formatted_wins,
        'payout': result['payout'],
        'is_win': result['is_win'],
        'new_balance': user.balance,
        'exp_gained': exp_gained,
        'new_level': user.level,
        'level_up': level_up,
        'level_up_reward': level_up_reward,
        'total_games': user.total_games,
        'total_wins': user.total_wins
    })

@login_required
@require_POST
def change_language(request):
    """API endpoint для смены языка"""
    import json
    from django.conf import settings

    data = json.loads(request.body)
    language = data.get('language', 'ru')

    # Проверяем, что язык поддерживается
    supported_languages = ['ru', 'en', 'es']
    if language not in supported_languages:
        return JsonResponse({'success': False, 'error': 'Unsupported language'})

    # Активируем язык
    translation.activate(language)
    request.session['django_language'] = language

    return JsonResponse({'success': True, 'language': language})