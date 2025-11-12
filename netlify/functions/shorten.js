const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  const { httpMethod, path, body } = event;

  // Initialize Supabase
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  // Handle POST - Create short URL
  if (httpMethod === 'POST') {
    try {
      console.log('Received body:', body);
      const { long_url, slug, title, description, image } = JSON.parse(body);

      // Validate inputs
      if (!long_url) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Missing long_url parameter' })
        };
      }

      // Check if URL already exists
      const { data: existingUrl } = await supabase
        .from('short_urls')
        .select('*')
        .eq('long_url', long_url)
        .single();

      if (existingUrl) {
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: 'URL already shortened',
            shortUrl: `${process.env.URL}/r/${existingUrl.id}`,
            id: existingUrl.id
          })
        };
      }

      // Check if slug already exists
      if (slug) {
        const { data: existing } = await supabase
          .from('short_urls')
          .select('*')
          .eq('id', slug)
          .single();

        if (existing) {
          return {
            statusCode: 409,
            body: JSON.stringify({ error: 'Slug already exists' })
          };
        }
      }

      // Generate slug if not provided
      const finalSlug = slug || generateSlug();

      // Insert into Supabase with metadata for link previews
      const { data, error } = await supabase
        .from('short_urls')
        .insert([
          {
            id: finalSlug,
            long_url: long_url,
            title: title || null,
            description: description || null,
            image: image || null,
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (error) throw error;

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slug: finalSlug,
          shortUrl: `${process.env.URL}/r/${finalSlug}`
        })
      };

    } catch (error) {
      console.error('POST error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message })
      };
    }
  }

  // In the GET handler
  if (event.httpMethod === 'GET') {
    const shortId = event.path.split('/').pop();
    const userAgent = event.headers['user-agent'] || event.headers['User-Agent'] || '';

    // Check if request is from a social media crawler
    const isCrawler = isSocialMediaCrawler(userAgent);

    try {
      const { data: urlData, error } = await supabase
        .from('short_urls')
        .select('id, long_url, title, description, image')
        .eq('id', shortId)
        .single();

      if (error || !urlData) {
        return {
          statusCode: 404,
          body: 'Short URL not found'
        };
      }

      const fullUrl = urlData.long_url;

      // If not a crawler, perform 301 redirect
      if (!isCrawler) {
        return {
          statusCode: 301,
          headers: {
            'Location': fullUrl,
            'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
          },
          body: ''
        };
      }

      // For crawlers, serve HTML with meta tags
      const ogImagePath = urlData.image
        ? urlData.image
        : '/assets/blog/default-og.png';

      // Ensure absolute URL for image
      const ogImageUrl = ogImagePath.startsWith('http')
        ? ogImagePath
        : `https://blog.evolvedlotus.com${ogImagePath}`;

      const safeTitle = (urlData.title || 'EvolvedLotus Blog').replace(/"/g, '"');
      const safeDescription = (urlData.description || 'Read more on EvolvedLotus Blog').replace(/"/g, '"');

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDescription}">

  <!-- Canonical URL to prevent duplicate content issues -->
  <link rel="canonical" href="${fullUrl}" />

  <!-- Open Graph Meta Tags -->
  <meta property="og:type" content="article">
  <meta property="og:url" content="${fullUrl}">
  <meta property="og:title" content="${safeTitle}">
  <meta property="og:description" content="${safeDescription}">
  <meta property="og:image" content="${ogImageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${safeTitle}">
  <meta property="og:site_name" content="EvolvedLotus Blog">

  <!-- Twitter Card Meta Tags -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${safeTitle}">
  <meta name="twitter:description" content="${safeDescription}">
  <meta name="twitter:image" content="${ogImageUrl}">
  <meta name="twitter:image:width" content="1200">
  <meta name="twitter:image:height" content="630">
  <meta name="twitter:image:alt" content="${safeTitle}">

  <!-- Additional social media platforms -->
  <meta property="og:image:secure_url" content="${ogImageUrl}">

  <!-- Prevent indexing of short URLs -->
  <meta name="robots" content="noindex, follow">

  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      text-align: center;
      padding: 50px;
      background: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 { color: #333; margin-bottom: 20px; }
    p { color: #666; margin-bottom: 30px; }
    .redirect-notice { font-size: 14px; color: #999; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${safeTitle}</h1>
    <p>${safeDescription}</p>
    <p class="redirect-notice">If you are not redirected automatically, <a href="${fullUrl}">click here</a>.</p>
  </div>

  <!-- Fallback redirect for crawlers that don't respect meta tags -->
  <script>
    setTimeout(function() {
      window.location.href = "${fullUrl}";
    }, 1000);
  </script>
</body>
</html>`;

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
        },
        body: html
      };

    } catch (error) {
      console.error('Error fetching short URL:', error);
      return {
        statusCode: 500,
        body: 'Internal server error'
      };
    }
  }

  return {
    statusCode: 405,
    body: 'Method not allowed'
  };
};

// Helper function to generate random slug
function generateSlug() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let slug = '';
  for (let i = 0; i < 6; i++) {
    slug += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return slug;
}

// Helper function to detect social media crawlers
function isSocialMediaCrawler(userAgent) {
  const crawlers = [
    'facebookexternalhit',
    'Twitterbot',
    'LinkedInBot',
    'WhatsApp',
    'TelegramBot',
    'Slackbot',
    'Discordbot',
    'facebookcatalog',
    'Facebot',
    'Instagram',
    'Pinterest',
    'redditbot',
    'Snapchat',
    'TikTok',
    'vkShare',
    'weibo'
  ];

  const lowerUserAgent = userAgent.toLowerCase();
  return crawlers.some(crawler => lowerUserAgent.includes(crawler.toLowerCase()));
}

// Helper function to escape HTML entities
function escapeHtml(text) {
  return text
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#039;');
}
