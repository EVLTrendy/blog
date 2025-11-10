const fs = require('fs');
const path = require('path');

function checkMetaTags() {
  const buildDir = '_site';
  const blogDir = path.join(buildDir, 'blog');

  if (!fs.existsSync(blogDir)) {
    console.log('❌ Build directory not found. Run: npm run build');
    return;
  }

  const files = fs.readdirSync(blogDir, { recursive: true })
    .filter(f => f.endsWith('index.html'));

  if (files.length === 0) {
    console.log('❌ No blog post HTML files found');
    return;
  }

  const sampleFile = path.join(blogDir, files[0]);
  console.log(`\n📄 Checking: ${sampleFile}\n`);

  const html = fs.readFileSync(sampleFile, 'utf8');

  console.log('=== TWITTER CARD VALIDATION ===\n');

  // Check for CORRECT Twitter Card syntax (name="twitter:...")
  const twitterCardCorrect = html.match(/<meta name="twitter:card"[^>]*>/);
  const twitterImageCorrect = html.match(/<meta name="twitter:image"[^>]*>/);

  // Check for WRONG syntax (property="twitter:...")
  const twitterCardWrong = html.match(/<meta property="twitter:card"[^>]*>/);
  const twitterImageWrong = html.match(/<meta property="twitter:image"[^>]*>/);

  if (twitterCardCorrect) {
    console.log('✅ twitter:card found with CORRECT attribute (name="")');
    console.log('   ', twitterCardCorrect[0]);
  } else if (twitterCardWrong) {
    console.log('❌ twitter:card found with WRONG attribute (property="")');
    console.log('   ', twitterCardWrong[0]);
    console.log('   FIX: Change property="" to name=""');
  } else {
    console.log('❌ twitter:card NOT FOUND');
  }

  console.log('');

  if (twitterImageCorrect) {
    console.log('✅ twitter:image found with CORRECT attribute (name="")');
    console.log('   ', twitterImageCorrect[0]);

    // Extract and validate URL
    const match = twitterImageCorrect[0].match(/content="([^"]*)"/);
    if (match) {
      const url = match[1];
      console.log('\n   URL Analysis:');
      console.log('   → Full URL:', url);
      console.log('   → Starts with https://?', url.startsWith('https://'));
      console.log('   → Is absolute?', url.startsWith('http'));

      if (!url.startsWith('https://')) {
        console.log('   ⚠️  WARNING: URL should start with https://');
      }
    }
  } else if (twitterImageWrong) {
    console.log('❌ twitter:image found with WRONG attribute (property="")');
    console.log('   ', twitterImageWrong[0]);
    console.log('   FIX: Change property="" to name=""');
  } else {
    console.log('❌ twitter:image NOT FOUND');
  }

  console.log('\n=== OPEN GRAPH VALIDATION ===\n');

  const ogImage = html.match(/<meta property="og:image"[^>]*>/);
  const ogImageWidth = html.match(/<meta property="og:image:width"[^>]*>/);
  const ogImageHeight = html.match(/<meta property="og:image:height"[^>]*>/);

  console.log(ogImage ? '✅' : '❌', 'og:image');
  if (ogImage) console.log('   ', ogImage[0]);

  console.log(ogImageWidth ? '✅' : '❌', 'og:image:width');
  if (ogImageWidth) console.log('   ', ogImageWidth[0]);

  console.log(ogImageHeight ? '✅' : '❌', 'og:image:height');
  if (ogImageHeight) console.log('   ', ogImageHeight[0]);

  console.log('\n=== SUMMARY ===\n');

  if (twitterImageCorrect && ogImage) {
    console.log('✅ All meta tags correctly formatted');
    console.log('✅ Ready for Twitter Card validator');
  } else if (twitterImageWrong) {
    console.log('❌ CRITICAL: Twitter tags using property="" instead of name=""');
    console.log('   This is why validator says "no Twitter Card image defined"');
  } else {
    console.log('❌ Missing required meta tags');
  }
}

checkMetaTags();
