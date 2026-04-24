from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from main.models import User, Game, GameSession, Transaction

# Кастомизация админки
admin.site.site_header = "OnyxChips Админ-панель"
admin.site.site_title = "OnyxChips Admin"
admin.site.index_title = "Управление казино"

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'level', 'balance', 'total_games', 'total_wins', 'is_staff')
    list_filter = ('is_staff', 'is_superuser', 'level', 'language')
    search_fields = ('username', 'email')
    ordering = ('-level', '-balance')

    fieldsets = BaseUserAdmin.fieldsets + (
        ('Игровая информация', {
            'fields': ('balance', 'level', 'experience', 'biggest_win')
        }),
        ('Статистика', {
            'fields': ('total_games', 'total_wins', 'total_losses')
        }),
        ('Бонусы', {
            'fields': ('last_daily_bonus', 'daily_bonus_streak')
        }),
        ('Настройки', {
            'fields': ('sound_enabled', 'language')
        }),
    )

    readonly_fields = ('experience_to_next_level', 'experience_progress', 'rank_title')

    def experience_to_next_level(self, obj):
        return obj.experience_to_next_level
    experience_to_next_level.short_description = 'Опыт до след. уровня'

    def experience_progress(self, obj):
        return f"{obj.experience_progress:.1f}%"
    experience_progress.short_description = 'Прогресс'

    def rank_title(self, obj):
        return obj.rank_title
    rank_title.short_description = 'Звание'

@admin.register(Game)
class GameAdmin(admin.ModelAdmin):
    list_display = ('game_name', 'is_active', 'total_sessions')
    list_filter = ('is_active',)
    search_fields = ('game_name',)

    def total_sessions(self, obj):
        return obj.sessions.count()
    total_sessions.short_description = 'Всего сессий'

@admin.register(GameSession)
class GameSessionAdmin(admin.ModelAdmin):
    list_display = ('user', 'game', 'bet_amount', 'win_amount', 'balance_after', 'created_at')
    list_filter = ('game', 'created_at')
    search_fields = ('user__username',)
    date_hierarchy = 'created_at'
    ordering = ('-created_at',)
    readonly_fields = ('created_at',)

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('user', 'amount', 'transaction_type', 'created_at')
    list_filter = ('transaction_type', 'created_at')
    search_fields = ('user__username', 'comment')
    date_hierarchy = 'created_at'
    ordering = ('-created_at',)
    readonly_fields = ('created_at',)
