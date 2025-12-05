#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function validateApiData() {
  const apiPath = path.join(__dirname, '..', 'public', 'api', 'posts.json');

  console.log('🔍 Validating CMS API data...');

  // Check if API file exists
  if (!fs.existsSync(apiPath)) {
    console.error('❌ API file not found:', apiPath);
    console.error('💡 Run "npm run build" to generate the API data');
    process.exit(1);
  }

  let data;
  try {
    data = JSON.parse(fs.readFileSync(apiPath, 'utf8'));
  } catch (e) {
    console.error('❌ Invalid JSON in API file:', apiPath);
    console.error(e.message);
    process.exit(1);
  }

  // Check basic structure
  if (!data || typeof data !== 'object') {
    console.error('❌ API data is not an object');
    process.exit(1);
  }

  // Check stats section
  if (!data.stats) {
    console.error('❌ Missing stats section');
    process.exit(1);
  }

  // Check blog section
  if (!Array.isArray(data.blog)) {
    console.error('❌ blog section is not an array');
    process.exit(1);
  }

  // Validate blog posts have required fields
  let validPosts = 0;
  let totalPosts = data.blog.length;

  for (let i = 0; i < data.blog.length; i++) {
    const post = data.blog[i];
    const postNum = i + 1;

    // Check required fields for CMS
    const requiredFields = ['id', 'title', 'description', 'author', 'tags', 'category', 'body'];
    const missingFields = requiredFields.filter(field => post[field] === undefined);

    if (missingFields.length > 0) {
      console.warn(`⚠️ Post ${postNum} (${post.title || 'Untitled'}): missing fields:`, missingFields.join(', '));

      // Add default values for missing required fields
      if (post.body === undefined) {
        post.body = '**Content not available - Please rebuild the site**\n\nThis post needs to be regenerated.';
        console.log(`🔧 Added placeholder body content for post ${postNum}`);
      }

      missingFields.forEach(field => {
        if (post[field] === undefined) {
          const defaults = {
            id: `post-${i}`,
            title: 'Untitled Post',
            description: 'No description available',
            author: 'EvolvedLotus Team',
            tags: [],
            category: 'misc',
            body: ''
          };
          post[field] = defaults[field];
        }
      });
    } else {
      validPosts++;
    }

    // Check if body content exists
    if (!post.body || post.body.trim().length === 0) {
      console.warn(`⚠️ Post ${postNum} (${post.title}): empty body content`);
      post.body = '**Content not available - Please check the source file**\n\nThis post needs its content regenerated.';
    }
  }

  console.log(`✓ Validated ${validPosts}/${totalPosts} blog posts`);

  // Check other sections exist (they can be empty)
  const sections = ['hubs', 'authors', 'notifications', 'pages'];
  sections.forEach(section => {
    if (!Array.isArray(data[section])) {
      console.warn(`⚠️ Section ${section} is missing or not an array - adding empty array`);
      data[section] = [];
    } else {
      console.log(`✓ ${section} section: ${data[section].length} items`);
    }
  });

  // Save the validated data back
  try {
    fs.writeFileSync(apiPath, JSON.stringify(data, null, 2));
    console.log('✅ API data validation complete!');
    console.log(`📁 Updated file: ${apiPath}`);
  } catch (e) {
    console.error('❌ Failed to save validated API data:', e.message);
    process.exit(1);
  }
}

// Run validation if this script is executed directly
if (require.main === module) {
  validateApiData();
}

module.exports = { validateApiData };
