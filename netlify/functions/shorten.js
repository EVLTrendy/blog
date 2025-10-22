const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event, context) => {
    // Handle CORS preflight requests
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
            }
        };
    }

    try {
        const pathSegments = event.path.split('/');
        const shortId = pathSegments[pathSegments.length - 2]; // Get short ID from URL

        if (!shortId) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'Short ID is required' })
            };
        }

        // Query Supabase for the short URL
        const { data: shortUrlData, error } = await supabase
            .from('short_urls')
            .select('*')
            .eq('short_id', shortId)
            .single();

        if (error || !shortUrlData) {
            return {
                statusCode: 404,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'Short URL not found' })
            };
        }

        // Construct the full URL for the blog post
        const fullUrl = `https://blog.evolvedlotus.com/blog/${shortUrlData.post_slug}/`;

        // Return redirect response
        return {
            statusCode: 302,
            headers: {
                'Location': fullUrl,
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
            }
        };

    } catch (error) {
        console.error('Error in shorten function:', error);

        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};
