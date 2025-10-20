# Link Preview Analyzer

A comprehensive tool for checking if link previews (Open Graph, Twitter Cards, etc.) work across major social media platforms for both main URLs and short URLs.

## Features

- ✅ **Multi-platform analysis**: Checks compatibility across 9 major platforms
- ✅ **Detailed reporting**: Shows exactly which meta tags are missing
- ✅ **Short URL support**: Compare main URLs vs short URLs
- ✅ **Strict format**: Provides clear "Platform: yes/no" results
- ✅ **Comprehensive coverage**: Open Graph, Twitter Cards, Facebook, LinkedIn, WhatsApp, Telegram, Discord, Pinterest, Reddit

## Platforms Supported

| Platform | Required Tags | Primary Use Case |
|----------|---------------|------------------|
| **Open Graph** | `og:title`, `og:description`, `og:image`, `og:url` | Universal fallback for all platforms |
| **Twitter Cards** | `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image` | Twitter/X link previews |
| **Facebook** | `og:title`, `og:description`, `og:image` | Facebook sharing and posts |
| **LinkedIn** | `og:title`, `og:description`, `og:image` | LinkedIn post previews |
| **WhatsApp** | `og:title`, `og:description`, `og:image` | WhatsApp link sharing |
| **Telegram** | `og:title`, `og:description`, `og:image` | Telegram instant view |
| **Discord** | `og:title`, `og:description`, `og:image` | Discord embeds |
| **Pinterest** | `og:image` | Pinterest pin previews |
| **Reddit** | `og:title`, `og:description` | Reddit link previews |

## Installation

The tool requires Node.js and uses the `jsdom` library for HTML parsing:

```bash
npm install jsdom
```

## Usage

### Basic Usage

Analyze a single URL:

```bash
node scripts/link-preview-analyzer.js https://example.com
```

### Compare Main URL vs Short URL

```bash
node scripts/link-preview-analyzer.js https://example.com/blog/article https://bit.ly/abc123
```

### Example Output

```
🚀 Analyzing main URL...

🔍 Link Preview Analysis for: https://blog.evolvedlotus.com
============================================================
Open Graph: ✅ yes
Twitter Cards: ✅ yes
Facebook: ✅ yes
LinkedIn: ✅ yes
WhatsApp: ✅ yes
Telegram: ✅ yes
Discord: ✅ yes
Pinterest: ✅ yes
Reddit: ✅ yes

📊 Summary:
Valid platforms: 9/9
Success rate: 100%
```

### Output with Missing Tags

When platforms fail, the tool shows exactly which tags are missing:

```
🔍 Link Preview Analysis for: https://example.com
============================================================
Open Graph: ❌ no
  Missing required tags: og:image, og:url
  ⚠️  Recommended tag missing: og:locale
Twitter Cards: ❌ no
  Missing required tags: twitter:card, twitter:image
Facebook: ❌ no
  Missing required tags: og:image
```

## API Usage

You can also use the analyzer programmatically:

```javascript
const {
  fetchHTML,
  extractMetaTags,
  analyzeLinkPreview,
  formatResults
} = require('./scripts/link-preview-analyzer.js');

async function analyzeURL(url) {
  try {
    const html = await fetchHTML(url);
    const metaTags = extractMetaTags(html);
    const analysis = analyzeLinkPreview(metaTags);

    console.log('Analysis Results:');
    Object.entries(analysis).forEach(([platform, result]) => {
      const status = result.valid ? '✅ yes' : '❌ no';
      console.log(`${platform}: ${status}`);

      if (!result.valid) {
        console.log(`  Missing: ${result.missing.join(', ')}`);
      }
    });

    return analysis;
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Usage
analyzeURL('https://example.com');
```

## Testing

Run the comprehensive test suite to see how the analyzer handles various scenarios:

```bash
node scripts/test-link-preview-analyzer.js
```

The test suite includes:
- Tests with missing meta tags
- Tests with real URLs that may have incomplete meta tag implementation
- Demonstrates error handling and reporting

## Integration with Build Process

You can integrate this analyzer into your build process or CI/CD pipeline:

```javascript
// In your build script
const { analyzeLinkPreview, fetchHTML, extractMetaTags } = require('./scripts/link-preview-analyzer.js');

async function validateSocialPreviews(url) {
  const html = await fetchHTML(url);
  const metaTags = extractMetaTags(html);
  const analysis = analyzeLinkPreview(metaTags);

  const failedPlatforms = Object.entries(analysis)
    .filter(([_, result]) => !result.valid)
    .map(([platform, _]) => platform);

  if (failedPlatforms.length > 0) {
    console.error(`❌ Link preview issues found for: ${failedPlatforms.join(', ')}`);
    process.exit(1);
  } else {
    console.log('✅ All link previews working correctly');
  }
}
```

## Troubleshooting

### Common Issues

1. **Images not loading**: Ensure `og:image` and `twitter:image` URLs are absolute and accessible
2. **Titles/descriptions too long**: Keep titles under 95 characters, descriptions under 200 characters
3. **HTTPS required**: All resources (images, URLs) should use HTTPS
4. **Missing canonical URL**: Always include `og:url` pointing to the canonical version of the page

### Best Practices

1. **Always test both main and short URLs** if using URL shorteners
2. **Use absolute URLs** for all `og:image` and `twitter:image` tags
3. **Include alt text** for images using `og:image:alt` and `twitter:image:alt`
4. **Set appropriate `og:type`** (usually `article` for blog posts)
5. **Test on multiple devices** and platforms regularly

## Meta Tag Reference

### Essential Open Graph Tags

```html
<meta property="og:title" content="Your Article Title">
<meta property="og:description" content="Brief description under 200 characters">
<meta property="og:image" content="https://example.com/image.jpg">
<meta property="og:url" content="https://example.com/article">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Your Site Name">
```

### Essential Twitter Card Tags

```html
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Your Article Title">
<meta name="twitter:description" content="Brief description under 200 characters">
<meta name="twitter:image" content="https://example.com/image.jpg">
<meta name="twitter:site" content="@yourusername">
```

## Contributing

To add support for new platforms or modify requirements:

1. Edit the `PLATFORM_REQUIREMENTS` object in `link-preview-analyzer.js`
2. Add the required and recommended meta tags for the platform
3. Update this documentation
4. Add tests to the test suite

## License

This tool is part of the EvolvedLotus blog project and is available for use in content creation workflows.
