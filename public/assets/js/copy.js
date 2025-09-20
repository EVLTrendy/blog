document.addEventListener('DOMContentLoaded', function() {
  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'copy-success';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 2000);
  }

  async function copyToClipboard(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        // For modern browsers
        await navigator.clipboard.writeText(text);
        showToast('Link copied to clipboard!');
      } else {
        // Fallback for older browsers and non-HTTPS
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          document.execCommand('copy');
          textArea.remove();
          showToast('Link copied to clipboard!');
        } catch (err) {
          console.error('Failed to copy text: ', err);
          showToast('Failed to copy link. Please try again.');
        }
      }
    } catch (err) {
      console.error('Failed to copy text: ', err);
      showToast('Failed to copy link. Please try again.');
    }
  }

  // Handle copy button clicks
  document.addEventListener('click', function(e) {
    if (e.target.closest('.copy-link-button')) {
      e.preventDefault();
      const button = e.target.closest('.copy-link-button');
      const url = button.dataset.url;
      if (url) {
        copyToClipboard(url);
      }
    }
  });
}); 