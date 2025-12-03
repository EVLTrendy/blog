// Reading Progress Bar
// Shows a progress indicator at the top of articles as user scrolls

(function () {
    'use strict';

    // Only run on article pages
    const isArticlePage = document.querySelector('.articlesection');
    if (!isArticlePage) return;

    // Create progress bar element
    const progressBar = document.createElement('div');
    progressBar.id = 'reading-progress';
    progressBar.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 0%;
    height: 3px;
    background: linear-gradient(90deg, #33bdef 0%, #019ad2 100%);
    z-index: 9999;
    transition: width 0.1s ease-out;
    box-shadow: 0 2px 4px rgba(51, 189, 239, 0.3);
  `;
    document.body.appendChild(progressBar);

    // Calculate and update progress
    function updateProgress() {
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        // Calculate progress percentage
        const scrollableHeight = documentHeight - windowHeight;
        const scrolled = (scrollTop / scrollableHeight) * 100;

        // Update progress bar width
        progressBar.style.width = Math.min(scrolled, 100) + '%';
    }

    // Update on scroll with throttling for performance
    let ticking = false;
    window.addEventListener('scroll', function () {
        if (!ticking) {
            window.requestAnimationFrame(function () {
                updateProgress();
                ticking = false;
            });
            ticking = true;
        }
    });

    // Initial update
    updateProgress();
})();
