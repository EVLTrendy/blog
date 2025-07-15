const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
// Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in Netlify Environment Variables
// SUPABASE_SERVICE_ROLE_KEY should be kept secret and NOT exposed to the client-side.
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

// Common headers for all responses (especially for POST/OPTIONS, less critical for 301 GET)
const commonHeaders = {
  'Access-Control-Allow-Origin': '*', // Adjust if you want to restrict CORS
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

exports.handler = async (event, context) => {
  // Handle OPTIONS request (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    console.log('Received OPTIONS request (CORS preflight)');
    return {
      statusCode: 204, // No Content for successful preflight
      headers: commonHeaders,
      body: ''
    };
  }

  // Handle POST requests (creating new short URLs)
  if (event.httpMethod === 'POST') {
    try {
      console.log('Received POST request to create short URL');
      
      let body;
      try {
        body = JSON.parse(event.body);
      } catch (e) {
        console.error('Error parsing request body (POST):', e);
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
        console.warn('Missing long_url parameter in POST request');
        return {
          statusCode: 400,
          headers: {
            ...commonHeaders,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'Missing long_url parameter' })
        };
      }

      console.log(`Attempting to shorten URL: ${long_url}`);
      
      // Check if URL already exists
      const { data: existingUrl, error: existingError } = await supabase
        .from('short_urls')
        .select('id')
        .eq('long_url', long_url)
        .single();
      
      if (existingError && existingError.code !== 'PGRST116') { // PGRST116 is "No rows found"
        console.error('Supabase error checking existing URL:', existingError);
        return {
          statusCode: 500,
          headers: {
            ...commonHeaders,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'Database error checking existing URL: ' + existingError.message })
        };
      }
      
      if (existingUrl) {
        console.log(`URL already exists, returning existing ID: ${existingUrl.id}`);
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
      let shortId = generateShortId();
      let unique = false;
      let retries = 0;
      const MAX_RETRIES = 5; // Prevent infinite loops
      
      // Ensure the generated ID is unique (though collisions are rare for 8 chars)
      while (!unique && retries < MAX_RETRIES) {
          const { data: existingShort, error: checkError } = await supabase
              .from('short_urls')
              .select('id')
              .eq('id', shortId)
              .single();

          if (checkError && checkError.code !== 'PGRST116') {
              console.error('Error checking short ID uniqueness:', checkError);
              throw new Error('Failed to check ID uniqueness'); // Throw to outer catch
          }

          if (!existingShort) {
              unique = true;
          } else {
              shortId = generateShortId();
              retries++;
              console.log(`Collision detected, retrying with new ID: ${shortId}`);
          }
      }

      if (!unique) {
          console.error('Failed to generate a unique short ID after multiple retries.');
          return {
              statusCode: 500,
              headers: { ...commonHeaders, 'Content-Type': 'application/json' },
              body: JSON.stringify({ error: 'Failed to generate a unique short ID.' })
          };
      }

      console.log('Generated unique short ID:', shortId);
      
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
        .select() // .select() is good to confirm insertion
        .single(); // .single() to get the inserted row

      if (insertError) {
        console.error('Supabase error inserting URL:', insertError);
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
      
      console.log('Successfully inserted new short URL:', insertData);
      
      return {
        statusCode: 200,
        headers: {
          ...commonHeaders,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          message: 'URL shortened successfully',
          id: shortId // Return the actual short ID
        })
      };
    } catch (error) {
      console.error('Unhandled error in POST handler:', error);
      return {
        statusCode: 500,
        headers: {
          ...commonHeaders,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: error.message || 'Internal server error during URL shortening',
          details: error.stack // Include stack for debugging
        })
      };
    }
  }

  // Handle GET requests (redirects)
  if (event.httpMethod === 'GET') {
    console.log('Received GET request for short URL redirection');
    
    // Extract ID from path (e.g., /r/abc123 -> abc123)
    const matches = event.path.match(/\/r\/([^\/]+)/);
    let id = null;
    if (matches && matches[1]) {
      id = matches[1];
    }
    
    // Optional: If you also support /shorten?id=xyz, uncomment this.
    // However, for /r/XYZ, the path matching is more direct.
    // if (event.queryStringParameters && event.queryStringParameters.id) {
    //   id = event.queryStringParameters.id;
    // }
    
    console.log('Extracted ID for GET request:', id);
    
    if (!id) {
      console.warn('No ID found in GET request path. Returning 404.');
      return {
        statusCode: 404, // Use 404 if no ID is provided, not 400.
        headers: {
          ...commonHeaders,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Short URL ID not provided in path (e.g., /r/your-id)',
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
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found"
        console.error(`Supabase error fetching URL for ID '${id}':`, error);
        return {
          statusCode: 500,
          headers: {
            ...commonHeaders,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'Database error fetching URL: ' + error.message })
        };
      }
      
      if (!data) {
        console.warn(`Short URL with ID '${id}' not found in database.`);
        return {
          statusCode: 404, // Use 404 if ID is not found in database
          headers: {
            ...commonHeaders,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: `Short URL '${id}' not found.` })
        };
      }

      console.log(`Found URL for ID '${id}': ${data.long_url}. Redirecting...`);
      
      // Perform the server-side 301 redirect
      return {
        statusCode: 301, // Permanent Redirect - Crucial for AdSense & SEO
        headers: {
          // CORS headers are less relevant for a 301 redirect as the browser immediately navigates
          // but including them doesn't hurt.
          // ...commonHeaders, // You can remove this for 301 if you prefer
          'Location': data.long_url, // This header tells the browser where to go
          'Cache-Control': 'public, max-age=31536000, immutable' // Aggressive caching for permanent redirect
        },
        body: '' // No body is needed for a 301 redirect
      };
    } catch (error) {
      console.error('Unhandled error in GET handler (redirect logic):', error);
      return {
        statusCode: 500,
        headers: {
          ...commonHeaders,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: error.message || 'Internal server error during redirection',
          details: error.stack // Include stack for debugging
        })
      };
    }
  }

  // Handle any other HTTP methods
  console.warn(`Received unsupported HTTP method: ${event.httpMethod}`);
  return {
    statusCode: 405, // Method Not Allowed
    headers: {
      ...commonHeaders,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ error: 'Method not allowed' })
  };
};