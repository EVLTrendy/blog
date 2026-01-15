#!/usr/bin/env node

/**
 * Script to automatically fix date formatting issues in markdown files
 * This script searches for and fixes problematic date field formats
 */

const fs = require('fs');
const path = require('path');

// Patterns to search for and fix
const problematicPatterns = [
  // Unquoted dates that look like YYYY-MM-DD
  {
    regex: /^(\s*date:\s*)(?!["'])([0-9]{4}-[0-9]{2}-[0-9]{2}[^"'\s]*)(.*)$/gm,
    fix: (match, prefix, date, suffix) => `${prefix}"${date}"${suffix}`
  },
  // Empty date fields
  {
    regex: /^(\s*date:\s*)$([^"'\s]*.*)?$/gm,
    fix: (match, prefix, suffix) => `${prefix}"1970-01-01T00:00:00.000Z"${suffix || ''}`
  },
  // Null dates
  {
    regex: /^(\s*date:\s*)(?:null|~|)(.*)$/gm,
    fix: (match, prefix, suffix) => `${prefix}"1970-01-01T00:00:00.000Z"${suffix || ''}`
  }
];

function findMarkdownFiles(dir) {
  const files = [];

  try {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        // Recursively search subdirectories
        files.push(...findMarkdownFiles(fullPath));
      } else if (item.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`❌ Error reading directory ${dir}:`, error.message);
  }

  return files;
}

function fixDateFormatting() {
  console.log('🔍 Searching for problematic date formatting in markdown files...\n');

  // Find all markdown files in src/blog/
  const markdownFiles = findMarkdownFiles('src/blog');

  if (markdownFiles.length === 0) {
    console.log('❌ No markdown files found in src/blog/');
    return;
  }

  console.log(`📁 Found ${markdownFiles.length} markdown files to check\n`);

  let totalFixed = 0;
  let filesModified = 0;

  for (const filePath of markdownFiles) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      let modified = false;
      let fileFixes = 0;
      let newContent = content;

      // Apply each fix pattern
      for (const pattern of problematicPatterns) {
        const originalContent = newContent;
        newContent = newContent.replace(pattern.regex, pattern.fix);

        if (newContent !== originalContent) {
          modified = true;
          fileFixes++;
        }
      }

      if (modified) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        filesModified++;
        totalFixed += fileFixes;
        console.log(`✅ Fixed ${fileFixes} date issue(s) in: ${path.basename(filePath)}`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error.message);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   • Files processed: ${markdownFiles.length}`);
  console.log(`   • Files modified: ${filesModified}`);
  console.log(`   • Total fixes applied: ${totalFixed}`);

  if (totalFixed === 0) {
    console.log(`\n✅ All date fields are properly formatted!`);
  } else {
    console.log(`\n🎯 Date formatting issues have been automatically fixed!`);
    console.log(`💡 Run your build again to verify everything works correctly.`);
  }
}

// Run the script
fixDateFormatting();
