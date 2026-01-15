---
description: File organization guidelines for the blog project
---

# File Organization Guidelines

This workflow defines where different types of files should be placed to maintain a clean, organized codebase.

## Directory Structure

### Source Files (`src/`)

#### Pages (`src/pages/`)
- **Static pages**: about.njk, contact.njk, privacy-policy.njk, terms-of-service.njk, saved.njk, offline.njk, 404.html
- **Main pages**: home.njk (homepage), blog.njk (blog listing)
- **Internationalization**: `src/pages/es/` and `src/pages/fr/` for Spanish and French versions
- **Rule**: All `.njk` page templates that aren't blog posts go here

#### Topics (`src/topics/`)
- **Category pages**: facebook.njk, instagram.njk, youtube.njk, twitter.njk, tiktok.njk, twitch.njk, kick.njk, linkedin.njk, misc.njk
- **Rule**: Platform-specific category/hub pages go here
- **Naming**: Use full platform names (e.g., `facebook.njk` not `x-fb.njk`)

#### Utilities (`src/utils/`)
- **System files**: feed.njk, sitemap.xml.njk, hub-feeds.njk
- **Rule**: RSS feeds, sitemaps, and other utility templates go here

#### Blog Posts (`src/blog/`)
- **Format**: `YYYY-MM-DD-slug.md`
- **Rule**: All blog post markdown files go here

#### Assets (`src/assets/`)
- **CSS**: `src/assets/css/` - All stylesheets
- **Images**: `src/assets/blog/`, `src/assets/og/` - Images and OG images
- **Rule**: All static assets (CSS, images, fonts) go in subdirectories here

#### Other Directories
- `src/_includes/` - Nunjucks partials and components
- `src/_data/` - Global data files (JSON, JS)
- `src/authors/` - Author profile pages
- `src/hubs/` - Content hub pages
- `src/insights/` - Insight pages
- `src/tools/` - Tool pages

### Root Directory Organization

#### Scripts (`scripts/`)
- **Active utilities**: `scripts/utils/` - Currently used scripts
- **Archived scripts**: `scripts/archive/` - Old/deprecated scripts
- **Rule**: Keep root `scripts/` clean, organize by purpose

#### Reports & Logs
- **Reports**: `reports/` - Audit reports, scan results (JSON files)
- **Logs**: `logs/` - Build logs, scan logs
- **Rule**: Never commit logs to git (add to .gitignore)

#### Documentation
- **Docs**: `docs/` - Documentation files (markdown)
- **Rule**: Project documentation goes here, not in root

## File Naming Conventions

### Pages
- Use kebab-case: `privacy-policy.njk`, `terms-of-service.njk`
- Use descriptive names: `home.njk` not `index.njk` (when in subdirectories)

### Topics/Categories
- Use full platform names: `facebook.njk`, `instagram.njk`
- Avoid abbreviations: NO `x-fb.njk`, YES `facebook.njk`

### Blog Posts
- Format: `YYYY-MM-DD-descriptive-slug.md`
- Example: `2025-01-15-how-to-grow-on-instagram.md`

### CSS Files
- Use descriptive names: `style.css`, `dark-mode.css`, `homepage-carousel.css`
- Group related styles: `layout-fixes.css`, `ux-enhancements.css`

## Permalinks

All pages should have explicit `permalink` frontmatter to ensure consistent URLs:

```yaml
---
permalink: /about/
---
```

### Pagination
For paginated pages, use dynamic permalinks:
```yaml
permalink: "/blog/{% if pagination.pageNumber > 0 %}page-{{ pagination.pageNumber + 1 }}/{% endif %}index.html"
```

## What NOT to Do

❌ **Don't** place CSS files in `src/` root
❌ **Don't** use cryptic abbreviations (x-fb, x-ig)
❌ **Don't** place utility files in `src/` root
❌ **Don't** commit log files or build artifacts
❌ **Don't** create files without explicit permalinks
❌ **Don't** place scripts in root without organizing them

## Pre-Commit Checklist

Before committing new files, verify:
- [ ] CSS files are in `src/assets/css/`
- [ ] Page templates are in `src/pages/`
- [ ] Topic pages are in `src/topics/`
- [ ] Scripts are organized in `scripts/utils/` or `scripts/archive/`
- [ ] All pages have explicit `permalink` frontmatter
- [ ] File names follow conventions (kebab-case, descriptive)
- [ ] No temporary files or logs are being committed

## Maintenance

Run these commands periodically to keep the codebase clean:

```bash
# Check for files in wrong locations
npm run validate

# Run a build to ensure everything works
npm run build

# Check for broken links
npm run validate:api
```
