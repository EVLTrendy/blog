#!/usr/bin/env node

/**
 * Debug YAML parsing differences between parsers
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const yaml = require('js-yaml');

const testFile = 'src/blog/2023-11-20-boost-tiktok-visuals-top-online-resources.md';

console.log('🔍 Debugging YAML parsing differences...\n');

// Read raw file content
const rawContent = fs.readFileSync(testFile, 'utf8');
console.log('=== RAW FILE CONTENT (first 300 chars) ===');
console.log(rawContent.substring(0, 300));
console.log('\n=== FRONTMATTER SECTION ===');
const frontmatterMatch = rawContent.match(/^---\n([\s\S]*?)\n---/);
if (frontmatterMatch) {
  console.log(frontmatterMatch[1]);
}

console.log('\n=== GRAY-MATTER PARSING ===');
try {
  const grayMatterResult = matter(rawContent);
  console.log('Parsed data:', JSON.stringify(grayMatterResult.data, null, 2));
} catch (error) {
  console.log('Gray-matter error:', error.message);
}

console.log('\n=== JS-YAML PARSING ===');
try {
  if (frontmatterMatch) {
    const yamlResult = yaml.load(frontmatterMatch[1]);
    console.log('Parsed data:', JSON.stringify(yamlResult, null, 2));
  }
} catch (error) {
  console.log('JS-YAML error:', error.message);
  console.log('Error details:', error);
}

console.log('\n=== CHECKING FOR HIDDEN CHARACTERS ===');
if (frontmatterMatch) {
  const frontmatter = frontmatterMatch[1];
  for (let i = 0; i < frontmatter.length; i++) {
    const char = frontmatter[i];
    const code = frontmatter.charCodeAt(i);
    if (code > 127 || code < 32) {
      console.log(`Hidden char at position ${i}: '${char}' (code: ${code})`);
    }
  }
}
