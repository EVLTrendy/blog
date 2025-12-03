// Competitor Analysis Dashboard
// Tracks competitor post frequency, trending topics, content gaps, and keyword opportunities

const fs = require('fs');
const path = require('path');

const CONFIG = {
    outputDir: path.join(__dirname, '../reports'),
    competitorDataFile: path.join(__dirname, '../data/competitors.json'),
    trendingTopicsFile: path.join(__dirname, '../data/trending-topics.json'),
    updateInterval: 7 // days
};

// Ensure directories exist
[CONFIG.outputDir, path.dirname(CONFIG.competitorDataFile)].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

class CompetitorAnalyzer {
    constructor() {
        this.competitors = this.loadCompetitors();
        this.trendingTopics = this.loadTrendingTopics();
        this.analysis = {
            postFrequency: {},
            topicCoverage: {},
            contentGaps: [],
            keywordOpportunities: [],
            recommendations: []
        };
    }

    // Load competitor data
    loadCompetitors() {
        if (fs.existsSync(CONFIG.competitorDataFile)) {
            return JSON.parse(fs.readFileSync(CONFIG.competitorDataFile, 'utf-8'));
        }

        // Default competitor structure
        const defaultCompetitors = {
            lastUpdated: new Date().toISOString(),
            competitors: [
                {
                    name: 'Social Media Examiner',
                    url: 'https://www.socialmediaexaminer.com',
                    focus: ['social-media', 'marketing', 'tiktok', 'instagram'],
                    postFrequency: 15, // posts per month
                    avgEngagement: 'high',
                    topTopics: ['TikTok Marketing', 'Instagram Reels', 'Social Media Strategy'],
                    lastChecked: null
                },
                {
                    name: 'Buffer Blog',
                    url: 'https://buffer.com/resources',
                    focus: ['social-media', 'content-marketing', 'analytics'],
                    postFrequency: 12,
                    avgEngagement: 'high',
                    topTopics: ['Social Media Analytics', 'Content Planning', 'Engagement Tips'],
                    lastChecked: null
                },
                {
                    name: 'Hootsuite Blog',
                    url: 'https://blog.hootsuite.com',
                    focus: ['social-media', 'marketing', 'trends'],
                    postFrequency: 20,
                    avgEngagement: 'high',
                    topTopics: ['Social Media Trends', 'Platform Updates', 'Marketing Strategy'],
                    lastChecked: null
                },
                {
                    name: 'Later Blog',
                    url: 'https://later.com/blog',
                    focus: ['instagram', 'tiktok', 'visual-content'],
                    postFrequency: 10,
                    avgEngagement: 'medium',
                    topTopics: ['Instagram Marketing', 'Visual Content', 'Influencer Tips'],
                    lastChecked: null
                },
                {
                    name: 'Neil Patel Blog',
                    url: 'https://neilpatel.com/blog',
                    focus: ['seo', 'content-marketing', 'digital-marketing'],
                    postFrequency: 25,
                    avgEngagement: 'very-high',
                    topTopics: ['SEO Strategy', 'Content Marketing', 'Digital Trends'],
                    lastChecked: null
                }
            ]
        };

        this.saveCompetitors(defaultCompetitors);
        return defaultCompetitors;
    }

