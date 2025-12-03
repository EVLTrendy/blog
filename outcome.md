# Research

## Page: Homepage (https://blog.evolvedlotus.com/)

### Feature: Global Navigation Header
#### What I Saw (Visual Description)
- Fixed header at the top of the page.
- Logo on the left side.
- Navigation menu items on the right.
- **Visual Error**: Navigation items are displaying raw translation keys (e.g., `nav.home`, `nav.about`, `nav.blog`) instead of human-readable text.
- Language switcher dropdown/icons.
- Search icon.

#### What I Did (Actions Taken)
- Hovered over navigation items.
- Clicked on navigation links.
- Attempted to switch languages using the switcher.
- Scrolled down to check sticky behavior.

#### What Happened (Actual Behavior)
- Navigation links function correctly and navigate to the expected pages, despite the label error.
- **Sticky Header**: The header remains fixed at the top when scrolling.
- **Language Switcher**: Clicking a different language changes the URL (e.g., appends `/es/`), but the **content remains in English**. The translation feature appears non-functional.

#### What I Expected (Intended Purpose)
- Navigation labels should be "Home", "About", "Blog", etc.
- Language switcher should translate the page content into the selected language.

#### Bugs / Missing Features / Errors
- **CRITICAL BUG**: Navigation menu displays `nav.*` translation keys instead of text.
- **CRITICAL BUG**: Language switcher updates URL but does not translate content.

### Feature: Responsive Mobile Menu
#### What I Saw (Visual Description)
- On tablet (768px) and mobile (375px) viewports, the desktop menu is replaced by a "Hamburger" icon.

#### What I Did (Actions Taken)
- Resized browser window to simulate tablet and mobile devices.
- Clicked the hamburger menu icon.

#### What Happened (Actual Behavior)
- The menu expands and collapses smoothly.
- The menu items inside also display the broken `nav.*` translation keys.

#### What I Expected (Intended Purpose)
- A fully functional responsive menu with readable labels.

#### Bugs / Missing Features / Errors
- **Bug**: Mobile menu inherits the translation key error (`nav.*`).

### Feature: Footer
#### What I Saw (Visual Description)
- Located at the bottom of the page.
- Contains social media icons, copyright text, and potentially other links.

#### What I Did (Actions Taken)
- Scrolled to the bottom.
- Checked for broken images or layout issues.

#### What Happened (Actual Behavior)
- Footer is visible and appears structurally correct.
- Social links are present.

#### What I Expected (Intended Purpose)
- Informational footer with working links.

#### Bugs / Missing Features / Errors
- None explicitly noted.

### Feature: Homepage Content
#### What I Saw (Visual Description)
- Hero section.
- Post grid/list.
- Pagination or "Load More" controls.

#### What I Did (Actions Taken)
- Scrolled through the content.
- Hovered over post cards.

#### What Happened (Actual Behavior)
- Post cards have a hover effect (likely a lift or shadow change).
- Layout is responsive.

#### What I Expected (Intended Purpose)
- Clean, responsive display of blog posts.

#### Bugs / Missing Features / Errors
- No layout errors reported.

## Page: Search Functionality

### Feature: Search Bar
#### What I Saw (Visual Description)
- Search icon in the header.
- Clicking it opens a search input field.

#### What I Did (Actions Taken)
- Clicked the search icon.
- Typed "tiktok".
- Pressed Enter / Clicked a result.

#### What Happened (Actual Behavior)
- Search results appeared (e.g., "How to Skyrocket Your TikTok Views...").
- Clicking a result navigated correctly to the article.

#### What I Expected (Intended Purpose)
- Functional search that finds relevant content.

#### Bugs / Missing Features / Errors
- None. Search appears to work correctly.

## Page: Article Detail (e.g., /blog/2025-05-13-how-to-skyrocket-your-tiktok-views...)

### Feature: Article Content & Interaction
#### What I Saw (Visual Description)
- Title, Author, Date.
- Main content image.
- "Copy Link" button.
- Share buttons (Twitter, Facebook, etc.).
- **Missing**: Tags section (e.g., #tiktok, #marketing) was NOT visible on the page.

#### What I Did (Actions Taken)
- Navigated to the article.
- Clicked "Copy Link".
- Scrolled up and down looking for tags.

#### What Happened (Actual Behavior)
- **Copy Link**: Clicking the button triggered a "Short URL copied to clipboard!" toast message. This works.
- **Tags**: Could not find any clickable tags on the page.

#### What I Expected (Intended Purpose)
- "Copy Link" should copy URL (Success).
- Tags should be visible and clickable to filter content.

#### Bugs / Missing Features / Errors
- **BUG**: Tags are missing from the article view. They should be displayed to allow category navigation.

## Page: 404 Error (e.g., /this-page-does-not-exist-123)

### Feature: 404 Page
#### What I Saw (Visual Description)
- A dedicated "404 - Page Not Found" message.
- A "Back to Homepage" button/link.

#### What I Did (Actions Taken)
- Navigated to a non-existent URL.
- Clicked "Back to Homepage".

#### What Happened (Actual Behavior)
- The 404 page displayed correctly.
- The "Back to Homepage" link successfully navigated back to the home page.

#### What I Expected (Intended Purpose)
- A user-friendly error page with a way out.

#### Bugs / Missing Features / Errors
- None. Works as expected.
