#!/usr/bin/env node

/**
 * Simple Express Development Server for CMS File Saving
 * This allows the CMS to save files directly during local development
 * AND runs the Eleventy dev server concurrently.
 */

const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const { spawn } = require('child_process');

const app = express();
const PORT = 3001; // CMS Helper Port

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for images

// CMS save endpoint
app.post('/api/save-content', async (req, res) => {
  try {
    const { filename, content, type, action, isBase64 } = req.body;

    // Security check - allow specific directories
    // Added 'assets/' to allow image uploads
    const allowedDirectories = ['blog/', 'hubs/', 'authors/', 'notifications/', 'pages/', 'assets/'];
    const isAllowed = allowedDirectories.some(dir => filename.startsWith(dir));

    if (!isAllowed) {
      return res.status(403).json({
        error: 'Forbidden: File operation not allowed in this directory'
      });
    }

    // Determine path
    // If it's an asset (starts with assets/), keep name as is. Otherwise add .md
    const isAsset = filename.startsWith('assets/');
    const finalFilename = isAsset ? filename : (filename.endsWith('.md') ? filename : filename + '.md');

    // Create full path to src/
    const fullPath = path.join(__dirname, '..', 'src', finalFilename);
    const dir = path.dirname(fullPath);

    // Ensure directory exists
    await fs.mkdir(dir, { recursive: true });

    if (action === 'delete') {
      try {
        await fs.unlink(fullPath);
        console.log(`🗑️ Deleted file: ${fullPath}`);
        return res.json({ success: true, message: 'File deleted' });
      } catch (err) {
        if (err.code === 'ENOENT') return res.json({ success: true, message: 'File already deleted' });
        throw err;
      }
    }

    // Write the file
    if (isBase64 || (isAsset && content)) {
      // Handle binary/image content
      const buffer = Buffer.from(content, 'base64');
      await fs.writeFile(fullPath, buffer);
    } else {
      // Handle text content
      await fs.writeFile(fullPath, content, 'utf8');
    }

    console.log(`📁 Saved file: ${fullPath}`);

    res.json({
      success: true,
      message: `File saved successfully: src/${finalFilename}`,
      type,
      filename: finalFilename,
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

// Start CMS Server
const server = app.listen(PORT, () => {
  console.log('\n🚀 CMS Development Server Running on http://localhost:' + PORT);

  // Now spawn Eleventy
  console.log('🔄 Starting Eleventy Server...');
  const eleventy = spawn('npm', ['start'], { stdio: 'inherit', shell: true });

  eleventy.on('close', (code) => {
    console.log(`Eleventy process exited with code ${code}`);
    process.exit(code);
  });
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down...');
  server.close();
  process.exit(0);
});
