// Система мультиязычности
const translations = {
    ru: {
        // Общее
        'loading': 'Загрузка',
        'welcome': 'Добро пожаловать',
        'balance': 'Баланс',
        'level': 'Уровень',
        'experience': 'Опыт',

        // Навигация
        'home': 'Главная',
        'profile': 'Профиль',
        'settings': 'Настройки',
        'logout': 'Выйти',

        // Игры
        'slots': 'Слоты',
        'roulette': 'Рулетка',
        'blackjack': 'Блэкджек',
        'choose_game': 'Выбери свою игру',

        // Слоты
        'spin': 'Крутить',
        'bet': 'Ставка',
        'win': 'Выигрыш',
        'you_won': 'Выигрыш!',
        'big_win': 'Большой выигрыш!',

        // Бонусы
        'daily_bonus': 'Ежедневный бонус',
        'claim': 'Получить',
        'claimed': 'Получено!',
        'streak': 'Серия',
        'days': 'дней',

        // Настройки
        'sound_effects': 'Звуковые эффекты',
        'sound_desc': 'Включить звуки при вращении и выигрыше',
        'animations': 'Анимации',
        'animations_desc': 'Показывать анимации и эффекты',
        'theme': 'Тема',
        'theme_desc': 'Цветовая схема приложения',
        'language': 'Язык',
        'language_desc': 'Выберите язык интерфейса',
        'dark': 'Темная',
        'light': 'Светлая',
        'auto': 'Авто',
        'save_settings': 'Сохранить настройки',
        'settings_saved': 'Настройки сохранены!',

        // Профиль
        'total_games': 'Всего игр',
        'wins': 'Выигрышей',
        'email': 'Email',
        'registration_date': 'Дата регистрации',
        'last_login': 'Последний вход',
        'status': 'Статус',
        'active': 'Активен',

        // Аутентификация
        'login': 'Вход',
        'register': 'Регистрация',
        'username': 'Имя пользователя',
        'password': 'Пароль',
        'confirm_password': 'Подтвердите пароль',
        'no_account': 'Нет аккаунта?',
        'have_account': 'Уже есть аккаунт?',
        'sign_in': 'Войти',
        'sign_up': 'Зарегистрироваться',

        // Туториал
        'tutorial_title': 'Добро пожаловать в OnyxChips!',
        'hotkeys': 'Горячие клавиши',
        'how_to_play': 'Как играть',
        'bonuses': 'Бонусы',
        'start_playing': 'Начать играть',
        'dont_show_again': 'Больше не показывать',

        // Ошибки
        'insufficient_funds': 'Недостаточно средств!',
        'error': 'Ошибка',
        'success': 'Успешно'
    },

    en: {
        // General
        'loading': 'Loading',
        'welcome': 'Welcome',
        'balance': 'Balance',
        'level': 'Level',
        'experience': 'Experience',

        // Navigation
        'home': 'Home',
        'profile': 'Profile',
        'settings': 'Settings',
        'logout': 'Logout',

        // Games
        'slots': 'Slots',
        'roulette': 'Roulette',
        'blackjack': 'Blackjack',
        'choose_game': 'Choose your game',

        // Slots
        'spin': 'Spin',
        'bet': 'Bet',
        'win': 'Win',
        'you_won': 'You Won!',
        'big_win': 'Big Win!',

        // Bonuses
        'daily_bonus': 'Daily Bonus',
        'claim': 'Claim',
        'claimed': 'Claimed!',
        'streak': 'Streak',
        'days': 'days',

        // Settings
        'sound_effects': 'Sound Effects',
        'sound_desc': 'Enable sounds for spinning and winning',
        'animations': 'Animations',
        'animations_desc': 'Show animations and effects',
        'theme': 'Theme',
        'theme_desc': 'Application color scheme',
        'language': 'Language',
        'language_desc': 'Select interface language',
        'dark': 'Dark',
        'light': 'Light',
        'auto': 'Auto',
        'save_settings': 'Save Settings',
        'settings_saved': 'Settings saved!',

        // Profile
        'total_games': 'Total Games',
        'wins': 'Wins',
        'email': 'Email',
        'registration_date': 'Registration Date',
        'last_login': 'Last Login',
        'status': 'Status',
        'active': 'Active',

        // Authentication
        'login': 'Login',
        'register': 'Register',
        'username': 'Username',
        'password': 'Password',
        'confirm_password': 'Confirm Password',
        'no_account': 'No account?',
        'have_account': 'Already have an account?',
        'sign_in': 'Sign In',
        'sign_up': 'Sign Up',

        // Tutorial
        'tutorial_title': 'Welcome to OnyxChips!',
        'hotkeys': 'Hotkeys',
        'how_to_play': 'How to Play',
        'bonuses': 'Bonuses',
        'start_playing': 'Start Playing',
        'dont_show_again': "Don't show again",

        // Errors
        'insufficient_funds': 'Insufficient funds!',
        'error': 'Error',
        'success': 'Success'
    }
};

class LanguageManager {
    constructor() {
        this.currentLang = localStorage.getItem('language') || 'ru';
        this.init();
    }

    init() {
        // Применяем язык при загрузке
        this.applyLanguage(this.currentLang);

        // Находим селектор языка в настройках
        const langSelect = document.querySelector('select.select-box');
        if (langSelect) {
            const settingItem = langSelect.closest('.setting-item');
            const label = settingItem?.querySelector('.setting-label');

            if (label && (label.textContent.includes('Язык') || label.textContent.includes('Language'))) {
                // Устанавливаем текущее значение
                langSelect.value = this.currentLang === 'ru' ? 'Русский' : 'English';

                // Обработчик изменения
                langSelect.addEventListener('change', (e) => {
                    const newLang = e.target.value === 'Русский' ? 'ru' : 'en';
                    this.setLanguage(newLang);
                });
            }
        }
    }

    setLanguage(lang) {
        this.currentLang = lang;
        localStorage.setItem('language', lang);
        this.applyLanguage(lang);
    }

    applyLanguage(lang) {
        // Применяем переводы ко всем элементам с data-i18n
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (translations[lang] && translations[lang][key]) {
                el.textContent = translations[lang][key];
            }
        });

        // Применяем переводы к placeholder'ам
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (translations[lang] && translations[lang][key]) {
                el.placeholder = translations[lang][key];
            }
        });

        // Обновляем атрибут lang у html
        document.documentElement.lang = lang;
    }

    t(key) {
        return translations[this.currentLang][key] || key;
    }
}

// Глобальный экземпляр
window.i18n = new LanguageManager();
