const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Automated Content Backup Script
 * 
 * This script creates comprehensive backups of all blog content including:
 * - All blog posts (markdown files)
 * - Configuration files
 * - Custom scripts
 * - Site metadata
 * 
 * Backups are exported to JSON format with timestamps for easy restoration.
 */

const BACKUP_CONFIG = {
    outputDir: path.join(__dirname, '..', 'backups'),
    timestamp: new Date().toISOString().replace(/[:.]/g, '-'),
    includeGitInfo: true
};

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_CONFIG.outputDir)) {
    fs.mkdirSync(BACKUP_CONFIG.outputDir, { recursive: true });
}

/**
 * Read all markdown files from a directory recursively
 */
function readMarkdownFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            // Skip node_modules, .git, and other system directories
            if (!['node_modules', '.git', 'public', '.netlify', 'backups'].includes(file)) {
                readMarkdownFiles(filePath, fileList);
            }
        } else if (file.endsWith('.md') || file.endsWith('.njk')) {
            fileList.push({
                path: filePath,
                relativePath: path.relative(path.join(__dirname, '..'), filePath),
                content: fs.readFileSync(filePath, 'utf8'),
                size: stat.size,
                modified: stat.mtime,
                created: stat.birthtime
            });
        }
    });

    return fileList;
}

/**
 * Extract frontmatter and content from markdown files
 */
function parseFrontmatter(content) {
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
    const match = content.match(frontmatterRegex);

    if (match) {
        return {
            frontmatter: match[1],
            content: match[2]
        };
    }

    return {
        frontmatter: null,
        content: content
    };
}

/**
 * Get Git information for version tracking
 */
function getGitInfo() {
    try {
        return {
            branch: execSync('git rev-parse --abbrev-ref HEAD').toString().trim(),
            commit: execSync('git rev-parse HEAD').toString().trim(),
            commitShort: execSync('git rev-parse --short HEAD').toString().trim(),
            commitMessage: execSync('git log -1 --pretty=%B').toString().trim(),
            commitDate: execSync('git log -1 --format=%cd').toString().trim(),
            remoteUrl: execSync('git config --get remote.origin.url').toString().trim()
        };
    } catch (error) {
        console.warn('Warning: Could not retrieve Git information:', error.message);
        return null;
    }
}

/**
 * Create comprehensive backup
 */
function createBackup() {
    console.log('🔄 Starting backup process...');

    const rootDir = path.join(__dirname, '..');
    const srcDir = path.join(rootDir, 'src');

    // Collect all content files
    const contentFiles = readMarkdownFiles(srcDir);

    // Parse all blog posts
    const blogPosts = contentFiles
        .filter(file => file.relativePath.includes('blog') && file.relativePath.endsWith('.md'))
        .map(file => {
            const parsed = parseFrontmatter(file.content);
            return {
                ...file,
                ...parsed
            };
        });

    // Collect configuration files
    const configFiles = [
        '.eleventy.js',
        'netlify.toml',
        'package.json',
        'src/admin/config.yml'
    ].map(configPath => {
        const fullPath = path.join(rootDir, configPath);
        if (fs.existsSync(fullPath)) {
            return {
                path: configPath,
                content: fs.readFileSync(fullPath, 'utf8')
            };
        }
        return null;
    }).filter(Boolean);

    // Create backup manifest
    const backup = {
        metadata: {
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            blogName: 'EvolvedLotus Blog',
            backupType: 'automated',
            totalFiles: contentFiles.length,
            totalBlogPosts: blogPosts.length,
            git: BACKUP_CONFIG.includeGitInfo ? getGitInfo() : null
        },
        blogPosts: blogPosts.map(post => ({
            relativePath: post.relativePath,
            frontmatter: post.frontmatter,
            content: post.content,
            size: post.size,
            modified: post.modified,
            created: post.created
        })),
        allContent: contentFiles.map(file => ({
            relativePath: file.relativePath,
            content: file.content,
            size: file.size,
            modified: file.modified,
            created: file.created
        })),
        configuration: configFiles,
        statistics: {
            totalContentSize: contentFiles.reduce((sum, file) => sum + file.size, 0),
            fileTypes: contentFiles.reduce((acc, file) => {
                const ext = path.extname(file.relativePath);
                acc[ext] = (acc[ext] || 0) + 1;
                return acc;
            }, {}),
            directories: [...new Set(contentFiles.map(file =>
                path.dirname(file.relativePath)
            ))]
        }
    };

    // Save backup to file
    const backupFileName = `backup-${BACKUP_CONFIG.timestamp}.json`;
    const backupFilePath = path.join(BACKUP_CONFIG.outputDir, backupFileName);

    fs.writeFileSync(backupFilePath, JSON.stringify(backup, null, 2));

    // Create a "latest" symlink/copy for easy access
    const latestBackupPath = path.join(BACKUP_CONFIG.outputDir, 'backup-latest.json');
    fs.writeFileSync(latestBackupPath, JSON.stringify(backup, null, 2));

    // Generate backup summary
    const summaryPath = path.join(BACKUP_CONFIG.outputDir, `backup-summary-${BACKUP_CONFIG.timestamp}.txt`);
    const summary = `
BACKUP SUMMARY
==============
Date: ${backup.metadata.timestamp}
Git Commit: ${backup.metadata.git?.commitShort || 'N/A'}
Git Branch: ${backup.metadata.git?.branch || 'N/A'}

STATISTICS
----------
Total Files: ${backup.metadata.totalFiles}
Blog Posts: ${backup.metadata.totalBlogPosts}
Total Size: ${(backup.statistics.totalContentSize / 1024).toFixed(2)} KB

FILE TYPES
----------
${Object.entries(backup.statistics.fileTypes)
            .map(([ext, count]) => `${ext || 'no extension'}: ${count}`)
            .join('\n')}

BACKUP FILES
------------
Main Backup: ${backupFileName}
Latest Link: backup-latest.json
Summary: backup-summary-${BACKUP_CONFIG.timestamp}.txt

RESTORATION
-----------
To restore from this backup, use the restore-backup.js script:
  node scripts/restore-backup.js ${backupFileName}
`;

    fs.writeFileSync(summaryPath, summary);

    console.log('✅ Backup completed successfully!');
    console.log(`📁 Backup saved to: ${backupFilePath}`);
    console.log(`📊 Summary saved to: ${summaryPath}`);
    console.log(`\n${summary}`);

    return {
        backupFile: backupFilePath,
        summaryFile: summaryPath,
        metadata: backup.metadata
    };
}

// Run backup if executed directly
if (require.main === module) {
    try {
        createBackup();
        process.exit(0);
    } catch (error) {
        console.error('❌ Backup failed:', error);
        process.exit(1);
    }
}

module.exports = { createBackup };
