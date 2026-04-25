// Конфигурация символов с ПУТЯМИ к картинкам
const SYMBOLS_IMG = {
    "cherry": STATIC_URL + "cherry.png",
    "lemon": STATIC_URL + "lemon.png",
    "orange": STATIC_URL + "orange.png",
    "plum": STATIC_URL + "plum.png",
    "seven": STATIC_URL + "seven.png",
    "crystal": STATIC_URL + "crystal.png"
};

// Класс игрового движка
class SlotsEngine {
    SYMBOLS_CONFIG = {
        "cherry": {"weight": 40, "multiplier": 2},
        "lemon": {"weight": 30, "multiplier": 2},
        "orange": {"weight": 20, "multiplier": 2},
        "plum": {"weight": 10, "multiplier": 15},
        "seven": {"weight": 5, "multiplier": 50},
        "crystal": {"weight": 1, "multiplier": 100},
    };

    GRID_SIZE = 3;

    constructor() {
        this.symbols = Object.keys(this.SYMBOLS_CONFIG);
        this.weights = Object.values(this.SYMBOLS_CONFIG).map(s => s.weight);
    }

    _generateGrid() {
        const flatGrid = [];
        for (let i = 0; i < this.GRID_SIZE * this.GRID_SIZE; i++) {
            flatGrid.push(this._getRandomSymbol());
        }
        const grid = [];
        for (let i = 0; i < flatGrid.length; i += this.GRID_SIZE) {
            grid.push(flatGrid.slice(i, i + this.GRID_SIZE));
        }
        return grid;
    }

    _getRandomSymbol() {
        const totalWeight = this.weights.reduce((a, b) => a + b, 0);
        let random = Math.random() * totalWeight;
        let accumulated = 0;

        for (let i = 0; i < this.symbols.length; i++) {
            accumulated += this.weights[i];
            if (random <= accumulated) {
                return this.symbols[i];
            }
        }
        return this.symbols[0];
    }

    _checkWin(grid) {
        const wins = [];

        // Проверка горизонталей
        for (let r = 0; r < this.GRID_SIZE; r++) {
            if (grid[r][0] === grid[r][1] && grid[r][1] === grid[r][2]) {
                const symbol = grid[r][0];
                wins.push({
                    line: `row_${r}`,
                    symbol: symbol,
                    mult: this.SYMBOLS_CONFIG[symbol].multiplier,
                    positions: [[r, 0], [r, 1], [r, 2]]
                });
            }
        }

        // Главная диагональ
        if (grid[0][0] === grid[1][1] && grid[1][1] === grid[2][2]) {
            const symbol = grid[0][0];
            wins.push({
                line: "diag_main",
                symbol: symbol,
                mult: this.SYMBOLS_CONFIG[symbol].multiplier,
                positions: [[0, 0], [1, 1], [2, 2]]
            });
        }

        // Побочная диагональ
        if (grid[0][2] === grid[1][1] && grid[1][1] === grid[2][0]) {
            const symbol = grid[0][2];
            wins.push({
                line: "diag_anti",
                symbol: symbol,
                mult: this.SYMBOLS_CONFIG[symbol].multiplier,
                positions: [[0, 2], [1, 1], [2, 0]]
            });
        }

        return wins;
    }

    spin(betAmount) {
        const grid = this._generateGrid();
        const winningLines = this._checkWin(grid);

        const totalMultiplier = winningLines.reduce((sum, line) => sum + line.mult, 0);
        const payout = betAmount * totalMultiplier;

        return {
            grid: grid,
            wins: winningLines,
            payout: payout,
            isWin: payout > 0
        };
    }
}

// Инициализация игры
let balance = 1000;
let currentBet = 10;
let isSpinning = false;

const engine = new SlotsEngine();

