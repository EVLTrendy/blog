// OAuth callback handler for Decap CMS
// This completes the GitHub OAuth flow and returns the access token

const fetch = require('node-fetch');

exports.handler = async (event) => {
    const { code } = event.queryStringParameters || {};

    if (!code) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'No authorization code provided' })
        };
    }

    const clientId = process.env.OAUTH_CLIENT_ID;
    const clientSecret = process.env.OAUTH_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'OAuth credentials not configured' })
        };
    }

    try {
        // Exchange code for access token
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                client_id: clientId,
                client_secret: clientSecret,
                code: code
            })
        });

        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: tokenData.error_description || tokenData.error })
            };
        }

        // Return success page with token that Decap CMS can read
        const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Authorization Successful</title>
  <script>
    // Send token back to CMS
    if (window.opener) {
      window.opener.postMessage(
        'authorization:github:success:${JSON.stringify(tokenData)}',
        window.location.origin
      );
      window.close();
    }
  </script>
</head>
<body>
  <h1>Authorization Successful!</h1>
  <p>You can close this window and return to the CMS.</p>
</body>
</html>
    `;

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'text/html',
                'Cache-Control': 'no-cache'
            },
            body: html
        };
    } catch (error) {
        console.error('OAuth error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Authentication failed', details: error.message })
        };
    }
};
