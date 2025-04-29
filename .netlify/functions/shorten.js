const { NetlifyKV } = require('@netlify/functions');

// Initialize KV store
const kv = new NetlifyKV('blog-short-urls');

// Function to generate a short ID from a blog post filename
function generateShortId(filename) {
  // Remove date and extension, take first 3 words and join with hyphens
  const words = filename
    .replace(/^\d{4}-\d{2}-\d{2}-/, '') // Remove date
    .replace(/\.md$/, '') // Remove .md extension
    .split('-')
    .slice(0, 3)
    .join('-');
  return words.toLowerCase();
}

// Read all blog posts and create redirects
const blogPosts = {};
const blogDir = 'C:/Users/xmarc/Documents/GitHub/blog/src/blog';

try {
  const files = fs.readdirSync(blogDir);
  files.forEach(file => {
    if (file.endsWith('.md')) {
      const shortId = generateShortId(file);
      const postUrl = `https://blog.evolvedlotus.com/blog/${file.replace('.md', '')}`;
      blogPosts[shortId] = postUrl;
    }
  });
} catch (error) {
  console.error('Error reading blog posts:', error);
}

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

    // Get the URL from KV store
    const targetUrl = await kv.get(id);
    
    if (!targetUrl) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Blog post not found' })
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
      
      // Store the URL in KV
      await kv.set(id, url);
      
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