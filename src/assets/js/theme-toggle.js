// Dark Mode Toggle Implementation
(function () {
    'use strict';

    const THEME_KEY = 'theme-preference';
    const DARK_CLASS = 'dark-mode';

    // Get saved theme or default to light
    function getTheme() {
        const saved = localStorage.getItem(THEME_KEY);
        if (saved) return saved;

        // Check system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }

    // Apply theme to document
    function applyTheme(theme) {
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            document.body.classList.add(DARK_CLASS);
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            document.body.classList.remove(DARK_CLASS);
        }
        localStorage.setItem(THEME_KEY, theme);
    }

    // Toggle between themes
    function toggleTheme() {
        const current = getTheme();
        const next = current === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        updateToggleButton(next);
    }

    // Update toggle button appearance
    function updateToggleButton(theme) {
        const button = document.getElementById('theme-toggle');
        if (!button) return;

        const icon = button.querySelector('.theme-icon');
        const text = button.querySelector('.theme-text');

        if (theme === 'dark') {
            icon.textContent = '☀️';
            if (text) text.textContent = 'Light Mode';
            button.setAttribute('aria-label', 'Switch to light mode');
        } else {
            icon.textContent = '🌙';
            if (text) text.textContent = 'Dark Mode';
            button.setAttribute('aria-label', 'Switch to dark mode');
        }
    }

    // Initialize theme on page load
    function init() {
        const theme = getTheme();
        applyTheme(theme);

        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                updateToggleButton(theme);
                setupToggleButton();
            });
        } else {
            updateToggleButton(theme);
            setupToggleButton();
        }
    }

    // Setup toggle button event listener
    function setupToggleButton() {
        const button = document.getElementById('theme-toggle');
        if (button) {
            button.addEventListener('click', toggleTheme);
        }
    }

    // Listen for system theme changes
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem(THEME_KEY)) {
                applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    // Initialize immediately to prevent flash
    init();
})();
