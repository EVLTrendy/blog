// OAuth authentication handler for Decap CMS
// This initiates the GitHub OAuth flow

exports.handler = async (event) => {
    const clientId = process.env.OAUTH_CLIENT_ID;

    if (!clientId) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'OAuth Client ID not configured' })
        };
    }

    // GitHub OAuth authorization URL
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=repo,user`;

    return {
        statusCode: 302,
        headers: {
            Location: authUrl,
            'Cache-Control': 'no-cache'
        },
        body: ''
    };
};
