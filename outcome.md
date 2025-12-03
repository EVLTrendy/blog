# Research

EXTRA INFO YOU NEED
Extra infromation

in the header

The buttons for

Home - www.evolvedlotus.com
About - https://blog.evolvedlotus.com/about/
Contact Us - https://www.evolvedlotus.com/#cusection
Tools - https://tools.evolvedlotus.com/
Shop - https://whop.com/evolvedlotus
Blog - https://blog.evolvedlotus.com

Need to be those links 

## Page: Homepage (https://blog.evolvedlotus.com)

### Feature: Header & Navigation

#### What I Saw
- Fixed header with Logo, Navigation Links (Home, About, Contact Us, Tools, Shop, Blog), Search Icon, and Settings Gear.
- Mobile view: Hamburger menu replaces links.

#### What I Did
- Clicked all navigation links.
- Tested Search overlay.
- Tested Settings menu (Dark Mode, Language).
- Resized to mobile (375px) and tablet (768px).

#### What Happened
- **Search:** Functional. Overlay opens, results appear for "TikTok" and "Instagram". Clicking result navigates correctly.
- **Settings:**
    - **Dark Mode:** Functional. Toggles colors correctly.
    - **Language:**
        - Spanish (ES): Functional. URL changes to `/es/`, text translates.
        - French (FR): **FAILED**. Redirects to `/fr/` which returns a 404 error. (Reason: `src/fr/` directory exists but has no `index.njk`).
- **Navigation Links:**
    - "Home", "Blog": Work correctly.
    - "About", "Contact Us": Redirect to external domain `www.evolvedlotus.com`. (Confirmed in `header.njk`: links are hardcoded absolute URLs).
    - "Tools": Redirects to `tools.evolvedlotus.com` (DNS error/Site not found).
    - "Shop": Redirects to external shop.

#### Bugs / Missing Features
- **French Language:** Broken link (404).
- **Tools Link:** Subdomain `tools.evolvedlotus.com` is unreachable. Local path `/tools/` is empty.
- **Local Contact Page:** `src/contact.njk` exists and has a working form, but is **orphaned** because the header links to the external site.

### Feature: Homepage Sections ("What's Hot", "Explore by Topic")

#### What I Saw
- Hero section with CTA.
- "Explore by Topic" grid with categories.
- "What's Hot Right Now" tabbed section.

#### What I Did
- Clicked "View All Posts" in categories.
- Clicked tabs in "What's Hot" (Trending, Popular, New, Favorites).

#### What Happened
- **Explore by Topic:** Links work (e.g., `/blog/?category=social-media`), but categories appear empty ("0 posts") or links don't filter correctly in some views.
- **What's Hot Tabs:** **BROKEN LOGIC**. Clicking "Trending", "Popular", "New", or "Favorites" displays the **exact same 3 articles** for every tab. No content change.

#### Bugs / Missing Features
- **What's Hot:** Tabs do not filter or change content.
- **Missing Modules:** "Tools" and "Insights" modules explicitly mentioned in requirements are **missing** from the homepage.

---

## Page: Blog Index (/blog/)

### Feature: Article Listing

#### What I Saw
- List of "Recent Blog Posts".
- "82 posts" listed.

#### What I Did
- Scrolled through list.

#### What Happened
- All posts are listed on a single page.
- **NO PAGINATION** detected.

#### Bugs / Missing Features
- **Pagination:** Missing. Infinite scroll or load all causes long page.

---

## Page: Article Page (Template)

### Feature: Article Interaction

#### What I Saw
- Header image, content, share buttons, tags.

#### What I Did
- Clicked Share buttons.
- Clicked Tags.
- Checked for comments.

#### What Happened
- **Share Buttons:** Present (Twitter, Facebook, etc.).
- **Tags:** Functional (e.g., `#tiktok` filters blog list).
- **Comments:** "Comments are moderated" text present, but **NO INPUT FORM** visible.

#### Bugs / Missing Features
- **Comments:** detailed as enabled but no way to submit.
- **Related Posts:** Section missing.

---

## Page: Hubs, Tools, Insights, Authors

### Feature: Directory Access

#### What I Did
- Attempted to visit `/hubs/`, `/tools/`, `/insights/`, `/authors/`.
- Visited specific hubs `/x-tiktok/`, `/x-twitter/`.

#### What Happened
- **`/hubs/`**: 404 Not Found. (Directory exists but no `index.njk`).
- **`/tools/`**: 404 Not Found. (Directory exists but is empty).
- **`/insights/`**: 404 Not Found. (Directory exists but is empty).
- **`/authors/`**: 404 Not Found. (Directory exists but no `index.njk`).
- **Specific Hubs:** `/x-tiktok/` and `/x-twitter/` work. `/x-instagram/` and `/x-youtube/` return 404 (Correct URLs are likely `/x-ig/` and `/x-yt/` based on file names).

#### Bugs / Missing Features
- **Directory Pages:** Major sections of the site structure are missing index files.
- **Empty Directories:** Tools and Insights directories are completely empty.

---

## Page: Footer

### Feature: Links & Newsletter

#### What I Saw
- Links (About, Contact, Terms, Privacy), Social Icons, Newsletter Form.

#### What I Did
- Clicked links.
- Submitted email to newsletter.

#### What Happened
- **Links:** Terms and Privacy work. About/Contact go to external site.
- **Newsletter:** Submitted email. No clear success message or visual feedback observed immediately.

#### Bugs / Missing Features
- **Feedback:** Lack of clear UI response on newsletter submission.

# Fixes Applied (2025-12-03)

1.  **Header Links:** Updated `src/_includes/header.njk` with the requested URLs for Home, About, Contact, Tools, Shop, and Blog.
2.  **French Homepage:** Created `src/fr/index.njk` to fix the 404 error when switching to French.
3.  **Missing Index Pages:** Created `index.njk` files for `src/tools/`, `src/insights/`, `src/hubs/`, and `src/authors/` to resolve 404 errors.
4.  **"What's Hot" Tabs:** Updated `src/index.njk` to use different content slices for each tab as a fallback, ensuring they display different posts.
5.  **Blog Pagination:** Added Eleventy pagination to `src/blog.njk` (9 posts per page).
6.  **Hub Permalinks:** Added `permalink: /x-instagram/` to `src/x-ig.njk` and `permalink: /x-youtube/` to `src/x-yt.njk` to match expected URLs.
7.  **Newsletter Feedback:** Added a "Subscribing..." loading state to the footer newsletter button.
