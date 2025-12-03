// Netlify Function for Lead Magnet Downloads
// Handles email capture and tracks downloads in Supabase

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

exports.handler = async (event, context) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { email, magnetId, magnetTitle, magnetType, downloadUrl, pageUrl } = JSON.parse(event.body);

        // Validate email
        if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Invalid email address' })
            };
        }

        // Validate required fields
        if (!magnetId || !magnetTitle) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing required fields' })
            };
        }

        // Track download in Supabase if configured
        if (supabase) {
            try {
                const { data, error } = await supabase
                    .from('lead_magnet_downloads')
                    .insert([
                        {
                            email: email,
                            magnet_id: magnetId,
                            magnet_title: magnetTitle,
                            magnet_type: magnetType,
                            page_url: pageUrl,
                            downloaded_at: new Date().toISOString(),
                            user_agent: event.headers['user-agent'],
                            ip_address: event.headers['x-nf-client-connection-ip']
                        }
                    ]);

                if (error) {
                    console.error('Supabase error:', error);
                    // Don't fail the request if tracking fails
                }
            } catch (dbError) {
                console.error('Database tracking error:', dbError);
                // Continue even if tracking fails
            }
        }

        // TODO: Add email to your email marketing service
        // Example: ConvertKit, Mailchimp, Buttondown, etc.
        // await addToEmailList(email, magnetTitle);

        // Return success with download URL
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                success: true,
                message: 'Download link sent to your email',
                downloadUrl: downloadUrl || null
            })
        };

    } catch (error) {
        console.error('Lead magnet function error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Internal server error',
                message: error.message
            })
        };
    }
};

// Helper function to add email to marketing service (implement based on your provider)
async function addToEmailList(email, magnetTitle) {
    // Example for ConvertKit:
    // const CONVERTKIT_API_KEY = process.env.CONVERTKIT_API_KEY;
    // const CONVERTKIT_FORM_ID = process.env.CONVERTKIT_FORM_ID;
    // 
    // const response = await fetch(`https://api.convertkit.com/v3/forms/${CONVERTKIT_FORM_ID}/subscribe`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     api_key: CONVERTKIT_API_KEY,
    //     email: email,
    //     tags: [magnetTitle]
    //   })
    // });
    // 
    // return response.json();

    console.log(`TODO: Add ${email} to email list for ${magnetTitle}`);
    return true;
}
