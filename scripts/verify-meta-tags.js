const fs = require('fs');
const path = require('path');

function checkMetaTags() {
  const buildDir = '_site';
  const blogDir = path.join(buildDir, 'blog');

  if (!fs.existsSync(blogDir)) {
    console.log('❌ Build directory not found. Run: npm run build');
    process.exit(1);
  }

  const files = fs.readdirSync(blogDir, { recursive: true })
    .filter(f => f.endsWith('index.html'))
    .slice(0, 10); // Check first 10 files

  if (files.length === 0) {
    console.log('❌ No blog post HTML files found');
    process.exit(1);
  }

  let totalErrors = 0;
  let totalWarnings = 0;

  files.forEach(file => {
    const filePath = path.join(blogDir, file);
    const html = fs.readFileSync(filePath, 'utf8');
    const fileName = path.relative(buildDir, filePath);

    console.log(`\n📄 Checking: ${fileName}`);

    const checks = [
      { name: 'og:type', regex: /<meta property="og:type" content="article"/, level: 'error' },
      { name: 'og:image (absolute)', regex: /<meta property="og:image" content="https:\/\//, level: 'error' },
      { name: 'og:image:width', regex: /<meta property="og:image:width" content="1200"/, level: 'warning' },
      { name: 'og:image:height', regex: /<meta property="og:image:height" content="630"/, level: 'warning' },
      { name: 'twitter:card', regex: /<meta name="twitter:card" content="summary_large_image"/, level: 'error' },
      { name: 'twitter:image', regex: /<meta name="twitter:image" content="https:\/\//, level: 'error' },
      { name: 'article:published_time', regex: /<meta property="article:published_time"/, level: 'warning' },
      { name: 'article:section', regex: /<meta property="article:section"/, level: 'warning' },
      { name: 'article:publisher', regex: /<meta property="article:publisher" content="https:\/\/blog.evolvedlotus.com/, level: 'warning' }
    ];

    checks.forEach(check => {
      if (!check.regex.test(html)) {
        if (check.level === 'error') {
          console.log(`  ❌ FAIL: ${check.name} missing or malformed`);
          totalErrors++;
        } else {
          console.log(`  ⚠️  WARN: ${check.name} missing or malformed`);
          totalWarnings++;
        }
      } else {
        // console.log(`  ✅ PASS: ${check.name}`);
      }
    });

    // Specific check for wrong twitter attribute
    if (/<meta property="twitter:/.test(html)) {
      console.log('  ❌ FAIL: Twitter tags using property="" instead of name=""');
      totalErrors++;
    }
  });

  console.log(`\n=== VALIDATION SUMMARY ===`);
  console.log(`Files checked: ${files.length}`);
  console.log(`Total Errors:   ${totalErrors}`);
  console.log(`Total Warnings: ${totalWarnings}`);
  console.log(`==========================\n`);

  if (totalErrors > 0) {
    console.log('❌ Validation failed with errors.');
    process.exit(1);
  } else {
    console.log('✅ Validation passed!');
    process.exit(0);
  }
}

checkMetaTags();

