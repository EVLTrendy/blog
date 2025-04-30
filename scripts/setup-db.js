const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role key for admin operations

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
    try {
        console.log('Setting up database...');
        
        // Drop the existing table if it exists
        const { error: dropError } = await supabase
            .from('short_urls')
            .delete()
            .neq('id', 0);
        
        if (dropError && !dropError.message.includes('does not exist')) {
            console.error('Error dropping table:', dropError);
            process.exit(1);
        }
        console.log('Cleared existing table if it existed');

        // Create the table using SQL
        const { error: createError } = await supabase.rpc('create_short_urls_table');
        if (createError) {
            // If the function doesn't exist, create the table directly
            const { error: directCreateError } = await supabase.rpc('create_table', {
                table_name: 'short_urls',
                columns: [
                    { name: 'id', type: 'serial', primary_key: true },
                    { name: 'short_url', type: 'text', unique: true, not_null: true },
                    { name: 'title', type: 'text', not_null: true },
                    { name: 'slug', type: 'text', not_null: true },
                    { name: 'created_at', type: 'timestamp', default: 'now()' }
                ]
            });
            
            if (directCreateError) {
                console.error('Error creating table:', directCreateError);
                process.exit(1);
            }
        }
        console.log('Created short_urls table with correct schema');
        console.log('Database setup completed successfully!');
    } catch (error) {
        console.error('Error setting up database:', error);
        process.exit(1);
    }
}

// Execute the setup
setupDatabase(); 