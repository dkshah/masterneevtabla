// YouTube Data API configuration
// Configuration is now loaded from config.js
const API_KEY = window.CONFIG ? window.CONFIG.API_KEY : '';
const CHANNEL_ID = window.CONFIG ? window.CONFIG.CHANNEL_ID : 'UCnfSjNZZwVl4gs_ZVn9i1ug';

// Fallback data in case API Key is missing or quota exceeded
const fallbackVideos = [
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
const shortsGrid = document.getElementById('shorts-grid');

// Utility to format numbers (e.g., 1200 -> 1.2K)
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// Utility to format time (simple relative time)
function timeSince(dateString) {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date() - date) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    return "Recently";
}

// Helper to check if video is a short (<= 60 seconds)
// Duration format: PT1M, PT59S, PT1H2M3S
function isShorts(durationIso) {
    if (!durationIso) return false;

    const match = durationIso.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return false;

    const hours = (parseInt(match[1]) || 0);
    const minutes = (parseInt(match[2]) || 0);
    const seconds = (parseInt(match[3]) || 0);

    const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;
    return totalSeconds <= 60;
}

async function fetchChannelStats() {
    if (!API_KEY || API_KEY.startsWith('YOUR_API_')) return;

    try {
        const response = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${CHANNEL_ID}&key=${API_KEY}`);
        const data = await response.json();

        if (data.error) {
            console.error('YouTube API Error:', data.error.message);
            return;
        }

        if (data.items && data.items.length > 0) {
            const stats = data.items[0].statistics;

            // Update DOM elements using IDs (Hero/Stats Section)
            const subEl = document.getElementById('stat-subscribers');
            const vidEl = document.getElementById('stat-videos');
            const viewEl = document.getElementById('stat-views');

            if (subEl) subEl.innerText = formatNumber(stats.subscriberCount);
            if (vidEl) vidEl.innerText = formatNumber(stats.videoCount);
            if (viewEl) viewEl.innerText = formatNumber(stats.viewCount);

            // Update Ticker Elements (Top Stats Bar)
            const tickerSubEl = document.getElementById('ticker-subscribers');
            const tickerVidEl = document.getElementById('ticker-videos');
            const tickerViewEl = document.getElementById('ticker-views');

            if (tickerSubEl) tickerSubEl.innerText = formatNumber(stats.subscriberCount);
            if (tickerVidEl) tickerVidEl.innerText = formatNumber(stats.videoCount);
            if (tickerViewEl) tickerViewEl.innerText = formatNumber(stats.viewCount);
        }
    } catch (error) {
        console.error('Error fetching channel stats:', error);
    }
}

async function fetchVideos() {
    // If no API key, use fallback
    if (!API_KEY || API_KEY.startsWith('YOUR_API_')) {
        console.log('Using fallback video data. Add API Key for dynamic updates.');
        renderVideos(fallbackVideos, videoGrid);
        return;
    }

    try {
        // 1. Get Uploads Playlist ID
        const channelResponse = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${CHANNEL_ID}&key=${API_KEY}`);
        const channelData = await channelResponse.json();

        if (channelData.error) {
            throw new Error(channelData.error.message);
        }

        if (!channelData.items || channelData.items.length === 0) throw new Error('Channel not found');

        const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;

        // 2. Get Videos from Playlist
        const playlistResponse = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=50&key=${API_KEY}`);
        const playlistData = await playlistResponse.json();

        if (!playlistData.items) throw new Error('No videos found');

        // 3. Get Video Stats AND Duration (contentDetails) to filter shorts
        const videoIds = playlistData.items.map(item => item.snippet.resourceId.videoId).join(',');
        const videosResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet,contentDetails&id=${videoIds}&key=${API_KEY}`);
        const videosData = await videosResponse.json();

        const allVideos = videosData.items.map(video => ({
            id: video.id,
            title: video.snippet.title,
            views: formatNumber(video.statistics.viewCount) + ' views',
            likes: formatNumber(video.statistics.likeCount || 0) + ' likes',
            timeAgo: timeSince(video.snippet.publishedAt),
            duration: video.contentDetails.duration
        }));

        const videos = allVideos.filter(v => !isShorts(v.duration));
        const shorts = allVideos.filter(v => isShorts(v.duration));

        renderVideos(videos, videoGrid);
        renderVideos(shorts, shortsGrid);

        // Hide sections if empty
        if (videoGrid && videos.length === 0) {
            const videoCategory = videoGrid.closest('.video-category');
            if (videoCategory) videoCategory.style.display = 'none';
        }
        if (shortsGrid && shorts.length === 0) {
            const shortsCategory = shortsGrid.closest('.video-category');
            if (shortsCategory) shortsCategory.style.display = 'none';
        }

        fetchChannelStats();

    } catch (error) {
        console.error('Error fetching videos:', error);
        renderVideos(fallbackVideos, videoGrid);
    }
}

