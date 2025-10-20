#!/usr/bin/env node

/**
 * ONE-TIME FIX: Restore correct dates from filenames
 * Fixes files that were incorrectly set to 1970 dates
 */

const fs = require('fs');
const path = require('path');

const POSTS_DIR = path.join(__dirname, '../src/blog'); // Changed from src/posts to src/blog based on file structure
const DRY_RUN = process.argv.includes('--dry-run');

function extractDateFromFilename(filename) {
  const match = filename.match(/^(\d{4})-(\d{2})-(\d{2})-/);
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}T12:00:00.000Z`;
  }
  return null;
}

function updateFileDate(filepath) {
  const filename = path.basename(filepath);
  const correctDate = extractDateFromFilename(filename);

  if (!correctDate) {
    console.log(`⏭️  Skipping ${filename} - no date in filename`);
    return { skipped: true };
  }

  let content = fs.readFileSync(filepath, 'utf8');

  // Check if file has 1970 date or incorrect date
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) {
    console.log(`⚠️  ${filename} - no frontmatter found`);
    return { skipped: true };
  }

  const frontmatter = frontmatterMatch[1];
  const dateMatch = frontmatter.match(/^date:\s*(.*)$/m);

  if (!dateMatch) {
    console.log(`📝 ${filename} - no date field, adding: ${correctDate}`);
    // Add date field after title
    const newFrontmatter = frontmatter.replace(
      /^(title:.*)$/m,
      `$1\ndate: "${correctDate}"`
    );
    content = content.replace(frontmatterMatch[0], `---\n${newFrontmatter}\n---`);
  } else {
    const currentDate = dateMatch[1].trim().replace(/['"]/g, '');

    // Check if it's a 1970 date or doesn't match filename
    if (currentDate.startsWith('1970') || !currentDate.startsWith(correctDate.substring(0, 10))) {
      console.log(`🔧 ${filename}`);
      console.log(`   OLD: ${currentDate}`);
      console.log(`   NEW: ${correctDate}`);

      // Replace the date line
      content = content.replace(
        /^date:.*$/m,
        `date: "${correctDate}"`
      );
    } else {
      console.log(`✅ ${filename} - date already correct`);
      return { correct: true };
    }
  }

  if (!DRY_RUN) {
    fs.writeFileSync(filepath, content, 'utf8');
    return { updated: true };
  } else {
    return { wouldUpdate: true };
  }
}

// Main execution
console.log('='.repeat(60));
console.log(DRY_RUN ? '🔍 DRY RUN MODE - No files will be modified' : '🔧 FIXING DATES FROM FILENAMES');
console.log('='.repeat(60));
console.log('');

if (!fs.existsSync(POSTS_DIR)) {
  console.error(`❌ Directory ${POSTS_DIR} does not exist!`);
  process.exit(1);
}

const files = fs.readdirSync(POSTS_DIR)
  .filter(f => f.endsWith('.md'))
  .map(f => path.join(POSTS_DIR, f));

if (files.length === 0) {
  console.log('📭 No markdown files found in', POSTS_DIR);
  process.exit(0);
}

const stats = {
  total: files.length,
  updated: 0,
  correct: 0,
  skipped: 0,
  wouldUpdate: 0
};

files.forEach(filepath => {
  const result = updateFileDate(filepath);
  if (result.updated) stats.updated++;
  if (result.correct) stats.correct++;
  if (result.skipped) stats.skipped++;
  if (result.wouldUpdate) stats.wouldUpdate++;
});

console.log('');
console.log('='.repeat(60));
console.log('📊 SUMMARY');
console.log('='.repeat(60));
console.log(`Total files: ${stats.total}`);
console.log(`Already correct: ${stats.correct}`);
console.log(`Skipped (no date in filename): ${stats.skipped}`);

if (DRY_RUN) {
  console.log(`Would update: ${stats.wouldUpdate}`);
  console.log('');
  console.log('✅ Run without --dry-run to apply changes:');
  console.log('   node scripts/restore-dates-from-filenames.js');
} else {
  console.log(`✅ Updated: ${stats.updated}`);
  console.log('');
  console.log('🎉 All dates restored from filenames!');
  console.log('💡 Now commit these changes to fix your blog posts.');
}
