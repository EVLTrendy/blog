const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { content, category, currentTitle } = JSON.parse(event.body);
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
    const systemPrompt = `You are an expert SEO specialist and content strategist for the 'EvolvedLotus' tech blog.
Your goal is to analyze the provided blog draft and generate high-impact SEO metadata.

Leverage your internal knowledge of current tech trends, search behavior, and semantic keyword relevance.
Follow this algorithm mentally to produce the result:
1.  **Keyword Collection**: Extract keywords from the content. Consider synonyms and related high-volume search terms in the niche.
2.  **Scoring & Filtering**: Prioritize keywords with high search intent and relevance. Remove generic filler words.
3.  **Clustering**: Group similar terms and pick the most potent one.
4.  **Generation**:
    *   **Title**: Create a compelling, click-worthy title (max 60 chars optimal).
    *   **Description**: Write a meta description (150-160 chars) that incites clicks (CTR).
    *   **Keywords**: A comma-separated list of the top 5-8 semantic keywords.
    *   **Image Alt**: A descriptive, keyword-rich alt text for a featured image.

**Output Format**: Return ONLY valid JSON with this structure:
{
  "title": "...",
  "description": "...",
  "keywords": "...",
  "imageAlt": "..."
}`;

    const userPrompt = `
**Blog Category**: ${category || 'Tech'}
**Current Draft Title**: ${currentTitle || 'Untitled'}
**Draft Content (Excerpt)**:
${content.slice(0, 4000)}

Verify the content against the category.
Generate the SEO metadata now.`;

    console.log(`Sending request to Groq. Content length: ${content.length}`);

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3-70b-8192',
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
