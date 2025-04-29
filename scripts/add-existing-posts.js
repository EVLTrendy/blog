const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
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

async function addExistingPosts() {
  const blogDir = 'C:/Users/xmarc/Documents/GitHub/blog/src/blog';
  
  try {
    // First, get all existing short URLs to avoid duplicates
    const { data: existingUrls } = await supabase
      .from('short_urls')
      .select('url');
    
    const existingUrlSet = new Set(existingUrls.map(item => item.url));
    
    // Read all blog posts
    const files = fs.readdirSync(blogDir);
    let addedCount = 0;
    let skippedCount = 0;
    
    for (const file of files) {
      if (file.endsWith('.md')) {
        const postUrl = `https://blog.evolvedlotus.com/blog/${file.replace('.md', '')}`;
        
        // Skip if URL already exists
        if (existingUrlSet.has(postUrl)) {
          console.log(`Skipping existing URL: ${postUrl}`);
          skippedCount++;
          continue;
        }
        
        // Generate a unique short ID
        let shortId;
        let isUnique = false;
        let attempts = 0;
        const maxAttempts = 5;
        
        while (!isUnique && attempts < maxAttempts) {
          shortId = generateShortId();
          const { data } = await supabase
            .from('short_urls')
            .select('short_id')
            .eq('short_id', shortId)
            .single();
          
          if (!data) {
            isUnique = true;
          }
          attempts++;
        }
        
        if (!isUnique) {
          console.error(`Failed to generate unique short ID for ${file}`);
          continue;
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
        addedCount++;
      }
    }
    
    console.log('\nSummary:');
    console.log(`Added ${addedCount} new short URLs`);
    console.log(`Skipped ${skippedCount} existing URLs`);
    console.log('All done!');
    
  } catch (error) {
    console.error('Error processing blog posts:', error);
  }
}

addExistingPosts(); 