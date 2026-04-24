// Система уведомлений
function showNotification(type, title, message) {
    // Создаем overlay
    const overlay = document.createElement('div');
    overlay.className = 'notification-overlay';

    // Создаем popup
    const popup = document.createElement('div');
    popup.className = `notification-popup ${type}`;

    const icon = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';

    popup.innerHTML = `
        <div class="notification-icon">${icon}</div>
        <div class="notification-title">${title}</div>
        <div class="notification-message">${message}</div>
        <button class="notification-btn" onclick="closeNotification()">OK</button>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(popup);

    // Звук
    if (window.soundManager) {
        if (type === 'error') {
            soundManager.play('click');
        } else if (type === 'success') {
            soundManager.play('win');
        }
    }
}

function closeNotification() {
    const overlay = document.querySelector('.notification-overlay');
    const popup = document.querySelector('.notification-popup');

    if (overlay) overlay.remove();
    if (popup) popup.remove();
}

// Popup повышения уровня
function showLevelUpPopup(newLevel, reward) {
    const overlay = document.createElement('div');
    overlay.className = 'notification-overlay';

    const popup = document.createElement('div');
    popup.className = 'level-up-popup';

    popup.innerHTML = `
        <div class="level-up-icon">🎉</div>
        <div class="level-up-title">ПОВЫШЕНИЕ УРОВНЯ!</div>
        <div class="level-up-level">УРОВЕНЬ ${newLevel}</div>
        <div class="level-up-reward">Награда: +${reward} фишек</div>
        <button class="level-up-btn" onclick="closeLevelUpPopup()">ОТЛИЧНО!</button>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(popup);

    // Звук повышения уровня
    if (window.soundManager) {
        soundManager.play('levelUp');
    }
}

function closeLevelUpPopup() {
    const overlay = document.querySelector('.notification-overlay');
    const popup = document.querySelector('.level-up-popup');

    if (overlay) overlay.remove();
    if (popup) popup.remove();

    // Перезагружаем страницу чтобы обновить уровень в прогресс-баре
    location.reload();
}

// Экспортируем функции глобально
window.showNotification = showNotification;
window.closeNotification = closeNotification;
window.showLevelUpPopup = showLevelUpPopup;
window.closeLevelUpPopup = closeLevelUpPopup;
