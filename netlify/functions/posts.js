const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Get the root directory (one level up from netlify/functions)
    const rootDir = path.join(__dirname, '../../');

    // Scan various content directories
    const blogPosts = await scanBlogPosts(path.join(rootDir, 'src/blog'));
    const contentHubs = await scanContentHubs(path.join(rootDir, 'src/hubs'));
    const authors = await scanAuthors(path.join(rootDir, 'src/authors'));
    const notifications = await scanNotifications(path.join(rootDir, 'src/notifications'));
    const pages = await scanPages(path.join(rootDir, 'src/pages'));

    // Calculate stats
    const stats = {
      totalBlogPosts: blogPosts.length,
      totalHubs: contentHubs.length,
      totalAuthors: authors.length,
      totalNotifications: notifications.length,
      totalPages: pages.length,
      lastUpdated: new Date().toISOString()
    };

    // Return the complete data structure
    const data = {
      stats,
      blog: blogPosts,
      hubs: contentHubs,
      authors,
      notifications,
      pages
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data),
    };

  } catch (error) {
    console.error('Error generating posts data:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to load content data', details: error.message }),
    };
  }
};

// Helper functions to scan different content types
async function scanBlogPosts(dir) {
  try {
    if (!fs.existsSync(dir)) return [];

    const files = fs.readdirSync(dir)
      .filter(file => file.endsWith('.md'))
      .sort((a, b) => b.localeCompare(a)); // Sort by filename descending (newest first)

    const posts = [];

    for (const file of files) {
      try {
        const filePath = path.join(dir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const { data } = matter(content);

        // Generate slug from filename (remove date prefix and extension)
        const slug = file.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace('.md', '');

        posts.push({
          id: slug,
          title: data.title || 'Untitled',
          description: data.description || '',
          date: data.date || '',
          author: data.author || '',
          tags: Array.isArray(data.tags) ? data.tags : (data.tags ? [data.tags] : []),
          category: data.category || '',
          image: data.image || '',
          featured: data.featured || false,
          draft: data.draft || false,
          url: `/blog/${data.date ? new Date(data.date).toISOString().split('T')[0].replace(/-/g, '/') + '-' + slug : slug}/`,
          filename: file
        });
      } catch (e) {
        console.warn(`Error parsing blog post ${file}:`, e);
      }
    }

    return posts;
  } catch (e) {
    console.error('Error scanning blog posts:', e);
    return [];
  }
}

async function scanContentHubs(dir) {
  try {
    if (!fs.existsSync(dir)) return [];

    const files = fs.readdirSync(dir)
      .filter(file => file.endsWith('.md'))
      .sort((a, b) => b.localeCompare(a));

    const hubs = [];

    for (const file of files) {
      try {
        const filePath = path.join(dir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const { data } = matter(content);

        const slug = file.replace('.md', '');

        hubs.push({
          id: slug,
          title: data.title || 'Untitled Hub',
          description: data.description || '',
          platform: data.hubCollection || '',
          url: data.permalink || `/hubs/${slug}/`,
          filename: file
        });
      } catch (e) {
        console.warn(`Error parsing content hub ${file}:`, e);
      }
    }

    return hubs;
  } catch (e) {
    console.error('Error scanning content hubs:', e);
    return [];
  }
}

async function scanAuthors(dir) {
  try {
    if (!fs.existsSync(dir)) return [];

    const files = fs.readdirSync(dir)
      .filter(file => file.endsWith('.md'))
      .sort();

    const authors = [];

    for (const file of files) {
      try {
        const filePath = path.join(dir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const { data } = matter(content);

        authors.push({
          id: data.slug || file.replace('.md', ''),
          name: data.name || 'Unknown Author',
          role: data.role || '',
          bio: data.bio || '',
          avatar: data.avatar || '',
          social: data.social || {},
          expertise: data.expertise || [],
          filename: file
        });
      } catch (e) {
        console.warn(`Error parsing author ${file}:`, e);
      }
    }

    return authors;
  } catch (e) {
    console.error('Error scanning authors:', e);
    return [];
  }
}

async function scanNotifications(dir) {
  try {
    if (!fs.existsSync(dir)) return [];

    const files = fs.readdirSync(dir)
      .filter(file => file.endsWith('.md'))
      .sort((a, b) => b.localeCompare(a));

    const notifications = [];

    for (const file of files) {
      try {
        const filePath = path.join(dir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const { data } = matter(content);

        const slug = file.replace('.md', '');

        notifications.push({
          id: slug,
          title: data.title || 'Untitled Notification',
          date: data.date || '',
          link: data.link || '',
          tags: data.tags || ['notification'],
          filename: file
        });
      } catch (e) {
        console.warn(`Error parsing notification ${file}:`, e);
      }
    }

    return notifications;
  } catch (e) {
    console.error('Error scanning notifications:', e);
    return [];
  }
}

async function scanPages(dir) {
  try {
    if (!fs.existsSync(dir)) return [];

    const files = fs.readdirSync(dir)
      .filter(file => file.endsWith('.njk') || file.endsWith('.md'))
      .sort();

    const pages = [];

    for (const file of files) {
      try {
        const filePath = path.join(dir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        let data = {};

        // Try to parse frontmatter if it's markdown
        if (file.endsWith('.md')) {
          const parsed = matter(content);
          data = parsed.data;
        }

        const slug = file.replace(/\.(njk|md)$/, '');

        pages.push({
          id: slug,
          title: data.title || slug.charAt(0).toUpperCase() + slug.slice(1),
          layout: data.layout || 'page.njk',
          permalink: data.permalink || `/${slug}/`,
          url: data.permalink || `/${slug}/`,
          filename: file
        });
      } catch (e) {
        console.warn(`Error parsing page ${file}:`, e);
      }
    }

    return pages;
  } catch (e) {
    console.error('Error scanning pages:', e);
    return [];
  }
}
