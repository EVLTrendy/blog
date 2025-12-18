# Meta Tag & SEO Architecture

This document describes the implementation of meta tags, social media previews, and SEO features in the EvolvedLotus blog.

## 1. Core Meta Tags (`base.njk`)

The `base.njk` layout serves as the foundation for all pages. It dynamically generates:

- **Standard Meta**: `description`, `author`, `keywords`, `canonical`.
- **Open Graph (OG)**: `og:title`, `og:description`, `og:image`, `og:image:width`, `og:image:height`, `og:type`, `og:url`.
- **Twitter Cards**: `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`, `twitter:site`.
- **Security**: CSP and other headers via `netlify.toml`.

### Article Specifics
For blog posts (`layout: post`), additional tags are added:
- `article:published_time`
- `article:modified_time`
- `article:author`
- `article:section`
- `article:publisher`

## 2. Dynamic `og:type`

- **Home/Listing Pages**: Defaults to `website`.
- **Blog Posts**: Overridden to `article` in `src/_includes/article.njk`.

## 3. Image Optimization (`scripts/generate-og-images.js`)

Open Graph images are automatically generated from source images in `src/assets/blog/`.
- **Target Dimensions**: 1200x630px (Standard OG size).
- **Format**: PNG (High compatibility).
- **Location**: Generated images are stored in `src/assets/og/`.
- **Fallbacks**: If a post has no featured image, `default-og.png` is used.

## 4. Short URL System (`netlify/functions/shorten.js`)

The short URL system (`/r/:id`) is designed for social media sharing.
- **Preview Generation**: Instead of a 301 redirect, it returns a 200 OK HTML page with meta tags.
- **Client Redirect**: uses `<meta http-equiv="refresh">` and JavaScript `window.location`.
- **Benefits**: Allows platforms like Discord and Twitter to crawl and show rich previews for short URLs.
- **Analytics**: Tracks clicks, referrers, and bot activity via Supabase.

## 5. Structured Data (JSON-LD)

Implemented via `src/_includes/schema.njk`:
- **WebSite**: Basic site info.
- **Organization**: Logo and social profiles.
- **BreadcrumbList**: Navigation path.
- **Article**: specific schema for blog posts (headline, author, dates, image).

## 6. Build Process Integration

- **Validation**: `frontmatter-validator.js` runs via `npm run build` to ensure all posts have required SEO fields (`imageAlt`, `category`, etc.).
- **OG Generation**: `generate-og-images.js` runs as a `prebuild` step.
- **Post-Build Verification**: `verify-meta-tags.js` checks the output HTML in `_site/` for critical errors.

## 7. Testing Previews

To test how meta tags appear:
1. **Local**: Use `npm run build` then inspect `_site/blog/*/index.html`.
2. **Social Media Tools**: Use [Open Graph Debugger](https://opengraph.dev/) or [Twitter Card Validator](https://cards-dev.twitter.com/validator).