// DOM элементы
const reelsElement = document.getElementById('reels');
const balanceElement = document.getElementById('balance');
const betAmountElement = document.getElementById('betAmount');
const winAmountElement = document.getElementById('winAmount');
const spinBtn = document.getElementById('spinBtn');
const betDownBtn = document.getElementById('betDown');
const betUpBtn = document.getElementById('betUp');
const winMessageElement = document.getElementById('winMessage');
const winPopup = document.getElementById('winPopup');
const winPopupTitle = document.getElementById('winPopupTitle');
const winPopupAmount = document.getElementById('winPopupAmount');
const winPopupDetails = document.getElementById('winPopupDetails');

// Обновление отображения барабанов с картинками
function updateReelsDisplay(grid) {
    const reels = reelsElement.querySelectorAll('.reel');

    for (let col = 0; col < 3; col++) {
        const symbolsInColumn = [grid[0][col], grid[1][col], grid[2][col]];
        const reel = reels[col];
        const imgElements = reel.querySelectorAll('.reel-img');

        for (let row = 0; row < 3; row++) {
            const symbol = symbolsInColumn[row];
            const imgFile = SYMBOLS_IMG[symbol];
            imgElements[row].src = imgFile;
            imgElements[row].alt = symbol;
        }
    }
}

// Улучшенная анимация прокрутки с синхронным стартом и последовательной остановкой
function animateSpin(finalGrid) {
    return new Promise(async (resolve) => {
        const reels = reelsElement.querySelectorAll('.reel');
        const allSymbols = Object.values(SYMBOLS_IMG);

        // Звук начала вращения
        if (window.soundManager) soundManager.play('spin');

        // Запускаем ВСЕ барабаны одновременно
        const spinIntervals = [];

        reels.forEach((reel, i) => {
            const images = reel.querySelectorAll('.reel-img');
            reel.classList.add('spinning');

            // Плавная смена символов для каждого барабана
            const spinInterval = setInterval(() => {
                images.forEach(img => {
                    const randomImg = allSymbols[Math.floor(Math.random() * allSymbols.length)];
                    img.src = randomImg;
                });
            }, 80); // Увеличил интервал для плавности

            spinIntervals.push(spinInterval);
        });

        // Останавливаем барабаны по очереди слева направо
        for (let i = 0; i < reels.length; i++) {
            // Задержка перед остановкой каждого барабана
            await new Promise(r => setTimeout(r, 1200 + i * 400));

            const reel = reels[i];
            const images = reel.querySelectorAll('.reel-img');

            // Останавливаем интервал смены картинок
            clearInterval(spinIntervals[i]);

            // Плавный переход к финальным символам
            await new Promise(r => setTimeout(r, 100));

            // Устанавливаем финальные символы для этого столбца
            const symbolsInColumn = [finalGrid[0][i], finalGrid[1][i], finalGrid[2][i]];
            images.forEach((img, row) => {
                const symbol = symbolsInColumn[row];
                img.src = SYMBOLS_IMG[symbol];
                img.alt = symbol;
            });

            // Убираем класс spinning
            reel.classList.remove('spinning');

            // Звук остановки барабана
            if (window.soundManager) soundManager.play('stop');
        }

        resolve();
    });
}

// Подсветка выигрышных линий
function highlightWinningLines(wins) {
    const reels = reelsElement.querySelectorAll('.reel');

    // Убираем предыдущие подсветки
    document.querySelectorAll('.reel-img').forEach(img => {
        img.classList.remove('win-highlight');
    });

    if (wins.length === 0) return;

    // Добавляем класс win-highlight к выигрышным символам
    wins.forEach(win => {
        win.positions.forEach(([row, col]) => {
            const reel = reels[col];
            const images = reel.querySelectorAll('.reel-img');
            if (images[row]) {
                images[row].classList.add('win-highlight');
            }
        });
    });

    // Убираем подсветку через 2 секунды
    setTimeout(() => {
        document.querySelectorAll('.reel-img').forEach(img => {
            img.classList.remove('win-highlight');
        });
    }, 2000);
}

