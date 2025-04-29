const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
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

exports.handler = async (event, context) => {
  console.log('Function called with event:', JSON.stringify(event));
  
  // Handle GET requests (redirects)
  if (event.httpMethod === 'GET') {
    const { id } = event.queryStringParameters;
    
    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing ID parameter' })
      };
    }

    // Get the URL from Supabase
    const { data, error } = await supabase
      .from('short_urls')
      .select('url')
      .eq('short_id', id)
      .single();
    
    if (error || !data) {
      console.error('Error fetching URL:', error);
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'URL not found' })
      };
    }

    return {
      statusCode: 302,
      headers: {
        Location: data.url
      },
      body: ''
    };
  }

  // Handle POST requests (creating new short URLs)
  if (event.httpMethod === 'POST') {
    try {
      console.log('Request body:', event.body);
      const body = JSON.parse(event.body);
      const { url } = body;
      
      if (!url) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Missing URL parameter' })
        };
      }
      
      // Check if URL already exists
      const { data: existingUrl } = await supabase
        .from('short_urls')
        .select('short_id')
        .eq('url', url)
        .single();
      
      if (existingUrl) {
        console.log('URL already exists:', existingUrl);
        return {
          statusCode: 200,
          body: JSON.stringify({ 
            message: 'URL already shortened',
            shortUrl: `https://blog.evolvedlotus.com/r/${existingUrl.short_id}`
          })
        };
      }
      
      // Generate a unique short ID
      let shortId;
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 5;
      
      while (!isUnique && attempts < maxAttempts) {
        shortId = generateShortId();
        const { data } = await supabase
          .from('short_urls')
          .select('short_id')
          .eq('short_id', shortId)
          .single();
        
        if (!data) {
          isUnique = true;
        }
        attempts++;
      }
      
      if (!isUnique) {
        throw new Error('Failed to generate unique short ID');
      }
      
      // Store the URL in Supabase
      const { error: insertError } = await supabase
        .from('short_urls')
        .insert([
          { short_id: shortId, url: url }
        ]);
      
      if (insertError) {
        console.error('Error inserting URL:', insertError);
        throw insertError;
      }
      
      const shortUrl = `https://blog.evolvedlotus.com/r/${shortId}`;
      console.log('Successfully created short URL:', shortUrl);
      
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          message: 'URL shortened successfully',
          shortUrl: shortUrl
        })
      };
    } catch (error) {
      console.error('Error in POST handler:', error);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: error.message || 'Invalid request' })
      };
    }
  }

  return {
    statusCode: 405,
    body: JSON.stringify({ error: 'Method not allowed' })
  };
}; 