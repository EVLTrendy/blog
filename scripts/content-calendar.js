// Content Calendar Integration System
// Generates editorial calendar, tracks content distribution, and identifies gaps

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const CONFIG = {
    contentDir: path.join(__dirname, '../src/blog'),
    outputDir: path.join(__dirname, '../reports'),
    weeksAhead: 4,
    minPostsPerWeek: 3,
    hubDistributionTarget: {
        'tiktok': 0.3,
        'instagram': 0.25,
        'youtube': 0.25,
        'ai-tools': 0.2
    }
};

// Ensure output directory exists
if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
}

class ContentCalendar {
    constructor() {
        this.posts = [];
        this.calendar = {};
        this.gaps = [];
        this.hubDistribution = {};
    }

    // Load all blog posts
    loadPosts() {
        const files = fs.readdirSync(CONFIG.contentDir)
            .filter(file => file.endsWith('.md'));

        this.posts = files.map(file => {
            const filePath = path.join(CONFIG.contentDir, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            const { data } = matter(content);

            return {
                filename: file,
                title: data.title || 'Untitled',
                date: data.date ? new Date(data.date) : null,
                hub: data.hub || 'uncategorized',
                tags: data.tags || [],
                status: this.determineStatus(data),
                author: data.author || 'Unknown'
            };
        }).filter(post => post.date); // Only include posts with dates

        console.log(`✅ Loaded ${this.posts.length} posts`);
    }

    // Determine post status
    determineStatus(frontmatter) {
        if (frontmatter.draft === true) return 'draft';
        if (frontmatter.scheduled === true) return 'scheduled';
        if (frontmatter.date && new Date(frontmatter.date) > new Date()) return 'scheduled';
        return 'published';
    }

    // Generate calendar for next N weeks
    generateCalendar() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Initialize calendar structure
        for (let i = 0; i < CONFIG.weeksAhead; i++) {
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() + (i * 7));

            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);

