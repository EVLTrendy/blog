#!/usr/bin/env node

/**
 * Fix Eleventy v2 Date Parsing Issues
 * Converts ISO string dates to proper eleventyComputed format
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

class EleventyDateFixer {
  constructor() {
    this.postsDirectory = path.join(__dirname, '..', 'src', 'blog');
    this.fixedCount = 0;
  }

  /**
   * Fix a single blog post
   */
  fixFile(filePath) {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const { data: frontmatter, content } = matter(fileContent);
      const fileName = path.basename(filePath);

      let needsFix = false;
      let updatedFrontmatter = { ...frontmatter };

      // Fix double-quoted dates like '"2023-11-20T12:00:00.000Z"'
      if (frontmatter.date && typeof frontmatter.date === 'string') {
        const dateValue = frontmatter.date.trim();

        // Check for double quotes (escaped quotes in YAML)
        if (dateValue.startsWith('"') && dateValue.endsWith('"') && dateValue.length > 2) {
          const innerDate = dateValue.slice(1, -1); // Remove outer quotes

          // Validate it's a proper ISO date
          const isoPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
          if (isoPattern.test(innerDate)) {
            console.log(`  🔧 Fixing ${fileName}: Converting double-quoted date to eleventyComputed`);
            updatedFrontmatter.date = innerDate;

            // Add eleventyComputed section for proper Date object conversion
            updatedFrontmatter.eleventyComputed = {
              date: `(() => {
                const { DateTime } = require("luxon");
                return DateTime.fromISO("${innerDate}").toJSDate();
              })()`
            };

            needsFix = true;
          }
        }
        // Handle already properly quoted dates like "2023-11-20T12:00:00.000Z"
        else if (dateValue.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)) {
          console.log(`  🔧 Fixing ${fileName}: Converting ISO string to eleventyComputed`);
          updatedFrontmatter.date = dateValue;

          // Add eleventyComputed section for proper Date object conversion
          updatedFrontmatter.eleventyComputed = {
            date: `(() => {
              const { DateTime } = require("luxon");
              return DateTime.fromISO("${dateValue}").toJSDate();
            })()`
          };

          needsFix = true;
        }
      }

      if (needsFix) {
        // Create new frontmatter with eleventyComputed
        const frontmatterLines = [];
        frontmatterLines.push('---');

        // Add all fields except eleventyComputed (we'll add it last)
        Object.keys(updatedFrontmatter).forEach(key => {
          if (key !== 'eleventyComputed') {
            const value = updatedFrontmatter[key];
            if (typeof value === 'string') {
              frontmatterLines.push(`${key}: "${value}"`);
            } else if (Array.isArray(value)) {
              frontmatterLines.push(`${key}:`);
              value.forEach(item => {
                frontmatterLines.push(`  - "${item}"`);
              });
            } else {
              frontmatterLines.push(`${key}: ${value}`);
            }
          }
        });

        // Add eleventyComputed section
        if (updatedFrontmatter.eleventyComputed) {
          frontmatterLines.push('eleventyComputed:');
          frontmatterLines.push('  date: >');
          frontmatterLines.push('    (() => {');
          frontmatterLines.push('      const { DateTime } = require("luxon");');
          frontmatterLines.push(`      return DateTime.fromISO("${updatedFrontmatter.date}").toJSDate();`);
          frontmatterLines.push('    })()');
        }

        frontmatterLines.push('---');

        // Combine with content
        const updatedContent = frontmatterLines.join('\n') + '\n' + content;

        fs.writeFileSync(filePath, updatedContent);
        console.log(`  ✅ Fixed: ${fileName}`);
        this.fixedCount++;
        return true;
      }

      return false;
    } catch (error) {
      console.error(`  ❌ Error fixing ${path.basename(filePath)}:`, error.message);
      return false;
    }
  }

  /**
   * Fix all blog posts
   */
  fixAllPosts() {
    console.log('🔧 Starting Eleventy v2 date fixes...\n');

    try {
      const files = fs.readdirSync(this.postsDirectory);
      let processedCount = 0;

      files.forEach(file => {
        if (file.endsWith('.md')) {
          const filePath = path.join(this.postsDirectory, file);
          if (this.fixFile(filePath)) {
            processedCount++;
          }
        }
      });

      console.log(`\n✅ Fixed ${this.fixedCount} files with eleventyComputed`);
      console.log(`📄 Processed ${processedCount} total files`);
      return this.fixedCount > 0;
    } catch (error) {
      console.error('❌ Error during date fixes:', error.message);
      return false;
    }
  }
}

/**
 * Main execution function
 */
function main() {
  const fixer = new EleventyDateFixer();
  fixer.fixAllPosts();
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = EleventyDateFixer;
