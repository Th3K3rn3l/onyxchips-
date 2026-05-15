// Конфигурация символов с ПУТЯМИ к картинкам
const SYMBOLS_IMG = {
    "cherry": STATIC_URL + "cherry.png",
    "lemon": STATIC_URL + "lemon.png",
    "orange": STATIC_URL + "orange.png",
    "plum": STATIC_URL + "plum.png",
    "seven": STATIC_URL + "seven.png",
    "crystal": STATIC_URL + "crystal.png"
};

// Инициализация игры
let currentBet = 10;
let isSpinning = false;

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
const winPopupAmount = document.getElementById('winPopupAmount');
const winPopupDetails = document.getElementById('winPopupDetails');

// Функция для получения CSRF токена
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

// Безопасное преобразование чисел
function safeNumber(value, defaultValue = 0) {
    const num = Number(value);
    return isNaN(num) ? defaultValue : num;
}

// Обновление отображения барабанов
function updateReelsDisplay(grid) {
    const reels = reelsElement.querySelectorAll('.reel');

    for (let col = 0; col < 3; col++) {
        const symbolsInColumn = [grid[0][col], grid[1][col], grid[2][col]];
        const reel = reels[col];
        const imgElements = reel.querySelectorAll('.reel-img');

        for (let row = 0; row < 3; row++) {
            const symbol = symbolsInColumn[row];
            const imgFile = SYMBOLS_IMG[symbol];
            if (imgFile && imgElements[row]) {
                imgElements[row].src = imgFile;
                imgElements[row].alt = symbol;
            }
        }
    }
}

// Анимация прокрутки
function animateSpin(finalGrid) {
    return new Promise(async (resolve) => {
        const reels = reelsElement.querySelectorAll('.reel');
        const allSymbols = Object.values(SYMBOLS_IMG);

        if (window.soundManager) soundManager.play('spin');

        const spinIntervals = [];

        reels.forEach((reel, i) => {
            const images = reel.querySelectorAll('.reel-img');
            reel.classList.add('spinning');

            const spinInterval = setInterval(() => {
                images.forEach(img => {
                    const randomImg = allSymbols[Math.floor(Math.random() * allSymbols.length)];
                    if (randomImg) img.src = randomImg;
                });
            }, 80);

            spinIntervals.push(spinInterval);
        });

        // Останавливаем барабаны по очереди
        for (let i = 0; i < reels.length; i++) {
            await new Promise(r => setTimeout(r, 1200 + i * 400));

            const reel = reels[i];
            const images = reel.querySelectorAll('.reel-img');
            clearInterval(spinIntervals[i]);

            await new Promise(r => setTimeout(r, 100));

            const symbolsInColumn = [finalGrid[0][i], finalGrid[1][i], finalGrid[2][i]];
            images.forEach((img, row) => {
                const symbol = symbolsInColumn[row];
                const imgFile = SYMBOLS_IMG[symbol];
                if (imgFile) {
                    img.src = imgFile;
                    img.alt = symbol;
                }
            });

            reel.classList.remove('spinning');
            if (window.soundManager) soundManager.play('stop');
        }

        resolve();
    });
}

// Подсветка выигрышных линий
function highlightWinningLines(wins) {
    const reels = reelsElement.querySelectorAll('.reel');

    document.querySelectorAll('.reel-img').forEach(img => {
        img.classList.remove('win-highlight');
    });

    if (!wins || wins.length === 0) return;

    wins.forEach(win => {
        if (win.positions && win.positions.length) {
            win.positions.forEach(([row, col]) => {
                const reel = reels[col];
                const images = reel?.querySelectorAll('.reel-img');
                if (images && images[row]) {
                    images[row].classList.add('win-highlight');
                }
            });
        }
    });

    setTimeout(() => {
        document.querySelectorAll('.reel-img').forEach(img => {
            img.classList.remove('win-highlight');
        });
    }, 2000);
}

// Анимация обновления баланса
function animateBalanceUpdate(newBalance) {
    const safeBalance = safeNumber(newBalance);
    const oldBalance = safeNumber(balanceElement.textContent, 1000);
    const diff = safeBalance - oldBalance;
    const steps = 20;
    const stepValue = diff / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
        currentStep++;
        let displayValue = Math.round(oldBalance + stepValue * currentStep);
        if (isNaN(displayValue)) displayValue = safeBalance;
        if (balanceElement) balanceElement.textContent = displayValue;

        if (currentStep >= steps) {
            clearInterval(interval);
            if (balanceElement) balanceElement.textContent = safeBalance;
        }
    }, 30);
}

