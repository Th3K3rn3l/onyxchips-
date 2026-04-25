// Обновление прогресс-бара уровня с анимацией
class LevelBarUpdater {
    constructor() {
        this.progressFill = document.querySelector('.progress-bar-fill');
        this.levelBadge = document.querySelector('.level-badge');
        this.progressLabel = document.querySelector('.progress-label');
        this.balanceDisplay = document.querySelector('.level-stats span:first-child');
        this.gamesDisplay = document.querySelector('.level-stats span:nth-child(2)');
        this.winsDisplay = document.querySelector('.level-stats span:nth-child(3)');
    }

    // Анимация заполнения прогресс-бара
    animateProgress(currentXP, targetXP, maxXP, duration = 1000) {
        if (!this.progressFill || !this.progressLabel) return;

        const startPercent = Math.min((currentXP / maxXP) * 100, 100);
        const endPercent = Math.min((targetXP / maxXP) * 100, 100);
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function для плавности
            const easeOutCubic = 1 - Math.pow(1 - progress, 3);

            const currentPercent = Math.min(startPercent + (endPercent - startPercent) * easeOutCubic, 100);
            const displayXP = Math.round(currentXP + (targetXP - currentXP) * easeOutCubic);

            this.progressFill.style.width = currentPercent + '%';
            this.progressLabel.querySelector('span:first-child').textContent = `${displayXP} / ${maxXP} XP`;
            this.progressLabel.querySelector('span:last-child').textContent = `${Math.round(currentPercent)}%`;

            // Добавляем эффект свечения при заполнении
            if (progress < 1) {
                this.progressFill.style.boxShadow = `0 0 ${20 + progress * 10}px rgba(230, 190, 138, ${0.6 + progress * 0.4})`;
                requestAnimationFrame(animate);
            } else {
                this.progressFill.style.boxShadow = '0 0 30px rgba(230, 190, 138, 1)';
                setTimeout(() => {
                    this.progressFill.style.boxShadow = '0 0 20px rgba(230, 190, 138, 0.8)';
                }, 300);
            }
        };

        animate();
    }

    // Обновление после получения опыта
    updateAfterGame(data) {
        const { exp_gained, new_level, level_up, level_up_reward, new_balance, total_games, total_wins } = data;

        // Получаем текущие значения
        const currentXPText = this.progressLabel.querySelector('span:first-child').textContent;
        const currentXP = parseInt(currentXPText.split(' / ')[0]);
        const maxXP = parseInt(currentXPText.split(' / ')[1]);

        // Вычисляем новый опыт
        let newXP = currentXP + exp_gained;

        // Если повышение уровня
        if (level_up) {
            // Сначала заполняем до 100%
            this.animateProgress(currentXP, maxXP, maxXP, 800);

            setTimeout(() => {
                // Обновляем уровень
                this.levelBadge.textContent = `LVL ${new_level}`;
                this.levelBadge.classList.add('level-up-animation');

                // Звук повышения уровня
                if (window.soundManager) {
                    soundManager.play('levelUp');
                }

                setTimeout(() => {
                    this.levelBadge.classList.remove('level-up-animation');
                }, 1000);

                // Вычисляем новый максимум опыта для нового уровня
                const newMaxXP = this.calculateMaxXP(new_level);

                // Обновляем прогресс-бар с новым опытом
                const remainingXP = newXP - maxXP;
                this.progressLabel.querySelector('span:first-child').textContent = `0 / ${newMaxXP} XP`;
                this.progressFill.style.width = '0%';

                setTimeout(() => {
                    this.animateProgress(0, remainingXP, newMaxXP, 800);
                }, 100);
            }, 900);
        } else {
            // Просто добавляем опыт
            this.animateProgress(currentXP, newXP, maxXP, 1000);
        }

        // Обновляем статистику
        setTimeout(() => {
            this.updateStats(new_balance, total_games, total_wins);
        }, level_up ? 1800 : 1000);
    }

    // Вычисление максимального опыта для уровня
    calculateMaxXP(level) {
        return level * 100;
    }

    // Обновление статистики
    updateStats(balance, games, wins) {
        if (this.balanceDisplay) {
            this.animateNumber(this.balanceDisplay, balance, '💰 ');
        }
        if (this.gamesDisplay) {
            this.animateNumber(this.gamesDisplay, games, '🎮 ');
        }
        if (this.winsDisplay) {
            this.animateNumber(this.winsDisplay, wins, '🏆 ');
        }
    }

    // Анимация изменения числа
    animateNumber(element, targetValue, prefix = '') {
        const currentText = element.textContent.replace(prefix, '');
        const currentValue = parseInt(currentText) || 0;
        const duration = 500;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            const displayValue = Math.round(currentValue + (targetValue - currentValue) * progress);
            element.textContent = prefix + displayValue;

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        animate();
    }
}

// Создаем глобальный экземпляр
window.levelBarUpdater = new LevelBarUpdater();

// CSS для анимации повышения уровня
(function() {
    const style = document.createElement('style');
    style.textContent = `
        .level-up-animation {
            animation: level-badge-pulse 1s ease-in-out;
        }

        @keyframes level-badge-pulse {
            0%, 100% {
                transform: scale(1);
                box-shadow: 0 0 20px rgba(230, 190, 138, 0.6);
            }
            25% {
                transform: scale(1.3) rotate(-5deg);
                box-shadow: 0 0 40px rgba(230, 190, 138, 1);
            }
            50% {
                transform: scale(1.4) rotate(5deg);
                box-shadow: 0 0 60px rgba(255, 215, 0, 1);
            }
            75% {
                transform: scale(1.3) rotate(-5deg);
                box-shadow: 0 0 40px rgba(230, 190, 138, 1);
            }
        }
    `;
    document.head.appendChild(style);
})();
