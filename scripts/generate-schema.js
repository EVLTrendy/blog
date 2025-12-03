// Schema Markup Generator
// Auto-generates JSON-LD schema from frontmatter for FAQ, HowTo, and VideoObject

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

function generateFAQSchema(faqs) {
    if (!faqs || faqs.length === 0) return null;

    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqs.map(faq => ({
            "@type": "Question",
            "name": faq.question,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answer
            }
        }))
    };
}

function generateHowToSchema(frontmatter) {
    if (frontmatter.schemaType !== 'HowTo') return null;

    const steps = frontmatter.howToSteps || [];

    return {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": frontmatter.title,
        "description": frontmatter.description,
        "image": frontmatter.image,
        "totalTime": frontmatter.totalTime || "PT30M",
        "estimatedCost": {
            "@type": "MonetaryAmount",
            "currency": "USD",
            "value": "0"
        },
        "step": steps.map((step, index) => ({
            "@type": "HowToStep",
            "position": index + 1,
            "name": step.name,
            "text": step.text,
            "image": step.image || frontmatter.image
        }))
    };
}

function generateVideoObjectSchema(frontmatter) {
    if (!frontmatter.videoUrl) return null;

    return {
        "@context": "https://schema.org",
        "@type": "VideoObject",
        "name": frontmatter.title,
        "description": frontmatter.description,
        "thumbnailUrl": frontmatter.videoThumbnail || frontmatter.image,
        "uploadDate": frontmatter.date,
        "duration": frontmatter.videoDuration || "PT10M",
        "contentUrl": frontmatter.videoUrl,
        "embedUrl": frontmatter.videoUrl,
        "publisher": {
            "@type": "Organization",
            "name": "EvolvedLotus",
            "logo": {
                "@type": "ImageObject",
                "url": "https://blog.evolvedlotus.com/assets/logo.png"
            }
        }
    };
}

function processMarkdownFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const { data: frontmatter } = matter(content);

    const schemas = [];

    // Generate FAQ schema
    if (frontmatter.faqs) {
        const faqSchema = generateFAQSchema(frontmatter.faqs);
        if (faqSchema) schemas.push(faqSchema);
    }

    // Generate HowTo schema
    if (frontmatter.schemaType === 'HowTo') {
        const howToSchema = generateHowToSchema(frontmatter);
        if (howToSchema) schemas.push(howToSchema);
    }

    // Generate VideoObject schema
    if (frontmatter.videoUrl) {
        const videoSchema = generateVideoObjectSchema(frontmatter);
        if (videoSchema) schemas.push(videoSchema);
    }

    return schemas;
}

function main() {
    console.log('📊 Schema Markup Generator\n');
    console.log('This script analyzes frontmatter and suggests schema markup.\n');

    const blogDir = path.join(__dirname, '..', 'src', 'blog');
    const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.md'));

    let totalSchemas = 0;
    let filesWithSchemas = 0;

    files.forEach(file => {
        const filePath = path.join(blogDir, file);
        const schemas = processMarkdownFile(filePath);

        if (schemas.length > 0) {
            filesWithSchemas++;
            totalSchemas += schemas.length;
            console.log(`✅ ${file}: ${schemas.length} schema(s) generated`);
        }
    });

    console.log(`\n📈 Summary:`);
    console.log(`   Files processed: ${files.length}`);
    console.log(`   Files with schemas: ${filesWithSchemas}`);
    console.log(`   Total schemas: ${totalSchemas}`);
    console.log(`\n💡 To add schemas to your posts, update frontmatter with:`);
    console.log(`   - faqs: [{question: "...", answer: "..."}]`);
    console.log(`   - schemaType: "HowTo"`);
    console.log(`   - videoUrl: "https://youtube.com/..."`);
}

main();
