const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Function to generate a random 8-character ID
function generateShortId() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Common headers for all responses
const commonHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

// Helper to extract meta tags from HTML
function extractMetadata(html, longUrl) {
  const metadata = {
    title: 'EvolvedLotus Blog',
    description: 'Unveiling Resources, Insights, and Creative Journeys',
    image: 'https://blog.evolvedlotus.com/assets/blog/default-og.png',
    author: 'EvolvedLotus',
    date: ''
  };

  try {
    // Generic regex to capture content attribute of meta tags
    const getMetaContent = (propName) => {
      // Matches: <meta [attributes] property/name="propName" [attributes] content="value" [attributes] >
      // This is a naive regex but better than the previous specific one.
      // We check for both 'name' and 'property'
      const regex = new RegExp(`<meta[^>]*?(?:name|property)=["']${propName}["'][^>]*?content=["'](.*?)["']`, 'i');
      const match = html.match(regex);
      // Try alternative order: content first (rare but possible)
      if (!match) {
        const altRegex = new RegExp(`<meta[^>]*?content=["'](.*?)["'][^>]*?(?:name|property)=["']${propName}["']`, 'i');
        const altMatch = html.match(altRegex);
        return altMatch ? altMatch[1] : null;
      }
      return match ? match[1] : null;
    };

    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    if (titleMatch) metadata.title = titleMatch[1];

    // Prioritize OG, then Twitter, then standard Description
    metadata.title = getMetaContent('og:title') || getMetaContent('twitter:title') || metadata.title;
    metadata.description = getMetaContent('og:description') || getMetaContent('twitter:description') || getMetaContent('description') || metadata.description;

    // Image priority
    metadata.image = getMetaContent('og:image') || getMetaContent('twitter:image') || metadata.image;

    // Capture dimensions if available
    metadata.imageWidth = getMetaContent('og:image:width');
    metadata.imageHeight = getMetaContent('og:image:height');

    // Author
    metadata.author = getMetaContent('author') || getMetaContent('article:author') || metadata.author;

    // Ensure image is absolute
    if (metadata.image && !metadata.image.startsWith('http')) {
      const baseUrl = new URL(longUrl).origin;
      metadata.image = baseUrl + (metadata.image.startsWith('/') ? '' : '/') + metadata.image;
    }
  } catch (e) {
    console.error('Error extracting metadata:', e);
  }

  return metadata;
}

// Analytics tracking
async function trackAccess(shortId, event) {
  try {
    const referrer = event.headers['referer'] || event.headers['referrer'] || 'direct';
    const userAgent = event.headers['user-agent'] || '';
    const isBot = /bot|crawler|spider|slurp|google|bing|yandex|baidu|duckduck|twitter|facebook|whatsapp|telegram/i.test(userAgent);

    await supabase.from('short_url_stats').insert([{
      short_id: shortId,
      referrer,
      user_agent: userAgent,
      is_bot: isBot,
      accessed_at: new Date().toISOString()
    }]);
  } catch (e) {
    console.warn('Analytics logging failed:', e.message);
  }
}

