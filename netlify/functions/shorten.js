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
        .eq('url', long_url)
        .single();

      if (existingUrl) {
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: 'URL already shortened',
            shortUrl: `${process.env.URL}/r/${existingUrl.slug}`,
            id: existingUrl.slug
          })
        };
      }

      // Check if slug already exists
      if (slug) {
        const { data: existing } = await supabase
          .from('short_urls')
          .select('*')
          .eq('slug', slug)
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
            slug: finalSlug,
            url: long_url,
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

  // Handle GET - Redirect with meta tags for link previews
  if (httpMethod === 'GET') {
    try {
      // Extract slug from path (e.g., /r/abc123 -> abc123)
      const slug = path.split('/').pop();

      if (!slug) {
        return {
          statusCode: 404,
          headers: { 'Content-Type': 'text/html' },
          body: '<h1>Short URL not found</h1>'
        };
      }

      // Fetch short URL from Supabase
      const { data, error } = await supabase
        .from('short_urls')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error || !data) {
        return {
          statusCode: 404,
          headers: { 'Content-Type': 'text/html' },
          body: '<h1>Short URL not found</h1>'
        };
      }

      const destinationUrl = data.url;
      const title = data.title || 'EvolvedLotus Blog';
      const description = data.description || 'Content creation and social media marketing advice';
      const image = data.image || `${process.env.URL}/assets/images/default-og.jpg`;

      // CRITICAL: Return HTML with meta tags for social media scrapers
      // This allows link previews to work on Twitter, Facebook, LinkedIn
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'public, max-age=3600'
        },
        body: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <!-- Open Graph / Facebook / LinkedIn -->
  <meta property="og:url" content="${process.env.URL}/r/${slug}">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${escapeHtml(image)}">

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${process.env.URL}/r/${slug}">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(image)}">

  <!-- Canonical -->
  <link rel="canonical" href="${escapeHtml(destinationUrl)}">

  <!-- Instant redirect for browsers (after scrapers read meta tags) -->
  <meta http-equiv="refresh" content="0;url=${escapeHtml(destinationUrl)}">
  <script>window.location.href = "${escapeHtml(destinationUrl)}";</script>

  <title>Redirecting...</title>
</head>
<body>
  <p>Redirecting to <a href="${escapeHtml(destinationUrl)}">${escapeHtml(destinationUrl)}</a>...</p>
</body>
</html>`
      };

    } catch (error) {
      console.error('GET error:', error);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'text/html' },
        body: `<h1>Error: ${error.message}</h1>`
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
