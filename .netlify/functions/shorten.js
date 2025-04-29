const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
console.log('Initializing Supabase client with URL:', process.env.SUPABASE_URL);
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

    console.log('Looking up URL for ID:', id);
    
    // Get the URL from Supabase
    const { data, error } = await supabase
      .from('short_urls')
      .select('url')
      .eq('short_id', id)
      .single();
    
    if (error) {
      console.error('Error fetching URL:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Error fetching URL: ' + error.message })
      };
    }
    
    if (!data) {
      console.log('No URL found for ID:', id);
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
      
      // Check if body is valid JSON
      let body;
      try {
        body = JSON.parse(event.body);
      } catch (e) {
        console.error('Invalid JSON in request body:', e);
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Invalid JSON in request body' })
        };
      }
      
      const { long_url } = body;
      
      if (!long_url) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Missing long_url parameter' })
        };
      }

      console.log('Processing URL:', long_url);
      
      // Check if URL already exists
      console.log('Checking if URL already exists in database');
      const { data: existingUrl, error: existingError } = await supabase
        .from('short_urls')
        .select('short_id')
        .eq('url', long_url)
        .single();
      
      if (existingError) {
        console.error('Error checking for existing URL:', existingError);
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Error checking for existing URL: ' + existingError.message })
        };
      }
      
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
      console.log('Generating unique short ID');
      let shortId;
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 5;
      
      while (!isUnique && attempts < maxAttempts) {
        shortId = generateShortId();
        console.log('Checking if ID is unique:', shortId);
        const { data, error: checkError } = await supabase
          .from('short_urls')
          .select('short_id')
          .eq('short_id', shortId)
          .single();
        
        if (checkError) {
          console.error('Error checking for unique ID:', checkError);
          return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Error checking for unique ID: ' + checkError.message })
          };
        }
        
        if (!data) {
          isUnique = true;
        }
        attempts++;
      }
      
      if (!isUnique) {
        throw new Error('Failed to generate unique short ID');
      }
      
      console.log('Generated unique short ID:', shortId);
      
      // Store the URL in Supabase
      console.log('Inserting new URL into database');
      const { error: insertError } = await supabase
        .from('short_urls')
        .insert([
          { short_id: shortId, url: long_url }
        ]);
      
      if (insertError) {
        console.error('Error inserting URL:', insertError);
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Error inserting URL into database: ' + insertError.message })
        };
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