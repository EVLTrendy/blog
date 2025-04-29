const redirects = {
  // Add your shortened URLs here
  // Format: 'short-id': 'https://full-url.com'
  'gh': 'https://github.com',
  'tw': 'https://twitter.com',
  // Add more redirects as needed
};

exports.handler = async (event, context) => {
  // Handle GET requests (redirects)
  if (event.httpMethod === 'GET') {
    const { id } = event.queryStringParameters;
    
    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing ID parameter' })
      };
    }

    const targetUrl = redirects[id];
    
    if (!targetUrl) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'URL not found' })
      };
    }

    return {
      statusCode: 302,
      headers: {
        Location: targetUrl
      },
      body: ''
    };
  }
  
  // Handle POST requests (creating new short URLs)
  if (event.httpMethod === 'POST') {
    try {
      const body = JSON.parse(event.body);
      const { id, url } = body;
      
      if (!id || !url) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Missing required parameters' })
        };
      }
      
      // In a real implementation, you'd want to store this in a database
      // For now, we'll just return a success message
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          message: 'URL shortened successfully',
          shortUrl: `https://blog.evolvedlotus.com/r/${id}`
        })
      };
    } catch (error) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid JSON in request body' })
      };
    }
  }

  return {
    statusCode: 405,
    body: JSON.stringify({ error: 'Method not allowed' })
  };
}; 