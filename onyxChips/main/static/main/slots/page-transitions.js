// Анимации переходов между страницами
document.addEventListener('DOMContentLoaded', function() {
    // Добавляем класс для анимации появления
    document.body.classList.add('page-transition');

    // Плавный переход при клике на ссылки
    document.querySelectorAll('a:not([target="_blank"])').forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');

            // Пропускаем якорные ссылки и внешние
            if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto')) {
                return;
            }

            // Пропускаем если это logout (нужен POST)
            if (href.includes('logout')) {
                return;
            }

            e.preventDefault();

            document.body.classList.add('page-exit');

            setTimeout(() => {
                window.location.href = href;
            }, 300);
        });
    });

    // Анимация появления элементов при скролле
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-up');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Наблюдаем за элементами
    document.querySelectorAll('.game-btn, .stat-card, .setting-item, .profile-stats > div').forEach(el => {
        observer.observe(el);
    });
});