exports.handler = async (event, context) => {
  // Handle OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: commonHeaders,
      body: ''
    };
  }

  // Handle POST requests (creating new short URLs)
  if (event.httpMethod === 'POST') {
    try {
      let body;
      try {
        body = JSON.parse(event.body);
      } catch (e) {
        return {
          statusCode: 400,
          headers: { ...commonHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Invalid JSON' })
        };
      }

      const { long_url, title, description, image } = body;

      if (!long_url) {
        return {
          statusCode: 400,
          headers: { ...commonHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Missing long_url' })
        };
      }

      // Check if URL already exists
      const { data: existingUrl } = await supabase
        .from('short_urls')
        .select('id')
        .eq('long_url', long_url)
        .single();

      if (existingUrl) {
        return {
          statusCode: 200,
          headers: { ...commonHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: existingUrl.id })
        };
      }

      const shortId = generateShortId();
      const { error: insertError } = await supabase
        .from('short_urls')
        .insert([{
          id: shortId,
          long_url: long_url,
          title: title || '',
          description: description || '',
          image: image || '',
          created_at: new Date().toISOString()
        }]);

      if (insertError) throw insertError;

      return {
        statusCode: 200,
        headers: { ...commonHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: shortId })
      };
    } catch (error) {
      return {
        statusCode: 500,
        headers: { ...commonHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: error.message })
      };
    }
  }

  // Handle GET requests (redirects with meta tags)
  if (event.httpMethod === 'GET') {
    const matches = event.path.match(/\/r\/([^\/]+)/);
    const id = matches ? matches[1] : null;

    if (!id) {
      return {
        statusCode: 404,
        headers: { ...commonHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Not Found' })
      };
    }

    try {
      const { data, error } = await supabase
        .from('short_urls')
        .select('*')
        .eq('id', id)
        .single();

      if (!data || error) {
        return {
          statusCode: 404,
          headers: { ...commonHeaders, 'Content-Type': 'text/html' },
          body: 'Not Found'
        };
      }

      // Track analytics (fire and forget)
      trackAccess(id, event);

      let metadata = {
        title: data.title,
        description: data.description,
        image: data.image
      };

      // If metadata is missing in DB, fetch from target URL
      if (!metadata.title || !metadata.image) {
        try {
          const response = await fetch(data.long_url);
          const html = await response.text();
          const fetchedMeta = extractMetadata(html, data.long_url);

          // Only overwrite if DB value is missing/empty
          metadata.title = metadata.title || fetchedMeta.title;
          metadata.description = metadata.description || fetchedMeta.description;
          metadata.image = metadata.image || fetchedMeta.image;
          metadata.imageWidth = metadata.imageWidth || fetchedMeta.imageWidth;
          metadata.imageHeight = metadata.imageHeight || fetchedMeta.imageHeight;
          metadata.author = metadata.author || fetchedMeta.author;

          // Update DB with fetched metadata for next time
          // Note: You must add 'image_width' and 'image_height' columns to your Supabase table for this to persist
          await supabase.from('short_urls').update({
            title: metadata.title,
            description: metadata.description,
            image: metadata.image
            // image_width: metadata.imageWidth,
            // image_height: metadata.imageHeight
          }).eq('id', id);
        } catch (fetchErr) {
          console.error('Metadata fetch failed:', fetchErr);
        }
      }

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${metadata.title || 'EvolvedLotus Blog'}</title>
    
    <!-- Meta Tags for Social Media Previews -->
    <!-- Meta Tags for Social Media Previews -->
    <meta name="description" content="${metadata.description ? metadata.description.substring(0, 160) + (metadata.description.length > 160 ? '...' : '') : ''}">
    
    <!-- Open Graph -->
    <meta property="og:title" content="${metadata.title || ''}">
    <meta property="og:description" content="${metadata.description ? metadata.description.substring(0, 160) + (metadata.description.length > 160 ? '...' : '') : ''}">
    <meta property="og:image" content="${metadata.image || ''}">
    ${metadata.image && metadata.image.startsWith('https') ? `<meta property="og:image:secure_url" content="${metadata.image}">` : ''}
    ${metadata.imageWidth ? `<meta property="og:image:width" content="${metadata.imageWidth}">` : ''}
    ${metadata.imageHeight ? `<meta property="og:image:height" content="${metadata.imageHeight}">` : ''}
    <meta property="og:image:alt" content="${metadata.title || ''}">
    <meta property="og:url" content="https://blog.evolvedlotus.com/r/${id}">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="EvolvedLotus Blog">

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="@evolvedlotus">
    <meta name="twitter:domain" content="blog.evolvedlotus.com">
    <meta name="twitter:creator" content="@evolvedlotus">
    <meta name="twitter:title" content="${metadata.title || ''}">
    <meta name="twitter:description" content="${metadata.description ? metadata.description.substring(0, 160) + (metadata.description.length > 160 ? '...' : '') : ''}">
    <meta name="twitter:image" content="${metadata.image || ''}">
    <meta name="twitter:image:alt" content="${metadata.title || ''}">

    <!-- Redirect Logic -->
    <meta http-equiv="refresh" content="0;url=${data.long_url}">
    <script>
        window.location.href = "${data.long_url}";
    </script>
    
    <style>
        body { font-family: -apple-system, system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f9fafb; color: #374151; }
        .container { text-align: center; padding: 2rem; }
        .spinner { border: 4px solid #f3f3f3; border-top: 4px solid #3b82f6; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 1rem; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        a { color: #3b82f6; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <div class="spinner"></div>
        <p>Redirecting you to <a href="${data.long_url}">${metadata.title || 'the article'}</a>...</p>
        <p style="font-size: 0.8rem; color: #6b7280; margin-top: 2rem;">If you are not redirected, <a href="${data.long_url}">click here</a>.</p>
    </div>
</body>
</html>`;

      return {
        statusCode: 200,
        headers: {
          ...commonHeaders,
          'Content-Type': 'text/html',
          'Cache-Control': 'public, max-age=3600'
        },
        body: html
      };
    } catch (error) {
      return {
        statusCode: 500,
        headers: { ...commonHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: error.message })
      };
    }
  }

  return {
    statusCode: 405,
    headers: commonHeaders,
    body: JSON.stringify({ error: 'Method Not Allowed' })
  };
};