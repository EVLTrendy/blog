const { schedule } = require('@netlify/functions');
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

// How often the function runs (every 10 minutes)
// Cron format: */10 * * * *  -> minute / hour / day / month / weekday
module.exports.handler = schedule('*/10 * * * *', async () => {
  const BUILD_HOOK = process.env.BUILD_HOOK_URL;
  if (!BUILD_HOOK) {
    console.warn('BUILD_HOOK_URL env-var not set – skipping');
    return { statusCode: 200, body: 'No build hook configured' };
  }

  const BLOG_DIR = path.join(process.cwd(), 'src', 'blog');
  const WINDOW_MS = 15 * 60 * 1000; // 15-minute window to avoid duplicate builds
  const now = new Date();
  const lowerBound = new Date(now.getTime() - WINDOW_MS);

  const mdFiles = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith('.md'));

  const shouldPublish = mdFiles.some((file) => {
    try {
      const { data } = matter.read(path.join(BLOG_DIR, file));
      if (!data.date) return false;
      const postDate = new Date(data.date);
      return postDate >= lowerBound && postDate <= now;
    } catch (err) {
      console.warn(`Failed to parse front-matter for ${file}:`, err.message);
      return false;
    }
  });

  if (!shouldPublish) {
    console.log('No post ready – skipping deploy');
    return { statusCode: 200, body: 'Nothing to publish' };
  }

  try {
    const res = await fetch(BUILD_HOOK, { method: 'POST' });
    console.log('Triggered Netlify build hook:', res.status);
    return { statusCode: 200, body: 'Build triggered' };
  } catch (error) {
    console.error('Failed to call build hook:', error);
    return { statusCode: 500, body: 'Build hook error' };
  }
}); 