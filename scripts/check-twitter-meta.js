const fs = require('fs');
const path = require('path');

// Check a built HTML file for Twitter meta tags
const checkFile = 'public/blog/index.html'; // Adjust to your structure

if (fs.existsSync(checkFile)) {
  const html = fs.readFileSync(checkFile, 'utf8');

  console.log('\n=== Twitter Card Meta Tags Found ===\n');

  const twitterTags = html.match(/<meta name="twitter:[^"]*"[^>]*>/g) || [];

  if (twitterTags.length === 0) {
    console.log('❌ NO TWITTER TAGS FOUND!');
  } else {
    twitterTags.forEach(tag => {
      console.log(tag);
    });
  }

  console.log('\n=== Checking twitter:image specifically ===\n');
  const imageTag = html.match(/<meta name="twitter:image" content="([^"]*)">/);

  if (!imageTag) {
    console.log('❌ twitter:image tag is MISSING');
  } else {
    console.log('✅ Found:', imageTag[0]);
    console.log('URL:', imageTag[1]);

    if (!imageTag[1].startsWith('http')) {
      console.log('⚠️  WARNING: URL is not absolute!');
    }
  }
} else {
  console.log('❌ Build file not found. Run npm run build first.');
}
