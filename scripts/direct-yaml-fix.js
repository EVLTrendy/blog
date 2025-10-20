#!/usr/bin/env node

/**
 * Direct YAML fix for date formatting issues
 * This script directly manipulates the raw YAML text
 */

const fs = require('fs');
const path = require('path');

const postsDirectory = path.join(__dirname, '..', 'src', 'blog');

console.log('🔧 Direct YAML fix for date formatting...\n');

// Read all markdown files
const files = fs.readdirSync(postsDirectory).filter(file => file.endsWith('.md'));

let fixedCount = 0;

files.forEach(file => {
  const filePath = path.join(postsDirectory, file);

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Fix unquoted dates in YAML frontmatter
    // Pattern: date: 2023-11-20T02:53:05.277Z -> date: "2023-11-20T02:53:05.277Z"
    content = content.replace(
      /^(date:\s*)([^"\s][^"\n]*)$/gm,
      (match, prefix, dateValue) => {
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(dateValue)) {
          console.log(`  🔧 Fixing ${file}: Quoting unquoted date`);
          modified = true;
          return `${prefix}"${dateValue}"`;
        }
        return match;
      }
    );

    // Fix multiline descriptions that might cause YAML parsing issues
    content = content.replace(
      /^(description:\s*['"]?)([^'"]*?)(['"]?\s*)$/gm,
      (match, start, descContent, end) => {
        if (descContent.includes('\n')) {
          console.log(`  🔧 Fixing ${file}: Escaping multiline description`);
          modified = true;
          const escapedDesc = descContent.replace(/\n/g, '\\n');
          return `${start}${escapedDesc}${end}`;
        }
        return match;
      }
    );

    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`  ✅ Fixed: ${file}`);
      fixedCount++;
    }

  } catch (error) {
    console.error(`  ❌ Error processing ${file}:`, error.message);
  }
});

console.log(`\n✅ Fixed ${fixedCount} files`);
console.log('\n🔄 Running validation to confirm fixes...');

// Run validation after fixes
const FrontmatterValidator = require('./frontmatter-validator');
const validator = new FrontmatterValidator();
validator.scanAllPosts();
validator.printResults();

console.log('\n📋 Summary:');
console.log(`Fixed ${fixedCount} files`);
console.log(`Remaining errors: ${validator.errors.length}`);
console.log(`Remaining warnings: ${validator.warnings.length}`);

if (validator.errors.length === 0) {
  console.log('\n🎉 All YAML formatting issues resolved!');
} else {
  console.log('\n⚠️  Some issues remain. Consider manual review of remaining errors.');
}
