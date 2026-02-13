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
        // Handle newlines in private keys (common issue with env vars)
        const privateKey = process.env.GOOGLE_PRIVATE_KEY
            ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
            : null;
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
