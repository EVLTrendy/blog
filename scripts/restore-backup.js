const fs = require('fs');
const path = require('path');

/**
 * Content Restoration Script
 * 
 * Restores blog content from a backup JSON file created by backup-content.js
 * 
 * Usage: node scripts/restore-backup.js [backup-file.json]
 */

function restoreBackup(backupFilePath) {
    console.log('🔄 Starting restoration process...');

    // Read backup file
    if (!fs.existsSync(backupFilePath)) {
        throw new Error(`Backup file not found: ${backupFilePath}`);
    }

    const backup = JSON.parse(fs.readFileSync(backupFilePath, 'utf8'));

    console.log(`📦 Restoring backup from: ${backup.metadata.timestamp}`);
    console.log(`📝 Total files to restore: ${backup.metadata.totalFiles}`);

    const rootDir = path.join(__dirname, '..');
    let restoredCount = 0;
    let skippedCount = 0;

    // Restore all content files
    backup.allContent.forEach(file => {
        const targetPath = path.join(rootDir, file.relativePath);
        const targetDir = path.dirname(targetPath);

        // Create directory if it doesn't exist
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        // Check if file exists and ask for confirmation (in interactive mode)
        if (fs.existsSync(targetPath)) {
            console.log(`⚠️  File exists: ${file.relativePath} (overwriting)`);
        }

        // Write file
        fs.writeFileSync(targetPath, file.content, 'utf8');
        restoredCount++;
    });

    // Restore configuration files
    backup.configuration.forEach(config => {
        const targetPath = path.join(rootDir, config.path);
        const targetDir = path.dirname(targetPath);

        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        fs.writeFileSync(targetPath, config.content, 'utf8');
        console.log(`✅ Restored config: ${config.path}`);
    });

    console.log('\n✅ Restoration completed!');
    console.log(`📊 Files restored: ${restoredCount}`);
    console.log(`⏭️  Files skipped: ${skippedCount}`);

    if (backup.metadata.git) {
        console.log(`\n📌 Original Git Info:`);
        console.log(`   Branch: ${backup.metadata.git.branch}`);
        console.log(`   Commit: ${backup.metadata.git.commitShort}`);
        console.log(`   Message: ${backup.metadata.git.commitMessage}`);
    }
}

// Run restoration if executed directly
if (require.main === module) {
    const backupFile = process.argv[2] || path.join(__dirname, '..', 'backups', 'backup-latest.json');

    try {
        restoreBackup(backupFile);
        process.exit(0);
    } catch (error) {
        console.error('❌ Restoration failed:', error);
        process.exit(1);
    }
}

module.exports = { restoreBackup };
