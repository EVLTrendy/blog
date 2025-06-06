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

// Common headers for all responses
const commonHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

exports.handler = async (event, context) => {
  // Handle OPTIONS request (CORS preflight)
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
      console.log('Received POST request');
      console.log('Request body:', event.body);
      
      let body;
      try {
        body = JSON.parse(event.body);
      } catch (e) {
        console.error('Error parsing request body:', e);
        return {
          statusCode: 400,
          headers: {
            ...commonHeaders,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'Invalid JSON in request body' })
        };
      }
      
      const { long_url } = body;
      
      if (!long_url) {
        return {
          statusCode: 400,
          headers: {
            ...commonHeaders,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'Missing long_url parameter' })
        };
      }

      console.log('Processing URL:', long_url);
      
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
          headers: {
            ...commonHeaders,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'Error checking existing URL: ' + existingError.message })
        };
      }
      
      if (existingUrl) {
        console.log('URL already exists:', existingUrl);
        return {
          statusCode: 200,
          headers: {
            ...commonHeaders,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            message: 'URL already shortened',
            id: existingUrl.id
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
          headers: {
            ...commonHeaders,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            error: 'Error inserting URL into database: ' + insertError.message,
            details: insertError
          })
        };
      }
      
      console.log('Successfully inserted:', insertData);
      
      return {
        statusCode: 200,
        headers: {
          ...commonHeaders,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          message: 'URL shortened successfully',
          id: shortId
        })
      };
    } catch (error) {
      console.error('Error in POST handler:', error);
      return {
        statusCode: 500,
        headers: {
          ...commonHeaders,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: error.message || 'Internal server error',
          details: error
        })
      };
    }
  }

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
          ...commonHeaders,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Missing ID parameter',
          params: event.queryStringParameters || {},
          path: event.path
        })
      };
    }

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
          headers: {
            ...commonHeaders,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'Error fetching URL: ' + error.message })
        };
      }
      
      if (!data) {
        return {
          statusCode: 404,
          headers: {
            ...commonHeaders,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'URL not found' })
        };
      }

      console.log('Found URL:', data.long_url);
      
      // Redirect to the long URL
      return {
        statusCode: 301,
        headers: {
          ...commonHeaders,
          'Location': data.long_url,
          'Cache-Control': 'no-cache'
        },
        body: ''
      };
    } catch (error) {
      console.error('Error handling redirect:', error);
      return {
        statusCode: 500,
        headers: {
          ...commonHeaders,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Internal server error' })
      };
    }
  }

  return {
    statusCode: 405,
    headers: {
      ...commonHeaders,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ error: 'Method not allowed' })
  };
}; 