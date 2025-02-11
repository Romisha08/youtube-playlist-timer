const API_KEY = "AIzaSyAYjveb7GAp-CQOrloVG_KShP2I12jZQXw"; // Replace with your API Key

async function calculatePlaylistLength() {
    let playlistUrl = document.getElementById("playlistUrl").value;
    let playlistId = extractPlaylistId(playlistUrl);
    
    if (!playlistId) {
        alert("Invalid YouTube Playlist URL!");
        return;
    }

    let videoIds = await fetchPlaylistVideos(playlistId);
    let durations = await fetchVideoDurations(videoIds);
    
    displayResults(durations);
}

// Extracts playlist ID from the given URL
function extractPlaylistId(url) {
    let match = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
}

// Fetch all video IDs in the playlist
async function fetchPlaylistVideos(playlistId) {
    let videoIds = [];
    let nextPageToken = "";
    
    do {
        let response = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&maxResults=50&playlistId=${playlistId}&key=${API_KEY}&pageToken=${nextPageToken}`);
        let data = await response.json();
        
        videoIds.push(...data.items.map(item => item.contentDetails.videoId));
        nextPageToken = data.nextPageToken || "";
    } while (nextPageToken);
    
    return videoIds;
}

// Fetch video durations from YouTube API
async function fetchVideoDurations(videoIds) {
    let durations = [];
    
    for (let i = 0; i < videoIds.length; i += 50) {
        let chunk = videoIds.slice(i, i + 50);
        let response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${chunk.join(",")}&key=${API_KEY}`);
        let data = await response.json();
        
        durations.push(...data.items.map(item => parseDuration(item.contentDetails.duration)));
    }
    
    return durations;
}

// Convert ISO 8601 duration format to seconds
function parseDuration(duration) {
    let match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    let hours = match[1] ? parseInt(match[1]) : 0;
    let minutes = match[2] ? parseInt(match[2]) : 0;
    let seconds = match[3] ? parseInt(match[3]) : 0;
    
    return hours * 3600 + minutes * 60 + seconds;
}

// Display results on the page
function displayResults(durations) {
    let totalSeconds = durations.reduce((a, b) => a + b, 0);
    let totalTime = formatTime(totalSeconds);
    let averageTime = formatTime(totalSeconds / durations.length);
    
    let speeds = [0.5, 1, 1.25, 1.5, 2];
    let speedResults = speeds.map(speed => `<li>${speed}X : ${formatTime(totalSeconds / speed)}</li>`).join("");

    document.getElementById("results").innerHTML = `
        <h2>Playlist Details</h2>
        <p><strong>Number of Videos:</strong> ${durations.length}</p>
        <p><strong>Total Length:</strong> ${totalTime}</p>
        <p><strong>Average Video Length:</strong> ${averageTime}</p>
        <h3>Length at Different Speeds</h3>
        <ul>${speedResults}</ul>
    `;
}

// Convert seconds to HH:MM:SS format
function formatTime(seconds) {
    let h = Math.floor(seconds / 3600);
    let m = Math.floor((seconds % 3600) / 60);
    let s = Math.floor(seconds % 60);
    
    return `${h}h ${m}m ${s}s`;
}
