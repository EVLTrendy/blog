const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

function findMarkdownFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);

  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat && stat.isDirectory()) {
      results = results.concat(findMarkdownFiles(filePath));
    } else if (file.endsWith('.md')) {
      results.push(filePath);
    }
  });

  return results;
}

function fixFrontmatter() {
  const files = findMarkdownFiles('./src/blog');
  let fixedCount = 0;

  files.forEach(filePath => {
    const content = fs.readFileSync(filePath, 'utf8');
    const { data, content: body } = matter(content);

    let needsFix = false;

    // Only fix concatenated dates (very rare)
    if (data.date && typeof data.date === 'string') {
      const dateStr = data.date.toString();
      // Check for pattern like 2023-11-202023-11-20
      const concatenatedMatch = dateStr.match(/(\d{4}-\d{2}-\d{2})(\d{4}-\d{2}-\d{2})/);
      if (concatenatedMatch) {
        data.date = concatenatedMatch[1]; // Use first date
        needsFix = true;
        console.log(`Fixed concatenated date in: ${path.basename(filePath)}`);
      }
    }

    // Check for missing required fields (don't modify, just warn)
    const required = ['title', 'description', 'date', 'author', 'image', 'tags'];
    const missing = required.filter(field => !data[field]);
    if (missing.length > 0) {
      console.log(`⚠️  Missing fields in ${path.basename(filePath)}: ${missing.join(', ')}`);
    }

    if (needsFix) {
      const newContent = matter.stringify(body, data);
      fs.writeFileSync(filePath, newContent);
      fixedCount++;
    }
  });

  console.log(`\n✅ Fixed ${fixedCount} files`);
}

fixFrontmatter();
