const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { long_url } = JSON.parse(event.body);

  const hash = crypto.createHash('sha256').update(long_url).digest('hex').substr(0, 7);

  const { data, error } = await supabase
    .from('urls')
    .insert([{ id: hash, long_url }]);

  if (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ short_url: `/.netlify/functions/redirect?hash=${hash}` })
  };
};
