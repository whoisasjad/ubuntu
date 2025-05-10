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

    // Fetch and display posts
    fetchPosts();
    
    // Load more functionality
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    let lastVisible = null;
    let loading = false;
    
    loadMoreBtn.addEventListener('click', function() {
        if (!loading) {
            fetchPosts(lastVisible);
        }
    });

    // Category filter
    const categoryFilter = document.getElementById('categoryFilter');
    categoryFilter.addEventListener('change', function() {
        fetchPosts();
    });

    // Sort by
    const sortBy = document.getElementById('sortBy');
    sortBy.addEventListener('change', function() {
        fetchPosts();
    });
});

// Function to fetch posts from Firestore
async function fetchPosts(startAfter = null) {
    const postsGrid = document.getElementById('postsGrid');
    const featuredPosts = document.getElementById('featuredPosts');
    const categoryFilter = document.getElementById('categoryFilter');
    const sortBy = document.getElementById('sortBy');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    
    // Show loading state
    if (!startAfter) {
        postsGrid.innerHTML = '<div class="loading">Loading posts...</div>';
        loadMoreBtn.disabled = true;
    }
    
    loading = true;
    
    try {
        let query = db.collection('posts');
        
        // Apply category filter
        if (categoryFilter.value !== 'all') {
            query = query.where('tags', 'array-contains', categoryFilter.value);
        }
        
        // Apply sorting
        switch (sortBy.value) {
            case 'newest':
                query = query.orderBy('created_at', 'desc');
                break;
            case 'oldest':
                query = query.orderBy('created_at', 'asc');
                break;
            case 'popular':
                query = query.orderBy('views', 'desc');
                break;
        }
        
        // Pagination
        if (startAfter) {
            query = query.startAfter(startAfter);
        }
        
        query = query.limit(6);
        
        const snapshot = await query.get();
        
        if (snapshot.empty) {
            if (!startAfter) {
                postsGrid.innerHTML = '<div class="no-posts">No posts found.</div>';
            } else {
                loadMoreBtn.style.display = 'none';
            }
            return;
        }
        
        // Store the last visible document for pagination
        lastVisible = snapshot.docs[snapshot.docs.length - 1];
        
        // Clear the grid if it's the first load
        if (!startAfter) {
            postsGrid.innerHTML = '';
            
            // Also fetch featured posts (first 3 posts)
            const featuredSnapshot = await db.collection('posts')
                .where('featured', '==', true)
                .limit(3)
                .get();
                
            featuredPosts.innerHTML = '';
            featuredSnapshot.forEach(doc => {
                const post = doc.data();
                featuredPosts.innerHTML += createFeaturedPostCard(post, doc.id);
            });
            
            // Populate categories filter
            const tagsSnapshot = await db.collection('tags').get();
            categoryFilter.innerHTML = '<option value="all">All Categories</option>';
            tagsSnapshot.forEach(doc => {
                categoryFilter.innerHTML += `<option value="${doc.id}">${doc.data().name}</option>`;
            });
        }
        
        // Add posts to the grid
        snapshot.forEach(doc => {
            const post = doc.data();
            postsGrid.innerHTML += createPostCard(post, doc.id);
        });
        
        loadMoreBtn.disabled = false;
    } catch (error) {
        console.error('Error fetching posts: ', error);
        if (!startAfter) {
            postsGrid.innerHTML = '<div class="error">Error loading posts. Please try again.</div>';
        }
    } finally {
        loading = false;
    }
}

// Function to create a featured post card
function createFeaturedPostCard(post, id) {
    return `
        <div class="featured-card">
            <a href="post.html?id=${id}">
                <img src="${post.image}" alt="${post.title}">
                <div class="featured-content">
                    <h3>${post.title}</h3>
                    <p>${post.excerpt}</p>
                    <div class="featured-meta">
                        <span>By ${post.author}</span>
                        <span>${formatDate(post.created_at)}</span>
                    </div>
                </div>
            </a>
        </div>
    `;
}

// Function to create a regular post card
function createPostCard(post, id) {
    const tags = post.tags.map(tag => `<span class="tag">${tag}</span>`).join('');
    
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
                    <div class="post-tags">
                        ${tags}
                    </div>
                </div>
            </a>
        </div>
    `;
}

// Function to format date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}