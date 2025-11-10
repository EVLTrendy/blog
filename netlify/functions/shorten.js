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

      // Construct OG image path
      const ogImagePath = urlData.image
        ? urlData.image
        : '/assets/blog/default-og.png';

      const ogImageUrl = `https://blog.evolvedlotus.com${ogImagePath}`;

      const safeTitle = (urlData.title || 'EvolvedLotus Blog').replace(/"/g, '"');
      const safeDescription = (urlData.description || 'Read more on EvolvedLotus Blog').replace(/"/g, '"');

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDescription}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${fullUrl}">
  <meta property="og:title" content="${safeTitle}">
  <meta property="og:description" content="${safeDescription}">
  <meta property="og:image" content="${ogImageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${safeTitle}">
  <meta name="twitter:description" content="${safeDescription}">
  <meta name="twitter:image" content="${ogImageUrl}">
  <meta http-equiv="refresh" content="0;url=${fullUrl}">
</head>
<body>
  <p>Redirecting to ${safeTitle}...</p>
</body>
</html>`;

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8'
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