// Анимация выигрыша
function animateWinAmount(amount) {
    const safeAmount = safeNumber(amount);
    
    if (safeAmount === 0) {
        if (winAmountElement) winAmountElement.textContent = "0";
        return;
    }

    const steps = 15;
    const stepValue = safeAmount / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
        currentStep++;
        const displayValue = Math.round(stepValue * currentStep);
        if (winAmountElement) winAmountElement.textContent = displayValue;

        if (currentStep >= steps) {
            clearInterval(interval);
            if (winAmountElement) winAmountElement.textContent = safeAmount;
        }
    }, 40);
}

// Создание конфетти
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
    const safeAmount = safeNumber(amount);
    let details = '';
    
    if (wins && wins.length === 1) {
        const win = wins[0];
        details = `Линия: ${win.line} • Множитель x${win.mult}`;
    } else if (wins && wins.length > 1) {
        const totalMult = wins.reduce((sum, w) => sum + w.mult, 0);
        details = `Множественный выигрыш! • x${totalMult}`;
    }

    if (winPopupAmount) winPopupAmount.textContent = safeAmount;
    if (winPopupDetails) winPopupDetails.textContent = details;

    if (winPopup) {
        winPopup.classList.add('show');
        setTimeout(() => {
            winPopup.classList.remove('show');
        }, 2500);
    }
}

// Обновление статистики на странице
// Обновление статистики на странице
function updateStats(data) {
    console.log('Updating stats with:', data); // Отладка
    
    // Обновляем баланс
    const balanceEl = document.getElementById('balance');
    if (balanceEl) {
        balanceEl.textContent = safeNumber(data.new_balance);
    }
    
    // Обновляем количество игр
    const totalGamesEl = document.getElementById('totalGames');
    if (totalGamesEl) {
        const games = safeNumber(data.total_games);
        totalGamesEl.textContent = games;
        console.log('Games updated to:', games);
    }
    
    // Обновляем количество побед
    const totalWinsEl = document.getElementById('totalWins');
    if (totalWinsEl) {
        const wins = safeNumber(data.total_wins);
        totalWinsEl.textContent = wins;
        console.log('Wins updated to:', wins);
    }
    
    // Обновляем звание
    const rankTitleEl = document.getElementById('rankTitle');
    if (rankTitleEl && data.new_level) {
        const level = safeNumber(data.new_level, 1);
        let rank = 'Новичок';
        if (level >= 100) rank = 'Легенда';
        else if (level >= 50) rank = 'Мастер';
        else if (level >= 20) rank = 'Профессионал';
        else if (level >= 10) rank = 'Опытный';
        else if (level >= 5) rank = 'Игрок';
        rankTitleEl.textContent = rank;
        console.log('Rank updated to:', rank);
    }
    
    // Обновляем прогресс-бар опыта
    if (window.levelBarUpdater && data.exp_gained !== undefined) {
        window.levelBarUpdater.updateAfterGame({
            exp_gained: safeNumber(data.exp_gained),
            new_level: safeNumber(data.new_level, 1),
            level_up: data.level_up || false,
            level_up_reward: safeNumber(data.level_up_reward)
        });
    }
}

