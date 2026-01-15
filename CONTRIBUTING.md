# Contributing to EvolvedLotus Blog

Thank you for contributing! Please follow these guidelines to maintain code quality and organization.

## File Organization

### Where to Place Files

- **Blog Posts**: `src/blog/YYYY-MM-DD-slug.md`
- **Static Pages**: `src/pages/*.njk`
- **Topic/Category Pages**: `src/topics/*.njk`
- **CSS Files**: `src/assets/css/*.css`
- **Images**: `src/assets/blog/` or `src/assets/og/`
- **Utilities**: `src/utils/*.njk` (feeds, sitemaps)
- **Scripts**: `scripts/utils/` (active) or `scripts/archive/` (deprecated)

### Naming Conventions

- **Files**: Use kebab-case (e.g., `privacy-policy.njk`)
- **Blog Posts**: `YYYY-MM-DD-descriptive-title.md`
- **Topics**: Use full names (e.g., `facebook.njk`, not `x-fb.njk`)

## Adding New Content

### New Blog Post

1. Create file in `src/blog/` with format: `YYYY-MM-DD-title.md`
2. Include required frontmatter:
   ```yaml
   ---
   title: "Your Post Title"
   description: "Brief description for SEO"
   date: "YYYY-MM-DD"
   tags: [post, relevant-tag]
   image: /assets/blog/your-image.webp
   imageAlt: "Image description"
   ---
   ```

### New Static Page

1. Create file in `src/pages/your-page.njk`
2. Include frontmatter with explicit permalink:
   ```yaml
   ---
   title: "Page Title"
   layout: 'base.njk'
   permalink: /your-page/
   ---
   ```

### New CSS File

1. Create file in `src/assets/css/your-styles.css`
2. Add link in `src/_includes/base.njk`:
   ```html
   <link rel="stylesheet" href="/assets/css/your-styles.css">
   ```

## Before Committing

Run these checks:

```bash
# Validate frontmatter
npm run validate

# Build the site
npm run build

# Test locally
npm run dev
```

### Pre-Commit Checklist

- [ ] All new files are in the correct directories
- [ ] CSS files are in `src/assets/css/`
- [ ] Pages have explicit `permalink` frontmatter
- [ ] File names follow kebab-case convention
- [ ] No log files or build artifacts included
- [ ] Build completes successfully
- [ ] No broken links

## Code Style

- Use 2 spaces for indentation
- Use double quotes for HTML attributes
- Keep lines under 100 characters when possible
- Add comments for complex logic

## Pull Request Process

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes following the guidelines above
3. Test locally: `npm run build && npm run dev`
4. Commit with descriptive message
5. Push and create pull request
6. Ensure CI/CD checks pass

## Questions?

Check the [File Organization Workflow](.agent/workflows/file-organization.md) for detailed guidelines.