    // Load trending topics
    loadTrendingTopics() {
        if (fs.existsSync(CONFIG.trendingTopicsFile)) {
            return JSON.parse(fs.readFileSync(CONFIG.trendingTopicsFile, 'utf-8'));
        }

        // Default trending topics structure
        const defaultTopics = {
            lastUpdated: new Date().toISOString(),
            topics: [
                {
                    topic: 'AI Content Creation Tools',
                    category: 'ai-tools',
                    trendScore: 95,
                    searchVolume: 'high',
                    competition: 'medium',
                    relevance: 'high',
                    keywords: ['AI writing tools', 'ChatGPT for content', 'AI video generation']
                },
                {
                    topic: 'TikTok Shop Marketing',
                    category: 'tiktok',
                    trendScore: 90,
                    searchVolume: 'very-high',
                    competition: 'high',
                    relevance: 'high',
                    keywords: ['TikTok Shop', 'TikTok commerce', 'social commerce']
                },
                {
                    topic: 'Instagram Threads Strategy',
                    category: 'instagram',
                    trendScore: 85,
                    searchVolume: 'high',
                    competition: 'medium',
                    relevance: 'medium',
                    keywords: ['Threads app', 'Instagram Threads marketing', 'text-based content']
                },
                {
                    topic: 'YouTube Shorts Monetization',
                    category: 'youtube',
                    trendScore: 88,
                    searchVolume: 'high',
                    competition: 'high',
                    relevance: 'high',
                    keywords: ['YouTube Shorts money', 'short-form video monetization', 'Shorts revenue']
                },
                {
                    topic: 'Authentic Content Marketing',
                    category: 'content-strategy',
                    trendScore: 82,
                    searchVolume: 'medium',
                    competition: 'low',
                    relevance: 'high',
                    keywords: ['authentic marketing', 'genuine content', 'brand authenticity']
                }
            ]
        };

        this.saveTrendingTopics(defaultTopics);
        return defaultTopics;
    }

    // Save competitor data
    saveCompetitors(data) {
        fs.writeFileSync(CONFIG.competitorDataFile, JSON.stringify(data, null, 2));
    }

    // Save trending topics
    saveTrendingTopics(data) {
        fs.writeFileSync(CONFIG.trendingTopicsFile, JSON.stringify(data, null, 2));
    }

    // Analyze post frequency
    analyzePostFrequency() {
        const ourPostFrequency = 8; // Estimate - could be calculated from actual posts

        this.competitors.competitors.forEach(comp => {
            const comparison = comp.postFrequency / ourPostFrequency;

            this.analysis.postFrequency[comp.name] = {
                theirFrequency: comp.postFrequency,
                ourFrequency: ourPostFrequency,
                ratio: comparison.toFixed(2),
                status: comparison > 1.5 ? 'behind' : comparison < 0.7 ? 'ahead' : 'competitive'
            };
        });

        console.log('✅ Analyzed post frequency');
    }

    // Analyze topic coverage
    analyzeTopicCoverage() {
        const allCompetitorTopics = new Set();

        this.competitors.competitors.forEach(comp => {
            comp.topTopics.forEach(topic => allCompetitorTopics.add(topic));
        });

        // Our current topics (from hubs)
        const ourTopics = new Set([
            'TikTok Marketing',
            'Instagram Marketing',
            'YouTube Strategy',
            'AI Tools for Content Creation'
        ]);

        // Find gaps
        const gaps = Array.from(allCompetitorTopics).filter(topic => !ourTopics.has(topic));

        this.analysis.topicCoverage = {
            ourTopics: Array.from(ourTopics),
            competitorTopics: Array.from(allCompetitorTopics),
            coverage: ourTopics.size / allCompetitorTopics.size,
            gaps
        };

        console.log('✅ Analyzed topic coverage');
    }

    // Identify content gaps
    identifyContentGaps() {
        const gaps = [];

        // Check trending topics we haven't covered
        this.trendingTopics.topics.forEach(trend => {
            if (trend.relevance === 'high' && trend.competition !== 'very-high') {
                gaps.push({
                    type: 'trending_topic',
                    priority: trend.trendScore > 85 ? 'high' : 'medium',
                    topic: trend.topic,
                    category: trend.category,
                    reason: `High trend score (${trend.trendScore}) with ${trend.competition} competition`,
                    keywords: trend.keywords,
                    estimatedSearchVolume: trend.searchVolume
                });
            }
        });

        // Check competitor topics we're missing
        this.analysis.topicCoverage.gaps.forEach(topic => {
            const competitorCount = this.competitors.competitors.filter(c =>
                c.topTopics.includes(topic)
            ).length;

            if (competitorCount >= 2) {
                gaps.push({
                    type: 'competitor_topic',
                    priority: competitorCount >= 3 ? 'high' : 'medium',
                    topic,
                    reason: `Covered by ${competitorCount} competitors`,
                    competitorCount
                });
            }
        });

        this.analysis.contentGaps = gaps.sort((a, b) => {
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });

        console.log(`⚠️  Identified ${gaps.length} content gaps`);
    }

