// Ежедневный бонус
document.addEventListener('DOMContentLoaded', function() {
    // Проверяем доступность бонуса
    fetch('/api/check-daily-bonus/')
        .then(response => response.json())
        .then(data => {
            if (data.can_claim) {
                showDailyBonusPopup();
            }
        })
        .catch(error => console.error('Error checking daily bonus:', error));
});

function showDailyBonusPopup() {
    const popup = document.createElement('div');
    popup.className = 'daily-bonus-popup';
    popup.innerHTML = `
        <div class="daily-bonus-overlay"></div>
        <div class="daily-bonus-content">
            <div class="daily-bonus-icon">🎁</div>
            <h2 class="daily-bonus-title">ЕЖЕДНЕВНЫЙ БОНУС</h2>
            <p class="daily-bonus-text">Получите бесплатные фишки!</p>
            <div class="daily-bonus-coins">
                <div class="coin"></div>
                <div class="coin"></div>
                <div class="coin"></div>
            </div>
            <button class="daily-bonus-btn" onclick="claimDailyBonus()">ПОЛУЧИТЬ</button>
        </div>
    `;

    document.body.appendChild(popup);

    setTimeout(() => {
        popup.classList.add('show');
    }, 100);
}

function claimDailyBonus() {
    fetch('/api/claim-daily-bonus/', {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCookie('csrftoken'),
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showBonusReward(data.amount, data.streak);
        }
    })
    .catch(error => console.error('Error claiming bonus:', error));
}

function showBonusReward(amount, streak) {
    const popup = document.querySelector('.daily-bonus-popup');
    const content = popup.querySelector('.daily-bonus-content');

    content.innerHTML = `
        <div class="daily-bonus-icon celebration">🎉</div>
        <h2 class="daily-bonus-title">ПОЛУЧЕНО!</h2>
        <div class="bonus-amount">+${amount}</div>
        <p class="bonus-streak">Серия: ${streak} ${streak === 1 ? 'день' : streak < 5 ? 'дня' : 'дней'}</p>
        <p class="bonus-hint">Заходите каждый день для увеличения бонуса!</p>
        <button class="daily-bonus-btn" onclick="closeDailyBonus()">ОТЛИЧНО!</button>
    `;

    // Обновляем баланс на странице
    setTimeout(() => {
        location.reload();
    }, 3000);
}

function closeDailyBonus() {
    const popup = document.querySelector('.daily-bonus-popup');
    popup.classList.remove('show');
    setTimeout(() => {
        popup.remove();
    }, 300);
}

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
