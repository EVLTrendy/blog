const { createClient } = require('@supabase/supabase-js');
const querystring = require('querystring');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const body = querystring.parse(event.body); // Parse form data
  const longUrl = body.long_url;

  if (!longUrl) {
    return { statusCode: 400, body: 'Missing long_url' };
  }

  // Generate a short ID
  const shortId = Math.random().toString(36).substring(2, 8);

  // Store in Supabase
  const { data, error } = await supabase
    .from('urls')
    .insert([{ short_id: shortId, long_url: longUrl }]);

  if (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ short_url: `${process.env.URL}/${shortId}` }),
  };
};
