# Automated Backup System

This directory contains automated backups of all blog content, configuration files, and metadata.

## 📋 Overview

The backup system creates comprehensive JSON snapshots of:
- All blog posts (markdown files with frontmatter)
- Configuration files (`.eleventy.js`, `netlify.toml`, `package.json`, etc.)
- Site metadata and statistics
- Git version information

## 🔄 Automated Backups

Backups are automatically created:
- **Weekly**: Every Sunday at 2 AM UTC via GitHub Actions
- **Manual**: Can be triggered manually through GitHub Actions UI

## 📁 Backup Files

- `backup-latest.json` - Always points to the most recent backup
- `backup-YYYY-MM-DDTHH-MM-SS.json` - Timestamped backup files
- `backup-summary-YYYY-MM-DDTHH-MM-SS.txt` - Human-readable summaries

## 🛠️ Manual Backup

To create a backup manually:

```bash
node scripts/backup-content.js
```

This will create a new backup in the `backups/` directory with a timestamp.

## 🔧 Restoration

To restore from a backup:

```bash
# Restore from latest backup
node scripts/restore-backup.js

# Restore from specific backup
node scripts/restore-backup.js backups/backup-2024-12-02T12-00-00.json
```

⚠️ **Warning**: Restoration will overwrite existing files. Make sure to commit your current changes before restoring.

## 📊 Backup Contents

Each backup includes:

### Metadata
- Timestamp of backup creation
- Git commit information (branch, commit hash, message)
- Total file count and statistics

### Blog Posts
- Full content with frontmatter
- File paths and metadata
- Creation and modification dates

### Configuration
- Eleventy configuration
- Netlify configuration
- Package.json
- CMS configuration

### Statistics
- Total content size
- File type distribution
- Directory structure

## 🔐 Security

- Backups are stored in GitHub Actions artifacts (90-day retention)
- Latest backup is committed to the repository
- Sensitive information (API keys, tokens) should never be in content files
- Backups are version-controlled for audit trail

## 📦 Backup Retention

- **GitHub Actions Artifacts**: 90 days
- **Repository Commits**: Indefinite (latest backup only)
- **Local Backups**: Manual cleanup recommended

## 🚨 Recovery Scenarios

### Accidental Deletion
1. Find the appropriate backup file
2. Run the restore script
3. Review changes and commit

### Content Corruption
1. Identify the last known good backup
2. Restore from that backup
3. Manually merge any recent changes

### Full Site Recovery
1. Clone the repository
2. Run `npm install`
3. Restore from `backup-latest.json`
4. Build and deploy

## 📝 Best Practices

1. **Regular Testing**: Periodically test restoration process
2. **External Backups**: Consider additional cloud storage backups
3. **Pre-Deployment**: Create manual backup before major changes
4. **Documentation**: Keep notes on significant content changes

## 🔗 Related Scripts

- `scripts/backup-content.js` - Creates backups
- `scripts/restore-backup.js` - Restores from backups
- `.github/workflows/automated-backup.yml` - Automated backup workflow

## 📞 Support

If you encounter issues with backups:
1. Check GitHub Actions logs
2. Verify file permissions
3. Ensure Node.js dependencies are installed
4. Review backup summary files for errors