    // Identify keyword opportunities
    identifyKeywordOpportunities() {
        const opportunities = [];

        this.trendingTopics.topics.forEach(trend => {
            trend.keywords.forEach(keyword => {
                opportunities.push({
                    keyword,
                    topic: trend.topic,
                    category: trend.category,
                    searchVolume: trend.searchVolume,
                    competition: trend.competition,
                    priority: this.calculateKeywordPriority(trend.searchVolume, trend.competition),
                    recommendedAction: this.getKeywordAction(trend.searchVolume, trend.competition)
                });
            });
        });

        this.analysis.keywordOpportunities = opportunities.sort((a, b) => {
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });

        console.log(`✅ Identified ${opportunities.length} keyword opportunities`);
    }

    // Calculate keyword priority
    calculateKeywordPriority(searchVolume, competition) {
        const volumeScore = { 'very-high': 3, 'high': 2, 'medium': 1, 'low': 0 };
        const compScore = { 'very-high': 0, 'high': 1, 'medium': 2, 'low': 3 };

        const score = volumeScore[searchVolume] + compScore[competition];

        if (score >= 5) return 'high';
        if (score >= 3) return 'medium';
        return 'low';
    }

    // Get recommended action for keyword
    getKeywordAction(searchVolume, competition) {
        if (searchVolume === 'very-high' && competition === 'low') {
            return 'Create comprehensive pillar content immediately';
        }
        if (searchVolume === 'high' && competition === 'medium') {
            return 'Create detailed guide with unique angle';
        }
        if (searchVolume === 'medium' && competition === 'low') {
            return 'Create focused tutorial or how-to';
        }
        return 'Monitor and consider for future content';
    }

    // Generate recommendations
    generateRecommendations() {
        const recommendations = [];

        // Post frequency recommendations
        const behindCompetitors = Object.entries(this.analysis.postFrequency)
            .filter(([_, data]) => data.status === 'behind');

        if (behindCompetitors.length >= 3) {
            recommendations.push({
                priority: 'high',
                category: 'publishing_frequency',
                action: 'Increase publishing frequency to 12-15 posts per month to match competitors',
                impact: 'Improved SEO, more traffic, better audience engagement'
            });
        }

        // Content gap recommendations
        const highPriorityGaps = this.analysis.contentGaps.filter(g => g.priority === 'high');

        highPriorityGaps.slice(0, 3).forEach(gap => {
            recommendations.push({
                priority: 'high',
                category: 'content_gap',
                action: `Create content about "${gap.topic}"`,
                impact: gap.reason,
                keywords: gap.keywords
            });
        });

        // Keyword opportunities
        const topKeywords = this.analysis.keywordOpportunities
            .filter(k => k.priority === 'high')
            .slice(0, 5);

        topKeywords.forEach(kw => {
            recommendations.push({
                priority: 'medium',
                category: 'keyword_opportunity',
                action: `Target keyword: "${kw.keyword}"`,
                impact: `${kw.searchVolume} search volume, ${kw.competition} competition`,
                recommendedAction: kw.recommendedAction
            });
        });

        // Trending topic recommendations
        const urgentTrends = this.trendingTopics.topics
            .filter(t => t.trendScore > 85 && t.relevance === 'high')
            .slice(0, 3);

        urgentTrends.forEach(trend => {
            recommendations.push({
                priority: 'high',
                category: 'trending_topic',
                action: `Cover trending topic: "${trend.topic}"`,
                impact: `Trend score: ${trend.trendScore}/100`,
                keywords: trend.keywords
            });
        });

        this.analysis.recommendations = recommendations;
        console.log(`💡 Generated ${recommendations.length} recommendations`);
    }

