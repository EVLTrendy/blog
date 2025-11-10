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

      // Extract post_slug from long_url (assuming format: https://blog.evolvedlotus.com/blog/{post_slug}/)
      const postSlug = long_url.split('/blog/')[1]?.replace('/', '') || '';

      // Check if URL already exists
      const { data: existingUrl } = await supabase
        .from('short_urls')
        .select('*')
        .eq('post_slug', postSlug)
        .single();

      if (existingUrl) {
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: 'URL already shortened',
            shortUrl: `${process.env.URL}/r/${existingUrl.short_id}`,
            id: existingUrl.short_id
          })
        };
      }

      // Check if slug already exists
      if (slug) {
        const { data: existing } = await supabase
          .from('short_urls')
          .select('*')
          .eq('short_id', slug)
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
            short_id: finalSlug,
            post_slug: postSlug,
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

  // In the GET handler (around line 50-120)
  if (event.httpMethod === 'GET') {
    const shortId = event.path.split('/').pop();
    
    try {
      const { data: urlData, error } = await supabase
        .from('short_urls')
        .select('post_slug, title, description, image')
        .eq('short_id', shortId)
        .single();

      if (error || !urlData) {
        return {
          statusCode: 404,
          body: 'Short URL not found'
        };
      }

      const fullUrl = `https://blog.evolvedlotus.com/blog/${urlData.post_slug}/`;
      
      // Construct OG image path
      const ogImagePath = urlData.image 
        ? urlData.image.replace('/assets/blog/', '/assets/og/')
        : '/assets/og/default-og.png';
      
      const ogImageUrl = `https://blog.evolvedlotus.com${ogImagePath}`;
      
      // Escape HTML entities for meta tags
      const escapeHtml = (text) => {
        if (!text) return '';
        return String(text)
          .replace(/&/g, '&')
          .replace(/</g, '<')
          .replace(/>/g, '>')
          .replace(/"/g, '"')
          .replace(/'/g, '&#039;');
      };
      
      const safeTitle = escapeHtml(urlData.title || 'EvolvedLotus Blog');
      const safeDescription = escapeHtml(urlData.description || 'Read more on EvolvedLotus Blog');

      // HTML response with proper meta tags for crawlers
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- Basic Meta Tags -->
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDescription}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="article">
  <meta property="og:url" content="${fullUrl}">
  <meta property="og:title" content="${safeTitle}">
  <meta property="og:description" content="${safeDescription}">
  <meta property="og:image" content="${ogImageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:type" content="image/png">
  <meta property="og:site_name" content="EvolvedLotus Blog">
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${fullUrl}">
  <meta name="twitter:title" content="${safeTitle}">
  <meta name="twitter:description" content="${safeDescription}">
  <meta name="twitter:image" content="${ogImageUrl}">
  
  <!-- Discord-specific -->
  <meta property="og:image:alt" content="${safeTitle}">
  
  <!-- Canonical URL -->
  <link rel="canonical" href="${fullUrl}">
  
  <!-- JavaScript redirect for browsers -->
  <script>
    if (!/bot|crawler|spider|crawling|facebookexternalhit|twitterbot|discordbot/i.test(navigator.userAgent)) {
      setTimeout(function() {
        window.location.href = '${fullUrl}';
      }, 500);
    }
  </script>
  
  <!-- Fallback meta refresh -->
  <noscript>
    <meta http-equiv="refresh" content="1;url=${fullUrl}">
  </noscript>
</head>
<body>
  <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 100px auto; padding: 20px; text-align: center;">
    <h1 style="color: #333; font-size: 24px; margin-bottom: 20px;">${safeTitle}</h1>
    <p style="color: #666; margin-bottom: 30px;">${safeDescription}</p>
    <p style="color: #999;">Redirecting to article...</p>
    <a href="${fullUrl}" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 5px;">
      Click here if not redirected
    </a>
  </div>
</body>
</html>`;

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=3600',
          'X-Robots-Tag': 'noindex, follow'
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

// Helper function to escape HTML entities
function escapeHtml(text) {
  return text
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#039;');
}
