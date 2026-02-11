const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { content, category, currentTitle, availableCategories } = JSON.parse(event.body);
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Missing GROQ_API_KEY' })
      };
    }

    if (!content) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Content is required for analysis.' })
      };
    }

    // System Prompt implementing the Algorithm Outline
    const systemPrompt = `You are a world-class SEO Strategist & Viral Content Expert for 'EvolvedLotus'.
Your goal is to generate **High-Engagement, High-CTR, and SEO-Optimized** metadata for a blog post.

**VALID CATEGORIES**: ${availableCategories ? availableCategories.join(', ') : 'Tech, Business, Marketing'}

### INSTRUCTIONS:

1.  **Analyze Content**: Understand the core value proposition, target audience, and key takeaways.
2.  **Select Category**: Choose the ONE category from the list above that best fits the content.
3.  **Generate Metadata**:
    *   **Title (CRITICAL)**: Must be "Click-Worthy" yet professional. Use **Power Words** (e.g., Ultimate, Essential, Proven, Insane, X Strategies).
        *   *Format*: "[Number] [Adjective] Ways to [Benefit]" OR "How to [Benefit] ( The [Adjective] Guide )".
        *   *Goal*: Maximize CTR while keeping keywords near the front. Max 60 chars.
    *   **Description**: A "Hook" that forces the user to click.
        *   *Structure*: [Problem/Pain Point] + [Solution/Tease] + [Call to Action].
        *   *Goal*: High emotional engagement & SEO relevance. 150-160 chars.
    *   **Keywords**: 5-8 high-volume, low-competition semantic keywords.
    *   **Image Alt**: specific, descriptive text for the hero image.

**Output Format**: Return ONLY valid JSON:
{
  "category": "exact-value-from-list",
  "title": "...",
  "description": "...",
  "keywords": "...",
  "imageAlt": "..."
}`;

    const userPrompt = `
**Current Draft Title**: ${currentTitle || 'Untitled'}
**Draft Content (Excerpt)**:
${content.slice(0, 4000)}

Generate the High-Impact SEO metadata now.`;

    console.log(`Sending request to Groq. Content length: ${content.length}`);

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1024,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Groq API Error (${response.status}): ${errorBody}`);
      throw new Error(`Groq API Error: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('SEO Generation Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Failed to generate SEO data.' })
    };
  }
};
