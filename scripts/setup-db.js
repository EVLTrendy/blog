const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function setupDatabase() {
  // Create short_urls table
  const { error } = await supabase.rpc('create_short_urls_table', {
    table_name: 'short_urls',
    columns: [
      { name: 'short_id', type: 'text', primary_key: true },
      { name: 'url', type: 'text', not_null: true },
      { name: 'created_at', type: 'timestamp', default: 'now()' }
    ]
  });
  
  if (error) {
    console.error('Error setting up database:', error);
    return;
  }
  
  console.log('Database setup complete!');
}

setupDatabase(); 