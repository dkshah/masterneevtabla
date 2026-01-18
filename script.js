const videos = [
    {
        id: 's5hO-cGsaAY',
        title: 'Keherwa Taal 🔥 | Single, Double & Prakar | Tabla Practice',
        views: '34 views',
        likes: '5 likes',
        timeAgo: '7 days ago'
    },
    {
        id: 'hDzKBE9dWsA',
        title: 'Basic Tabla Taals for Students | Keherwa, Dadra & Teentaal',
        views: '33 views',
        likes: '3 likes',
        timeAgo: '7 days ago'
    },
    {
        id: 'Pa3OabV5b6Q',
        title: 'Taal Dadra 🔥 Single, Double & Prakar | Tabla Shorts',
        views: '73 views',
        likes: '8 likes',
        timeAgo: '2 weeks ago'
    },
    {
        id: 'YgO2LwVsn60',
        title: 'Taal Dadra on Tabla | Single, Double & Prakar Explained',
        views: '741 views',
        likes: '45 likes',
        timeAgo: '2 weeks ago'
    },
    {
        id: '_Rlmz5v9bTc',
        title: 'The Tabla Loop',
        views: '922 views',
        likes: '62 likes',
        timeAgo: '3 weeks ago'
    },
    {
        id: '25FE1dSMxms',
        title: 'Taal Dadra (Single & Double)',
        views: '566 views',
        likes: '38 likes',
        timeAgo: '1 month ago'
    }
];

const videoGrid = document.getElementById('video-grid');

function renderVideos() {
    videoGrid.innerHTML = '';

    videos.forEach(video => {
        const card = document.createElement('div');
        card.className = 'video-card';
        card.innerHTML = `
            <a href="https://www.youtube.com/watch?v=${video.id}" target="_blank" class="video-thumbnail">
                <img src="https://img.youtube.com/vi/${video.id}/maxresdefault.jpg" alt="${video.title}" loading="lazy">
                <div class="play-button">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M8 5v14l11-7z"/></svg>
                </div>
            </a>
            <div class="video-info">
                <h4><a href="https://www.youtube.com/watch?v=${video.id}" target="_blank">${video.title}</a></h4>
                <div class="video-meta">
                    <span class="video-views">${video.views}</span>
                    <span class="meta-dot">•</span>
                    <span class="video-time">${video.timeAgo}</span>
                </div>
                <div class="video-actions-row">
                     <div class="stat-badge likes">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-1.91l-.01-.01L23 10z"/></svg>
                        ${video.likes}
                    </div>
                </div>
                <a href="https://www.youtube.com/watch?v=${video.id}" target="_blank" class="btn-watch-youtube">
                    <span>Watch on YouTube</span>
                    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M10 6.296v11.408l7.656-5.704L10 6.296zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg>
                </a>
            </div>
        `;
        videoGrid.appendChild(card);
    });
}

// Initialize
renderVideos();

// Smooth scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});
