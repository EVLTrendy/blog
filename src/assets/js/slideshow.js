document.addEventListener('DOMContentLoaded', function() {
    const slider = document.querySelector('.notifications-slider');
    const slides = document.querySelectorAll('.notification-item');
    const dotsContainer = document.querySelector('.slider-dots');
    let currentSlide = 0;
    let interval;

    // Create dots
    slides.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.classList.add('slider-dot');
        dot.addEventListener('click', () => goToSlide(index));
        dotsContainer.appendChild(dot);
    });

    const dots = document.querySelectorAll('.slider-dot');

    function updateSlides() {
        slides.forEach((slide, index) => {
            slide.classList.remove('active');
            dots[index].classList.remove('active');
            if (index === currentSlide) {
                slide.classList.add('active');
                dots[index].classList.add('active');
            }
        });
    }

    function nextSlide() {
        currentSlide = (currentSlide + 1) % slides.length;
        updateSlides();
    }

    function goToSlide(index) {
        currentSlide = index;
        updateSlides();
        resetInterval();
    }

    function resetInterval() {
        clearInterval(interval);
        interval = setInterval(nextSlide, 5000); // Change slide every 5 seconds
    }

    // Initialize
    updateSlides();
    resetInterval();
}); 