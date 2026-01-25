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

            // Update DOM elements using IDs
            const subEl = document.getElementById('stat-subscribers');
            const vidEl = document.getElementById('stat-videos');
            const viewEl = document.getElementById('stat-views');

            if (subEl) subEl.innerText = formatNumber(stats.subscriberCount);
            if (vidEl) vidEl.innerText = formatNumber(stats.videoCount);
            if (viewEl) viewEl.innerText = formatNumber(stats.viewCount);
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
        if (videos.length === 0) videoGrid.closest('.video-category').style.display = 'none';
        if (shorts.length === 0) shortsGrid.closest('.video-category').style.display = 'none';

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
        container.appendChild(card);
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
