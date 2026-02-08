// Quiz Page JavaScript

// YouTube Data API configuration
const API_KEY = window.CONFIG ? window.CONFIG.API_KEY : '';
const CHANNEL_ID = window.CONFIG ? window.CONFIG.CHANNEL_ID : 'UCnfSjNZZwVl4gs_ZVn9i1ug';

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

// Fetch Channel Stats from YouTube API
async function fetchChannelStats() {
    if (!API_KEY || API_KEY.startsWith('YOUR_API_')) {
        console.log('Using default stats. Add API Key for dynamic updates.');
        return;
    }

    try {
        const response = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${CHANNEL_ID}&key=${API_KEY}`);
        const data = await response.json();

        if (data.error) {
            console.error('YouTube API Error:', data.error.message);
            return;
        }

        if (data.items && data.items.length > 0) {
            const stats = data.items[0].statistics;

            // Update CTA section stats
            const subEl = document.getElementById('cta-subscribers');
            const vidEl = document.getElementById('cta-videos');
            const viewEl = document.getElementById('cta-views');

            if (subEl) subEl.innerText = formatNumber(stats.subscriberCount);
            if (vidEl) vidEl.innerText = formatNumber(stats.videoCount);
            if (viewEl) viewEl.innerText = formatNumber(stats.viewCount);
        }
    } catch (error) {
        console.error('Error fetching channel stats:', error);
    }
}

const quizData = {
    basics: [
        {
            question: "What are the two drums that make up the Tabla?",
            answers: ["Dayan and Bayan", "Tabla and Mridangam", "Dhol and Dholak", "Pakhawaj and Tabla"],
            correct: 0
        },
        {
            question: "Which hand is used to play the Dayan (right drum)?",
            answers: ["Left hand", "Right hand", "Both hands", "Either hand"],
            correct: 1
        },
        {
            question: "What is the black circle in the middle of the Tabla called?",
            answers: ["Syahi", "Gab", "Pudi", "Baj"],
            correct: 0
        },
        {
            question: "What material is traditionally used for Tabla heads?",
            answers: ["Plastic", "Goat skin", "Rubber", "Canvas"],
            correct: 1
        },
        {
            question: "Which country did Tabla originate from?",
            answers: ["Pakistan", "Nepal", "India", "Bangladesh"],
            correct: 2
        }
    ],
    taals: [
        {
            question: "How many beats (matras) are in Teentaal?",
            answers: ["8 beats", "12 beats", "16 beats", "10 beats"],
            correct: 2
        },
        {
            question: "How many beats are in Dadra Taal?",
            answers: ["4 beats", "6 beats", "8 beats", "10 beats"],
            correct: 1
        },
        {
            question: "How many beats are in Keherwa Taal?",
            answers: ["6 beats", "8 beats", "10 beats", "12 beats"],
            correct: 1
        },
        {
            question: "What is the first beat of a Taal called?",
            answers: ["Tali", "Khali", "Sam", "Vibhag"],
            correct: 2
        },
        {
            question: "Which Taal is most commonly used in Bollywood songs?",
            answers: ["Teentaal", "Keherwa", "Dadra", "Jhaptaal"],
            correct: 1
        }
    ],
    bols: [
        {
            question: "What does 'Dha' sound like?",
            answers: ["A sharp sound", "A bass sound", "A ringing sound", "A soft sound"],
            correct: 1
        },
        {
            question: "Which bol is played on the Dayan (right drum) only?",
            answers: ["Dha", "Ge", "Na", "Tin"],
            correct: 3
        },
        {
            question: "What is a 'Bol' in Tabla?",
            answers: ["A rhythm pattern", "A syllable or sound", "A type of drum", "A hand position"],
            correct: 1
        },
        {
            question: "Which bol creates a ringing sound?",
            answers: ["Dha", "Tin", "Na", "Ge"],
            correct: 2
        },
        {
            question: "How many basic bols are there in Tabla?",
            answers: ["5-7", "10-12", "15-20", "25-30"],
            correct: 1
        }
    ],
    fun: [
        {
            question: "How old is the Tabla instrument?",
            answers: ["100 years", "300 years", "500 years", "1000 years"],
            correct: 1
        },
        {
            question: "What is a Tabla player called?",
            answers: ["Tablachi", "Tablist", "Tabliya", "Drummer"],
            correct: 2
        },
        {
            question: "Can you tune a Tabla?",
            answers: ["Yes, by tightening straps", "No, it's fixed", "Only the Dayan", "Only the Bayan"],
            correct: 0
        },
        {
            question: "What is the wooden hammer used to tune Tabla called?",
            answers: ["Tabla stick", "Tuning hammer", "Gatta", "Lakdi"],
            correct: 2
        },
        {
            question: "Which famous musician is known for Tabla?",
            answers: ["Ravi Shankar", "Zakir Hussain", "Pandit Jasraj", "Bismillah Khan"],
            correct: 1
        }
    ]
};

let currentCategory = 'basics';
let currentQuestionIndex = 0;
let score = 0;
let selectedAnswer = null;
let quizCompleted = false;

// DOM Elements
const categoryBtns = document.querySelectorAll('.quiz-category-btn');
const questionText = document.getElementById('question-text');
const answersGrid = document.getElementById('answers-grid');
const nextBtn = document.getElementById('next-question');
const progressFill = document.getElementById('quiz-progress');
const progressText = document.getElementById('progress-text');
const scoreValue = document.getElementById('score-value');
const quizContent = document.getElementById('quiz-content');
const quizResult = document.getElementById('quiz-result');
const restartBtn = document.getElementById('restart-quiz');
const changeCategoryBtn = document.getElementById('change-category');
const ctaSection = document.getElementById('cta-section');
const quizOverlay = document.getElementById('quiz-overlay');
const btnSubscribeQuiz = document.getElementById('btn-subscribe-quiz');

// Initialize Quiz
function initQuiz() {
    currentQuestionIndex = 0;
    score = 0;
    selectedAnswer = null;
    quizCompleted = false;
    updateScore();
    loadQuestion();
    hideCTA();
}

// Load Question
function loadQuestion() {
    const questions = quizData[currentCategory];
    const question = questions[currentQuestionIndex];

    questionText.textContent = question.question;
    answersGrid.innerHTML = '';
    selectedAnswer = null;
    nextBtn.disabled = true;

    question.answers.forEach((answer, index) => {
        const btn = document.createElement('button');
        btn.className = 'answer-btn';
        btn.textContent = answer;
        btn.addEventListener('click', () => selectAnswer(index, btn));
        answersGrid.appendChild(btn);
    });

    updateProgress();
}

// Select Answer
function selectAnswer(index, btn) {
    if (selectedAnswer !== null) return; // Already answered

    selectedAnswer = index;
    const questions = quizData[currentCategory];
    const question = questions[currentQuestionIndex];
    const allBtns = answersGrid.querySelectorAll('.answer-btn');

    allBtns.forEach(b => b.disabled = true);

    if (index === question.correct) {
        btn.classList.add('correct');
        score++;
        updateScore();
    } else {
        btn.classList.add('incorrect');
        // Show correct answer
        allBtns[question.correct].classList.add('correct');
    }

    nextBtn.disabled = false;
}

// Update Progress
function updateProgress() {
    const questions = quizData[currentCategory];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
    progressFill.style.width = progress + '%';
    progressText.textContent = `Question ${currentQuestionIndex + 1} of ${questions.length}`;
}

// Update Score
function updateScore() {
    scoreValue.textContent = score;
}

// Next Question
function nextQuestion() {
    const questions = quizData[currentCategory];

    if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        loadQuestion();
    } else {
        showResults();
    }
}

// Show Results
function showResults() {
    quizCompleted = true;
    quizContent.classList.add('hidden');
    quizResult.classList.remove('hidden');

    const questions = quizData[currentCategory];
    const percentage = (score / questions.length) * 100;

    const resultEmoji = document.getElementById('result-emoji');
    const resultTitle = document.getElementById('result-title');
    const resultMessage = document.getElementById('result-message');
    const resultStars = document.getElementById('result-stars');

    // Set emoji and title based on score
    if (percentage === 100) {
        resultEmoji.textContent = '🏆';
        resultTitle.textContent = 'Perfect Score!';
    } else if (percentage >= 80) {
        resultEmoji.textContent = '🎉';
        resultTitle.textContent = 'Excellent!';
    } else if (percentage >= 60) {
        resultEmoji.textContent = '😊';
        resultTitle.textContent = 'Great Job!';
    } else if (percentage >= 40) {
        resultEmoji.textContent = '👍';
        resultTitle.textContent = 'Good Try!';
    } else {
        resultEmoji.textContent = '💪';
        resultTitle.textContent = 'Keep Practicing!';
    }

    resultMessage.textContent = `You scored ${score} out of ${questions.length}!`;

    // Show stars
    resultStars.innerHTML = '';
    const stars = Math.round((score / questions.length) * 5);
    for (let i = 0; i < 5; i++) {
        const star = document.createElement('span');
        star.className = 'star';
        star.textContent = i < stars ? '⭐' : '☆';
        resultStars.appendChild(star);
    }

    // Show CTA section after a delay
    setTimeout(() => {
        showCTA();
    }, 1000);
}

// Show/Hide CTA
function showCTA() {
    ctaSection.style.display = 'block';
    ctaSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // Fetch latest channel stats from YouTube API
    fetchChannelStats();
}

function hideCTA() {
    if (ctaSection) {
        ctaSection.style.display = 'none';
    }
}

// Restart Quiz
function restartQuiz() {
    quizContent.classList.remove('hidden');
    quizResult.classList.add('hidden');
    initQuiz();
}

// Change Category
function changeCategory() {
    quizContent.classList.remove('hidden');
    quizResult.classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Category Selection
categoryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        categoryBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.dataset.category;
        initQuiz();
    });
});

// Event Listeners
nextBtn.addEventListener('click', nextQuestion);
restartBtn.addEventListener('click', restartQuiz);
changeCategoryBtn.addEventListener('click', changeCategory);

// Share Functionality
const shareUrl = window.location.href;
const shareText = "I just took the Tabla Quiz! Test your knowledge too!";

// WhatsApp share
document.querySelector('.share-btn.whatsapp')?.addEventListener('click', () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank');
});

// Facebook share
document.querySelector('.share-btn.facebook')?.addEventListener('click', () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank', 'width=600,height=400');
});

// Twitter share
document.querySelector('.share-btn.twitter')?.addEventListener('click', () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank', 'width=600,height=400');
});

// Copy link
document.querySelector('.share-btn.copy-link')?.addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    const feedback = btn.querySelector('.copy-feedback');

    try {
        await navigator.clipboard.writeText(shareUrl);
        feedback.classList.add('show');
        setTimeout(() => {
            feedback.classList.remove('show');
        }, 2000);
    } catch (err) {
        console.error('Failed to copy:', err);
    }
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// Initialize on page load
// initQuiz(); // Remove direct initialization, wait for subscription

// Subscription Gate Logic
// Assuming quizOverlay and btnSubscribeQuiz are declared globally or earlier in the script
// If not, they should be declared here:
// const quizOverlay = document.getElementById('quiz-overlay');
// const btnSubscribeQuiz = document.getElementById('btn-subscribe-quiz');

if (btnSubscribeQuiz) {
    btnSubscribeQuiz.addEventListener('click', () => {
        // 1. Open YouTube Channel
        window.open(`https://www.youtube.com/channel/${window.CONFIG ? window.CONFIG.CHANNEL_ID : 'UCnfSjNZZwVl4gs_ZVn9i1ug'}?sub_confirmation=1`, '_blank');

        // 2. Unlock Quiz (Simulate verify)
        btnSubscribeQuiz.innerText = "Verifying...";

        setTimeout(() => {
            quizOverlay.classList.remove('active');
            // Initialize quiz after unlock
            initQuiz();
        }, 2000); // 2 second delay to simulate user action
    });
} else {
    // If element not found (e.g., error in HTML), fallback init
    initQuiz();
}