function renderVideos(videosToRender, container) {
    if (!container) return;
    container.innerHTML = '';

    videosToRender.forEach(video => {
        const card = document.createElement('div');
        card.className = 'video-card';
        const videoUrl = `https://www.youtube.com/watch?v=${video.id}`;
        const shareText = `Check out this amazing Tabla video: ${video.title}`;

        card.innerHTML = `
            <a href="${videoUrl}" target="_blank" class="video-thumbnail">
                <img src="https://img.youtube.com/vi/${video.id}/maxresdefault.jpg" alt="${video.title}" loading="lazy">
                <div class="play-button">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M8 5v14l11-7z"/></svg>
                </div>
            </a>
            <div class="video-info">
                <h4><a href="${videoUrl}" target="_blank">${video.title}</a></h4>
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
                
                <div class="share-section">
                    <div class="share-label">Share:</div>
                    <div class="share-buttons">
                        <button class="share-btn whatsapp" data-url="${videoUrl}" data-text="${shareText}" title="Share on WhatsApp">
                            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                            </svg>
                        </button>
                        <button class="share-btn instagram" data-url="${videoUrl}" data-text="${shareText}" title="Share on Instagram">
                            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                            </svg>
                            <span class="copy-feedback">Link Copied! Paste in Instagram</span>
                        </button>
                        <button class="share-btn facebook" data-url="${videoUrl}" title="Share on Facebook">
                            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                        </button>
                        <button class="share-btn twitter" data-url="${videoUrl}" data-text="${shareText}" title="Share on Twitter">
                            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                            </svg>
                        </button>
                        <button class="share-btn copy-link" data-url="${videoUrl}" title="Copy Link">
                            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                                <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                            </svg>
                            <span class="copy-feedback">Copied!</span>
                        </button>
                    </div>
                </div>
                
                <a href="${videoUrl}" target="_blank" class="btn-watch-youtube">
                    <span>Watch on YouTube</span>
                    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M10 6.296v11.408l7.656-5.704L10 6.296zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg>
                </a>
            </div>
        `;
        container.appendChild(card);
    });

    // Add event listeners for share buttons
    attachShareListeners();
}

function attachShareListeners() {
    // WhatsApp share
    document.querySelectorAll('.share-btn.whatsapp').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const url = btn.dataset.url;
            const text = btn.dataset.text;
            window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
        });
    });

    // Instagram share (copies link since Instagram doesn't have web share API)
    document.querySelectorAll('.share-btn.instagram').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            const url = btn.dataset.url;
            const feedback = btn.querySelector('.copy-feedback');

            try {
                await navigator.clipboard.writeText(url);
                feedback.classList.add('show');
                setTimeout(() => {
                    feedback.classList.remove('show');
                }, 3000);
            } catch (err) {
                console.error('Failed to copy:', err);
            }
        });
    });

    // Facebook share
    document.querySelectorAll('.share-btn.facebook').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const url = btn.dataset.url;
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank', 'width=600,height=400');
        });
    });

    // Twitter share
    document.querySelectorAll('.share-btn.twitter').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const url = btn.dataset.url;
            const text = btn.dataset.text;
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank', 'width=600,height=400');
        });
    });

    // Copy link
    document.querySelectorAll('.share-btn.copy-link').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            const url = btn.dataset.url;
            const feedback = btn.querySelector('.copy-feedback');

            try {
                await navigator.clipboard.writeText(url);
                feedback.classList.add('show');
                setTimeout(() => {
                    feedback.classList.remove('show');
                }, 2000);
            } catch (err) {
                console.error('Failed to copy:', err);
            }
        });
    });
}

// Initialize
fetchVideos();

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
