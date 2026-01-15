#!/usr/bin/env node

/**
 * Revert Eleventy v2 Date Fixes
 * Removes eleventyComputed sections and reverts to simple ISO strings
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

class EleventyDateReverter {
  constructor() {
    this.postsDirectory = path.join(__dirname, '..', 'src', 'blog');
    this.revertedCount = 0;
  }

  /**
   * Revert a single blog post
   */
  revertFile(filePath) {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const { data: frontmatter, content } = matter(fileContent);
      const fileName = path.basename(filePath);

      let needsRevert = false;
      let updatedFrontmatter = { ...frontmatter };

      // Check if file has eleventyComputed section
      if (frontmatter.eleventyComputed && frontmatter.eleventyComputed.date) {
        console.log(`  🔄 Reverting ${fileName}: Removing eleventyComputed section`);
        delete updatedFrontmatter.eleventyComputed;
        needsRevert = true;
      }

      if (needsRevert) {
        // Create new frontmatter without eleventyComputed
        const frontmatterLines = [];
        frontmatterLines.push('---');

        // Add all fields
        Object.keys(updatedFrontmatter).forEach(key => {
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
        });

        frontmatterLines.push('---');

        // Combine with content
        const updatedContent = frontmatterLines.join('\n') + '\n' + content;

        fs.writeFileSync(filePath, updatedContent);
        console.log(`  ✅ Reverted: ${fileName}`);
        this.revertedCount++;
        return true;
      }

      return false;
    } catch (error) {
      console.error(`  ❌ Error reverting ${path.basename(filePath)}:`, error.message);
      return false;
    }
  }

  /**
   * Revert all blog posts
   */
  revertAllPosts() {
    console.log('🔄 Starting Eleventy v2 date reversion...\n');

    try {
      const files = fs.readdirSync(this.postsDirectory);
      let processedCount = 0;

      files.forEach(file => {
        if (file.endsWith('.md')) {
          const filePath = path.join(this.postsDirectory, file);
          if (this.revertFile(filePath)) {
            processedCount++;
          }
        }
      });

      console.log(`\n✅ Reverted ${this.revertedCount} files to simple ISO strings`);
      console.log(`📄 Processed ${processedCount} total files`);
      return this.revertedCount > 0;
    } catch (error) {
      console.error('❌ Error during date reversion:', error.message);
      return false;
    }
  }
}

/**
 * Main execution function
 */
function main() {
  const reverter = new EleventyDateReverter();
  reverter.revertAllPosts();
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = EleventyDateReverter;
