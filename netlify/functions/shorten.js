const { createClient } = require('@supabase/supabase-js');

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
      .from('ShortUrl')
      .select('long_url')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching URL:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Error fetching URL: ' + error.message })
      };
    }
    
    if (!data) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'URL not found' })
      };
    }

    return {
      statusCode: 302,
      headers: {
        Location: data.long_url
      },
      body: ''
    };
  }

  // Handle POST requests (creating new short URLs)
  if (event.httpMethod === 'POST') {
    try {
      const { long_url } = JSON.parse(event.body);
      
      if (!long_url) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Missing long_url parameter' })
        };
      }

      // Check if URL already exists
      const { data: existingUrl } = await supabase
        .from('ShortUrl')
        .select('id')
        .eq('long_url', long_url)
        .single();
      
      if (existingUrl) {
        const shortUrl = `https://blog.evolvedlotus.com/r/${existingUrl.id}`;
        return {
          statusCode: 200,
          body: JSON.stringify({ 
            message: 'URL already shortened',
            shortUrl: shortUrl
          })
        };
      }
      
      // Generate a unique short ID
      const shortId = generateShortId();
      
      // Store the URL in Supabase
      const { error: insertError } = await supabase
        .from('ShortUrl')
        .insert([
          { 
            id: shortId, 
            long_url: long_url,
            created_at: new Date().toISOString()
          }
        ]);
      
      if (insertError) {
        console.error('Error inserting URL:', insertError);
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Error inserting URL into database: ' + insertError.message })
        };
      }
      
      const shortUrl = `https://blog.evolvedlotus.com/r/${shortId}`;
      
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          message: 'URL shortened successfully',
          shortUrl: shortUrl
        })
      };
    } catch (error) {
      console.error('Error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message || 'Internal server error' })
      };
    }
  }

  return {
    statusCode: 405,
    body: JSON.stringify({ error: 'Method not allowed' })
  };
};
