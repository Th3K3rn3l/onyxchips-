// Система горячих клавиш и подсказок
class HotkeysManager {
    constructor() {
        this.init();
        this.showTutorialIfNeeded();
    }

    init() {
        document.addEventListener('keydown', (e) => {
            // Игнорируем если фокус на input/textarea
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            switch(e.key.toLowerCase()) {
                case ' ':
                case 'enter':
                    // Спин в слотах
                    const spinBtn = document.getElementById('spinBtn');
                    if (spinBtn && !spinBtn.disabled) {
                        e.preventDefault();
                        spinBtn.click();
                    }
                    break;

                case 'arrowup':
                case '+':
                    // Увеличить ставку
                    e.preventDefault();
                    const betUpBtn = document.getElementById('betUp');
                    if (betUpBtn) betUpBtn.click();
                    break;

                case 'arrowdown':
                case '-':
                    // Уменьшить ставку
                    e.preventDefault();
                    const betDownBtn = document.getElementById('betDown');
                    if (betDownBtn) betDownBtn.click();
                    break;

                case 'h':
                    // Показать помощь
                    e.preventDefault();
                    this.showHelp();
                    break;

                case 'escape':
                    // Закрыть модальные окна
                    this.closeModals();
                    break;

                case 's':
                    // Открыть настройки
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        window.location.href = '/settings';
                    }
                    break;

                case 'p':
                    // Открыть профиль
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        window.location.href = '/profile';
                    }
                    break;
            }
        });
    }

    showTutorialIfNeeded() {
        const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
        if (!hasSeenTutorial && window.location.pathname.includes('slots')) {
            setTimeout(() => {
                this.showTutorial();
            }, 2000);
        }
    }

    showTutorial() {
        const tutorial = document.createElement('div');
        tutorial.className = 'tutorial-overlay';
        tutorial.innerHTML = `
            <div class="tutorial-content">
                <h2 class="tutorial-title">🎰 Добро пожаловать в OnyxChips!</h2>
                <div class="tutorial-steps">
                    <div class="tutorial-step">
                        <div class="tutorial-icon">⌨️</div>
                        <h3>Горячие клавиши</h3>
                        <ul>
                            <li><kbd>Space</kbd> или <kbd>Enter</kbd> - Крутить барабаны</li>
                            <li><kbd>↑</kbd> или <kbd>+</kbd> - Увеличить ставку</li>
                            <li><kbd>↓</kbd> или <kbd>-</kbd> - Уменьшить ставку</li>
                            <li><kbd>H</kbd> - Показать помощь</li>
                            <li><kbd>Esc</kbd> - Закрыть окна</li>
                        </ul>
                    </div>
                    <div class="tutorial-step">
                        <div class="tutorial-icon">🎮</div>
                        <h3>Как играть</h3>
                        <ul>
                            <li>Выберите размер ставки</li>
                            <li>Нажмите "КРУТИТЬ" или Space</li>
                            <li>Соберите 3 одинаковых символа</li>
                            <li>Получайте опыт и повышайте уровень!</li>
                        </ul>
                    </div>
                    <div class="tutorial-step">
                        <div class="tutorial-icon">🏆</div>
                        <h3>Бонусы</h3>
                        <ul>
                            <li>Ежедневный бонус при входе</li>
                            <li>Опыт за каждую игру</li>
                            <li>Награды за повышение уровня</li>
                            <li>Серия дней увеличивает бонус</li>
                        </ul>
                    </div>
                </div>
                <button class="tutorial-btn" onclick="window.hotkeysManager.closeTutorial()">
                    НАЧАТЬ ИГРАТЬ
                </button>
                <label class="tutorial-checkbox">
                    <input type="checkbox" id="dontShowAgain">
                    Больше не показывать
                </label>
            </div>
        `;

        document.body.appendChild(tutorial);
        setTimeout(() => tutorial.classList.add('show'), 100);
    }

    closeTutorial() {
        const tutorial = document.querySelector('.tutorial-overlay');
        const dontShow = document.getElementById('dontShowAgain');

        if (dontShow && dontShow.checked) {
            localStorage.setItem('hasSeenTutorial', 'true');
        }

        tutorial.classList.remove('show');
        setTimeout(() => tutorial.remove(), 300);
    }

    showHelp() {
        const help = document.createElement('div');
        help.className = 'help-overlay';
        help.innerHTML = `
            <div class="help-content">
                <h2 class="help-title">⌨️ Горячие клавиши</h2>
                <div class="help-grid">
                    <div class="help-item">
                        <kbd>Space</kbd> / <kbd>Enter</kbd>
                        <span>Крутить барабаны</span>
                    </div>
                    <div class="help-item">
                        <kbd>↑</kbd> / <kbd>+</kbd>
                        <span>Увеличить ставку</span>
                    </div>
                    <div class="help-item">
                        <kbd>↓</kbd> / <kbd>-</kbd>
                        <span>Уменьшить ставку</span>
                    </div>
                    <div class="help-item">
                        <kbd>H</kbd>
                        <span>Показать помощь</span>
                    </div>
                    <div class="help-item">
                        <kbd>Esc</kbd>
                        <span>Закрыть окна</span>
                    </div>
                    <div class="help-item">
                        <kbd>Ctrl</kbd> + <kbd>S</kbd>
                        <span>Настройки</span>
                    </div>
                    <div class="help-item">
                        <kbd>Ctrl</kbd> + <kbd>P</kbd>
                        <span>Профиль</span>
                    </div>
                </div>
                <button class="help-btn" onclick="window.hotkeysManager.closeHelp()">
                    ЗАКРЫТЬ
                </button>
            </div>
        `;

        document.body.appendChild(help);
        setTimeout(() => help.classList.add('show'), 100);
    }

    closeHelp() {
        const help = document.querySelector('.help-overlay');
        help.classList.remove('show');
        setTimeout(() => help.remove(), 300);
    }

    closeModals() {
        // Закрываем все модальные окна
        document.querySelectorAll('.tutorial-overlay, .help-overlay, .win-popup, .daily-bonus-popup').forEach(modal => {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        });
    }
}

// Инициализация
window.hotkeysManager = new HotkeysManager();
