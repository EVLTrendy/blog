#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const title = process.argv[2] || 'New Post';
const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
const date = new Date().toISOString();

const template = `---
title: "${title}"
date: "${date}"
description: ""
keywords: []
category: ""
tags: []
author: "Your Name"
---

# ${title}

Start writing here...
`;

const filename = `${date.split('T')[0]}-${slug}.md`;
const filepath = path.join(__dirname, '../src/blog', filename);

fs.writeFileSync(filepath, template);
console.log(`✅ Created: ${filename}`);
