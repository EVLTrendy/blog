const { createClient } = require('@supabase/supabase-js');

// Fetch environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event, context) => {
  const { id } = event.queryStringParameters;

  if (!id) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Missing ID parameter' })
    };
  }

  try {
    // Fetch the long URL associated with the short URL
    const { data, error } = await supabase
      .from('urls')
      .select('long_url')
      .eq('id', id)
      .single();

    if (error || !data) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'URL not found' })
      };
    }

    return {
      statusCode: 301,
      headers: {
        Location: data.long_url // Redirect to the long URL
      }
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message })
    };
  }
};
