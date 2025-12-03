# Research

## Page: Homepage (https://blog.evolvedlotus.com/)

### Feature: Header Navigation
#### What I Saw (Visual Description)
-   Logo on the left.
-   Navigation links on the right: `nav.home`, `nav.blog`, `nav.contact`, `nav.tools`.
-   Language switcher (EN, ES, FR).
-   Search icon (magnifying glass).

#### What I Did (Actions Taken)
-   Clicked links.
-   Switched languages.
-   Clicked search icon.

#### What Happened (Actual Behavior)
-   Links navigate correctly but text is raw translation keys.
-   Language switcher changes URL path (e.g., `/es/`) but content remains in English and nav links remain as keys.
-   Search icon navigates to `/blog#search`.

#### What I Expected (Intended Purpose)
-   Nav links should show "Home", "Blog", etc.
-   Language switcher should translate content.

#### Bugs / Missing Features / Errors
-   **Bug**: Navigation links display raw keys (`nav.home`).
-   **Bug**: Language switcher does not translate content.
-   **Missing**: Dark mode toggle.

### Feature: Footer
#### What I Saw (Visual Description)
-   Links: About, Contact, Terms, Privacy, Newsletter.
-   Social icons.
-   Copyright text.

#### What I Did (Actions Taken)
-   Scrolled to bottom.
-   Verified links exist.

#### What Happened (Actual Behavior)
-   Links appear functional.

#### What I Expected (Intended Purpose)
-   Standard footer navigation.

#### Bugs / Missing Features / Errors
-   None observed.

### Feature: Responsive Design (Mobile)
#### What I Saw (Visual Description)
-   Hamburger menu icon appears at mobile width (375px).

#### What I Did (Actions Taken)
-   Resized window to 375px.
-   Clicked hamburger menu.

#### What Happened (Actual Behavior)
-   Menu opens correctly.
-   Contains nav links (still keys), search, and language switcher.
-   Language switcher inside menu also fails to translate.

#### What I Expected (Intended Purpose)
-   Mobile-friendly navigation.

#### Bugs / Missing Features / Errors
-   Same translation/key issues as desktop.

## Page: Blog Listing (https://blog.evolvedlotus.com/blog/)

### Feature: Blog Post Display
#### What I Saw (Visual Description)
-   Social media icons (Kick, Facebook, etc.) as filters near the top.
-   Search bar below that.
-   "Recent Blog Posts" heading, but NO posts listed by default below it.
-   Posts only appear in a `search-results-enhanced` div *after* searching.

#### What I Did (Actions Taken)
-   Loaded the page, scrolled down.

#### What Happened (Actual Behavior)
-   No posts were listed by default. Only after searching did posts appear within a specific results div.

#### What I Expected (Intended Purpose)
-   A list of recent blog posts should be displayed by default below "Recent Blog Posts".

#### Bugs / Missing Features / Errors
-   **Bug**: Recent posts are not listed on initial page load of `/blog`.
-   **Missing**: Pagination controls.

### Feature: Search Bar (/blog)
#### What I Saw (Visual Description)
-   Input field with placeholder "Search blogs...".

#### What I Did (Actions Taken)
-   Typed "TikTok", observed results.
-   Cleared search.

#### What Happened (Actual Behavior)
-   Typing dynamically filtered and showed relevant posts in a div below the search bar.
-   Clearing emptied the results div.

#### What I Expected (Intended Purpose)
-   Search should filter blog posts.

#### Bugs / Missing Features / Errors
-   None for search functionality itself, but it highlights the lack of default post listing.

## Page: Article (https://blog.evolvedlotus.com/blog/2025-05-13-how-to-skyrocket-your-tiktok-views...)

### Feature: Article Layout & Metadata
#### What I Saw (Visual Description)
-   Article title at the top.
-   Date found within the content body, not prominently displayed with title.
-   No obvious author name near the title.
-   No large cover image at the top.

#### What I Did (Actions Taken)
-   Viewed the page, scrolled.

#### What Happened (Actual Behavior)
-   Basic article content is present.

#### What I Expected (Intended Purpose)
-   Expected date, author, and maybe cover image to be clearly displayed near the title.

#### Bugs / Missing Features / Errors
-   **Missing**: Prominent author display.
-   **Missing**: Cover image (if intended).

### Feature: Social Share Buttons
#### What I Saw (Visual Description)
-   No visible share buttons (floating or inline).

#### What I Did (Actions Taken)
-   Scrolled through the article.

#### What Happened (Actual Behavior)
-   No share buttons found.

#### What I Expected (Intended Purpose)
-   Share buttons to allow easy sharing to social media.

#### Bugs / Missing Features / Errors
-   **Missing**: Social share buttons.

### Feature: Tags
#### What I Saw (Visual Description)
-   No "Tags" section at the end of the article content.

#### What I Did (Actions Taken)
-   Scrolled to the bottom of the article content.

#### What Happened (Actual Behavior)
-   No tags found.

#### What I Expected (Intended Purpose)
-   A list of tags associated with the article, linking to tag archive pages.

#### Bugs / Missing Features / Errors
-   **Missing**: Tags section and tag links.

### Feature: Related Articles / Next/Prev
#### What I Saw (Visual Description)
-   No "Related Articles" or "Next/Previous Post" links.

#### What I Did (Actions Taken)
-   Scrolled to the bottom.

#### What Happened (Actual Behavior)
-   No such links found.

#### What I Expected (Intended Purpose)
-   Links to other relevant content.

#### Bugs / Missing Features / Errors
-   **Missing**: Related/Next/Prev post links.

### Feature: Comments
#### What I Saw (Visual Description)
-   "Comments" heading, followed by "Comments are currently disabled."

#### What I Did (Actions Taken)
-   Viewed the section.

#### What Happened (Actual Behavior)
-   Comments are disabled.

#### What I Expected (Intended Purpose)
-   Either a working comment form or no section if comments are not intended.

#### Bugs / Missing Features / Errors
-   None, it clearly states they are disabled.

### Feature: Article Responsiveness (Mobile)
#### What I Saw (Visual Description)
-   Content reflows to fit mobile screen.

#### What I Did (Actions Taken)
-   Resized to 375px width.

#### What Happened (Actual Behavior)
-   Text readable, images fit.

#### What I Expected (Intended Purpose)
-   Good mobile reading experience.

#### Bugs / Missing Features / Errors
-   None.