// Анимация обновления баланса
function animateBalanceUpdate(newBalance) {
    const oldBalance = parseInt(balanceElement.textContent);
    const diff = newBalance - oldBalance;
    const steps = 20;
    const stepValue = diff / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
        currentStep++;
        const displayValue = Math.round(oldBalance + stepValue * currentStep);
        balanceElement.textContent = displayValue;

        if (currentStep >= steps) {
            clearInterval(interval);
            balanceElement.textContent = newBalance;
        }
    }, 30);
}

// Анимация выигрыша
function animateWinAmount(amount) {
    if (amount === 0) {
        winAmountElement.textContent = "0";
        return;
    }

    const steps = 15;
    const stepValue = amount / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
        currentStep++;
        const displayValue = Math.round(stepValue * currentStep);
        winAmountElement.textContent = displayValue;

        if (currentStep >= steps) {
            clearInterval(interval);
            winAmountElement.textContent = amount;
        }
    }, 40);
}

// Создание конфетти при большом выигрыше
function createConfetti() {
    const colors = ['#ffd700', '#E6BE8A', '#ff6b6b', '#4ecdc4', '#45b7d1'];
    const confettiCount = 50;

    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.style.position = 'fixed';
        confetti.style.width = '10px';
        confetti.style.height = '10px';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.left = Math.random() * window.innerWidth + 'px';
        confetti.style.top = '-10px';
        confetti.style.opacity = '1';
        confetti.style.pointerEvents = 'none';
        confetti.style.zIndex = '9999';
        confetti.style.borderRadius = '50%';

        document.body.appendChild(confetti);

        const duration = 2000 + Math.random() * 1000;
        const startTime = Date.now();

        function animateConfetti() {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;

            if (progress < 1) {
                confetti.style.top = (progress * window.innerHeight) + 'px';
                confetti.style.opacity = 1 - progress;
                confetti.style.transform = `rotate(${progress * 720}deg)`;
                requestAnimationFrame(animateConfetti);
            } else {
                confetti.remove();
            }
        }

        animateConfetti();
    }
}

// Показать popup выигрыша
function showWinPopup(amount, wins) {
    let details = '';
    if (wins.length === 1) {
        const win = wins[0];
        details = `Линия: ${win.line} • Множитель x${win.mult}`;
    } else if (wins.length > 1) {
        const totalMult = wins.reduce((sum, w) => sum + w.mult, 0);
        details = `Множественный выигрыш! • x${totalMult}`;
    }

    winPopupAmount.textContent = amount;
    winPopupDetails.textContent = details;

    // Показываем popup
    winPopup.classList.add('show');

    // Скрываем через 2.5 секунды
    setTimeout(() => {
        winPopup.classList.remove('show');
    }, 2500);
}

// Основной спин
async function spin() {
    if (isSpinning) return;

    const bet = currentBet;

    if (bet > balance) {
        winMessageElement.textContent = "❌ Недостаточно средств!";
        winMessageElement.style.color = "#ff4444";
        winMessageElement.classList.add('winning');
        setTimeout(() => {
            winMessageElement.textContent = "";
            winMessageElement.classList.remove('winning');
        }, 2000);
        return;
    }

    isSpinning = true;
    spinBtn.disabled = true;
    winMessageElement.textContent = "🎰 Крутим... 🎰";
    winMessageElement.style.color = "#E6BE8A";
    winMessageElement.classList.remove('winning');

    // СНАЧАЛА генерируем результат
    const result = engine.spin(bet);

    // Анимация прокрутки с финальным результатом
    await animateSpin(result.grid);

    // Небольшая задержка перед показом результата
    await new Promise(r => setTimeout(r, 300));

    // Обновляем баланс с анимацией
    const newBalance = balance - bet + result.payout;
    animateBalanceUpdate(newBalance);
    balance = newBalance;

    // Анимация выигрыша
    animateWinAmount(result.payout);

    // Показываем результат
    if (result.isWin) {
        // Подсвечиваем выигрышные линии
        highlightWinningLines(result.wins);

        // Звук выигрыша
        if (window.soundManager) {
            if (result.payout >= bet * 20) {
                soundManager.play('bigWin');
            } else {
                soundManager.play('win');
            }
        }

        // Ждем 1.5 секунды чтобы пользователь увидел подсветку
        await new Promise(r => setTimeout(r, 1500));

        // Показываем popup выигрыша
        showWinPopup(result.payout, result.wins);

        // Эффект конфетти при большом выигрыше
        if (result.payout >= bet * 20) {
            createConfetti();
        }
    }

    // Отправляем результат игры на сервер для начисления опыта
    try {
        const response = await fetch('/api/game-result/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({
                bet: bet,
                payout: result.payout,
                is_win: result.isWin
            })
        });

        const data = await response.json();

        if (data.success) {
            // Анимируем прогресс-бар опыта
            if (window.levelBarUpdater) {
                levelBarUpdater.updateAfterGame(data);
            }

            // Если повышение уровня - показываем popup через 2 секунды (после анимации)
            if (data.level_up) {
                setTimeout(() => {
                    if (window.showLevelUpPopup) {
                        showLevelUpPopup(data.new_level, data.level_up_reward);
                    }
                }, 2000);
            }
        }
    } catch (error) {
        console.error('Ошибка отправки результата игры:', error);
    }

    isSpinning = false;
    spinBtn.disabled = false;
}

