const { createClient } = require('@supabase/supabase-js');

// In-memory rate limiting store (for serverless, consider using Supabase or Redis in production)
const rateLimitStore = new Map();

// Rate limiting configuration
const RATE_LIMIT = {
  MAX_REQUESTS: 10, // Maximum requests per time window
  TIME_WINDOW: 60 * 60 * 1000, // 1 hour in milliseconds
  CLEANUP_INTERVAL: 5 * 60 * 1000 // Clean up old entries every 5 minutes
};

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now - data.resetTime > RATE_LIMIT.TIME_WINDOW) {
      rateLimitStore.delete(key);
    }
  }
}, RATE_LIMIT.CLEANUP_INTERVAL);

// Rate limiting function
function checkRateLimit(identifier) {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now
    });
    return { allowed: true, remaining: RATE_LIMIT.MAX_REQUESTS - 1 };
  }

  // Reset if time window has passed
  if (now - record.resetTime > RATE_LIMIT.TIME_WINDOW) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now
    });
    return { allowed: true, remaining: RATE_LIMIT.MAX_REQUESTS - 1 };
  }

  // Check if limit exceeded
  if (record.count >= RATE_LIMIT.MAX_REQUESTS) {
    const resetIn = Math.ceil((RATE_LIMIT.TIME_WINDOW - (now - record.resetTime)) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetIn
    };
  }

  // Increment count
  record.count++;
  return {
    allowed: true,
    remaining: RATE_LIMIT.MAX_REQUESTS - record.count
  };
}

// Detect suspicious patterns
function isSuspiciousRequest(body, headers) {
  try {
    const data = JSON.parse(body);

    // Check for very short or suspicious URLs
    if (data.long_url && data.long_url.length < 10) {
      return true;
    }

    // Check for common spam patterns
    const spamPatterns = [
      /viagra/i,
      /casino/i,
      /lottery/i,
      /click.*here/i,
      /free.*money/i
    ];

    const urlToCheck = data.long_url || '';
    if (spamPatterns.some(pattern => pattern.test(urlToCheck))) {
      return true;
    }

    // Check user agent for bot patterns
    const userAgent = headers['user-agent'] || '';
    const botPatterns = /bot|crawler|spider|scraper/i;
    if (botPatterns.test(userAgent) && !userAgent.includes('Google')) {
      return true;
    }

    return false;
  } catch (e) {
    return false;
  }
}

exports.handler = async (event, context) => {
  const { httpMethod, path, body, headers } = event;

  // Initialize Supabase
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  // Handle POST - Create short URL
  if (httpMethod === 'POST') {
    try {
      // Get client IP for rate limiting
      const clientIP = headers['x-forwarded-for']?.split(',')[0] ||
        headers['x-real-ip'] ||
        'unknown';

      // Check rate limit
      const rateLimitResult = checkRateLimit(clientIP);
      if (!rateLimitResult.allowed) {
        return {
          statusCode: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': rateLimitResult.resetIn.toString(),
            'X-RateLimit-Limit': RATE_LIMIT.MAX_REQUESTS.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetIn.toString()
          },
          body: JSON.stringify({
            error: 'Rate limit exceeded',
            message: `Too many requests. Please try again in ${rateLimitResult.resetIn} seconds.`,
            retryAfter: rateLimitResult.resetIn
          })
        };
      }

      // Check for suspicious activity
      if (isSuspiciousRequest(body, headers)) {
        console.warn('Suspicious request detected from IP:', clientIP);
        return {
          statusCode: 403,
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            error: 'Request rejected',
            message: 'This request has been flagged as suspicious.'
          })
        };
      }

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
