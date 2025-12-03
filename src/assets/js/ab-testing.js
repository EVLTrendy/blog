// Simple A/B Testing Framework
// Lightweight client-side A/B testing without external dependencies

(function () {
    'use strict';

    const AB_TEST_CONFIG = {
        // Test configurations
        tests: {
            'cta_button_text': {
                enabled: true,
                variants: [
                    { id: 'control', weight: 50, value: 'Get Started' },
                    { id: 'variant_a', weight: 50, value: 'Start Learning Now' }
                ],
                selector: '.cta-button-text',
                metric: 'cta_click'
            },
            'newsletter_form_placement': {
                enabled: true,
                variants: [
                    { id: 'control', weight: 50, value: 'bottom' },
                    { id: 'variant_a', weight: 50, value: 'inline' }
                ],
                selector: '.newsletter-form',
                metric: 'newsletter_signup'
            },
            'article_title_style': {
                enabled: true,
                variants: [
                    { id: 'control', weight: 50, value: 'default' },
                    { id: 'variant_a', weight: 50, value: 'question' }
                ],
                selector: '.article_title',
                metric: 'reading_time'
            },
            'lead_magnet_offer': {
                enabled: true,
                variants: [
                    { id: 'control', weight: 50, value: 'Free Guide' },
                    { id: 'variant_a', weight: 50, value: 'Exclusive Template' }
                ],
                selector: '.lead-magnet-title',
                metric: 'lead_magnet_download'
            }
        },

        // Storage key prefix
        storagePrefix: 'ab_test_',

        // Cookie duration (days)
        cookieDuration: 30,

        // Debug mode
        debug: false
    };

    class ABTest {
        constructor(config) {
            this.config = config;
            this.activeTests = {};
            this.init();
        }

        log(...args) {
            if (this.config.debug) {
                console.log('[A/B Test]', ...args);
            }
        }

        // Initialize all enabled tests
        init() {
            Object.keys(this.config.tests).forEach(testName => {
                const test = this.config.tests[testName];
                if (test.enabled) {
                    this.runTest(testName, test);
                }
            });

            this.log('A/B tests initialized:', this.activeTests);
        }

        // Get or assign variant for a test
        getVariant(testName, test) {
            const storageKey = `${this.config.storagePrefix}${testName}`;

            // Check if user already has a variant assigned
            let assignedVariant = localStorage.getItem(storageKey);

            if (assignedVariant) {
                this.log(`Existing variant for ${testName}:`, assignedVariant);
                return test.variants.find(v => v.id === assignedVariant);
            }

            // Assign new variant based on weights
            const variant = this.selectVariant(test.variants);
            localStorage.setItem(storageKey, variant.id);

            // Track variant assignment
            this.trackEvent('ab_test_assigned', {
                test_name: testName,
                variant_id: variant.id,
                variant_value: variant.value
            });

            this.log(`New variant assigned for ${testName}:`, variant.id);
            return variant;
        }

        // Select variant based on weights
        selectVariant(variants) {
            const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
            let random = Math.random() * totalWeight;

            for (const variant of variants) {
                random -= variant.weight;
                if (random <= 0) {
                    return variant;
                }
            }

            return variants[0]; // Fallback to first variant
        }

        // Run a specific test
        runTest(testName, test) {
            const variant = this.getVariant(testName, test);
            this.activeTests[testName] = variant;

            // Apply variant to page
            this.applyVariant(testName, test, variant);

            // Track conversions for this test
            this.trackConversions(testName, test, variant);
        }

        // Apply variant changes to the page
        applyVariant(testName, test, variant) {
            const elements = document.querySelectorAll(test.selector);

            if (elements.length === 0) {
                this.log(`No elements found for test ${testName} with selector ${test.selector}`);
                return;
            }

            elements.forEach(element => {
                switch (testName) {
                    case 'cta_button_text':
                        element.textContent = variant.value;
                        break;

                    case 'newsletter_form_placement':
                        if (variant.value === 'inline') {
                            element.classList.add('newsletter-inline');
                            element.classList.remove('newsletter-bottom');
                        } else {
                            element.classList.add('newsletter-bottom');
                            element.classList.remove('newsletter-inline');
                        }
                        break;

                    case 'article_title_style':
                        if (variant.value === 'question' && !element.textContent.endsWith('?')) {
                            element.textContent = 'How to: ' + element.textContent;
                        }
                        break;

                    case 'lead_magnet_offer':
                        element.textContent = variant.value;
                        break;
                }

                // Add data attribute for tracking
                element.setAttribute('data-ab-test', testName);
                element.setAttribute('data-ab-variant', variant.id);
            });

            this.log(`Applied variant for ${testName}:`, variant.id);
        }

        // Track conversions for test metrics
        trackConversions(testName, test, variant) {
            const metricEvent = test.metric;

            // Listen for the metric event
            document.addEventListener('click', (e) => {
                const element = e.target.closest(`[data-ab-test="${testName}"]`);
                if (element) {
                    this.trackConversion(testName, variant, metricEvent);
                }
            });
        }

        // Track a conversion event
        trackConversion(testName, variant, metric) {
            this.trackEvent('ab_test_conversion', {
                test_name: testName,
                variant_id: variant.id,
                variant_value: variant.value,
                metric: metric
            });

            this.log(`Conversion tracked for ${testName}:`, variant.id, metric);
        }

        // Send event to analytics
        trackEvent(eventName, eventParams) {
            if (typeof gtag !== 'undefined') {
                gtag('event', eventName, eventParams);
            }

            // Also send to custom analytics if available
            if (window.analyticsTracker) {
                // Custom tracking logic
            }
        }

        // Get active variant for a test
        getActiveVariant(testName) {
            return this.activeTests[testName] || null;
        }

        // Get all active tests
        getActiveTests() {
            return this.activeTests;
        }

        // Force a specific variant (for testing)
        forceVariant(testName, variantId) {
            const test = this.config.tests[testName];
            if (!test) {
                this.log(`Test ${testName} not found`);
                return;
            }

            const variant = test.variants.find(v => v.id === variantId);
            if (!variant) {
                this.log(`Variant ${variantId} not found for test ${testName}`);
                return;
            }

            const storageKey = `${this.config.storagePrefix}${testName}`;
            localStorage.setItem(storageKey, variant.id);

            this.log(`Forced variant ${variantId} for test ${testName}`);
            location.reload();
        }

        // Reset all tests (clear assignments)
        resetTests() {
            Object.keys(this.config.tests).forEach(testName => {
                const storageKey = `${this.config.storagePrefix}${testName}`;
                localStorage.removeItem(storageKey);
            });

            this.log('All A/B tests reset');
            location.reload();
        }

        // Get test results summary
        getTestSummary() {
            const summary = {};
            Object.keys(this.activeTests).forEach(testName => {
                summary[testName] = {
                    variant: this.activeTests[testName].id,
                    value: this.activeTests[testName].value
                };
            });
            return summary;
        }
    }

    // Initialize A/B testing when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.abTest = new ABTest(AB_TEST_CONFIG);
        });
    } else {
        window.abTest = new ABTest(AB_TEST_CONFIG);
    }

    // Expose configuration for easy updates
    window.AB_TEST_CONFIG = AB_TEST_CONFIG;

})();