// Функция для получения CSRF токена из cookies
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Изменение ставки с анимацией
function changeBet(delta) {
    let newBet = currentBet + delta;
    if (newBet >= 5 && newBet <= balance) {
        currentBet = newBet;

        // Анимация изменения ставки
        betAmountElement.style.transform = 'scale(1.2)';
        betAmountElement.style.color = '#ffd700';
        betAmountElement.value = currentBet;

        setTimeout(() => {
            betAmountElement.style.transform = 'scale(1)';
            betAmountElement.style.color = '#fff';
        }, 200);

        winAmountElement.textContent = "0";
    } else if (newBet > balance) {
        winMessageElement.textContent = "⚠️ Ставка не может превышать баланс!";
        winMessageElement.style.color = "#ff4444";
        winMessageElement.classList.add('winning');
        setTimeout(() => {
            winMessageElement.textContent = "";
            winMessageElement.classList.remove('winning');
        }, 1500);
    } else if (newBet < 5) {
        winMessageElement.textContent = "⚠️ Минимальная ставка: 5";
        winMessageElement.style.color = "#ff4444";
        winMessageElement.classList.add('winning');
        setTimeout(() => {
            winMessageElement.textContent = "";
            winMessageElement.classList.remove('winning');
        }, 1500);
    }
}

// События
spinBtn.addEventListener('click', spin);
betDownBtn.addEventListener('click', () => changeBet(-5));
betUpBtn.addEventListener('click', () => changeBet(5));

// Обработка ввода ставки вручную
betAmountElement.addEventListener('input', function() {
    let value = parseInt(this.value) || 10;
    if (value < 5) value = 5;
    if (value > balance) value = balance;
    currentBet = value;
    this.value = value;
});

betAmountElement.addEventListener('blur', function() {
    if (!this.value || parseInt(this.value) < 5) {
        this.value = 10;
        currentBet = 10;
    }
});

// Горячие клавиши
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !isSpinning) {
        e.preventDefault();
        spin();
    } else if (e.code === 'ArrowUp' && !isSpinning) {
        e.preventDefault();
        changeBet(5);
    } else if (e.code === 'ArrowDown' && !isSpinning) {
        e.preventDefault();
        changeBet(-5);
    }
});

// Инициализация начального отображения (все вишни)
const initialGrid = [
    ["cherry", "cherry", "cherry"],
    ["cherry", "cherry", "cherry"],
    ["cherry", "cherry", "cherry"]
];
updateReelsDisplay(initialGrid);

console.log("🎰 Игра Слоты загружена!");
console.log("💡 Подсказка: используйте Пробел для вращения, ↑↓ для изменения ставки");
