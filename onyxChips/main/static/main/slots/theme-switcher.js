// Переключатель темы
document.addEventListener('DOMContentLoaded', function() {
    // Загружаем сохраненную тему
    const savedTheme = localStorage.getItem('theme') || 'dark';
    applyTheme(savedTheme);

    // Находим селектор темы на странице настроек
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
        // Устанавливаем текущее значение
        if (savedTheme === 'light') {
            themeSelect.value = 'Светлая';
        } else if (savedTheme === 'dark') {
            themeSelect.value = 'Темная';
        } else {
            themeSelect.value = 'Авто';
        }

        // Обработчик изменения темы - применяем сразу при выборе
        themeSelect.addEventListener('change', function() {
            const selectedTheme = this.value;

            if (selectedTheme === 'Светлая') {
                applyTheme('light');
                localStorage.setItem('theme', 'light');
            } else if (selectedTheme === 'Темная') {
                applyTheme('dark');
                localStorage.setItem('theme', 'dark');
            } else if (selectedTheme === 'Авто') {
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                applyTheme(prefersDark ? 'dark' : 'light');
                localStorage.setItem('theme', 'auto');
            }
        });
    }

    // Обработчик для кнопки "Сохранить настройки"
    const saveBtn = document.querySelector('.save-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            // Показываем уведомление
            const notification = document.createElement('div');
            notification.textContent = 'Настройки сохранены!';
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #4caf50, #45a049);
                color: white;
                padding: 15px 30px;
                border-radius: 10px;
                box-shadow: 0 5px 20px rgba(76, 175, 80, 0.4);
                z-index: 10000;
                font-weight: 600;
                animation: slideIn 0.3s ease-out;
            `;

            document.body.appendChild(notification);

            setTimeout(() => {
                notification.style.animation = 'slideOut 0.3s ease-out';
                setTimeout(() => notification.remove(), 300);
            }, 2000);
        });
    }
});

// Функция применения темы
function applyTheme(theme) {
    if (theme === 'light') {
        document.body.classList.add('light-theme');
    } else {
        document.body.classList.remove('light-theme');
    }
}

// CSS анимации для уведомления
(function() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }

        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
})();
