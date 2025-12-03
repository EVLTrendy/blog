// Advanced Analytics Tracking
// Tracks custom events: scroll depth, reading time, social shares, clicks, conversions

(function () {
    'use strict';

    // Configuration
    const CONFIG = {
        scrollDepthThresholds: [25, 50, 75, 90, 100],
        readingTimeInterval: 30000, // Track every 30 seconds
        enableDebug: false
    };

    // State tracking
    const state = {
        scrollDepthsFired: new Set(),
        readingTimeStarted: Date.now(),
        lastReadingTimeEvent: 0,
        maxScrollDepth: 0,
        engagementScore: 0
    };

    // Debug logger
    function log(...args) {
        if (CONFIG.enableDebug) {
            console.log('[Analytics]', ...args);
        }
    }

    // Send event to Google Analytics
    function trackEvent(eventName, eventParams = {}) {
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, eventParams);
            log('Event tracked:', eventName, eventParams);
        } else {
            log('gtag not available, event not tracked:', eventName);
        }
    }

    // Calculate scroll depth percentage
    function getScrollDepth() {
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollableHeight = documentHeight - windowHeight;

        if (scrollableHeight <= 0) return 100;
        return Math.round((scrollTop / scrollableHeight) * 100);
    }

    // Track scroll depth milestones
    function trackScrollDepth() {
        const currentDepth = getScrollDepth();
        state.maxScrollDepth = Math.max(state.maxScrollDepth, currentDepth);

        CONFIG.scrollDepthThresholds.forEach(threshold => {
            if (currentDepth >= threshold && !state.scrollDepthsFired.has(threshold)) {
                state.scrollDepthsFired.add(threshold);
                trackEvent('scroll_depth', {
                    depth_percentage: threshold,
                    page_location: window.location.pathname
                });

                // Increase engagement score
                state.engagementScore += threshold / 10;
            }
        });
    }

    // Track reading time
    function trackReadingTime() {
        const now = Date.now();
        const timeSpent = Math.round((now - state.readingTimeStarted) / 1000); // in seconds

        if (now - state.lastReadingTimeEvent >= CONFIG.readingTimeInterval) {
            state.lastReadingTimeEvent = now;

            trackEvent('reading_time', {
                time_seconds: timeSpent,
                time_minutes: Math.round(timeSpent / 60),
                page_location: window.location.pathname
            });

            // Increase engagement score
            state.engagementScore += 5;
        }
    }

    // Track social shares
    function trackSocialShare(platform) {
        trackEvent('social_share', {
            platform: platform,
            page_location: window.location.pathname,
            page_title: document.title
        });

        state.engagementScore += 20;
    }

    // Track internal link clicks
    function trackInternalLinkClick(url, linkText) {
        trackEvent('internal_link_click', {
            link_url: url,
            link_text: linkText,
            from_page: window.location.pathname
        });

        state.engagementScore += 2;
    }

    // Track external link clicks
    function trackExternalLinkClick(url, linkText) {
        trackEvent('external_link_click', {
            link_url: url,
            link_text: linkText,
            from_page: window.location.pathname
        });

        state.engagementScore += 3;
    }

    // Track newsletter signup
    function trackNewsletterSignup(source) {
        trackEvent('newsletter_signup', {
            signup_source: source,
            page_location: window.location.pathname
        });

        state.engagementScore += 50;
    }

    // Track lead magnet download
    function trackLeadMagnetDownload(magnetId, magnetTitle) {
        trackEvent('lead_magnet_download', {
            magnet_id: magnetId,
            magnet_title: magnetTitle,
            page_location: window.location.pathname
        });

        state.engagementScore += 40;
    }

    // Track CTA clicks
    function trackCTAClick(ctaText, ctaLocation) {
        trackEvent('cta_click', {
            cta_text: ctaText,
            cta_location: ctaLocation,
            page_location: window.location.pathname
        });

        state.engagementScore += 10;
    }

    // Track video plays
    function trackVideoPlay(videoTitle) {
        trackEvent('video_play', {
            video_title: videoTitle,
            page_location: window.location.pathname
        });

        state.engagementScore += 15;
    }

    // Track search usage
    function trackSearch(searchTerm, resultsCount) {
        trackEvent('search', {
            search_term: searchTerm,
            results_count: resultsCount,
            page_location: window.location.pathname
        });

        state.engagementScore += 8;
    }

    // Send engagement score on page unload
    function trackEngagement() {
        trackEvent('engagement_score', {
            score: state.engagementScore,
            max_scroll_depth: state.maxScrollDepth,
            time_on_page: Math.round((Date.now() - state.readingTimeStarted) / 1000),
            page_location: window.location.pathname
        });
    }

    // Initialize scroll tracking
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            trackScrollDepth();
        }, 100);
    }, { passive: true });

    // Initialize reading time tracking
    setInterval(trackReadingTime, CONFIG.readingTimeInterval);

    // Track all link clicks
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link) return;

        const url = link.href;
        const linkText = link.textContent.trim();

        // Check if internal or external
        if (url.startsWith(window.location.origin)) {
            trackInternalLinkClick(url, linkText);
        } else if (url.startsWith('http')) {
            trackExternalLinkClick(url, linkText);
        }

        // Track social share buttons
        if (link.hasAttribute('data-action')) {
            const action = link.getAttribute('data-action');
            if (['twitter', 'facebook', 'whatsapp', 'linkedin'].includes(action)) {
                trackSocialShare(action);
            }
        }

        // Track CTA buttons
        if (link.classList.contains('myButton') || link.classList.contains('cta-button')) {
            trackCTAClick(linkText, link.getAttribute('data-cta-location') || 'unknown');
        }
    });

    // Track share button clicks (for buttons, not just links)
    document.addEventListener('click', (e) => {
        const button = e.target.closest('.share-button');
        if (button) {
            const platform = button.getAttribute('data-action');
            if (platform) {
                trackSocialShare(platform);
            }
        }
    });

    // Track engagement score on page unload
    window.addEventListener('beforeunload', trackEngagement);

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            trackEngagement();
        }
    });

    // Expose tracking functions globally for use in other scripts
    window.analyticsTracker = {
        trackSocialShare,
        trackInternalLinkClick,
        trackExternalLinkClick,
        trackNewsletterSignup,
        trackLeadMagnetDownload,
        trackCTAClick,
        trackVideoPlay,
        trackSearch,
        getEngagementScore: () => state.engagementScore
    };

    log('Advanced analytics initialized');
})();
