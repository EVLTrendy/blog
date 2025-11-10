const fs = require('fs');
const path = require('path');

// Check what meta tags are actually in the built HTML
function checkMetaTags() {
  const buildDir = '_site';

  // Find a sample blog post HTML file
  const blogDir = path.join(buildDir, 'blog');

  if (!fs.existsSync(blogDir)) {
    console.log('❌ Build directory not found. Run: npm run build');
    return;
  }

  // Get first blog post HTML file
  const files = fs.readdirSync(blogDir, { recursive: true })
    .filter(f => f.endsWith('index.html'));

  if (files.length === 0) {
    console.log('❌ No blog post HTML files found');
    return;
  }

  const sampleFile = path.join(blogDir, files[0]);
  console.log(`\n📄 Checking: ${sampleFile}\n`);

  const html = fs.readFileSync(sampleFile, 'utf8');

  // Extract all meta tags
  const metaTags = html.match(/<meta[^>]*>/g) || [];

  console.log('=== ALL META TAGS ===\n');

  const ogTags = metaTags.filter(tag => tag.includes('og:'));
  const twitterTags = metaTags.filter(tag => tag.includes('twitter:'));

  console.log('--- Open Graph Tags ---');
  if (ogTags.length === 0) {
    console.log('❌ NO OG TAGS FOUND!\n');
  } else {
    ogTags.forEach(tag => console.log(tag));
    console.log('');
  }

  console.log('--- Twitter Card Tags ---');
  if (twitterTags.length === 0) {
    console.log('❌ NO TWITTER TAGS FOUND!\n');
  } else {
    twitterTags.forEach(tag => console.log(tag));
    console.log('');
  }

  // Check specific required tags
  console.log('=== COMPLIANCE CHECK ===\n');

  const required = {
    'og:url': html.includes('property="og:url"'),
    'og:type': html.includes('property="og:type"'),
    'og:title': html.includes('property="og:title"'),
    'og:description': html.includes('property="og:description"'),
    'og:image': html.includes('property="og:image"'),
    'og:image:width': html.includes('property="og:image:width"'),
    'og:image:height': html.includes('property="og:image:height"'),
    'twitter:card': html.includes('name="twitter:card"'),
    'twitter:image': html.includes('name="twitter:image"')
  };

  Object.entries(required).forEach(([tag, exists]) => {
    console.log(`${exists ? '✅' : '❌'} ${tag}`);
  });

  // Extract image URLs
  const ogImageMatch = html.match(/property="og:image"\s+content="([^"]*)"/);
  const twitterImageMatch = html.match(/name="twitter:image"\s+content="([^"]*)"/);

  console.log('\n=== IMAGE URLS ===\n');

  if (ogImageMatch) {
    const url = ogImageMatch[1];
    console.log('og:image:', url);
    console.log('  → Absolute URL?', url.startsWith('http'));
    console.log('  → HTTPS?', url.startsWith('https://'));
  } else {
    console.log('❌ No og:image found');
  }

  if (twitterImageMatch) {
    const url = twitterImageMatch[1];
    console.log('twitter:image:', url);
    console.log('  → Absolute URL?', url.startsWith('http'));
    console.log('  → HTTPS?', url.startsWith('https://'));
  } else {
    console.log('❌ No twitter:image found');
  }
}

checkMetaTags();
