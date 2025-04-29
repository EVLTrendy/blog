const redirects = {
  // Add your shortened URLs here
  // Format: 'short-id': 'https://full-url.com'
  'gh': 'https://github.com',
  'tw': 'https://twitter.com',
  // Add more redirects as needed
};

exports.handler = async (event, context) => {
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
}; 