// ГЛАВНЫЙ СПИН
async function spin() {
    if (isSpinning) return;

    const bet = currentBet;
    const currentBalance = safeNumber(balanceElement?.textContent, 1000);

    if (bet > currentBalance) {
        if (winMessageElement) {
            winMessageElement.textContent = "❌ Недостаточно средств!";
            winMessageElement.style.color = "#ff4444";
            winMessageElement.classList.add('winning');
            setTimeout(() => {
                if (winMessageElement) {
                    winMessageElement.textContent = "";
                    winMessageElement.classList.remove('winning');
                }
            }, 2000);
        }
        return;
    }

    isSpinning = true;
    if (spinBtn) spinBtn.disabled = true;
    if (winMessageElement) {
        winMessageElement.textContent = "🎰 Крутим... 🎰";
        winMessageElement.style.color = "#E6BE8A";
        winMessageElement.classList.remove('winning');
    }

    try {
        // Отправляем запрос на сервер
        const response = await fetch('/api/slots/spin/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({ bet: bet })
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Ошибка сервера');
        }

        // Безопасное преобразование всех данных
        data.payout = safeNumber(data.payout);
        data.new_balance = safeNumber(data.new_balance);
        data.exp_gained = safeNumber(data.exp_gained, 10);
        data.new_level = safeNumber(data.new_level, 1);
        data.total_games = safeNumber(data.total_games);
        data.total_wins = safeNumber(data.total_wins);
        data.level_up_reward = safeNumber(data.level_up_reward);

        // Анимация прокрутки
        await animateSpin(data.grid);
        await new Promise(r => setTimeout(r, 300));

        // Обновляем отображение
        animateBalanceUpdate(data.new_balance);
        animateWinAmount(data.payout);
        updateStats(data);

        // Обработка выигрыша
        if (data.is_win) {
            highlightWinningLines(data.wins);

            if (window.soundManager) {
                if (data.payout >= bet * 20) {
                    soundManager.play('bigWin');
                } else {
                    soundManager.play('win');
                }
            }

            await new Promise(r => setTimeout(r, 1500));
            showWinPopup(data.payout, data.wins);

            if (data.payout >= bet * 20) {
                createConfetti();
            }
        }

        // Показываем повышение уровня
        if (data.level_up) {
            setTimeout(() => {
                if (window.showLevelUpPopup) {
                    window.showLevelUpPopup(data.new_level, data.level_up_reward);
                } else {
                    // Стандартное уведомление
                    if (winMessageElement) {
                        winMessageElement.textContent = `🎉 ПОВЫШЕНИЕ УРОВНЯ! Уровень ${data.new_level}! +${data.level_up_reward} фишек! 🎉`;
                        winMessageElement.style.color = "#ffd700";
                        winMessageElement.classList.add('winning');
                        setTimeout(() => {
                            if (winMessageElement) {
                                winMessageElement.textContent = "";
                                winMessageElement.classList.remove('winning');
                            }
                        }, 3000);
                    }
                }
            }, 2000);
        }

    } catch (error) {
        console.error('Spin error:', error);
        if (winMessageElement) {
            winMessageElement.textContent = "❌ " + (error.message || 'Ошибка соединения');
            winMessageElement.style.color = "#ff4444";
            winMessageElement.classList.add('winning');
            setTimeout(() => {
                if (winMessageElement) {
                    winMessageElement.textContent = "";
                    winMessageElement.classList.remove('winning');
                }
            }, 2000);
        }
    } finally {
        isSpinning = false;
        if (spinBtn) spinBtn.disabled = false;
    }
}

// Изменение ставки
function changeBet(delta) {
    let newBet = currentBet + delta;
    const currentBalance = safeNumber(balanceElement?.textContent, 1000);
    
    if (newBet >= 5 && newBet <= currentBalance) {
        currentBet = newBet;
        if (betAmountElement) {
            betAmountElement.style.transform = 'scale(1.2)';
            betAmountElement.style.color = '#ffd700';
            betAmountElement.value = currentBet;
            setTimeout(() => {
                if (betAmountElement) {
                    betAmountElement.style.transform = 'scale(1)';
                    betAmountElement.style.color = '#fff';
                }
            }, 200);
        }
        if (winAmountElement) winAmountElement.textContent = "0";
    } else if (newBet > currentBalance) {
        if (winMessageElement) {
            winMessageElement.textContent = "⚠️ Ставка не может превышать баланс!";
            winMessageElement.style.color = "#ff4444";
            winMessageElement.classList.add('winning');
            setTimeout(() => {
                if (winMessageElement) {
                    winMessageElement.textContent = "";
                    winMessageElement.classList.remove('winning');
                }
            }, 1500);
        }
    } else if (newBet < 5) {
        if (winMessageElement) {
            winMessageElement.textContent = "⚠️ Минимальная ставка: 5";
            winMessageElement.style.color = "#ff4444";
            winMessageElement.classList.add('winning');
            setTimeout(() => {
                if (winMessageElement) {
                    winMessageElement.textContent = "";
                    winMessageElement.classList.remove('winning');
                }
            }, 1500);
        }
    }
}

// События
if (spinBtn) spinBtn.addEventListener('click', spin);
if (betDownBtn) betDownBtn.addEventListener('click', () => changeBet(-5));
if (betUpBtn) betUpBtn.addEventListener('click', () => changeBet(5));

if (betAmountElement) {
    betAmountElement.addEventListener('input', function() {
        let value = parseInt(this.value) || 10;
        const currentBalance = safeNumber(balanceElement?.textContent, 1000);
        if (value < 5) value = 5;
        if (value > currentBalance) value = currentBalance;
        currentBet = value;
        this.value = value;
    });

    betAmountElement.addEventListener('blur', function() {
        if (!this.value || parseInt(this.value) < 5) {
            this.value = 10;
            currentBet = 10;
        }
    });
}

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

// Инициализация начального отображения
const initialGrid = [
    ["cherry", "cherry", "cherry"],
    ["cherry", "cherry", "cherry"],
    ["cherry", "cherry", "cherry"]
];
updateReelsDisplay(initialGrid);

console.log("🎰 Игра Слоты загружена! (Серверная валидация активна)");