from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _

# Create your models here.
class User(AbstractUser):
    role = models.CharField(max_length=15, default='player')
    balance = models.IntegerField(default=1000)

    # Система уровней
    level = models.IntegerField(default=1)
    experience = models.IntegerField(default=0)

    # Ежедневный бонус
    last_daily_bonus = models.DateField(null=True, blank=True)
    daily_bonus_streak = models.IntegerField(default=0)

    # Статистика
    total_games = models.IntegerField(default=0)
    total_wins = models.IntegerField(default=0)
    total_losses = models.IntegerField(default=0)
    biggest_win = models.IntegerField(default=0)

    # Настройки
    sound_enabled = models.BooleanField(default=True)
    language = models.CharField(max_length=2, default='ru', choices=[('ru', 'Русский'), ('en', 'English')])

    def __str__(self):
        return self.username

    @property
    def experience_to_next_level(self):
        """Опыт необходимый для следующего уровня"""
        return self.level * 100

    @property
    def experience_progress(self):
        """Прогресс в процентах до следующего уровня"""
        exp_needed = self.experience_to_next_level
        if exp_needed == 0:
            return 0
        progress = (self.experience / exp_needed) * 100
        return min(progress, 100)  # Ограничиваем максимум 100%

    @property
    def rank_title(self):
        """Звание игрока в зависимости от уровня"""
        if self.level < 5:
            return _("Новичок")
        elif self.level < 10:
            return _("Игрок")
        elif self.level < 20:
            return _("Опытный")
        elif self.level < 50:
            return _("Профессионал")
        elif self.level < 100:
            return _("Мастер")
        else:
            return _("Легенда")

    def add_experience(self, amount):
        """Добавить опыт и проверить повышение уровня"""
        self.experience += amount
        while self.experience >= self.experience_to_next_level:
            self.experience -= self.experience_to_next_level
            self.level += 1
            # Бонус за повышение уровня
            self.balance += self.level * 50
        self.save()

    def can_claim_daily_bonus(self):
        """Проверка доступности ежедневного бонуса"""
        from datetime import date
        if not self.last_daily_bonus:
            return True
        return self.last_daily_bonus < date.today()

    def claim_daily_bonus(self):
        """Получить ежедневный бонус"""
        from datetime import date, timedelta
        today = date.today()

        if not self.can_claim_daily_bonus():
            return 0

        # Проверяем серию
        if self.last_daily_bonus and self.last_daily_bonus == today - timedelta(days=1):
            self.daily_bonus_streak += 1
        else:
            self.daily_bonus_streak = 1

        # Бонус увеличивается с серией (макс 7 дней)
        bonus_multiplier = min(self.daily_bonus_streak, 7)
        bonus_amount = 100 * bonus_multiplier

        self.balance += bonus_amount
        self.last_daily_bonus = today
        self.save()

        return bonus_amount
    

class Game(models.Model):
    game_name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.game_name

class GameSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions')
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='sessions')

    bet_amount = models.IntegerField()
    win_amount = models.IntegerField()
    balance_before = models.IntegerField()
    balance_after = models.IntegerField()
    game_result = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    

class Transaction(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transactions')
    amount = models.IntegerField()
    transaction_type = models.CharField(max_length=50)
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)


