#!/usr/bin/env node

/**
 * Frontmatter Validation Script for Eleventy Blog
 * Validates required frontmatter fields and provides build-time warnings
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

class FrontmatterValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.postsDirectory = path.join(__dirname, '..', 'src', 'blog');
  }

  /**
   * Validate a single markdown file
   */
  validateFile(filePath) {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const { data: frontmatter } = matter(fileContent);
      const fileName = path.basename(filePath);

      // Required fields validation
      const requiredFields = ['title', 'description', 'image'];
      const missingFields = [];

      requiredFields.forEach(field => {
        if (!frontmatter[field]) {
          missingFields.push(field);
        }
      });

      if (missingFields.length > 0) {
        this.errors.push({
          file: fileName,
          type: 'missing_required_fields',
          message: `Missing required fields: ${missingFields.join(', ')}`,
          fields: missingFields
        });
      }

      // Recommended fields validation
      const recommendedFields = ['author', 'date', 'tags', 'imageAlt', 'keywords'];
      const missingRecommended = [];

      recommendedFields.forEach(field => {
        if (!frontmatter[field]) {
          missingRecommended.push(field);
        }
      });

      if (missingRecommended.length > 0) {
        this.warnings.push({
          file: fileName,
          type: 'missing_recommended_fields',
          message: `Missing recommended fields: ${missingRecommended.join(', ')}`,
          fields: missingRecommended
        });
      }

      // Field content validation
      if (frontmatter.title && frontmatter.title.length < 10) {
        this.warnings.push({
          file: fileName,
          type: 'title_too_short',
          message: 'Title is very short (less than 10 characters)'
        });
      }

      if (frontmatter.description && frontmatter.description.length < 50) {
        this.warnings.push({
          file: fileName,
          type: 'description_too_short',
          message: 'Description is very short (less than 50 characters)'
        });
      }

      if (frontmatter.image && !frontmatter.image.startsWith('/assets/') && !frontmatter.image.startsWith('http')) {
        this.warnings.push({
          file: fileName,
          type: 'invalid_image_path',
          message: 'Image path should start with /assets/ or be an absolute URL'
        });
      }



      // More permissive date validation - accept strings OR Date objects
      if (frontmatter.date) {
        const dateValue = frontmatter.date;

        // Only flag if it's truly malformed (not a string, not a Date object)
        if (typeof dateValue !== 'string' && !(dateValue instanceof Date)) {
          this.errors.push({
            file: fileName,
            type: 'invalid_date_type',
            message: `Date must be a string or Date object, found: ${typeof dateValue}`,
            value: dateValue
          });
        }

        // Check for the ACTUAL problem: concatenated dates
        if (typeof dateValue === 'string') {
          // Check for concatenated dates like "2023-11-20T...Z""2023-11-20T...Z"
          if (dateValue.includes('""') && dateValue.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/g)?.length > 1) {
            this.errors.push({
              file: fileName,
              type: 'concatenated_dates',
              message: 'Multiple dates concatenated together',
              value: dateValue
            });
          }

          // Check for obviously malformed date strings (but be permissive)
          else if (dateValue.includes('""') || dateValue.includes('T""')) {
            this.errors.push({
              file: fileName,
              type: 'malformed_date_string',
              message: 'Date string contains malformed quotes',
              value: dateValue
            });
          }
        }
      }

      if (frontmatter.tags && (!Array.isArray(frontmatter.tags) || frontmatter.tags.length === 0)) {
        this.warnings.push({
          file: fileName,
          type: 'invalid_tags',
          message: 'Tags should be a non-empty array'
        });
      }

    } catch (error) {
      this.errors.push({
        file: path.basename(filePath),
        type: 'file_read_error',
        message: `Error reading file: ${error.message}`
      });
    }
  }

  /**
   * Check if date is valid
   */
  isValidDate(dateString) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  }

  /**
   * Check if date is valid ISO format
   */
  isValidISODate(dateString) {
    // Check if it's a valid date first
    if (!this.isValidDate(dateString)) {
      return false;
    }

    // Check if it matches ISO format pattern
    const isoPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}(Z|[+-]\d{2}:\d{2})$/;
    return isoPattern.test(dateString);
  }

  /**
   * Scan all blog posts
   */
  scanAllPosts() {
    try {
      const files = fs.readdirSync(this.postsDirectory);

      files.forEach(file => {
        if (file.endsWith('.md')) {
          const filePath = path.join(this.postsDirectory, file);
          this.validateFile(filePath);
        }
      });
    } catch (error) {
      console.error('Error scanning posts directory:', error.message);
    }
  }

  /**
   * Generate validation report
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalFiles: 0,
        errors: this.errors.length,
        warnings: this.warnings.length
      },
      errors: this.errors,
      warnings: this.warnings
    };

    // Count total files (approximate)
    try {
      const files = fs.readdirSync(this.postsDirectory);
      report.summary.totalFiles = files.filter(f => f.endsWith('.md')).length;
    } catch (error) {
      // Ignore error for summary
    }

    return report;
  }

  /**
   * Print results to console
   */
  printResults() {
    const report = this.generateReport();

    console.log('\n' + '='.repeat(60));
    console.log('FRONTMATTER VALIDATION REPORT');
    console.log('='.repeat(60));
    console.log(`Generated: ${new Date().toLocaleString()}`);
    console.log(`Total Files: ${report.summary.totalFiles}`);
    console.log(`Errors: ${report.summary.errors}`);
    console.log(`Warnings: ${report.summary.warnings}`);
    console.log('-'.repeat(60));

    if (this.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.errors.forEach(error => {
        console.log(`  ${error.file}: ${error.message}`);
      });
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.warnings.forEach(warning => {
        const message = warning.message || `Missing recommended fields: ${warning.fields?.join(', ') || 'unknown'}`;
        console.log(`  ${warning.file}: ${message}`);
      });
    }

    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('\n✅ All frontmatter validation checks passed!');
    }

    console.log('='.repeat(60));

    // Save report to file
    const reportPath = path.join(__dirname, '..', 'reports', 'frontmatter-validation-report.json');
    try {
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(`\n📄 Report saved to: ${reportPath}`);
    } catch (error) {
      console.error('Error saving report:', error.message);
    }

    return report;
  }

  /**
   * Exit with appropriate code for CI/CD
   */
  getExitCode() {
    return this.errors.length > 0 ? 1 : 0;
  }

  /**
   * Auto-fix capability for malformed dates
   */
  autoFix(filePath) {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const { data: frontmatter, content } = matter(fileContent);
      const fileName = path.basename(filePath);

      let needsFix = false;
      let fixedFrontmatter = { ...frontmatter };

      // Fix date field if it's not a string
      if (frontmatter.date && typeof frontmatter.date !== 'string') {
        console.log(`  🔧 Fixing ${fileName}: Converting date to string`);
        fixedFrontmatter.date = new Date(frontmatter.date).toISOString();
        needsFix = true;
      }

      // Fix unquoted dates
      if (frontmatter.date && typeof frontmatter.date === 'string' && !frontmatter.date.startsWith('"')) {
        const datePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
        if (datePattern.test(frontmatter.date)) {
          console.log(`  🔧 Fixing ${fileName}: Quoting unquoted date`);
          fixedFrontmatter.date = `"${frontmatter.date}"`;
          needsFix = true;
        }
      }

      // Fix missing dates
      if (!frontmatter.date) {
        const stats = fs.statSync(filePath);
        const fallbackDate = stats.mtime.toISOString();
        console.log(`  🔧 Fixing ${fileName}: Adding missing date`);
        fixedFrontmatter.date = `"${fallbackDate}"`;
        needsFix = true;
      }

      // Fix YAML formatting issues that might cause parsing errors
      if (frontmatter.description && frontmatter.description.includes('\n')) {
        console.log(`  🔧 Fixing ${fileName}: Escaping multiline description`);
        fixedFrontmatter.description = frontmatter.description.replace(/\n/g, '\\n');
        needsFix = true;
      }

      if (needsFix) {
        const updatedContent = matter.stringify(content, fixedFrontmatter, { lineWidth: -1 });
        fs.writeFileSync(filePath, updatedContent);
        console.log(`  ✅ Auto-fixed: ${fileName}`);
        return true;
      }

      return false;
    } catch (error) {
      console.error(`  ❌ Error auto-fixing ${path.basename(filePath)}:`, error.message);
      return false;
    }
  }

  /**
   * Auto-fix all files with issues
   */
  autoFixAll() {
    console.log('🔧 Starting auto-fix for frontmatter issues...\n');

    try {
      const files = fs.readdirSync(this.postsDirectory);
      let fixedCount = 0;

      files.forEach(file => {
        if (file.endsWith('.md')) {
          const filePath = path.join(this.postsDirectory, file);
          if (this.autoFix(filePath)) {
            fixedCount++;
          }
        }
      });

      console.log(`\n✅ Auto-fixed ${fixedCount} files`);
      return fixedCount > 0;
    } catch (error) {
      console.error('❌ Error during auto-fix:', error.message);
      return false;
    }
  }
}

/**
 * Main execution function
 */
function main() {
  // Check for --fix flag
  if (process.argv.includes('--fix')) {
    const validator = new FrontmatterValidator();
    const wasFixed = validator.autoFixAll();

    if (wasFixed) {
      console.log('\n🔄 Running validation after fixes...');
      // Run validation again after fixes
      const newValidator = new FrontmatterValidator();
      newValidator.scanAllPosts();
      newValidator.printResults();
      process.exit(newValidator.getExitCode());
    } else {
      console.log('\n✅ No fixes needed');
      process.exit(0);
    }
  } else {
    const validator = new FrontmatterValidator();
    validator.scanAllPosts();
    const report = validator.printResults();
    process.exit(validator.getExitCode());
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = FrontmatterValidator;
