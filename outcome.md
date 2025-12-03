# Comprehensive Site Feature & Functionality Audit

This document provides an exhaustive list of every feature, setting, control, interaction, visual element, and intended function of the **EvolvedLotus Blog** ecosystem.

## 1. Core Navigation & Layout

### Header
*   **Logo/Home Link:** SVG Logo linking to the main `evolvedlotus.com` site.
*   **Desktop Navigation:**
    *   Links: Home, About, Contact Us, Tools, Shop (External), Blog.
    *   **Language Support:** Dynamic text rendering based on selected language (EN, ES, FR).
*   **Mobile Navigation:**
    *   **Hamburger Menu:** Icon button visible only on mobile (`max-width: 768px`).
    *   **Slide-out Overlay:** Full-height menu sliding from the right.
    *   **Overlay Actions:** Click outside to close, "X" button to close.
*   **Search System:**
    *   **Toggle:** Magnifying glass icon opens a full-screen search overlay.
    *   **Real-time Filtering:** Client-side JavaScript filters blog posts as you type (min 2 chars).
    *   **Results:** Displays clickable Title and Description.
    *   **Focus:** Auto-focuses input field on open.
*   **Settings Widget:**
    *   **Dropdown:** Floating panel toggled by a "three-dots" icon.
    *   **Dark Mode Toggle:** Switch control with Sun/Moon icons. Persists preference in `localStorage`.
    *   **Language Switcher:** Links to switch between English (`/`), Spanish (`/es/`), and French (`/fr/`).

### Footer
*   **Navigation Links:** About, Contact, Terms of Service, Privacy Policy.
*   **Newsletter Signup:**
    *   Embedded Mailchimp form.
    *   **Interactive Button:** Changes text to "Subscribing..." on click.
*   **Social Media:** Icons for Twitter, Facebook, Discord, LinkedIn (open in new tab).
*   **Copyright:** Dynamic footer text.

## 2. Content Discovery & Interaction

### Homepage (Hub)
*   **Hero Section:**
    *   **Value Prop:** High-impact title and subtitle.
    *   **Stats:** Visual counters for Articles, Readers, Updates.
    *   **CTA:** "Explore Insights" anchor link to categories.
*   **Category Hubs:**
    *   **Panels:** 6 distinct categories (Social Media, Content Creation, SEO, Strategy, Tools, Growth).
    *   **Dynamic Counts:** Shows the number of articles in each category.
    *   **Recent Previews:** Lists the 3 most recent posts per category.
    *   **"View All" Links:** Deep links to the blog listing page with category filters.
*   **Content Tabs (Interactive):**
    *   **Tabs:** Trending Now, Most Shared, New This Week, Reader Favorites.
    *   **Logic:** JavaScript-based tab switching without page reload.
    *   **Filtering:** Displays posts based on tags (`trending`, `popular`, `favorite`).
*   **Tools & Resources Band:**
    *   **Cards:** Visual links to internal and external tools (Twitter Bot, Content Calendar, etc.).
*   **Quick Insights Panel:**
    *   **Badges:** Visual indicators for "Update", "Resource", "Community".
    *   **Action Links:** "Try Now", "Download", "Join".

### Article Pages
*   **Reading Progress Bar:**
    *   **Visual:** Gradient blue line fixed at the top of the viewport.
    *   **Logic:** Expands width from 0% to 100% based on scroll position.
*   **Bookmarking System:**
    *   **Save Button:** Interactive button to "Save for Later".
    *   **State:** Toggles icon fill and tooltip text.
    *   **Storage:** Saves article metadata to `localStorage`.
    *   **Feedback:** Toast notifications ("Article saved!", "Article removed").
*   **Short URL Generator:**
    *   **Action:** "Copy Link" button.
    *   **Backend:** Generates or retrieves a 6-character short code via Supabase.
    *   **Feedback:** Button text changes to "Generating..." -> "Copied!".
    *   **Format:** `.../r/abcdef/`

## 3. User Personalization & Settings

*   **Dark Mode:**
    *   **System:** CSS Variable-based theming (`[data-theme="dark"]`).
    *   **Scope:** Affects background, text, borders, inputs, and specific components like the footer and nav.
    *   **Persistence:** Remembers user choice across sessions.
*   **Language Localization:**
    *   **Support:** English (default), Spanish, French.
    *   **Implementation:** URL-based routing (`/es/`, `/fr/`) and Nunjucks templating.
*   **A/B Testing Framework:**
    *   **Client-side Logic:** Randomly assigns users to "control" or "variant" groups.
    *   **Persistence:** Cookie/LocalStorage (30 days).
    *   **Active Tests:**
        *   `cta_button_text`: Button copy variations.
        *   `newsletter_form_placement`: Inline vs. Bottom positioning.
        *   `article_title_style`: Standard vs. Question format.
        *   `lead_magnet_offer`: Offer text variations.
    *   **Tracking:** Sends conversion events to Google Analytics (`gtag`).

## 4. Content Management System (CMS)

### Collections
*   **Blog Posts:**
    *   **Editorial Workflow:** Status tracking (Draft, In Review, Scheduled, Published).
    *   **SEO Suite:** Focus keywords, Search Intent, Meta overrides, Canonical URLs.
    *   **Content Strategy:** Evergreen/Seasonal toggles, Priority levels.
    *   **Repurposing Tracker:** Fields to track URLs for YouTube, TikTok, Instagram, etc.
    *   **Performance:** Manual entry for Page Views, Bounce Rate, etc.
*   **Content Hubs:** Manage specific topic hubs (e.g., TikTok Marketing) with icons and descriptions.
*   **Notifications:** Create site-wide alerts (Info, Success, Warning) with start dates.
*   **Authors:** Manage author profiles, bios, and social links.
*   **Tools & Resources:** Database of recommended tools with pricing, platform, and ratings.
*   **Quick Insights:** Short-form tips and updates.
*   **What's Hot Rules:** Define criteria (views, engagement) for trending content.

### Global Settings
*   **Feature Toggles:** Enable/Disable Comments, Newsletter, Dark Mode, Social Sharing, etc.
*   **Analytics:** Manage IDs for GA4, Facebook Pixel, Hotjar.
*   **Social Media:** Centralized management of social profile URLs.

## 5. Visual Elements & Feedback

*   **Micro-Interactions:**
    *   **Hover Effects:** Color changes on icons, links, and buttons.
    *   **Transitions:** Smooth fading for mobile menus and search overlays.
    *   **Button States:** Loading/Success states for Newsletter and Short URL buttons.
*   **Responsive Layouts:**
    *   **Grid Systems:** Auto-adjusting grids for categories and testimonials.
    *   **Visibility:** `desktop-only` and `mobile-only` utility classes.
*   **Toast Notifications:** Non-intrusive popup messages for system feedback (e.g., "Article Saved").

## 6. Hidden & Background Features

*   **Service Worker (`sw.js`):** Offline support and caching strategies (implied by file existence).
*   **Redirects (`_redirects`):** Netlify-specific rules for handling URL changes.
*   **Robots.txt:** SEO directives for search engine crawlers.
*   **Sitemap:** Auto-generated XML sitemap for SEO.
*   **Analytics Tracking:**
    *   `analytics-tracker.js`: Custom event tracking wrapper.
    *   Integration with Google Analytics, Facebook Pixel, and Hotjar.
