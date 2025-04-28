const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

exports.handler = async (event, context) => {
  const { hash } = event.queryStringParameters;

  const { data, error } = await supabase
    .from('urls')
    .select('long_url')
    .eq('id', hash)
    .single();

  if (error || !data) {
    return { statusCode: 404, body: 'URL not found' };
  }

  return {
    statusCode: 301,
    headers: {
      Location: data.long_url
    },
    body: ''
  };
};
