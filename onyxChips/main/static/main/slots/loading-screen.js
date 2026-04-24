// Загрузочный экран
document.addEventListener('DOMContentLoaded', function() {
    // Создаем загрузочный экран
    const loadingScreen = document.createElement('div');
    loadingScreen.className = 'loading-screen';
    loadingScreen.innerHTML = `
        <div class="loading-particles" id="loadingParticles"></div>
        <img src="${document.querySelector('link[rel*="icon"]')?.href || '/static/main/slots/onyxchips-logo.png'}"
             alt="OnyxChips" class="loading-logo">
        <div class="loading-spinner">
            <div class="spinner-ring"></div>
            <div class="spinner-ring"></div>
            <div class="spinner-ring"></div>
        </div>
        <div class="loading-text">
            Загрузка<span class="loading-dots"></span>
        </div>
        <div class="loading-progress">
            <div class="loading-progress-bar"></div>
        </div>
    `;

    document.body.insertBefore(loadingScreen, document.body.firstChild);

    // Создаем частицы
    createLoadingParticles();

    // Скрываем загрузочный экран после загрузки
    window.addEventListener('load', function() {
        setTimeout(() => {
            loadingScreen.classList.add('hidden');
            setTimeout(() => {
                loadingScreen.remove();
            }, 500);
        }, 1000); // Минимум 1 секунда показа
    });
});

function createLoadingParticles() {
    const container = document.getElementById('loadingParticles');
    if (!container) return;

    const particleCount = 20;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'loading-particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 3 + 's';
        particle.style.animationDuration = (Math.random() * 2 + 2) + 's';
        container.appendChild(particle);
    }
}
