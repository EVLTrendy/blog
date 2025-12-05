#!/usr/bin/env node

/**
 * Simple Express Development Server for CMS File Saving
 * This allows the CMS to save files directly during local development
 */

const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001; // Different port than Eleventy

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// CMS save endpoint
app.post('/api/save-content', async (req, res) => {
  try {
    const { filename, content, type } = req.body;

    // Security check - only allow specific directories
    const allowedDirectories = ['blog/', 'hubs/', 'authors/', 'notifications/', 'pages/'];
    const isAllowed = allowedDirectories.some(dir => filename.startsWith(dir));

    if (!isAllowed) {
      return res.status(403).json({
        error: 'Forbidden: File operation not allowed in this directory'
      });
    }

    // Create full path
    const fullPath = path.join(__dirname, '..', 'src', filename + '.md');
    const dir = path.dirname(fullPath);

    // Ensure directory exists
    await fs.mkdir(dir, { recursive: true });

    // Write the file
    await fs.writeFile(fullPath, content, 'utf8');

    console.log(`📁 Saved file: ${fullPath}`);

    res.json({
      success: true,
      message: `File saved successfully: src/${filename}.md`,
      type,
      filename,
      local: true
    });

  } catch (error) {
    console.error('Error saving file:', error);
    res.status(500).json({
      error: 'Failed to save file locally',
      message: error.message
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log('\n🚀 CMS Development Server Running');
  console.log(`📡 Server: http://localhost:${PORT}`);
  console.log('💡 CMS can now save files directly during development');
  console.log('⚠️  Make sure to also run: npm start (Eleventy server)');
  console.log('\n📝 CMS Workflow:');
  console.log('1. Visit your main site: http://localhost:8080/admin/');
  console.log('2. Edit content and click "Save Changes"');
  console.log('3. Files will be saved directly to src/ folder');
  console.log('\nPress Ctrl+C to stop\n');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 CMS Development Server stopped');
  process.exit(0);
});
