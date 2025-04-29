const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Function to generate a random 8-character ID
function generateShortId() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function initializeBlogUrls() {
  const blogDir = 'C:/Users/xmarc/Documents/GitHub/blog/src/blog';
  
  try {
    const files = fs.readdirSync(blogDir);
    for (const file of files) {
      if (file.endsWith('.md')) {
        const postUrl = `https://blog.evolvedlotus.com/blog/${file.replace('.md', '')}`;
        
        // Generate a unique short ID
        let shortId;
        let isUnique = false;
        
        while (!isUnique) {
          shortId = generateShortId();
          const { data } = await supabase
            .from('short_urls')
            .select('short_id')
            .eq('short_id', shortId)
            .single();
          
          if (!data) {
            isUnique = true;
          }
        }
        
        // Store the URL in Supabase
        const { error } = await supabase
          .from('short_urls')
          .insert([
            { short_id: shortId, url: postUrl }
          ]);
        
        if (error) {
          console.error(`Error adding ${file}:`, error);
          continue;
        }
        
        console.log(`Added: ${shortId} -> ${postUrl}`);
      }
    }
    console.log('All blog posts have been added to the database!');
  } catch (error) {
    console.error('Error initializing blog URLs:', error);
  }
}

initializeBlogUrls(); 