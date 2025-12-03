# Research

## Page: Homepage (https://blog.evolvedlotus.com/)

### Feature: Header Navigation & Settings
#### What I Saw (Visual Description)
- Header with Logo, Navigation Links, Search Icon, and Settings Icon.
- Settings dropdown contains Language (EN/ES/FR) and Dark Mode toggle.

#### What I Did (Actions Taken)
- Hovered links.
- Clicked Search Icon.
- Clicked Settings Icon.
- Toggled Dark Mode.
- Switched Language to ES.

#### What Happened (Actual Behavior)
- **Search**: Overlay appeared correctly.
- **Dark Mode**: Toggled correctly.
- **Language**: URL changed to `/es/` and page title changed to "Página de Inicio".
- **Navigation**: Links work.

#### What I Expected (Intended Purpose)
- All header elements to function.

#### Bugs / Missing Features / Errors
- None. Header works as expected on Desktop.

### Feature: Mobile Navigation
#### What I Saw (Visual Description)
- Resized browser to 375px (Mobile).
- Desktop links disappeared (or overflowed).

#### What I Did (Actions Taken)
- Looked for Hamburger Menu.

#### What Happened (Actual Behavior)
- **NO Hamburger Menu found**. The user is unable to navigate on mobile.

#### What I Expected (Intended Purpose)
- A hamburger menu should appear to allow navigation on mobile devices.

#### Bugs / Missing Features / Errors
- **CRITICAL**: Mobile navigation is missing.

### Feature: "What's Hot" Tabs
#### What I Saw (Visual Description)
- Tabbed section with "Trending", "Popular", "New", "Favorites".

#### What I Did (Actions Taken)
- Clicked each tab.

#### What Happened (Actual Behavior)
- Tabs changed visual state (active styling).
- **Content did NOT change**. The same articles remained visible.

#### What I Expected (Intended Purpose)
- Clicking a tab should filter or switch the displayed articles.

#### Bugs / Missing Features / Errors
- **BUG**: Tabs are non-functional.

### Feature: Footer Newsletter
#### What I Saw (Visual Description)
- Footer with links and social icons.

#### What I Did (Actions Taken)
- Looked for Newsletter Signup Form.

#### What Happened (Actual Behavior)
- No form found. Only a link to a Mailchimp page.

#### What I Expected (Intended Purpose)
- A functional input field to subscribe directly from the footer.

#### Bugs / Missing Features / Errors
- **MISSING**: Newsletter form is not embedded.

## Page: Article Detail

### Feature: Tags
#### What I Saw (Visual Description)
- Tags (e.g., `#tiktok`) displayed near the top.

#### What I Did (Actions Taken)
- Clicked `#tiktok`.

#### What Happened (Actual Behavior)
- Navigated to `/x-kick/` (Kick Hub).

#### What I Expected (Intended Purpose)
- Should navigate to a blog index filtered by that tag (e.g., `/blog/?search=tiktok`).

#### Bugs / Missing Features / Errors
- **BUG**: Tags redirect to Hubs instead of search results/filtered lists.

### Feature: Share Buttons
#### What I Saw (Visual Description)
- Social share buttons (Twitter, etc.).

#### What I Did (Actions Taken)
- Clicked "Share on Twitter".

#### What Happened (Actual Behavior)
- **Nothing**. No new tab, no popup.

#### What I Expected (Intended Purpose)
- A Twitter share dialog should open.

#### Bugs / Missing Features / Errors
- **BUG**: Share buttons are non-functional.

### Feature: Comments
#### What I Saw (Visual Description)
- Article footer area.

#### What I Did (Actions Taken)
- Looked for comments section.

#### What Happened (Actual Behavior)
- No comments section found.

#### What I Expected (Intended Purpose)
- A place for users to leave comments.

#### Bugs / Missing Features / Errors
- **MISSING**: Comments section.

## Page: Static Pages (About, Contact, Privacy, Terms)

### Feature: Content Loading
#### What I Saw (Visual Description)
- Standard text pages.

#### What I Did (Actions Taken)
- Visited each page.

#### What Happened (Actual Behavior)
- All pages loaded correctly with visible content.

#### What I Expected (Intended Purpose)
- Pages should exist and load.

#### Bugs / Missing Features / Errors
- None.

## Page: Hubs (e.g., /x-kick/)

### Feature: Hub Content
#### What I Saw (Visual Description)
- Hub page with specific content.

#### What I Did (Actions Taken)
- Visited page.

#### What Happened (Actual Behavior)
- Loaded correctly.

#### What I Expected (Intended Purpose)
- Hub page should load.

#### Bugs / Missing Features / Errors
- None.
