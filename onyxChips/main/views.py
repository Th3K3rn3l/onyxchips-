import json

from django.shortcuts import render, redirect
from django.contrib.auth import login, authenticate, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.password_validation import validate_password
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.contrib import messages
from django.db import transaction, IntegrityError
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.utils import translation
from django.utils.translation import gettext as _
from .models import User

# --- Игровые константы ---------------------------------------------------
# Лимит максимальной ставки — защита от переполнения и злоупотреблений.
MAX_BET = 1_000_000
MIN_BET = 5

# --- Лимиты ввода --------------------------------------------------------
# Ограничение длины пароля. Алгоритмы хеширования (PBKDF2 и т.п.) тратят
# время пропорционально длине входа — без лимита злоумышленник может
# отправить пароль на 10 МБ и устроить CPU-DoS.
MAX_PASSWORD_LEN = 128
MIN_PASSWORD_LEN = 8

# --- Rate limiting -------------------------------------------------------
# Защита от brute force на /login/ и от массовой регистрации с одного IP.
# Используем штатный django.core.cache; в settings.py по умолчанию это
# in-memory кэш — этого достаточно для одной машины.
LOGIN_ATTEMPT_LIMIT = 5            # попыток
LOGIN_ATTEMPT_WINDOW = 15 * 60     # за 15 минут
REGISTER_LIMIT = 5                 # регистраций
REGISTER_WINDOW = 60 * 60          # за час


def _client_ip(request):
    """Возвращает IP клиента. X-Forwarded-For используем только если
    приложение действительно стоит за доверенным прокси — иначе клиент
    может подделать заголовок и обойти rate limit. По умолчанию доверяем
    только REMOTE_ADDR.
    """
    return request.META.get('REMOTE_ADDR', '0.0.0.0')


def _rate_limited(key, limit, window):
    """Простая реализация скользящего счётчика на кэше.
    Возвращает True, если лимит превышен."""
    count = cache.get(key, 0)
    if count >= limit:
        return True
    # add() атомарен и ставит TTL только при создании ключа,
    # затем incr() инкрементирует без сброса TTL.
    if cache.add(key, 1, window):
        return False
    try:
        cache.incr(key)
    except ValueError:
        cache.set(key, 1, window)
    return False

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
        # Rate limit по IP — защита от массовой регистрации ботов.
        if _rate_limited(f'reg:{_client_ip(request)}', REGISTER_LIMIT, REGISTER_WINDOW):
            messages.error(request, _('Слишком много попыток. Попробуйте позже.'))
            return render(request, 'main/register.html')

        username = (request.POST.get('username') or '').strip()
        email = (request.POST.get('email') or '').strip()
        password1 = request.POST.get('password1') or ''
        password2 = request.POST.get('password2') or ''

        # Непустые поля
        if not username or not email or not password1:
            messages.error(request, _('Все поля обязательны!'))
            return render(request, 'main/register.html')

        # Длина имени пользователя
        if len(username) < 3 or len(username) > 30:
            messages.error(request, _('Имя пользователя должно быть от 3 до 30 символов!'))
            return render(request, 'main/register.html')

        # Ограничиваем длину пароля до проверки/хеширования — защита от
        # CPU-DoS через гигантский пароль (хешер обработает любой ввод).
        if len(password1) > MAX_PASSWORD_LEN or len(password1) < MIN_PASSWORD_LEN:
            messages.error(
                request,
                _('Пароль должен быть от %(min)d до %(max)d символов.') % {
                    'min': MIN_PASSWORD_LEN, 'max': MAX_PASSWORD_LEN
                },
            )
            return render(request, 'main/register.html')

        # Формат email
        try:
            validate_email(email)
        except ValidationError:
            messages.error(request, _('Некорректный email!'))
            return render(request, 'main/register.html')

        if password1 != password2:
            messages.error(request, _('Пароли не совпадают!'))
            return render(request, 'main/register.html')

        # Стандартные валидаторы Django (длина, частые пароли и т.п.)
        try:
            validate_password(password1)
        except ValidationError as e:
            for err in e.messages:
                messages.error(request, err)
            return render(request, 'main/register.html')

        # Создаём пользователя сразу, полагаясь на UNIQUE-индексы БД.
        # Это закрывает гонку (TOCTOU) между .filter(...).exists() и save(),
        # и даёт ОБЩЕЕ сообщение об ошибке — без user/email enumeration.
        try:
            with transaction.atomic():
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    password=password1,
                    balance=1000,
                    level=1,
                    experience=0,
                )
        except IntegrityError:
            messages.error(
                request,
                _('Такие имя пользователя или email уже заняты.'),
            )
            return render(request, 'main/register.html')

        login(request, user)
        messages.success(request, _('Добро пожаловать, %(username)s! Вы получили 1000 фишек!') % {'username': username})
        return redirect('index')

    return render(request, 'main/register.html')

