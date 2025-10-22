// Short URL management using Supabase
class ShortURLManager {
    constructor() {
        this.supabaseUrl = 'https://ttokqdichqlzihyqidoq.supabase.co';
        this.supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0b2txZGljaHFsemloeXFpZG9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4ODAzODIsImV4cCI6MjA2MTQ1NjM4Mn0.La7CSQDyA0CCyBo4zSP2hYRr056Jm0CJQBhYlNf2egE';
        this.baseUrl = 'https://blog.evolvedlotus.com';
    }

    // Generate a random short ID
    generateShortId() {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    // Get or create short URL for a post
    async getOrCreateShortURL(postSlug, postTitle) {
        try {
            // First, check if short URL already exists
            const existingResponse = await fetch(`${this.supabaseUrl}/rest/v1/short_urls?post_slug=eq.${encodeURIComponent(postSlug)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': this.supabaseKey,
                    'Authorization': `Bearer ${this.supabaseKey}`
                }
            });

            if (existingResponse.ok) {
                const existing = await existingResponse.json();
                if (existing && existing.length > 0) {
                    return `${this.baseUrl}/r/${existing[0].short_id}/`;
                }
            }

            // Generate new short URL
            const shortId = this.generateShortId();

            // Check if short ID is unique
            const checkResponse = await fetch(`${this.supabaseUrl}/rest/v1/short_urls?short_id=eq.${shortId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': this.supabaseKey,
                    'Authorization': `Bearer ${this.supabaseKey}`
                }
            });

            if (checkResponse.ok) {
                const checkResult = await checkResponse.json();
                if (checkResult && checkResult.length > 0) {
                    // Try again with a new ID
                    return await this.getOrCreateShortURL(postSlug, postTitle);
                }
            }

            // Create new short URL
            const createResponse = await fetch(`${this.supabaseUrl}/rest/v1/short_urls`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': this.supabaseKey,
                    'Authorization': `Bearer ${this.supabaseKey}`
                },
                body: JSON.stringify({
                    post_slug: postSlug,
                    short_id: shortId,
                    title: postTitle,
                    created_at: new Date().toISOString()
                })
            });

            if (createResponse.ok) {
                return `${this.baseUrl}/r/${shortId}/`;
            } else {
                console.error('Failed to create short URL:', await createResponse.text());
                return null;
            }

        } catch (error) {
            console.error('Error managing short URL:', error);
            return null;
        }
    }

    // Copy short URL to clipboard
    async copyShortURL(postSlug, postTitle, buttonElement) {
        try {
            // Show loading state
            const originalText = buttonElement.textContent;
            buttonElement.textContent = 'Generating...';
            buttonElement.disabled = true;

            // Get or create short URL
            const shortURL = await this.getOrCreateShortURL(postSlug, postTitle);

            if (shortURL) {
                // Copy to clipboard
                await navigator.clipboard.writeText(shortURL);

                // Show success state
                buttonElement.textContent = 'Copied!';
                setTimeout(() => {
                    buttonElement.textContent = originalText;
                    buttonElement.disabled = false;
                }, 2000);

                return shortURL;
            } else {
                // Show error state
                buttonElement.textContent = 'Error';
                setTimeout(() => {
                    buttonElement.textContent = originalText;
                    buttonElement.disabled = false;
                }, 2000);
                return null;
            }

        } catch (error) {
            console.error('Error copying short URL:', error);
            buttonElement.textContent = 'Error';
            setTimeout(() => {
                buttonElement.textContent = 'Copy Link';
                buttonElement.disabled = false;
            }, 2000);
            return null;
        }
    }
}

// Initialize short URL manager
const shortURLManager = new ShortURLManager();

// Export for use in other scripts
window.shortURLManager = shortURLManager;
