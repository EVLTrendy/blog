const https = require('https');
const crypto = require('crypto');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const body = JSON.parse(event.body);
    const { filename, content, type, action } = body;

    // For security, only allow file operations in specific directories
    const allowedDirectories = ['blog/', 'hubs/', 'authors/', 'notifications/', 'pages/'];

    let isAllowed = false;
    for (const dir of allowedDirectories) {
      if (filename.startsWith(dir)) {
        isAllowed = true;
        break;
      }
    }

    if (!isAllowed) {
      return {
        statusCode: 403,
        body: JSON.stringify({
          error: 'Forbidden: File operation not allowed in this directory'
        })
      };
    }

    // Check if running locally vs production
    const isLocal = process.env.NODE_ENV === 'development' ||
      process.env.CONTEXT === 'local' ||
      !process.env.NETLIFY;

    if (isLocal) {
      // Local development - write directly to file system
      return await handleLocalSave(filename, content, type);
    } else {
      // Production - commit to GitHub
      return await handleGitHubCommit(filename, content, type);
    }

  } catch (error) {
    console.error('Error processing save request:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};

async function handleLocalSave(filename, content, type) {
  // Only available during local development
  const fs = require('fs').promises;
  const path = require('path');

  try {
    const fullPath = path.join(__dirname, '../../src', filename + '.md');
    const dir = path.dirname(fullPath);

    // Ensure directory exists
    await fs.mkdir(dir, { recursive: true });

    // Write the file
    await fs.writeFile(fullPath, content, 'utf8');

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: `File saved locally: src/${filename}.md`,
        type,
        filename,
        local: true
      })
    };

  } catch (error) {
    console.error('Error saving file locally:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to save file locally',
        message: error.message
      })
    };
  }
}

async function handleGitHubCommit(filename, content, type) {
  // GitHub API integration for production
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const GITHUB_REPO = process.env.GITHUB_REPOSITORY || 'EVLTrendy/blog';
  const BRANCH = process.env.HEAD || 'main';

  if (!GITHUB_TOKEN) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'GitHub token not configured'
      })
    };
  }

  try {
    // Get current file SHA if it exists
    let sha = null;
    try {
      const getResponse = await makeGitHubRequest(
        `GET /repos/${GITHUB_REPO}/contents/src/${filename}.md?ref=${BRANCH}`,
        null,
        GITHUB_TOKEN
      );

      if (getResponse.sha) {
        sha = getResponse.sha;
      }
    } catch (e) {
      // File doesn't exist yet, that's fine
      console.log('File does not exist yet, will create new:', filename);
    }

    // Prepare commit
    const commitData = {
      message: `${type}: ${sha ? 'Update' : 'Create'} ${filename}.md`,
      content: Buffer.from(content).toString('base64'),
      branch: BRANCH
    };

    if (sha) {
      commitData.sha = sha; // Include SHA for updates
    }

    // Create or update file
    const commitResponse = await makeGitHubRequest(
      `PUT /repos/${GITHUB_REPO}/contents/src/${filename}.md`,
      commitData,
      GITHUB_TOKEN
    );

    // Trigger Netlify build (optional - depends on webhook setup)
    try {
      await triggerNetlifyBuild();
    } catch (buildError) {
      console.warn('Failed to trigger build:', buildError.message);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: `Content committed to ${GITHUB_REPO}`,
        type,
        filename,
        commit: commitResponse.commit,
        buildTriggered: true
      })
    };

  } catch (error) {
    console.error('GitHub commit error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to commit to GitHub',
        message: error.message
      })
    };
  }
}

async function makeGitHubRequest(endpoint, data, token) {
  // Parse endpoint (e.g., "GET /repos/..." or "PUT /repos/...")
  let method = data ? 'PUT' : 'GET';
  let path = endpoint;

  // Check if endpoint includes method prefix
  if (endpoint.startsWith('GET ')) {
    method = 'GET';
    path = endpoint.substring(4);
  } else if (endpoint.startsWith('PUT ')) {
    method = 'PUT';
    path = endpoint.substring(4);
  } else if (endpoint.startsWith('POST ')) {
    method = 'POST';
    path = endpoint.substring(5);
  } else if (endpoint.startsWith('DELETE ')) {
    method = 'DELETE';
    path = endpoint.substring(7);
  }

  console.log(`GitHub API Request: ${method} ${path}`);

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: path,
      method: method,
      headers: {
        'Authorization': `token ${token}`,
        'User-Agent': 'Netlify-CMS-via-Eleventy',
        'Accept': 'application/vnd.github.v3+json'
      }
    };

    if (data) {
      options.headers['Content-Type'] = 'application/json';
    }

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);

      res.on('end', () => {
        try {
          const response = body ? JSON.parse(body) : {};
          console.log(`GitHub API Response: ${res.statusCode}`);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(response);
          } else {
            console.error(`GitHub API Error: ${res.statusCode} - ${response.message || body}`);
            reject(new Error(`GitHub API error ${res.statusCode}: ${response.message || body}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function triggerNetlifyBuild() {
  const NETLIFY_WEBHOOK_URL = process.env.NETLIFY_BUILD_HOOK;

  if (!NETLIFY_WEBHOOK_URL) {
    console.warn('No Netlify webhook URL configured');
    return;
  }

  return new Promise((resolve, reject) => {
    const url = new URL(NETLIFY_WEBHOOK_URL);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true });
        } else {
          reject(new Error(`Build trigger failed: ${res.statusCode}`));
        }
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify({}));
    req.end();
  });
}
