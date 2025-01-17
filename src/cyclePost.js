document.addEventListener("DOMContentLoaded", () => {
    const posts = document.querySelectorAll(".ftbot > div");
    let currentIndex = 0;
  
    function cyclePosts() {
      posts.forEach((post, index) => {
        post.style.display = index === currentIndex ? "block" : "none";
      });
      currentIndex = (currentIndex + 1) % posts.length;
    }
  
    setInterval(cyclePosts, 3000); // Cycle every 3 seconds
    cyclePosts(); // Initial display
  });
  