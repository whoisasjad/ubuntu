document.addEventListener('DOMContentLoaded', function() {
    // Theme toggle functionality
    const themeToggle = document.getElementById('themeToggle');
    const currentTheme = localStorage.getItem('theme') || 'light';
    
    if (currentTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
    
    themeToggle.addEventListener('click', function() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        if (currentTheme === 'dark') {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        }
    });

    // Mobile menu toggle
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.querySelector('.nav-links');
    
    hamburger.addEventListener('click', function() {
        navLinks.classList.toggle('active');
    });

    // Get post ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');
    
    if (postId) {
        fetchPost(postId);
    } else {
        document.getElementById('blogPost').innerHTML = '<div class="error">Post not found.</div>';
    }
});

// Function to fetch a single post from Firestore
async function fetchPost(postId) {
    const blogPost = document.getElementById('blogPost');
    const relatedPosts = document.getElementById('relatedPosts');
    
    blogPost.innerHTML = '<div class="loading">Loading post...</div>';
    
    try {
        // Get the post
        const postRef = db.collection('posts').doc(postId);
        const doc = await postRef.get();
        
        if (!doc.exists) {
            blogPost.innerHTML = '<div class="error">Post not found.</div>';
            return;
        }
        
        const post = doc.data();
        
        // Increment view count
        await postRef.update({
            views: firebase.firestore.FieldValue.increment(1)
        });
        
        // Display the post
        blogPost.innerHTML = createPostContent(post);
        
        // Fetch related posts (posts with similar tags)
        const tags = post.tags;
        if (tags && tags.length > 0) {
            const snapshot = await db.collection('posts')
                .where('tags', 'array-contains-any', tags)
                .where(firebase.firestore.FieldPath.documentId(), '!=', postId)
                .limit(3)
                .get();
                
            if (!snapshot.empty) {
                relatedPosts.innerHTML = '';
                snapshot.forEach(doc => {
                    const relatedPost = doc.data();
                    relatedPosts.innerHTML += createPostCard(relatedPost, doc.id);
                });
            } else {
                relatedPosts.innerHTML = '<p>No related posts found.</p>';
            }
        } else {
            relatedPosts.innerHTML = '<p>No related posts found.</p>';
        }
    } catch (error) {
        console.error('Error fetching post: ', error);
        blogPost.innerHTML = '<div class="error">Error loading post. Please try again.</div>';
    }
}

// Function to create post content
function createPostContent(post) {
    const tags = post.tags.map(tag => `<span class="tag">${tag}</span>`).join('');
    
    return `
        <div class="post-header">
            <h1>${post.title}</h1>
            <div class="post-meta-large">
                <span>By ${post.author}</span>
                <span>${formatDate(post.created_at)}</span>
                <span>${post.views || 0} views</span>
            </div>
            ${tags ? `<div class="post-tags">${tags}</div>` : ''}
        </div>
        <img src="${post.image}" alt="${post.title}" class="post-image">
        <div class="post-content">
            ${post.content}
        </div>
        <div class="post-footer">
            <h3>Share this post</h3>
            <div class="share-buttons">
                <a href="https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(post.title)}" class="share-btn" target="_blank">
                    <i class="fab fa-twitter"></i>
                </a>
                <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}" class="share-btn" target="_blank">
                    <i class="fab fa-facebook-f"></i>
                </a>
                <a href="https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(window.location.href)}&title=${encodeURIComponent(post.title)}" class="share-btn" target="_blank">
                    <i class="fab fa-linkedin-in"></i>
                </a>
            </div>
        </div>
    `;
}

// Function to create a related post card
function createPostCard(post, id) {
    return `
        <div class="post-card">
            <a href="post.html?id=${id}">
                <img src="${post.image}" alt="${post.title}">
                <div class="post-content">
                    <h3>${post.title}</h3>
                    <p>${post.excerpt}</p>
                    <div class="post-meta">
                        <span>By ${post.author}</span>
                        <span>${formatDate(post.created_at)}</span>
                    </div>
                </div>
            </a>
        </div>
    `;
}

// Function to format date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}