def login_view(request):
    if request.user.is_authenticated:
        return redirect('index')

    if request.method == 'POST':
        username = (request.POST.get('username') or '').strip()
        password = request.POST.get('password') or ''

        # 1. Жёсткий лимит длины пароля — защита от CPU-DoS на хешировании.
        if len(password) > MAX_PASSWORD_LEN:
            messages.error(request, _('Неверное имя пользователя или пароль!'))
            return render(request, 'main/login.html')

        # 2. Rate limit по IP И отдельно по (IP, username) — защита от
        #    brute force паролей и от credential stuffing.
        ip = _client_ip(request)
        ip_key = f'login:ip:{ip}'
        user_key = f'login:user:{ip}:{username.lower()}'

        if _rate_limited(ip_key, LOGIN_ATTEMPT_LIMIT * 4, LOGIN_ATTEMPT_WINDOW) or \
           _rate_limited(user_key, LOGIN_ATTEMPT_LIMIT, LOGIN_ATTEMPT_WINDOW):
            messages.error(
                request,
                _('Слишком много попыток входа. Попробуйте позже.'),
            )
            return render(request, 'main/login.html')

        user = authenticate(request, username=username, password=password)

        if user is not None:
            # Успешный вход — сбрасываем счётчик для этого пользователя.
            cache.delete(user_key)
            login(request, user)
            messages.success(request, _('С возвращением, %(username)s!') % {'username': user.username})
            return redirect('index')
        else:
            # Единое сообщение — без username enumeration.
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
    """API endpoint для получения ежедневного бонуса.

    Используем select_for_update() внутри атомарной транзакции, иначе
    параллельные запросы могут оба пройти проверку can_claim_daily_bonus()
    и пользователь получит бонус несколько раз.
    """
    with transaction.atomic():
        user = User.objects.select_for_update().get(pk=request.user.pk)

        if not user.can_claim_daily_bonus():
            return JsonResponse({'success': False, 'error': 'Бонус уже получен сегодня'}, status=400)

        amount = user.claim_daily_bonus()

    return JsonResponse({
        'success': True,
        'amount': amount,
        'streak': user.daily_bonus_streak,
        'new_balance': user.balance
    })

@login_required
@require_POST
def slots_spin(request):
    """
    API endpoint для игры в слоты - ВСЯ ЛОГИКА НА СЕРВЕРЕ!
    Клиент отправляет ТОЛЬКО ставку, сервер сам генерирует результат.

    Безопасность:
    - Транзакция БД + select_for_update() блокирует строку пользователя
      на время операции, чтобы параллельные запросы не могли потратить
      больше денег, чем есть на балансе (race condition).
    - Ставка валидируется на сервере (мин/макс/баланс).
    - Случайные числа — secrets.SystemRandom (см. SlotsEngine).
    """
    from main.logic.slots_machine import SlotsEngine
    from .models import Transaction

    # Парсинг входных данных — ловим только ожидаемые исключения.
    try:
        data = json.loads(request.body or b'{}')
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'error': 'Неверный запрос'}, status=400)

    raw_bet = data.get('bet', 0) if isinstance(data, dict) else None
    # bool — подкласс int в Python, поэтому проверяем явно, чтобы True/False
    # не превращались в 1/0. Принимаем только числа или строковое число.
    if isinstance(raw_bet, bool) or not isinstance(raw_bet, (int, str)):
        return JsonResponse({'success': False, 'error': 'Неверный запрос'}, status=400)
    try:
        bet_amount = int(raw_bet)
    except (ValueError, TypeError):
        return JsonResponse({'success': False, 'error': 'Неверный запрос'}, status=400)

    # 1. ВАЛИДАЦИЯ ставки на сервере
    if bet_amount < MIN_BET:
        return JsonResponse({'success': False, 'error': f'Минимальная ставка: {MIN_BET}'}, status=400)

    if bet_amount > MAX_BET:
        return JsonResponse({'success': False, 'error': f'Максимальная ставка: {MAX_BET}'}, status=400)

    # 2. РАСЧЁТ выигрыша на сервере (клиент не участвует!)
    # Делаем это до транзакции, т.к. сам спин не требует БД.
    engine = SlotsEngine()
    result = engine.spin(bet_amount)
    payout = result['payout']
    net_change = payout - bet_amount

    # 3. Атомарно: блокируем пользователя, проверяем баланс, обновляем.
    with transaction.atomic():
        user = User.objects.select_for_update().get(pk=request.user.pk)

        if user.balance < bet_amount:
            return JsonResponse({'success': False, 'error': 'Недостаточно средств'}, status=400)

        old_level = user.level
        user.balance += net_change
        user.total_games += 1
        if result['is_win']:
            user.total_wins += 1
            if payout > user.biggest_win:
                user.biggest_win = payout
        else:
            user.total_losses += 1

        # Начисляем опыт (10 опыта за игру, +5 за выигрыш).
        # add_experience() сам делает save() и может повысить уровень.
        exp_gained = 10 + (5 if result['is_win'] else 0)
        user.add_experience(exp_gained)

        Transaction.objects.create(
            user=user,
            amount=net_change,
            transaction_type='GAME',
            comment=f"Spin: {'Win' if result['is_win'] else 'Loss'} - {payout}"
        )

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
            'positions': win.get('positions', []),
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
    from django.conf import settings

    # Защита от падения с 500-кой при некорректном JSON.
    try:
        data = json.loads(request.body or b'{}')
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'error': 'Invalid JSON'}, status=400)

    language = data.get('language', 'ru')

    # Список поддерживаемых языков берём из настроек, чтобы он не разъезжался
    # с settings.LANGUAGES и моделью пользователя.
    supported_languages = {code for code, _name in settings.LANGUAGES}
    if language not in supported_languages:
        return JsonResponse({'success': False, 'error': 'Unsupported language'}, status=400)

    # Активируем язык
    translation.activate(language)
    request.session['django_language'] = language

    return JsonResponse({'success': True, 'language': language})