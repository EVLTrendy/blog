// Content Freshness Audit Script
// Analyzes all blog posts and flags content that needs updating

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const BLOG_DIR = path.join(__dirname, '..', 'src', 'blog');
const MONTHS_FRESH = 6;
const MONTHS_AGING = 12;

function getContentAge(date, lastModified) {
    const checkDate = lastModified || date;
    if (!checkDate) return 'unknown';

    const contentDate = new Date(checkDate);
    const now = new Date();
    const monthsOld = (now - contentDate) / (1000 * 60 * 60 * 24 * 30);

    if (monthsOld < MONTHS_FRESH) return 'fresh';
    if (monthsOld < MONTHS_AGING) return 'aging';
    return 'stale';
}

function analyzePost(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const { data: frontmatter } = matter(content);

    const age = getContentAge(frontmatter.date, frontmatter.lastModified);
    const fileName = path.basename(filePath);

    return {
        fileName,
        title: frontmatter.title || 'Untitled',
        date: frontmatter.date,
        lastModified: frontmatter.lastModified,
        age,
        hub: frontmatter.hub || 'general',
        tags: frontmatter.tags || [],
        hasVideo: !!frontmatter.videoUrl,
        hasFAQs: !!(frontmatter.faqs && frontmatter.faqs.length > 0),
        description: frontmatter.description
    };
}

function generateReport(posts) {
    const fresh = posts.filter(p => p.age === 'fresh');
    const aging = posts.filter(p => p.age === 'aging');
    const stale = posts.filter(p => p.age === 'stale');

    const missingDescription = posts.filter(p => !p.description);

    // Check for duplicate titles
    const titleCounts = {};
    posts.forEach(p => {
        titleCounts[p.title] = (titleCounts[p.title] || 0) + 1;
    });
    const duplicateTitles = Object.keys(titleCounts).filter(title => titleCounts[title] > 1);

    console.log('\n📊 CONTENT FRESHNESS AUDIT REPORT\n');
    console.log('='.repeat(60));

    console.log(`\n📈 Summary:`);
    console.log(`   Total Posts: ${posts.length}`);
    console.log(`   ✅ Fresh (<${MONTHS_FRESH} months): ${fresh.length} (${(fresh.length / posts.length * 100).toFixed(1)}%)`);
    console.log(`   ⚠️  Aging (${MONTHS_FRESH}-${MONTHS_AGING} months): ${aging.length} (${(aging.length / posts.length * 100).toFixed(1)}%)`);
    console.log(`   🔴 Stale (>${MONTHS_AGING} months): ${stale.length} (${(stale.length / posts.length * 100).toFixed(1)}%)`);
    console.log(`   📝 Missing Description: ${missingDescription.length}`);
    console.log(`   👯 Duplicate Titles: ${duplicateTitles.length}`);

    if (stale.length > 0) {
        console.log(`\n🔴 STALE CONTENT (Needs Immediate Update):`);
        console.log('='.repeat(60));
        stale.forEach((post, index) => {
            console.log(`${index + 1}. ${post.title}`);
            console.log(`   File: ${post.fileName}`);
            console.log(`   Last Updated: ${post.lastModified || post.date}`);
            console.log(`   Hub: ${post.hub}`);
            console.log('');
        });
    }

    if (missingDescription.length > 0) {
        console.log(`\n📝 MISSING META DESCRIPTIONS:`);
        console.log('='.repeat(60));
        missingDescription.forEach((post, index) => {
            console.log(`${index + 1}. ${post.title} (${post.fileName})`);
        });
    }

    if (duplicateTitles.length > 0) {
        console.log(`\n👯 DUPLICATE TITLES:`);
        console.log('='.repeat(60));
        duplicateTitles.forEach((title, index) => {
            console.log(`${index + 1}. ${title}`);
            const duplicates = posts.filter(p => p.title === title);
            duplicates.forEach(d => console.log(`   - ${d.fileName}`));
        });
    }

    if (aging.length > 0) {
        console.log(`\n⚠️  AGING CONTENT (Review Soon):`);
        console.log('='.repeat(60));
        aging.slice(0, 10).forEach((post, index) => {
            console.log(`${index + 1}. ${post.title}`);
            console.log(`   File: ${post.fileName}`);
            console.log(`   Last Updated: ${post.lastModified || post.date}`);
            console.log('');
        });
        if (aging.length > 10) {
            console.log(`   ... and ${aging.length - 10} more`);
        }
    }

    // Hub breakdown
    const hubStats = {};
    posts.forEach(post => {
        if (!hubStats[post.hub]) {
            hubStats[post.hub] = { fresh: 0, aging: 0, stale: 0 };
        }
        hubStats[post.hub][post.age]++;
    });

    console.log(`\n📂 Content by Hub:`);
    console.log('='.repeat(60));
    Object.keys(hubStats).sort().forEach(hub => {
        const stats = hubStats[hub];
        const total = stats.fresh + stats.aging + stats.stale;
        console.log(`${hub}: ${total} posts (Fresh: ${stats.fresh}, Aging: ${stats.aging}, Stale: ${stats.stale})`);
    });

    // Recommendations
    console.log(`\n💡 Recommendations:`);
    console.log('='.repeat(60));
    if (stale.length > 0) {
        console.log(`1. Update ${stale.length} stale posts immediately`);
        console.log(`   - Add lastModified date to frontmatter`);
        console.log(`   - Update statistics and examples`);
        console.log(`   - Check for broken links`);
    }
    if (missingDescription.length > 0) {
        console.log(`2. Add meta descriptions to ${missingDescription.length} posts`);
    }
    if (duplicateTitles.length > 0) {
        console.log(`3. Fix ${duplicateTitles.length} duplicate titles`);
    }
    if (aging.length > 5) {
        console.log(`4. Review ${aging.length} aging posts in the next month`);
    }
    console.log(`5. Maintain a schedule to review content every 6 months`);
    console.log(`6. Add lastModified field to all posts when updating`);

    // Export JSON report
    const reportPath = path.join(__dirname, '..', 'content-freshness-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
        generatedAt: new Date().toISOString(),
        summary: {
            total: posts.length,
            fresh: fresh.length,
            aging: aging.length,
            stale: stale.length,
            missingDescription: missingDescription.length,
            duplicateTitles: duplicateTitles.length
        },
        stalePosts: stale,
        agingPosts: aging,
        missingDescriptionPosts: missingDescription,
        duplicateTitles,
        hubStats
    }, null, 2));

    console.log(`\n📄 Full report saved to: content-freshness-report.json`);
}

function main() {
    console.log('🔍 Scanning blog posts for content freshness...\n');

    if (!fs.existsSync(BLOG_DIR)) {
        console.error(`❌ Blog directory not found: ${BLOG_DIR}`);
        process.exit(1);
    }

    const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
    const posts = files.map(file => analyzePost(path.join(BLOG_DIR, file)));

    generateReport(posts);

    console.log('\n✨ Audit complete!');
}

main();