            const weekKey = this.getWeekKey(weekStart);
            this.calendar[weekKey] = {
                weekStart,
                weekEnd,
                posts: [],
                hubDistribution: {},
                postCount: 0
            };
        }

        // Populate calendar with scheduled/published posts
        this.posts.forEach(post => {
            if (!post.date) return;

            const postDate = new Date(post.date);
            const weekKey = this.getWeekKey(postDate);

            if (this.calendar[weekKey]) {
                this.calendar[weekKey].posts.push(post);
                this.calendar[weekKey].postCount++;

                // Track hub distribution
                const hub = post.hub || 'uncategorized';
                this.calendar[weekKey].hubDistribution[hub] =
                    (this.calendar[weekKey].hubDistribution[hub] || 0) + 1;
            }
        });

        console.log(`✅ Generated ${CONFIG.weeksAhead}-week calendar`);
    }

    // Get week key (YYYY-WW format)
    getWeekKey(date) {
        const year = date.getFullYear();
        const weekNum = this.getWeekNumber(date);
        return `${year}-W${String(weekNum).padStart(2, '0')}`;
    }

    // Get ISO week number
    getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }

    // Identify content gaps
    identifyGaps() {
        Object.entries(this.calendar).forEach(([weekKey, week]) => {
            const issues = [];

            // Check minimum posts per week
            if (week.postCount < CONFIG.minPostsPerWeek) {
                issues.push({
                    type: 'low_volume',
                    severity: 'high',
                    message: `Only ${week.postCount} posts scheduled (target: ${CONFIG.minPostsPerWeek})`
                });
            }

            // Check hub distribution
            const totalPosts = week.postCount;
            if (totalPosts > 0) {
                Object.entries(CONFIG.hubDistributionTarget).forEach(([hub, targetRatio]) => {
                    const actualCount = week.hubDistribution[hub] || 0;
                    const actualRatio = actualCount / totalPosts;
                    const deviation = Math.abs(actualRatio - targetRatio);

                    if (deviation > 0.2) { // 20% deviation threshold
                        issues.push({
                            type: 'hub_imbalance',
                            severity: 'medium',
                            hub,
                            message: `${hub} content is ${Math.round(actualRatio * 100)}% (target: ${Math.round(targetRatio * 100)}%)`
                        });
                    }
                });
            }

            if (issues.length > 0) {
                this.gaps.push({
                    weekKey,
                    weekStart: week.weekStart,
                    weekEnd: week.weekEnd,
                    issues
                });
            }
        });

        console.log(`⚠️  Identified ${this.gaps.length} weeks with content gaps`);
    }

    // Calculate overall hub distribution
    calculateHubDistribution() {
        const hubCounts = {};
        let total = 0;

        this.posts.forEach(post => {
            const hub = post.hub || 'uncategorized';
            hubCounts[hub] = (hubCounts[hub] || 0) + 1;
            total++;
        });

        Object.entries(hubCounts).forEach(([hub, count]) => {
            this.hubDistribution[hub] = {
                count,
                percentage: Math.round((count / total) * 100),
                target: Math.round((CONFIG.hubDistributionTarget[hub] || 0) * 100)
            };
        });
    }

    // Identify seasonal content opportunities
    identifySeasonalOpportunities() {
        const opportunities = [];
        const today = new Date();
        const currentMonth = today.getMonth();

        // Define seasonal opportunities
        const seasonalEvents = [
            { month: 0, name: 'New Year Content Strategy', hubs: ['all'] },
            { month: 1, name: 'Valentine\'s Day Marketing', hubs: ['instagram', 'tiktok'] },
            { month: 2, name: 'Spring Content Refresh', hubs: ['all'] },
            { month: 3, name: 'Easter Marketing', hubs: ['instagram', 'tiktok'] },
            { month: 4, name: 'Mother\'s Day Campaigns', hubs: ['instagram', 'tiktok'] },
            { month: 5, name: 'Summer Content Planning', hubs: ['all'] },
            { month: 6, name: 'Mid-Year Review', hubs: ['all'] },
            { month: 8, name: 'Back to School Marketing', hubs: ['tiktok', 'youtube'] },
            { month: 9, name: 'Halloween Content', hubs: ['tiktok', 'instagram'] },
            { month: 10, name: 'Black Friday/Cyber Monday Prep', hubs: ['all'] },
            { month: 11, name: 'Holiday Marketing Season', hubs: ['all'] }
        ];

        // Check upcoming 2 months
        for (let i = 0; i < 2; i++) {
            const checkMonth = (currentMonth + i) % 12;
            const relevantEvents = seasonalEvents.filter(e => e.month === checkMonth);

            relevantEvents.forEach(event => {
                opportunities.push({
                    month: checkMonth,
                    monthName: new Date(2024, checkMonth, 1).toLocaleString('default', { month: 'long' }),
                    event: event.name,
                    recommendedHubs: event.hubs,
                    daysUntil: this.getDaysUntilMonth(checkMonth)
                });
            });
        }

        return opportunities;
    }

    // Get days until a specific month
    getDaysUntilMonth(targetMonth) {
        const today = new Date();
        const target = new Date(today.getFullYear(), targetMonth, 1);

        if (target < today) {
            target.setFullYear(target.getFullYear() + 1);
        }

        const diffTime = target - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // Generate Google Calendar ICS format
    generateICSFile() {
        const icsLines = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//EvolvedLotus Blog//Content Calendar//EN',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            'X-WR-CALNAME:Blog Content Calendar',
            'X-WR-TIMEZONE:UTC'
        ];

        // Add scheduled posts as events
        this.posts
            .filter(post => post.status === 'scheduled' || post.status === 'published')
            .forEach(post => {
                const date = new Date(post.date);
                const dateStr = date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

                icsLines.push('BEGIN:VEVENT');
                icsLines.push(`UID:${post.filename}@evolvedlotus.com`);
                icsLines.push(`DTSTAMP:${dateStr}`);
                icsLines.push(`DTSTART:${dateStr}`);
                icsLines.push(`SUMMARY:Publish: ${post.title}`);
                icsLines.push(`DESCRIPTION:Hub: ${post.hub}\\nAuthor: ${post.author}\\nStatus: ${post.status}`);
                icsLines.push(`CATEGORIES:${post.hub},blog-post`);
                icsLines.push('STATUS:CONFIRMED');
                icsLines.push('END:VEVENT');
            });

        icsLines.push('END:VCALENDAR');

        const icsPath = path.join(CONFIG.outputDir, 'content-calendar.ics');
        fs.writeFileSync(icsPath, icsLines.join('\r\n'));

        console.log(`✅ Generated Google Calendar file: ${icsPath}`);
        return icsPath;
    }

    // Generate comprehensive report
    generateReport() {
        const seasonalOpportunities = this.identifySeasonalOpportunities();

        const report = {
            generatedAt: new Date().toISOString(),
            summary: {
                totalPosts: this.posts.length,
                scheduledPosts: this.posts.filter(p => p.status === 'scheduled').length,
                draftPosts: this.posts.filter(p => p.status === 'draft').length,
                weeksPlanned: CONFIG.weeksAhead,
                gapsIdentified: this.gaps.length
            },
            calendar: Object.entries(this.calendar).map(([weekKey, week]) => ({
                week: weekKey,
                dateRange: `${week.weekStart.toLocaleDateString()} - ${week.weekEnd.toLocaleDateString()}`,
                postCount: week.postCount,
                posts: week.posts.map(p => ({
                    title: p.title,
                    date: p.date.toLocaleDateString(),
                    hub: p.hub,
                    status: p.status
                })),
                hubDistribution: week.hubDistribution,
                meetsMinimum: week.postCount >= CONFIG.minPostsPerWeek
            })),
            gaps: this.gaps.map(gap => ({
                week: gap.weekKey,
                dateRange: `${gap.weekStart.toLocaleDateString()} - ${gap.weekEnd.toLocaleDateString()}`,
                issues: gap.issues
            })),
            hubDistribution: this.hubDistribution,
            seasonalOpportunities,
            recommendations: this.generateRecommendations()
        };

        // Save JSON report
        const jsonPath = path.join(CONFIG.outputDir, 'content-calendar-report.json');
        fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

        // Save human-readable report
        const readablePath = path.join(CONFIG.outputDir, 'content-calendar-report.md');
        fs.writeFileSync(readablePath, this.formatReadableReport(report));

        console.log(`✅ Generated reports:`);
        console.log(`   - ${jsonPath}`);
        console.log(`   - ${readablePath}`);

        return report;
    }

    // Generate actionable recommendations
    generateRecommendations() {
        const recommendations = [];

        // Check for gaps
        if (this.gaps.length > 0) {
            recommendations.push({
                priority: 'high',
                category: 'content_volume',
                action: `Schedule ${this.gaps.length * 2} more posts to fill content gaps`
            });
        }

        // Check hub distribution
        Object.entries(this.hubDistribution).forEach(([hub, stats]) => {
            const deviation = Math.abs(stats.percentage - stats.target);
            if (deviation > 10) {
                const direction = stats.percentage < stats.target ? 'increase' : 'decrease';
                recommendations.push({
                    priority: 'medium',
                    category: 'hub_balance',
                    action: `${direction.charAt(0).toUpperCase() + direction.slice(1)} ${hub} content (currently ${stats.percentage}%, target ${stats.target}%)`
                });
            }
        });

        // Check for upcoming seasonal opportunities
        const urgentOpportunities = this.identifySeasonalOpportunities()
            .filter(opp => opp.daysUntil < 30);

        urgentOpportunities.forEach(opp => {
            recommendations.push({
                priority: 'high',
                category: 'seasonal',
                action: `Create ${opp.event} content (${opp.daysUntil} days until ${opp.monthName})`
            });
        });

        return recommendations;
    }

    // Format readable report
    formatReadableReport(report) {
        let output = `# Content Calendar Report\n\n`;
        output += `Generated: ${new Date(report.generatedAt).toLocaleString()}\n\n`;

        // Summary
        output += `## 📊 Summary\n\n`;
        output += `- **Total Posts:** ${report.summary.totalPosts}\n`;
        output += `- **Scheduled:** ${report.summary.scheduledPosts}\n`;
        output += `- **Drafts:** ${report.summary.draftPosts}\n`;
        output += `- **Planning Horizon:** ${report.summary.weeksPlanned} weeks\n`;
        output += `- **Content Gaps:** ${report.summary.gapsIdentified} weeks\n\n`;

        // Calendar
        output += `## 📅 ${CONFIG.weeksAhead}-Week Calendar\n\n`;
        report.calendar.forEach(week => {
            const status = week.meetsMinimum ? '✅' : '⚠️';
            output += `### ${status} ${week.week} (${week.dateRange})\n\n`;
            output += `**Posts Scheduled:** ${week.postCount}\n\n`;

            if (week.posts.length > 0) {
                week.posts.forEach(post => {
                    output += `- **${post.title}** - ${post.date} (${post.hub}) [${post.status}]\n`;
                });
                output += `\n`;
            } else {
                output += `*No posts scheduled for this week*\n\n`;
            }
        });

        // Gaps
        if (report.gaps.length > 0) {
            output += `## ⚠️ Content Gaps\n\n`;
            report.gaps.forEach(gap => {
                output += `### ${gap.week} (${gap.dateRange})\n\n`;
                gap.issues.forEach(issue => {
                    const emoji = issue.severity === 'high' ? '🔴' : '🟡';
                    output += `${emoji} **${issue.type}:** ${issue.message}\n`;
                });
                output += `\n`;
            });
        }

        // Hub Distribution
        output += `## 🎯 Hub Distribution\n\n`;
        Object.entries(report.hubDistribution).forEach(([hub, stats]) => {
            const status = Math.abs(stats.percentage - stats.target) <= 10 ? '✅' : '⚠️';
            output += `${status} **${hub}:** ${stats.count} posts (${stats.percentage}% - target: ${stats.target}%)\n`;
        });
        output += `\n`;

        // Seasonal Opportunities
        if (report.seasonalOpportunities.length > 0) {
            output += `## 🎉 Seasonal Opportunities\n\n`;
            report.seasonalOpportunities.forEach(opp => {
                output += `- **${opp.event}** (${opp.monthName}) - ${opp.daysUntil} days away\n`;
                output += `  - Recommended hubs: ${opp.recommendedHubs.join(', ')}\n`;
            });
            output += `\n`;
        }

        // Recommendations
        if (report.recommendations.length > 0) {
            output += `## 💡 Recommendations\n\n`;
            const highPriority = report.recommendations.filter(r => r.priority === 'high');
            const mediumPriority = report.recommendations.filter(r => r.priority === 'medium');

            if (highPriority.length > 0) {
                output += `### 🔴 High Priority\n\n`;
                highPriority.forEach(rec => {
                    output += `- ${rec.action}\n`;
                });
                output += `\n`;
            }

            if (mediumPriority.length > 0) {
                output += `### 🟡 Medium Priority\n\n`;
                mediumPriority.forEach(rec => {
                    output += `- ${rec.action}\n`;
                });
                output += `\n`;
            }
        }

        return output;
    }

    // Run full analysis
    run() {
        console.log('🚀 Starting Content Calendar Analysis...\n');

        this.loadPosts();
        this.generateCalendar();
        this.calculateHubDistribution();
        this.identifyGaps();

        const report = this.generateReport();
        this.generateICSFile();

        console.log('\n✅ Content Calendar Analysis Complete!');
        console.log(`\n📋 Next Steps:`);
        console.log(`   1. Review ${CONFIG.outputDir}/content-calendar-report.md`);
        console.log(`   2. Import ${CONFIG.outputDir}/content-calendar.ics to Google Calendar`);
        console.log(`   3. Address ${this.gaps.length} content gaps`);

        return report;
    }
}

// Run if called directly
if (require.main === module) {
    const calendar = new ContentCalendar();
    calendar.run();
}

module.exports = ContentCalendar;
