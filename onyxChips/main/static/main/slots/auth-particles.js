// Анимированные частицы на фоне страниц аутентификации
document.addEventListener('DOMContentLoaded', function() {
    const particlesContainer = document.getElementById('particles');
    if (!particlesContainer) return;

    const particleCount = 30;
    const colors = ['#E6BE8A', '#ffd700', '#c4a060'];

    for (let i = 0; i < particleCount; i++) {
        createParticle();
    }

    function createParticle() {
        const particle = document.createElement('div');
        particle.style.position = 'absolute';
        particle.style.width = Math.random() * 4 + 2 + 'px';
        particle.style.height = particle.style.width;
        particle.style.background = colors[Math.floor(Math.random() * colors.length)];
        particle.style.borderRadius = '50%';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.opacity = Math.random() * 0.5 + 0.2;
        particle.style.boxShadow = `0 0 ${Math.random() * 10 + 5}px currentColor`;

        particlesContainer.appendChild(particle);

        animateParticle(particle);
    }

    function animateParticle(particle) {
        const duration = Math.random() * 10000 + 5000;
        const startX = parseFloat(particle.style.left);
        const startY = parseFloat(particle.style.top);
        const endX = Math.random() * 100;
        const endY = Math.random() * 100;
        const startTime = Date.now();

        function animate() {
            const elapsed = Date.now() - startTime;
            const progress = (elapsed % duration) / duration;

            const currentX = startX + (endX - startX) * progress;
            const currentY = startY + (endY - startY) * progress;

            particle.style.left = currentX + '%';
            particle.style.top = currentY + '%';
            particle.style.opacity = Math.sin(progress * Math.PI) * 0.5 + 0.2;

            requestAnimationFrame(animate);
        }

        animate();
    }
});
