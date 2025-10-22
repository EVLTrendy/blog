const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Generate a random short ID
function generateShortId() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Check if short URL exists for a post slug
async function getShortUrlForPost(postSlug) {
    try {
        const { data, error } = await supabase
            .from('short_urls')
            .select('*')
            .eq('post_slug', postSlug)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
            console.error('Error fetching short URL:', error);
            return null;
        }

        return data;
    } catch (error) {
        console.error('Error connecting to Supabase:', error);
        return null;
    }
}

// Create new short URL for a post
async function createShortUrl(postSlug, postTitle) {
    try {
        // Check if short URL already exists
        const existing = await getShortUrlForPost(postSlug);
        if (existing) {
            return existing;
        }

        // Generate unique short ID
        let shortId;
        let attempts = 0;
        do {
            shortId = generateShortId();
            attempts++;

            // Prevent infinite loops
            if (attempts > 10) {
                console.error('Failed to generate unique short ID after 10 attempts');
                return null;
            }
        } while (await checkShortIdExists(shortId));

        // Insert new short URL
        const { data, error } = await supabase
            .from('short_urls')
            .insert([{
                post_slug: postSlug,
                short_id: shortId,
                title: postTitle,
                created_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) {
            console.error('Error creating short URL:', error);
            return null;
        }

        return data;
    } catch (error) {
        console.error('Error creating short URL:', error);
        return null;
    }
}

// Check if short ID already exists
async function checkShortIdExists(shortId) {
    try {
        const { data, error } = await supabase
            .from('short_urls')
            .select('id')
            .eq('short_id', shortId)
            .single();

        return !error || error.code !== 'PGRST116';
    } catch (error) {
        console.error('Error checking short ID:', error);
        return false;
    }
}

// Get short URL by ID
async function getShortUrlById(shortId) {
    try {
        const { data, error } = await supabase
            .from('short_urls')
            .select('*')
            .eq('short_id', shortId)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching short URL by ID:', error);
            return null;
        }

        return data;
    } catch (error) {
        console.error('Error connecting to Supabase:', error);
        return null;
    }
}

// Export functions for use in Eleventy
module.exports = {
    getShortUrlForPost,
    createShortUrl,
    getShortUrlById,
    checkShortIdExists
};
