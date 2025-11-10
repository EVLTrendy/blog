#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables');
    console.error('Make sure SUPABASE_URL and SUPABASE_ANON_KEY are set in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// SQL to create the short_urls table
const createTableSQL = `
CREATE TABLE IF NOT EXISTS short_urls (
    id TEXT PRIMARY KEY,
    long_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    title TEXT,
    description TEXT,
    image TEXT
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_short_urls_long_url ON short_urls(long_url);
CREATE INDEX IF NOT EXISTS idx_short_urls_id ON short_urls(id);
`;

async function setupDatabase() {
    console.log('🔧 Setting up Supabase short URLs table...');

    try {
        // Create the table
        const { error: createError } = await supabase.rpc('exec_sql', {
            query: createTableSQL
        });

        // If RPC doesn't work, try direct SQL execution
        if (createError) {
            console.log('⚠️ RPC method failed, table may already exist or use different approach');
        }

        console.log('✅ Database table ready');

        // Migrate existing short URLs from JSON
        await migrateExistingShortURLs();

    } catch (error) {
        console.error('❌ Error setting up database:', error);
        console.log('ℹ️ You may need to create the table manually in Supabase SQL editor:');
        console.log(createTableSQL);
    }
}

async function migrateExistingShortURLs() {
    console.log('📁 Checking for existing short URLs to migrate...');

    try {
        const shortUrlsPath = path.join(__dirname, '../src/_data/shortUrls.json');

        if (!fs.existsSync(shortUrlsPath)) {
            console.log('ℹ️ No existing shortUrls.json file found, starting fresh');
            return;
        }

        const existingData = JSON.parse(fs.readFileSync(shortUrlsPath, 'utf8'));
        console.log(`📋 Found ${Object.keys(existingData).length} existing short URLs`);

        // Check what's already in the database
        const { data: existingInDb, error: fetchError } = await supabase
            .from('short_urls')
            .select('long_url');

        if (fetchError) {
            console.error('❌ Error checking existing database entries:', fetchError);
            return;
        }

        const existingUrls = new Set(existingInDb.map(item => item.long_url));

        // Migrate entries that don't exist in the database
        let migrated = 0;
        for (const [shortId, shortUrlData] of Object.entries(existingData)) {
            const longUrl = `https://blog.evolvedlotus.com/blog/${shortUrlData.slug}/`;
            if (!existingUrls.has(longUrl)) {
                const { error: insertError } = await supabase
                    .from('short_urls')
                    .insert([{
                        id: shortId,
                        long_url: longUrl,
                        title: shortUrlData.title || '',
                        created_at: new Date().toISOString()
                    }]);

                if (insertError) {
                    console.error(`❌ Error migrating ${shortId}:`, insertError);
                } else {
                    console.log(`✅ Migrated: ${shortId} → ${shortUrlData.slug}`);
                    migrated++;
                }
            } else {
                console.log(`ℹ️ Skipped (already exists): ${shortId} → ${shortUrlData.slug}`);
            }
        }

        console.log(`🎉 Migration complete! Migrated ${migrated} short URLs`);

    } catch (error) {
        console.error('❌ Error during migration:', error);
    }
}

async function testConnection() {
    console.log('🔍 Testing Supabase connection...');

    try {
        const { data, error } = await supabase
            .from('short_urls')
            .select('count', { count: 'exact', head: true });

        if (error) {
            console.error('❌ Connection test failed:', error);
            return false;
        }

        console.log('✅ Supabase connection successful');
        return true;
    } catch (error) {
        console.error('❌ Connection test error:', error);
        return false;
    }
}

// Main execution
async function main() {
    console.log('🚀 Starting Supabase short URL system setup...\n');

    // Test connection first
    const connected = await testConnection();
    if (!connected) {
        console.error('❌ Cannot proceed without database connection');
        process.exit(1);
    }

    // Setup database and migrate data
    await setupDatabase();

    console.log('\n🎯 Setup complete!');
    console.log('📝 Next steps:');
    console.log('1. Deploy your Netlify function');
    console.log('2. Test short URL generation on your blog');
    console.log('3. Verify link previews work correctly');
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { setupDatabase, migrateExistingShortURLs, testConnection };
