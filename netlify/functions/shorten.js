const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
console.log('Initializing Supabase client with URL:', process.env.SUPABASE_URL);
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
    console.log('Processing GET request');
    
    // Try to get ID from multiple possible sources
    let id = null;
    
    // Check query parameters
    if (event.queryStringParameters && event.queryStringParameters.id) {
      id = event.queryStringParameters.id;
    }
    // Check path parameters
    else if (event.path) {
      // Extract ID from path (e.g., /r/abc123 -> abc123)
      const matches = event.path.match(/\/r\/([^\/]+)/);
      if (matches && matches[1]) {
        id = matches[1];
      }
    }
    
    console.log('Extracted ID:', id);
    
    if (!id) {
      console.log('No ID found in request');
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Missing ID parameter',
          params: event.queryStringParameters || {},
          path: event.path,
          event: {
            path: event.path,
            httpMethod: event.httpMethod,
            queryStringParameters: event.queryStringParameters
          }
        })
      };
    }

    console.log('Looking up URL for ID:', id);
    
    try {
      // Get the URL from Supabase
      const { data, error } = await supabase
        .from('short_urls')
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

      console.log('Found URL:', data.long_url);
      console.log('Redirecting to:', data.long_url);
      
      return {
        statusCode: 301,
        headers: {
          'Location': data.long_url,
          'Cache-Control': 'no-cache'
        },
        body: ''
      };
    } catch (error) {
      console.error('Error handling redirect:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Internal server error' })
      };
    }
  }

  // Handle POST requests (creating new short URLs)
  if (event.httpMethod === 'POST') {
    try {
      console.log('Received POST request');
      const { long_url } = JSON.parse(event.body);
      
      if (!long_url) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Missing long_url parameter' })
        };
      }

      console.log('Checking if URL exists:', long_url);
      
      // Check if URL already exists
      const { data: existingUrl, error: existingError } = await supabase
        .from('short_urls')
        .select('id')
        .eq('long_url', long_url)
        .single();
      
      if (existingError && existingError.code !== 'PGRST116') {
        console.error('Error checking existing URL:', existingError);
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Error checking existing URL: ' + existingError.message })
        };
      }
      
      if (existingUrl) {
        console.log('URL already exists:', existingUrl);
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
      console.log('Generated short ID:', shortId);
      
      // Store the URL in Supabase
      console.log('Inserting new URL into database');
      const { data: insertData, error: insertError } = await supabase
        .from('short_urls')
        .insert([
          { 
            id: shortId, 
            long_url: long_url,
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();
      
      if (insertError) {
        console.error('Error inserting URL:', insertError);
        return {
          statusCode: 500,
          body: JSON.stringify({ 
            error: 'Error inserting URL into database: ' + insertError.message,
            details: insertError
          })
        };
      }
      
      console.log('Successfully inserted:', insertData);
      const shortUrl = `https://blog.evolvedlotus.com/r/${shortId}`;
      
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
        statusCode: 500,
        body: JSON.stringify({ 
          error: error.message || 'Internal server error',
          details: error
        })
      };
    }
  }

  return {
    statusCode: 405,
    body: JSON.stringify({ error: 'Method not allowed' })
  };
};
