#!/usr/bin/env node

/**
 * Fix YAML date formatting issues for Netlify compatibility
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const postsDirectory = path.join(__dirname, '..', 'src', 'blog');

console.log('🔧 Fixing YAML date formatting for Netlify compatibility...\n');

// Read all markdown files
const files = fs.readdirSync(postsDirectory).filter(file => file.endsWith('.md'));

let fixedCount = 0;

files.forEach(file => {
  const filePath = path.join(postsDirectory, file);

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const { data: frontmatter, content: body } = matter(content);

    let needsFix = false;
    let fixedFrontmatter = { ...frontmatter };

    // Check if date needs fixing for YAML compatibility
    if (frontmatter.date) {
      const dateValue = frontmatter.date;

      // If gray-matter parsed it as a string but it's not properly quoted in raw YAML
      if (typeof dateValue === 'string') {
        // Check if the raw YAML has unquoted date
        const rawDateMatch = content.match(/^date:\s*(.+)$/m);
        if (rawDateMatch) {
          const rawDateValue = rawDateMatch[1].trim();

          // If raw YAML has unquoted date, fix it
          if (rawDateValue && !rawDateValue.startsWith('"') && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(rawDateValue)) {
            console.log(`  🔧 Fixing ${file}: Quoting unquoted date in YAML`);
            fixedFrontmatter.date = `"${dateValue}"`;
            needsFix = true;
          }
        }
      }

      // Fix any other YAML formatting issues
      if (frontmatter.description && frontmatter.description.includes('\n')) {
        fixedFrontmatter.description = frontmatter.description.replace(/\n/g, '\\n');
        needsFix = true;
      }
    }

    if (needsFix) {
      const updatedContent = matter.stringify(body, fixedFrontmatter, { lineWidth: -1 });
      fs.writeFileSync(filePath, updatedContent);
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
