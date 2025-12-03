# Lead Magnets Directory

This directory contains downloadable resources (lead magnets) for the blog.

## Structure

```
resources/
├── tiktok/
│   ├── tiktok-growth-checklist.pdf
│   └── viral-content-template.pdf
├── instagram/
│   ├── instagram-hashtag-guide.pdf
│   └── reel-ideas-template.pdf
├── youtube/
│   ├── youtube-seo-checklist.pdf
│   └── thumbnail-template.psd
└── general/
    ├── content-calendar-template.xlsx
    └── social-media-audit.pdf
```

## Adding New Lead Magnets

1. Create the resource file (PDF, template, etc.)
2. Add it to the appropriate hub directory
3. Update the blog post frontmatter:

```yaml
leadMagnet:
  id: "tiktok-growth-checklist"
  title: "Free TikTok Growth Checklist"
  description: "Get our proven 30-day TikTok growth strategy"
  type: "checklist"
  downloadUrl: "/resources/tiktok/tiktok-growth-checklist.pdf"
  benefits:
    - "30-day step-by-step action plan"
    - "Proven hashtag strategies"
    - "Content ideas for maximum engagement"
```

## File Naming Convention

- Use lowercase with hyphens
- Be descriptive but concise
- Include the hub name if specific to a platform
- Examples:
  - `tiktok-growth-checklist.pdf`
  - `instagram-reel-template.pdf`
  - `youtube-thumbnail-guide.pdf`

## File Types Supported

- **PDF**: Guides, checklists, ebooks
- **XLSX/Google Sheets**: Templates, calendars
- **PSD/Figma**: Design templates
- **ZIP**: Multiple files bundled together

## Tracking

All downloads are tracked in Supabase with:
- Email address
- Magnet ID
- Download timestamp
- Page URL
- User agent
- IP address (for analytics, not storage)
