// Critical CSS Inline Generator
// Extracts above-the-fold CSS for homepage, blog listing, and article pages
// Inlines critical CSS in <head> for faster initial render

const fs = require('fs');
const path = require('path');

// Critical CSS for different page types
const criticalCSS = {
    // Homepage critical CSS
    homepage: `
    :root { --bg-primary: #ffffff; --bg-secondary: #f1f5f9; --text-primary: #1e293b; --text-secondary: #64748b; --card-bg: #ffffff; --card-border: #e2e8f0; --shadow-color: rgba(0, 0, 0, 0.08); }
    [data-theme="dark"] { --bg-primary: #0f172a; --bg-secondary: #1e293b; --text-primary: #e2e8f0; --text-secondary: #94a3b8; --card-bg: #1e293b; --card-border: #334155; --shadow-color: rgba(0, 0, 0, 0.3); }
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; background-color: var(--bg-secondary); color: var(--text-primary); transition: background-color 0.3s ease, color 0.3s ease; }
    header { padding-bottom: 5px; }
    .evl-navcontainer { display: flex; width: 100%; height: 100px; padding-bottom: 10px; box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1); background-color: white; }
    .maindiv { background: linear-gradient(135deg, #f0f5fa 0%, #e3f2fd 100%); min-height: 400px; }
    [data-theme="dark"] .maindiv { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); }
  `,

    // Blog listing critical CSS
    blogListing: `
    :root { --bg-primary: #ffffff; --bg-secondary: #f1f5f9; --text-primary: #1e293b; --text-secondary: #64748b; --card-bg: #ffffff; --card-border: #e2e8f0; --shadow-color: rgba(0, 0, 0, 0.08); }
    [data-theme="dark"] { --bg-primary: #0f172a; --bg-secondary: #1e293b; --text-primary: #e2e8f0; --text-secondary: #94a3b8; --card-bg: #1e293b; --card-border: #334155; --shadow-color: rgba(0, 0, 0, 0.3); }
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; background-color: var(--bg-secondary); color: var(--text-primary); }
    header { padding-bottom: 5px; }
    .evl-navcontainer { display: flex; width: 100%; height: 100px; padding-bottom: 10px; box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1); background-color: white; }
    .blog-posts-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; margin-bottom: 3rem; }
  `,

    // Article page critical CSS
    article: `
    :root { --bg-primary: #ffffff; --bg-secondary: #f1f5f9; --text-primary: #1e293b; --text-secondary: #64748b; --card-bg: #ffffff; --card-border: #e2e8f0; --shadow-color: rgba(0, 0, 0, 0.08); }
    [data-theme="dark"] { --bg-primary: #0f172a; --bg-secondary: #1e293b; --text-primary: #e2e8f0; --text-secondary: #94a3b8; --card-bg: #1e293b; --card-border: #334155; --shadow-color: rgba(0, 0, 0, 0.3); }
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; background-color: var(--bg-secondary); color: var(--text-primary); }
    header { padding-bottom: 5px; }
    .evl-navcontainer { display: flex; width: 100%; height: 100px; padding-bottom: 10px; box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1); background-color: white; }
    .imagediv { position: relative; width: 100%; height: 400px; overflow: hidden; }
    .imagediv img { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain !important; background-color: #f8f9fa; }
    .article_title { font-size: 2.5rem; margin: 2rem 0 1rem; text-align: center; }
    #reading-progress { position: fixed; top: 0; left: 0; width: 0%; height: 3px; background: linear-gradient(90deg, #33bdef 0%, #019ad2 100%); z-index: 9999; transition: width 0.1s ease-out; box-shadow: 0 2px 4px rgba(51, 189, 239, 0.3); }
  `
};

// Minify CSS (basic minification)
function minifyCSS(css) {
    return css
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
        .replace(/\s+/g, ' ') // Collapse whitespace
        .replace(/\s*([{}:;,])\s*/g, '$1') // Remove spaces around punctuation
        .trim();
}

// Generate critical CSS files
function generateCriticalCSS() {
    const outputDir = path.join(__dirname, '..', 'src', '_includes', 'critical-css');

    // Create directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    Object.keys(criticalCSS).forEach(pageType => {
        const minified = minifyCSS(criticalCSS[pageType]);
        const outputPath = path.join(outputDir, `${pageType}.njk`);

        const content = `{# Critical CSS for ${pageType} #}
<style>
${minified}
</style>`;

        fs.writeFileSync(outputPath, content);
        console.log(`✅ Generated critical CSS for ${pageType}: ${(minified.length / 1024).toFixed(2)}KB`);
    });

    console.log('\n💡 Next steps:');
    console.log('   1. Include critical CSS in base.njk: {% include "critical-css/article.njk" %}');
    console.log('   2. Defer non-critical CSS: <link rel="stylesheet" href="/style.css" media="print" onload="this.media=\'all\'">');
    console.log('   3. Test LCP improvements with Lighthouse');
}

console.log('🎨 Generating critical CSS...\n');
generateCriticalCSS();
console.log('\n✨ Critical CSS generation complete!');
