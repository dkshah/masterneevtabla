/**
 * tabla-echo-game.js
 * A simple "Simon Says" style memory game for kids.
 */

// Configuration
const CONFIG = {
    KEYS: [0, 1, 2, 3], // Red, Blue, Green, Yellow
    SOUNDS: [261.63, 329.63, 392.00, 523.25], // C4, E4, G4, C5 (Pentatonic feel)
    LABELS: ['Dha', 'Na', 'Ge', 'Tin'],
    PAD_DELAY: 400, // Ms to light up
    GAP_DELAY: 250, // Ms between notes
    START_DELAY: 1000
};

// Game State
let state = {
    sequence: [],
    playerInput: [],
    level: 1,
    isPlaying: false,
    isInputBlocked: true,
    isSubscribed: false, // In a real app, verify this via API
};

// Audio Engine (Simple Synth)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playTone(index) {
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine'; // Soft, bell-like tone
    osc.frequency.setValueAtTime(CONFIG.SOUNDS[index], audioCtx.currentTime);

    // Envelope
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
}

// DOM Elements
const pads = document.querySelectorAll('.game-pad');
const statusText = document.getElementById('status-text');
const levelText = document.getElementById('level');
const overlay = document.getElementById('game-overlay');
const btnSubscribe = document.getElementById('btn-subscribe-play');
const btnPlayNow = document.getElementById('btn-play-now');
const btnStart = document.getElementById('btn-start'); // The one in control area (optional)

// --- Game Logic ---

function startGame() {
    state.sequence = [];
    state.playerInput = [];
    state.level = 1;
    state.isPlaying = true;
    state.isInputBlocked = true;

    updateLevel();
    statusText.innerText = "Watch closely!";
    overlay.classList.remove('active'); // Hide overlay

    setTimeout(nextRound, CONFIG.START_DELAY);
}

function nextRound() {
    state.playerInput = [];
    state.isInputBlocked = true;

    // Add new step
    const randomPad = Math.floor(Math.random() * 4);
    state.sequence.push(randomPad);

    updateLevel();
    statusText.innerText = "Listen...";

    playSequence();
}

function playSequence() {
    let i = 0;
    const interval = setInterval(() => {
        const padIndex = state.sequence[i];
        activatePad(padIndex);
        i++;

        if (i >= state.sequence.length) {
            clearInterval(interval);
            setTimeout(() => {
                state.isInputBlocked = false;
                statusText.innerText = "Your Turn!";
                statusText.classList.add('status-highlight');
            }, CONFIG.PAD_DELAY);
        }
    }, CONFIG.PAD_DELAY + CONFIG.GAP_DELAY);
}

function activatePad(index) {
    const pad = pads[index];
    pad.classList.add('active');
    playTone(index);

    setTimeout(() => {
        pad.classList.remove('active');
    }, CONFIG.PAD_DELAY);
}

function handleInput(index) {
    if (state.isInputBlocked || !state.isPlaying) return;

    activatePad(index); // Visual/Audio feedback immediately

    // Check correctness
    const currentStep = state.playerInput.length;

    if (index === state.sequence[currentStep]) {
        // Correct
        state.playerInput.push(index);

        // Detailed feedback (optional)
        statusText.classList.remove('status-highlight');

        // Sequence Complete?
        if (state.playerInput.length === state.sequence.length) {
            state.isInputBlocked = true;
            state.level++;
            statusText.innerText = "Good Job! 🎉";
            setTimeout(nextRound, 1000);
        }
    } else {
        // Wrong
        gameOver();
    }
}

function gameOver() {
    state.isPlaying = false;
    state.isInputBlocked = true;
    statusText.innerText = "Game Over!";

    // Flash red or shake
    document.body.style.background = '#ff4757';
    setTimeout(() => {
        document.body.style.background = ''; // Reset
        // Show overlay with "Try Again"
        overlay.classList.add('active');
        document.querySelector('.overlay-content h1').innerText = "Try Again!";
        document.querySelector('.overlay-content p').innerText = `You reached Level ${state.level}`;
        document.getElementById('sub-gate').style.display = 'none'; // Ensure sub gate is gone
        btnPlayNow.classList.remove('hidden');
        btnPlayNow.innerText = "RETRY ⟳";
    }, 500);
}

function updateLevel() {
    levelText.innerText = state.level;
}

// --- Event Listeners ---

// Pads (Touch & Click)
pads.forEach((pad, index) => {
    // We rely on 'click' for simplicity as most devices handle it well enough for this game speed
    // But let's add touchstart for responsiveness
    pad.addEventListener('touchstart', (e) => {
        e.preventDefault(); // Prevent double-fire
        handleInput(index);
    });

    pad.addEventListener('mousedown', (e) => {
        handleInput(index);
    });
});

// Subscribe Gate
btnSubscribe.addEventListener('click', () => {
    // 1. Open Channel
    window.open(`https://www.youtube.com/channel/${window.CONFIG ? window.CONFIG.CHANNEL_ID : 'UCnfSjNZZwVl4gs_ZVn9i1ug'}?sub_confirmation=1`, '_blank');

    // 2. Unlock
    btnSubscribe.innerText = "Verifying...";
    setTimeout(() => {
        state.isSubscribed = true;
        document.getElementById('sub-gate').style.display = 'none';
        btnPlayNow.classList.remove('hidden');
    }, 2000);
});

// Play Button (Overlay)
btnPlayNow.addEventListener('click', () => {
    startGame();
});

// Start Button (Main UI - fallback)
if (btnStart) {
    btnStart.addEventListener('click', startGame);
}
