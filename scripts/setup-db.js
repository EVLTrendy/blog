const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function setupDatabase() {
  try {
    console.log('Setting up database...');
    
    // Drop existing table if it exists
    const { error: dropError } = await supabase
      .from('short_urls')
      .delete()
      .neq('id', 0);

    if (dropError && !dropError.message.includes('does not exist')) {
      console.error('Error dropping table:', dropError);
      return;
    }

    // Create the table
    const { error: createError } = await supabase.rpc('create_short_urls_table', {
      table_name: 'short_urls',
      columns: [
        { name: 'id', type: 'serial', primary_key: true },
        { name: 'short_url', type: 'text', unique: true, not_null: true },
        { name: 'title', type: 'text', not_null: true },
        { name: 'slug', type: 'text', not_null: true },
        { name: 'created_at', type: 'timestamp', default: 'now()' }
      ]
    });
    
    if (createError) {
      console.error('Error creating table:', createError);
      return;
    }
    
    console.log('Database setup complete!');
  } catch (error) {
    console.error('Error in setupDatabase:', error);
  }
}

setupDatabase(); 