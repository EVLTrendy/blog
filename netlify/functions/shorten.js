const { createClient } = require('@supabase/supabase-js');

// Fetch environment variables from .env
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' })
    };
  }

  const { long_url } = JSON.parse(event.body);

  if (!long_url) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Missing long_url in request body' })
    };
  }

  try {
    // Insert the long_url into Supabase database
    const { data, error } = await supabase
      .from('urls')
      .insert([{ long_url }]);

    if (error) {
      throw new Error(error.message);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ short_url: `${supabaseUrl}/r/${data[0].id}` })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message })
    };
  }
};