    // Generate comprehensive report
    generateReport() {
        const report = {
            generatedAt: new Date().toISOString(),
            summary: {
                competitorsTracked: this.competitors.competitors.length,
                trendingTopicsMonitored: this.trendingTopics.topics.length,
                contentGapsIdentified: this.analysis.contentGaps.length,
                keywordOpportunities: this.analysis.keywordOpportunities.length,
                highPriorityActions: this.analysis.recommendations.filter(r => r.priority === 'high').length
            },
            postFrequency: this.analysis.postFrequency,
            topicCoverage: this.analysis.topicCoverage,
            contentGaps: this.analysis.contentGaps,
            keywordOpportunities: this.analysis.keywordOpportunities,
            trendingTopics: this.trendingTopics.topics,
            recommendations: this.analysis.recommendations
        };

        // Save JSON report
        const jsonPath = path.join(CONFIG.outputDir, 'competitor-analysis-report.json');
        fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

        // Save readable report
        const readablePath = path.join(CONFIG.outputDir, 'competitor-analysis-report.md');
        fs.writeFileSync(readablePath, this.formatReadableReport(report));

        console.log(`✅ Generated reports:`);
        console.log(`   - ${jsonPath}`);
        console.log(`   - ${readablePath}`);

        return report;
    }

    // Format readable report
    formatReadableReport(report) {
        let output = `# Competitor Analysis Report\n\n`;
        output += `Generated: ${new Date(report.generatedAt).toLocaleString()}\n\n`;

        // Summary
        output += `## 📊 Summary\n\n`;
        output += `- **Competitors Tracked:** ${report.summary.competitorsTracked}\n`;
        output += `- **Trending Topics:** ${report.summary.trendingTopicsMonitored}\n`;
        output += `- **Content Gaps:** ${report.summary.contentGapsIdentified}\n`;
        output += `- **Keyword Opportunities:** ${report.summary.keywordOpportunities}\n`;
        output += `- **High Priority Actions:** ${report.summary.highPriorityActions}\n\n`;

        // Post Frequency
        output += `## 📈 Post Frequency Comparison\n\n`;
        output += `| Competitor | Their Frequency | Our Frequency | Ratio | Status |\n`;
        output += `|------------|----------------|---------------|-------|--------|\n`;
        Object.entries(report.postFrequency).forEach(([name, data]) => {
            const statusEmoji = data.status === 'ahead' ? '✅' : data.status === 'behind' ? '⚠️' : '➖';
            output += `| ${name} | ${data.theirFrequency}/mo | ${data.ourFrequency}/mo | ${data.ratio}x | ${statusEmoji} ${data.status} |\n`;
        });
        output += `\n`;

        // Topic Coverage
        output += `## 🎯 Topic Coverage\n\n`;
        output += `**Coverage Rate:** ${Math.round(report.topicCoverage.coverage * 100)}%\n\n`;
        output += `**Our Topics:**\n`;
        report.topicCoverage.ourTopics.forEach(topic => {
            output += `- ✅ ${topic}\n`;
        });
        output += `\n**Missing Topics:**\n`;
        report.topicCoverage.gaps.forEach(topic => {
            output += `- ⚠️ ${topic}\n`;
        });
        output += `\n`;

        // Content Gaps
        if (report.contentGaps.length > 0) {
            output += `## 🔍 Content Gaps\n\n`;

            const highPriority = report.contentGaps.filter(g => g.priority === 'high');
            const mediumPriority = report.contentGaps.filter(g => g.priority === 'medium');

            if (highPriority.length > 0) {
                output += `### 🔴 High Priority\n\n`;
                highPriority.forEach(gap => {
                    output += `**${gap.topic}**\n`;
                    output += `- Type: ${gap.type}\n`;
                    output += `- Reason: ${gap.reason}\n`;
                    if (gap.keywords) {
                        output += `- Keywords: ${gap.keywords.join(', ')}\n`;
                    }
                    output += `\n`;
                });
            }

            if (mediumPriority.length > 0) {
                output += `### 🟡 Medium Priority\n\n`;
                mediumPriority.forEach(gap => {
                    output += `- **${gap.topic}** - ${gap.reason}\n`;
                });
                output += `\n`;
            }
        }

        // Trending Topics
        output += `## 🔥 Trending Topics\n\n`;
        report.trendingTopics.forEach(trend => {
            const emoji = trend.trendScore > 90 ? '🔥' : trend.trendScore > 80 ? '⭐' : '📈';
            output += `${emoji} **${trend.topic}** (Score: ${trend.trendScore}/100)\n`;
            output += `- Category: ${trend.category}\n`;
            output += `- Search Volume: ${trend.searchVolume}\n`;
            output += `- Competition: ${trend.competition}\n`;
            output += `- Keywords: ${trend.keywords.join(', ')}\n\n`;
        });

        // Keyword Opportunities
        const topKeywords = report.keywordOpportunities.filter(k => k.priority === 'high').slice(0, 10);
        if (topKeywords.length > 0) {
            output += `## 🔑 Top Keyword Opportunities\n\n`;
            output += `| Keyword | Search Volume | Competition | Action |\n`;
            output += `|---------|---------------|-------------|--------|\n`;
            topKeywords.forEach(kw => {
                output += `| ${kw.keyword} | ${kw.searchVolume} | ${kw.competition} | ${kw.recommendedAction} |\n`;
            });
            output += `\n`;
        }

        // Recommendations
        if (report.recommendations.length > 0) {
            output += `## 💡 Recommendations\n\n`;

            const highPriority = report.recommendations.filter(r => r.priority === 'high');
            const mediumPriority = report.recommendations.filter(r => r.priority === 'medium');

            if (highPriority.length > 0) {
                output += `### 🔴 High Priority Actions\n\n`;
                highPriority.forEach((rec, i) => {
                    output += `${i + 1}. **${rec.action}**\n`;
                    output += `   - Category: ${rec.category}\n`;
                    output += `   - Impact: ${rec.impact}\n`;
                    if (rec.keywords) {
                        output += `   - Keywords: ${rec.keywords.join(', ')}\n`;
                    }
                    output += `\n`;
                });
            }

            if (mediumPriority.length > 0) {
                output += `### 🟡 Medium Priority Actions\n\n`;
                mediumPriority.forEach((rec, i) => {
                    output += `${i + 1}. ${rec.action}\n`;
                });
                output += `\n`;
            }
        }

        output += `---\n\n`;
        output += `*Update competitor data in \`${CONFIG.competitorDataFile}\`*\n`;
        output += `*Update trending topics in \`${CONFIG.trendingTopicsFile}\`*\n`;

        return output;
    }

    // Run full analysis
    run() {
        console.log('🚀 Starting Competitor Analysis...\n');

        this.analyzePostFrequency();
        this.analyzeTopicCoverage();
        this.identifyContentGaps();
        this.identifyKeywordOpportunities();
        this.generateRecommendations();

        const report = this.generateReport();

        console.log('\n✅ Competitor Analysis Complete!');
        console.log(`\n📋 Next Steps:`);
        console.log(`   1. Review ${CONFIG.outputDir}/competitor-analysis-report.md`);
        console.log(`   2. Update competitor data in ${CONFIG.competitorDataFile}`);
        console.log(`   3. Implement ${report.summary.highPriorityActions} high-priority actions`);

        return report;
    }
}

// Run if called directly
if (require.main === module) {
    const analyzer = new CompetitorAnalyzer();
    analyzer.run();
}

module.exports = CompetitorAnalyzer;
