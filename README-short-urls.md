# 🔗 Supabase-Backed Short URL System

This document explains the new database-backed short URL system that replaces the static JSON approach.

## 🚀 Quick Start

### 1. Setup Database
```bash
npm run setup:shorturls
```

This will:
- Create the `short_urls` table in Supabase
- Migrate existing short URLs from `shortUrls.json`
- Test the database connection

### 2. Manual Table Creation (if needed)
If the automated setup fails, run this SQL in your Supabase SQL editor:

```sql
CREATE TABLE IF NOT EXISTS short_urls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_slug TEXT NOT NULL,
    short_id TEXT NOT NULL UNIQUE,
    title TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_short_urls_post_slug ON short_urls(post_slug);
CREATE INDEX IF NOT EXISTS idx_short_urls_short_id ON short_urls(short_id);
```

### 3. Deploy Netlify Function
The `netlify/functions/shorten.js` function handles redirects from `/r/{id}` to the full post URL.

## 🏗️ System Architecture

### Database Schema
```sql
short_urls table:
- id: UUID (Primary Key)
- post_slug: TEXT (Blog post slug)
- short_id: TEXT (6-character short code)
- title: TEXT (Post title)
- created_at: TIMESTAMP (Creation time)
```

### Data Flow
```
1. Blog Post Created → 2. Short URL Generated → 3. Stored in Supabase
4. Copy Link Clicked → 5. Fetch/Create Short URL → 6. Copy to Clipboard
7. Short URL Visited → 8. Netlify Function → 9. Redirect to Full Post
```

## 📁 File Structure

```
blog/
├── src/
│   ├── _data/
│   │   └── shortUrls.js          # Supabase client & functions
│   ├── assets/js/
│   │   └── short-url.js          # Frontend short URL manager
│   └── _includes/
│       └── short-url-preview.njk # Short URL page template
├── netlify/functions/
│   └── shorten.js                # Redirect handler
└── scripts/
    └── setup-short-urls-db.js    # Database setup script
```

## 🔧 Key Components

### 1. Supabase Data Layer (`src/_data/shortUrls.js`)
```javascript
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Generate unique short ID
function generateShortId() {
    // Returns 6-character alphanumeric string
}

// Get existing or create new short URL
async function getOrCreateShortURL(postSlug, postTitle) {
    // Checks database first, creates if doesn't exist
}

// Prevent duplicate short IDs
async function checkShortIdExists(shortId) {
    // Database uniqueness check
}
```

### 2. Eleventy Collections (`blog/.eleventy.js`)
```javascript
// Async collection using Supabase
eleventyConfig.addCollection('shortUrls', async function(collectionApi) {
    const { getShortUrlForPost } = require('./src/_data/shortUrls');

    for (const post of posts) {
        const shortUrlData = await getShortUrlForPost(post.data.slug);
        // Build collection with database data
    }
});
```

### 3. Frontend Manager (`src/assets/js/short-url.js`)
```javascript
class ShortURLManager {
    async copyShortURL(postSlug, postTitle, buttonElement) {
        // Get or create short URL via REST API
        // Copy to clipboard with visual feedback
    }
}
```

### 4. Netlify Function (`netlify/functions/shorten.js`)
```javascript
exports.handler = async (event, context) => {
    // Extract short ID from URL path
    // Query Supabase for destination
    // Return 302 redirect to full post URL
};
```

## 🎯 How It Works

### Short URL Generation
1. **Check Database**: Query for existing short URL by `post_slug`
2. **Return Existing**: If found, return the existing short URL
3. **Generate New**: If not found, create unique 6-character ID
4. **Prevent Duplicates**: Check database for ID uniqueness
5. **Store & Return**: Save to database and return new short URL

### Link Preview Preservation
- **Metadata Inheritance**: Short URLs inherit all metadata from destination posts
- **Identical Previews**: Same Open Graph, Twitter Card, and social media tags
- **Canonical URLs**: Point to full destination URLs, not short URLs

### Automatic Handling
- **Existing Posts**: Database queries replace static JSON lookups
- **Future Posts**: Automatic short URL generation on first copy link click
- **No Breaking Changes**: All existing templates and functionality preserved

## 🚨 Important Notes

### Environment Variables
Ensure `.env` contains:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

### Database Permissions
The Supabase anon key needs:
- `short_urls` table: SELECT, INSERT permissions
- Row Level Security (RLS) disabled or properly configured

### Migration from Static JSON
- Existing `shortUrls.json` entries are automatically migrated
- Database takes precedence over static file
- Static file becomes backup/fallback

## 🛠️ Troubleshooting

### Common Issues

**1. "Missing Supabase environment variables"**
- Check `.env` file exists and has correct values
- Verify variables are loaded in deployment environment

**2. "Short URLs not generating"**
- Check browser console for JavaScript errors
- Verify Supabase credentials and permissions
- Check network tab for failed API requests

**3. "Redirects not working"**
- Ensure Netlify function is deployed
- Check function logs in Netlify dashboard
- Verify short URL exists in database

**4. "Duplicate short IDs"**
- Database constraint should prevent this
- Check for concurrent creation attempts
- Verify unique constraint on `short_id` column

### Debug Commands
```bash
# Test database connection
node -e "require('./src/_data/shortUrls.js').testConnection()"

# Manual short URL creation
node -e "require('./src/_data/shortUrls.js').createShortUrl('test-slug', 'Test Title')"

# Check existing short URLs
node -e "console.log(require('./src/_data/shortUrls.json'))"
```

## 🔒 Security Considerations

- **API Keys**: Store securely in environment variables
- **Rate Limiting**: Consider implementing for high-traffic sites
- **Input Validation**: Validate post slugs and titles
- **Error Handling**: Don't expose database errors to users

## 📈 Performance

- **Database Indexes**: Optimized for slug and short_id lookups
- **Caching**: Netlify function responses cached for 1 hour
- **Async Operations**: Non-blocking database queries in Eleventy
- **Connection Pooling**: Supabase handles connection management

## 🔄 Migration Guide

### From Static JSON to Database
1. Run `npm run setup:shorturls` to migrate existing data
2. Deploy new Netlify function
3. Update any hardcoded short URL references
4. Test link preview functionality
5. Remove old `shortUrls.json` after verification

### Rollback (if needed)
1. Restore `shortUrls.json` from backup
2. Comment out Supabase code in `.eleventy.js`
3. Deploy previous version

## 🎉 Benefits

- ✅ **Dynamic Generation**: No manual short URL management
- ✅ **Duplicate Prevention**: Database constraints prevent conflicts
- ✅ **Automatic Scaling**: Works for unlimited posts
- ✅ **Link Preview Compatibility**: Identical previews for short and full URLs
- ✅ **Future-Proof**: No more manual JSON file maintenance
- ✅ **Performance**: Fast database queries with proper indexing

The system is now fully database-backed while maintaining complete compatibility with existing link preview functionality!
