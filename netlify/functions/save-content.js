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
    const { filename, content, type, action, isBase64 } = body;

    // For security, only allow file operations in specific directories
    const allowedDirectories = ['blog/', 'hubs/', 'authors/', 'notifications/', 'pages/', 'assets/'];

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
    // Netlify Functions have AWS_LAMBDA_FUNCTION_NAME set
    // Local CLI has NETLIFY_DEV=true
    const isProduction = process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env.AWS_REGION ||
      process.env.NETLIFY === 'true';
    const isLocal = !isProduction && (
      process.env.NODE_ENV === 'development' ||
      process.env.NETLIFY_DEV === 'true' ||
      process.env.CONTEXT === 'local'
    );

    console.log('Environment check:', {
      isLocal,
      isProduction,
      AWS_LAMBDA: !!process.env.AWS_LAMBDA_FUNCTION_NAME,
      filename,
      type,
      action,
      isBase64
    });

    if (isLocal) {
      // Local development - handle locally
      if (action === 'delete') {
        return await handleLocalDelete(filename, type);
      }
      if (action === 'upload-binary') {
        return await handleLocalBinaryUpload(filename, content, type);
      }
      return await handleLocalSave(filename, content, type);
    } else {
      // Production - use GitHub API
      if (action === 'delete') {
        return await handleGitHubDelete(filename, type);
      }
      return await handleGitHubCommit(filename, content, type, isBase64);
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

async function handleLocalBinaryUpload(filename, base64Content, type) {
  const fs = require('fs').promises;
  const path = require('path');

  try {
    const fullPath = path.join(__dirname, '../../src', filename);
    const dir = path.dirname(fullPath);

    // Ensure directory exists
    await fs.mkdir(dir, { recursive: true });

    // Decode base64 and write binary file
    const buffer = Buffer.from(base64Content, 'base64');
    await fs.writeFile(fullPath, buffer);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: `File uploaded locally: src/${filename}`,
        type,
        filename,
        local: true
      })
    };
  } catch (error) {
    console.error('Error uploading file locally:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to upload file locally',
        message: error.message
      })
    };
  }
}

async function handleLocalDelete(filename, type) {
  const fs = require('fs').promises;
  const path = require('path');

  try {
    const fullPath = path.join(__dirname, '../../src', filename + '.md');
    await fs.unlink(fullPath);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: `File deleted locally: src/${filename}.md`,
        type,
        filename,
        local: true
      })
    };
  } catch (error) {
    console.error('Error deleting file locally:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to delete file locally',
        message: error.message
      })
    };
  }
}

async function handleGitHubDelete(filename, type) {
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
    // Determine file path logic consistent with commit
    const isAsset = filename.startsWith('assets/');
    const filePath = isAsset ? `src/${filename}` : `src/${filename}.md`;

    console.log(`Attempting to delete: ${filePath} (type: ${type})`);

    // Get current file SHA (required for deletion)
    const getResponse = await makeGitHubRequest(
      `GET /repos/${GITHUB_REPO}/contents/${filePath}?ref=${BRANCH}`,
      null,
      GITHUB_TOKEN
    );

    if (!getResponse.sha) {
      console.error('File not found or no SHA returned:', getResponse);
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: 'File not found',
          message: `${filePath} does not exist`
        })
      };
    }

    console.log(`Found SHA for ${filePath}: ${getResponse.sha}`);

    // Delete the file
    const deleteData = {
      message: `${type}: Delete ${isAsset ? filename : filename + '.md'}`,
      sha: getResponse.sha,
      branch: BRANCH
    };

    await makeGitHubRequest(
      `DELETE /repos/${GITHUB_REPO}/contents/${filePath}`,
      deleteData,
      GITHUB_TOKEN
    );

    // Trigger rebuild
    try {
      await triggerNetlifyBuild();
    } catch (buildError) {
      console.warn('Failed to trigger build:', buildError.message);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: `File deleted from ${GITHUB_REPO}`,
        type,
        filename,
        buildTriggered: true
      })
    };

  } catch (error) {
    console.error('GitHub delete error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to delete from GitHub',
        message: error.message
      })
    };
  }
}

async function handleGitHubCommit(filename, content, type, isBase64 = false) {
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

  // Determine file path - binary files don't get .md extension
  const isAsset = filename.startsWith('assets/');
  const filePath = isAsset ? `src/${filename}` : `src/${filename}.md`;

  try {
    // Get current file SHA if it exists
    let sha = null;
    try {
      const getResponse = await makeGitHubRequest(
        `GET /repos/${GITHUB_REPO}/contents/${filePath}?ref=${BRANCH}`,
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

    // Prepare commit - if isBase64, content is already base64 encoded
    const skipDeploy = isAsset ? ' [skip ci]' : '';
    const commitData = {
      message: `${type}: ${sha ? 'Update' : 'Create'} ${isAsset ? filename : filename + '.md'}${skipDeploy}`,
      content: isBase64 ? content : Buffer.from(content).toString('base64'),
      branch: BRANCH
    };

    if (sha) {
      commitData.sha = sha; // Include SHA for updates
    }

    // Create or update file
    const commitResponse = await makeGitHubRequest(
      `PUT /repos/${GITHUB_REPO}/contents/${filePath}`,
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

    const postData = data ? JSON.stringify(data) : null;

    if (postData) {
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    console.log('Sending GitHub Request with headers:', JSON.stringify({
      ...options.headers,
      Authorization: 'REDACTED'
    }));

    if (postData) {
      console.log('Sending Body:', postData);
    }

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);

      res.on('end', () => {
        let response;
        try {
          response = body ? JSON.parse(body) : {};
        } catch (e) {
          // If body is not JSON (e.g. 500 HTML page), use it as message
          console.log('Failed to parse GitHub response as JSON, using raw body:', body.substring(0, 100));
          response = { message: body || 'Unknown error from GitHub' };
        }

        console.log(`GitHub API Response: ${res.statusCode}`);
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(response);
        } else {
          // Ensure we don't reject with an object that can't be stringified
          const errorMsg = response.message || (typeof response === 'string' ? response : JSON.stringify(response));
          console.error(`GitHub API Error: ${res.statusCode} - ${errorMsg}`);
          reject(new Error(`GitHub API error ${res.statusCode}: ${errorMsg}`));
        }
      });
    });

    req.on('error', reject);

    if (postData) {
      req.write(postData);
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
