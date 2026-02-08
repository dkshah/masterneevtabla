/**
 * tabla-game.js
 * A simple rhythm game for Master Neev Tabla
 */

// Configuration
const CONFIG = {
    LANE_COUNT: 4,
    NOTE_SPEED: 4, // Pixels per frame
    HIT_ZONE_Y: 0.85, // Percentage of height
    HIT_WINDOW: 50, // Pixels tolerance
    SPAWN_Rate: 60, // Frames between spawns (approx 1 sec at 60fps)
    KEYS: ['d', 'f', 'j', 'k'],
    LABELS: ['Ge', 'Te', 'Te', 'Ka'],
    COLORS: ['#FF5733', '#33FF57', '#3357FF', '#FF33A8']
};

// Game State
let state = {
    isPlaying: false,
    isSubscribed: false, // In a real app, check via API or LocalStorage
    score: 0,
    combo: 0,
    notes: [], // Array of active notes
    particles: [], // Array of hit effects
    frameCount: 0,
    animationId: null,
    audioContext: null
};

// DOM Elements
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const comboEl = document.getElementById('combo');
const overlay = document.getElementById('game-overlay');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreEl = document.getElementById('final-score');
const btnSubscribe = document.getElementById('btn-subscribe-play');
const btnStart = document.getElementById('btn-start-game');
const btnRestart = document.getElementById('btn-restart');

// --- Audio System (Web Audio API) ---
class AudioEngine {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }

    playTone(type) {
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        const now = this.ctx.currentTime;

        if (type === 0) { // Ge (Bass)
            osc.type = 'sine';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.5);
            gain.gain.setValueAtTime(1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        } else if (type === 1 || type === 2) { // Te (Snare-ish)
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(400, now);
            gain.gain.setValueAtTime(0.5, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        } else { // Ka (Flat)
            osc.type = 'square';
            osc.frequency.setValueAtTime(200, now);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        }

        osc.start(now);
        osc.stop(now + 0.5);
    }
}

const audio = new AudioEngine();

// --- Game Logic ---

function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function spawnNote() {
    // Random lane
    const lane = Math.floor(Math.random() * CONFIG.LANE_COUNT);
    state.notes.push({
        lane: lane,
        y: -50, // Start above screen
        active: true,
        color: CONFIG.COLORS[lane]
    });
}

