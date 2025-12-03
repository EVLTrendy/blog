class BookmarkManager {
    constructor() {
        this.storageKey = 'evolvedlotus_bookmarks';
        this.bookmarks = this.loadBookmarks();
        this.init();
    }

    loadBookmarks() {
        const stored = localStorage.getItem(this.storageKey);
        return stored ? JSON.parse(stored) : [];
    }

    saveBookmarks() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.bookmarks));
    }

    addBookmark(article) {
        if (!this.isBookmarked(article.url)) {
            this.bookmarks.push({
                url: article.url,
                title: article.title,
                description: article.description,
                image: article.image,
                date: new Date().toISOString()
            });
            this.saveBookmarks();
            this.updateUI(article.url, true);
            this.showToast('Article saved!');
        }
    }

    removeBookmark(url) {
        this.bookmarks = this.bookmarks.filter(b => b.url !== url);
        this.saveBookmarks();
        this.updateUI(url, false);
        this.showToast('Article removed from saved.');
    }

    toggleBookmark(article) {
        if (this.isBookmarked(article.url)) {
            this.removeBookmark(article.url);
        } else {
            this.addBookmark(article);
        }
    }

    isBookmarked(url) {
        return this.bookmarks.some(b => b.url === url);
    }

    updateUI(url, isSaved) {
        const buttons = document.querySelectorAll(`button[data-action="save"][data-url="${url}"]`);
        buttons.forEach(btn => {
            const icon = btn.querySelector('svg');
            if (isSaved) {
                icon.setAttribute('fill', 'currentColor');
                btn.classList.add('active');
                btn.setAttribute('title', 'Remove from Saved');
            } else {
                icon.setAttribute('fill', 'none');
                btn.classList.remove('active');
                btn.setAttribute('title', 'Save for Later');
            }
        });
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            // Check current page status
            const currentUrl = window.location.pathname;
            if (this.isBookmarked(currentUrl)) {
                this.updateUI(currentUrl, true);
            }

            // Attach listeners
            document.querySelectorAll('button[data-action="save"]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const article = {
                        url: btn.dataset.url || window.location.pathname,
                        title: btn.dataset.title || document.title,
                        description: btn.dataset.description || '',
                        image: btn.dataset.image || ''
                    };
                    this.toggleBookmark(article);
                });
            });
        });
    }

    showToast(message) {
        // Reuse existing toast if available
        if (typeof window.showToast === 'function') {
            window.showToast(message);
        } else {
            alert(message);
        }
    }
}

const bookmarkManager = new BookmarkManager();
