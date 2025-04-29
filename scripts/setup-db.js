const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function setupDatabase() {
  // Create short_urls table
  const { error } = await supabase.rpc('create_short_urls_table');
  
  if (error) {
    console.error('Error setting up database:', error);
    return;
  }
  
  console.log('Database setup complete!');
}

setupDatabase(); 