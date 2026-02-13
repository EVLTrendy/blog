const { google } = require('googleapis');

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
        console.log(`Debug: Using Client Email: '${clientEmail}'`);

        let privateKey = process.env.GOOGLE_PRIVATE_KEY;
        if (!privateKey) {
            console.warn('GOOGLE_PRIVATE_KEY is missing');
            return {
                statusCode: 200,
                body: JSON.stringify({ configured: false, error: 'Configuration Missing' })
            };
        }

        // Fix keys that have been flattened to a single line
        // 1. Replace literal '\n' characters
        privateKey = privateKey.replace(/\\n/g, '\n');

        // 2. If it still doesn't look like a PEM key (no newlines) but has spaces, try to fix it
        if (privateKey.indexOf('\n') === -1 && privateKey.indexOf(' ') > -1) {
            // This regex reconstructs the header/footer and chunks the body
            const pemHeader = '-----BEGIN PRIVATE KEY-----';
            const pemFooter = '-----END PRIVATE KEY-----';

            // Remove header/footer if they exist to get just the body
            let body = privateKey;
            if (body.includes(pemHeader)) body = body.replace(pemHeader, '');
            if (body.includes(pemFooter)) body = body.replace(pemFooter, '');

            // Remove all spaces from the body
            body = body.replace(/\s/g, '');

            // Chunk the body into 64-char lines (standard PEM format)
            const chunkedBody = body.match(/.{1,64}/g).join('\n');

            // Reassemble
            privateKey = `${pemHeader}\n${chunkedBody}\n${pemFooter}`;
        }
        const propertyId = process.env.GA4_PROPERTY_ID;

        if (!clientEmail || !privateKey || !propertyId) {
            console.warn('Missing Google Analytics credentials or Property ID');
            return {
                statusCode: 200,
                body: JSON.stringify({
                    configured: false,
                    error: 'Configuration Missing',
                    message: 'To see analytics here, you need to configure Google Analytics 4 (GA4).'
                })
            };
        }

        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: clientEmail,
                private_key: privateKey,
            },
            scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
        });

        const analyticsData = google.analyticsdata({
            version: 'v1beta',
            auth: auth
        });

        // Run report on GA4
        const response = await analyticsData.properties.runReport({
            property: `properties/${propertyId}`,
            requestBody: {
                dateRanges: [
                    {
                        startDate: '30daysAgo',
                        endDate: 'today',
                    },
                ],
                dimensions: [
                    { name: 'pagePath' },
                ],
                metrics: [
                    { name: 'activeUsers' },
                    { name: 'screenPageViews' },
                    { name: 'averageSessionDuration' }
                ],
                dimensionFilter: {
                    filter: {
                        fieldName: 'pagePath',
                        stringFilter: {
                            matchType: 'BEGINS_WITH',
                            value: '/blog/' // ONLY show blog pages
                        }
                    }
                },
                limit: 100 // Top 100 blog pages
            },
        });

        const rows = response.data.rows || [];

        // Sort logic within JS as API sorts can be tricky
        const formattedData = rows.map(row => ({
            path: row.dimensionValues[0].value,
            users: parseInt(row.metricValues[0].value, 10),
            views: parseInt(row.metricValues[1].value, 10),
            avgDuration: parseFloat(row.metricValues[2].value).toFixed(1)
        })).sort((a, b) => b.views - a.views);

        // Calculate totals for summary cards
        const totalViews = formattedData.reduce((sum, item) => sum + item.views, 0);
        const totalUsers = formattedData.reduce((sum, item) => sum + item.users, 0);

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                configured: true,
                data: formattedData,
                totals: {
                    views: totalViews,
                    users: totalUsers,
                },
                period: 'Last 30 Days'
            })
        };

    } catch (error) {
        console.error('Error fetching Analytics data:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Failed to fetch analytics data',
                message: error.message
            })
        };
    }
};