function update() {
    if (!state.isPlaying) return;

    // clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Lanes
    const laneWidth = canvas.width / CONFIG.LANE_COUNT;
    const hitY = canvas.height * CONFIG.HIT_ZONE_Y;

    // Draw Hit Zone Line
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.moveTo(0, hitY);
    ctx.lineTo(canvas.width, hitY);
    ctx.stroke();

    // Draw Lane Dividers & Keys
    for (let i = 0; i < CONFIG.LANE_COUNT; i++) {
        const x = i * laneWidth;

        // Key Indicator at bottom
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(x + 10, hitY, laneWidth - 20, canvas.height - hitY - 10);

        ctx.fillStyle = '#fff';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(CONFIG.LABELS[i], x + laneWidth / 2, canvas.height - 20);
    }

    // Spawn Logic
    state.frameCount++;
    if (state.frameCount % CONFIG.SPAWN_Rate === 0) {
        spawnNote();
        // Increase difficulty over time
        if (state.frameCount % 600 === 0 && CONFIG.SPAWN_Rate > 20) {
            CONFIG.SPAWN_Rate -= 5;
        }
    }

    // Update & Draw Notes
    state.notes.forEach((note, index) => {
        if (!note.active) return;

        note.y += CONFIG.NOTE_SPEED;

        // Draw Note
        const x = note.lane * laneWidth + laneWidth / 2;
        ctx.beginPath();
        ctx.arc(x, note.y, 25, 0, Math.PI * 2);
        ctx.fillStyle = note.color;
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#fff';
        ctx.stroke();

        // Missed Note
        if (note.y > canvas.height) {
            note.active = false;
            resetCombo();
        }
    });

    // Remove inactive notes
    state.notes = state.notes.filter(n => n.active);

    // Update & Draw Particles (Hit Effects)
    state.particles.forEach((p, i) => {
        p.life--;
        p.radius += 2;
        p.alpha -= 0.05;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 215, 0, ${p.alpha})`; // Gold color
        ctx.lineWidth = 2;
        ctx.stroke();
    });
    state.particles = state.particles.filter(p => p.life > 0);

    state.animationId = requestAnimationFrame(update);
}

function handleInput(lane) {
    if (!state.isPlaying) return;

    const hitY = canvas.height * CONFIG.HIT_ZONE_Y;
    const laneWidth = canvas.width / CONFIG.LANE_COUNT;

    // Check for matching note in hit window
    const hitNoteIndex = state.notes.findIndex(note =>
        note.active &&
        note.lane === lane &&
        Math.abs(note.y - hitY) < CONFIG.HIT_WINDOW
    );

    if (hitNoteIndex !== -1) {
        // HIT!
        const note = state.notes[hitNoteIndex];
        note.active = false; // Remove note

        // Update Score
        state.score += 100 + (state.combo * 10);
        state.combo++;
        scoreEl.innerText = state.score;
        comboEl.innerText = state.combo;

        // Visual Effect
        createExplosion(note.lane * laneWidth + laneWidth / 2, hitY);

        // Sound
        audio.playTone(lane);

    } else {
        // Miss (clicked empty lane)
        // Optional: Could penalize score
    }
}

function createExplosion(x, y) {
    state.particles.push({
        x: x,
        y: y,
        radius: 10,
        alpha: 1,
        life: 20
    });
}

function resetCombo() {
    state.combo = 0;
    comboEl.innerText = 0;
    // Shake screen or flash red?
    canvas.style.transform = 'translate(5px, 0)';
    setTimeout(() => canvas.style.transform = 'none', 50);
}

function gameOver() {
    state.isPlaying = false;
    cancelAnimationFrame(state.animationId);
    overlay.style.display = 'flex';
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas
    document.getElementById('start-screen').style.display = 'none';
    gameOverScreen.style.display = 'block';
    finalScoreEl.innerText = state.score;
}

function startGame() {
    // Reset State
    state.score = 0;
    state.combo = 0;
    state.notes = [];
    state.particles = [];
    state.frameCount = 0;
    CONFIG.SPAWN_Rate = 60; // Reset difficulty
    scoreEl.innerText = '0';
    comboEl.innerText = '0';

    state.isPlaying = true;
    overlay.style.display = 'none';

    // Resume Audio Context if needed
    if (audio.ctx.state === 'suspended') {
        audio.ctx.resume();
    }

    update();

    // Simple game over timer for demo purposes (e.g., 60 seconds song)
    // Or just let it run forever until missed too many?
    // For now, infinite loop until user quits or we add lives.
}

// --- Event Listeners ---

// Keyboard
window.addEventListener('keydown', (e) => {
    const keyIndex = CONFIG.KEYS.indexOf(e.key.toLowerCase());
    if (keyIndex !== -1) {
        handleInput(keyIndex);
        // Add visual feedback to lane
    }
});

// Touch / Mobile Controls
document.querySelectorAll('.mobile-pad').forEach((btn, index) => {
    btn.addEventListener('touchstart', (e) => {
        e.preventDefault(); // Prevent zoom/scroll
        handleInput(index);
    });
    // For desktop testing with mouse
    btn.addEventListener('mousedown', (e) => {
        handleInput(index);
    });
});

// UI Buttons
btnSubscribe.addEventListener('click', () => {
    // 1. Open YouTube Channel
    window.open(`https://www.youtube.com/channel/${window.CONFIG ? window.CONFIG.CHANNEL_ID : 'UCnfSjNZZwVl4gs_ZVn9i1ug'}?sub_confirmation=1`, '_blank');

    // 2. Unlock Game (Simulate verify)
    btnSubscribe.innerText = "Verifying...";
    setTimeout(() => {
        state.isSubscribed = true;
        btnSubscribe.style.display = 'none';
        btnStart.style.display = 'inline-block';
        startScreen.querySelector('.sub-note').innerText = "Thanks for subscribing! You're ready to play.";
        startScreen.querySelector('.sub-note').style.color = '#4CAF50';
    }, 2000); // 2 second delay to simulate user action
});

btnStart.addEventListener('click', startGame);

btnRestart.addEventListener('click', () => {
    gameOverScreen.style.display = 'none';
    startGame();
});
