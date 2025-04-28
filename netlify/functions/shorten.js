const { createClient } = require('@supabase/supabase-js');

// Using the provided Supabase URL and anon key
const supabaseUrl = 'https://ttokqdichqlzihyqidoq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0b2txZGljaHFsemloeXFpZG9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4ODAzODIsImV4cCI6MjA2MTQ1NjM4Mn0.La7CSQDyA0CCyBo4zSP2hYRr056Jm0CJQBhYlNf2egE';

const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event) => {
  try {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ message: 'Method Not Allowed' }),
      };
    }

    // Parse the request body
    const { long_url } = JSON.parse(event.body);

    // If no long_url provided, return an error
    if (!long_url) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'long_url is required' }),
      };
    }

    // Generate a random short ID
    const short_id = Math.random().toString(36).substring(2, 8);

    // Insert the long URL and short ID into the Supabase database
    const { data, error } = await supabase
      .from('urls')
      .insert([{ short_id, long_url }]);

    // Handle any errors during the database insert
    if (error) {
      console.error(error);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Database insert failed' }),
      };
    }

    // Return the short URL in the response
    return {
      statusCode: 200,
      body: JSON.stringify({ short_url: `${short_id}` }),
    };
  } catch (err) {
    // Catch and log any other errors
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};
