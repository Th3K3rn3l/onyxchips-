// Динамическое применение анимаций
document.addEventListener('DOMContentLoaded', function() {
    // Добавляем анимации появления к элементам
    const animateOnScroll = () => {
        const elements = document.querySelectorAll('.game-btn, .stat-card, .setting-item');

        elements.forEach((el, index) => {
            setTimeout(() => {
                el.classList.add('slide-up');
            }, index * 100);
        });
    };

    animateOnScroll();

    // Анимация обновления баланса
    const observeBalanceChanges = () => {
        const balanceElement = document.getElementById('balance');
        if (!balanceElement) return;

        let lastBalance = balanceElement.textContent;

        const observer = new MutationObserver(() => {
            const newBalance = balanceElement.textContent;
            if (newBalance !== lastBalance) {
                balanceElement.classList.add('updated');
                setTimeout(() => {
                    balanceElement.classList.remove('updated');
                }, 600);
                lastBalance = newBalance;
            }
        });

        observer.observe(balanceElement, { childList: true, characterData: true, subtree: true });
    };

    observeBalanceChanges();

    // Добавляем эффект свечения к кнопкам
    document.querySelectorAll('.spin-btn, .auth-btn, .daily-bonus-btn').forEach(btn => {
        btn.classList.add('glow-on-hover');
    });

    // Эффект встряски при ошибке
    window.showError = function(message) {
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message shake';
        errorElement.textContent = message;
        errorElement.style.cssText = `
            position: fixed;
            top: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(244, 67, 54, 0.9);
            color: white;
            padding: 15px 30px;
            border-radius: 10px;
            z-index: 10000;
            font-weight: 600;
        `;

        document.body.appendChild(errorElement);

        setTimeout(() => {
            errorElement.style.animation = 'zoomOut 0.3s ease-out';
            setTimeout(() => errorElement.remove(), 300);
        }, 3000);
    };

    // Эффект успеха
    window.showSuccess = function(message) {
        const successElement = document.createElement('div');
        successElement.className = 'success-message zoom-in';
        successElement.textContent = message;
        successElement.style.cssText = `
            position: fixed;
            top: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(76, 175, 80, 0.9);
            color: white;
            padding: 15px 30px;
            border-radius: 10px;
            z-index: 10000;
            font-weight: 600;
        `;

        document.body.appendChild(successElement);

        setTimeout(() => {
            successElement.style.animation = 'slideUp 0.3s ease-out reverse';
            setTimeout(() => successElement.remove(), 300);
        }, 3000);
    };
});
