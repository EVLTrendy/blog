const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function setupDatabase() {
  try {
    // Create short_urls table
    const { error } = await supabase.rpc('create_short_urls_table', {
      table_name: 'short_urls',
      columns: [
        { name: 'id', type: 'serial', primary_key: true },
        { name: 'short_url', type: 'text', unique: true, not_null: true },
        { name: 'title', type: 'text', not_null: true },
        { name: 'slug', type: 'text', not_null: true },
        { name: 'created_at', type: 'timestamp', default: 'now()' }
      ]
    });
    
    if (error) {
      console.error('Error setting up database:', error);
      return;
    }
    
    console.log('Database setup complete!');
  } catch (error) {
    console.error('Error in setupDatabase:', error);
  }
}

setupDatabase(); 