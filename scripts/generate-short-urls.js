const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Function to generate a short URL
function generateShortUrl(title) {
  if (!title) {
    console.error('Warning: Empty title found, generating random short URL');
    return crypto.randomBytes(3).toString('hex');
  }
  // Create a hash of the title
  const hash = crypto.createHash('md5').update(title).digest('hex');
  // Take first 6 characters of the hash
  return hash.substring(0, 6);
}

// Function to read all blog posts
function getBlogPosts() {
  const blogDir = path.join(__dirname, '../src/blog');
  try {
    if (!fs.existsSync(blogDir)) {
      throw new Error(`Blog directory not found at ${blogDir}`);
    }
    
    const files = fs.readdirSync(blogDir);
    console.log(`Found ${files.length} files in blog directory`);
    
    return files
      .filter(file => file.endsWith('.md'))
      .map(file => {
        try {
          const content = fs.readFileSync(path.join(blogDir, file), 'utf8');
          const title = content.match(/title:\s*['"](.*?)['"]/)?.[1] || '';
          const date = content.match(/date:\s*['"](.*?)['"]/)?.[1] || '';
          const slug = file.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, '');
          
          if (!title) {
            console.warn(`Warning: No title found in ${file}`);
          }
          
          return {
            file,
            title,
            date,
            slug,
            shortUrl: generateShortUrl(title)
          };
        } catch (error) {
          console.error(`Error processing file ${file}:`, error);
          return null;
        }
      })
      .filter(post => post !== null);
  } catch (error) {
    console.error('Error reading blog directory:', error);
    return [];
  }
}

// Function to save short URLs to a data file
function saveShortUrls(posts) {
  try {
    const shortUrls = posts.reduce((acc, post) => {
      if (!post.shortUrl) {
        console.warn(`Warning: No short URL generated for ${post.file}`);
        return acc;
      }
      acc[post.shortUrl] = {
        title: post.title,
        date: post.date,
        slug: post.slug
      };
      return acc;
    }, {});

    const dataDir = path.join(__dirname, '../src/_data');
    if (!fs.existsSync(dataDir)) {
      console.log(`Creating data directory at ${dataDir}`);
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const outputPath = path.join(dataDir, 'shortUrls.json');
    fs.writeFileSync(outputPath, JSON.stringify(shortUrls, null, 2));
    console.log(`Successfully saved ${Object.keys(shortUrls).length} short URLs to ${outputPath}`);

    return shortUrls;
  } catch (error) {
    console.error('Error saving short URLs:', error);
    return {};
  }
}

// Function to update Supabase with short URLs
async function updateSupabase(shortUrls) {
  try {
    // First, clear existing short URLs
    const { error: deleteError } = await supabase
      .from('short_urls')
      .delete()
      .neq('id', 0); // Delete all records

    if (deleteError) {
      throw deleteError;
    }

    // Then insert new short URLs
    const records = Object.entries(shortUrls).map(([shortUrl, data]) => ({
      short_url: shortUrl,
      title: data.title,
      slug: data.slug,
      created_at: new Date().toISOString()
    }));

    const { error: insertError } = await supabase
      .from('short_urls')
      .insert(records);

    if (insertError) {
      throw insertError;
    }

    console.log(`Successfully updated ${records.length} short URLs in Supabase`);
  } catch (error) {
    console.error('Error updating Supabase:', error);
  }
}

// Main function
async function main() {
  console.log('Starting short URL generation...');
  const posts = getBlogPosts();
  if (posts.length === 0) {
    console.error('No blog posts found to process');
    process.exit(1);
  }
  const shortUrls = saveShortUrls(posts);
  await updateSupabase(shortUrls);
  console.log(`Successfully generated short URLs for ${posts.length} blog posts`);
}

main(); 