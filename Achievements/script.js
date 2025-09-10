// ---------------- LOCAL STORAGE KEYS ---------------- //
const STORAGE_KEYS = {
    points: 'ach_points',
    streak: 'ach_streak',
    correct: 'ach_correct',
    questions: 'ach_questions',
    perfection: 'ach_perfection',
    badges: 'ach_badges',
    hash: 'ach_hash',
    achievementsBitmap: 'ach_achievements'
};

// ---------------- ACHIEVEMENTS DATA ---------------- //
const ACHIEVEMENTS = {
    points: [
        { threshold: 100, name: "Getting Started", icon: "🌟" },
        { threshold: 500, name: "Point Collector", icon: "💎" },
        { threshold: 1000, name: "Rising Scholar", icon: "📚" },
        { threshold: 5000, name: "Point Hoarder", icon: "💰" },
        { threshold: 10000, name: "Master", icon: "👑" },
        { threshold: 50000, name: "Legendary", icon: "🏆" },
        { threshold: 100000, name: "HOW DID WE GET HERE?!", icon: "🚀" }
    ],
    streak: [
        { threshold: 7, name: "Week One Wonder", icon: "📅" },
        { threshold: 10, name: "Double Digits", icon: "🔟" },
        { threshold: 30, name: "Month Maven", icon: "📆" },
        { threshold: 50, name: "Half-Century Hero", icon: "⭐" },
        { threshold: 100, name: "Century Streak", icon: "💯" },
        { threshold: 365, name: "Daily Devotee", icon: "🌅" }
    ],
    correct: [
        { threshold: 10, name: "A Start", icon: "✅" },
        { threshold: 100, name: "Getting It", icon: "🧠" },
        { threshold: 1000, name: "Decent Brain", icon: "🎯" },
        { threshold: 10000, name: "Quiz Master", icon: "🏅" }
    ],
    questions: [
        { threshold: 10, name: "Questionable Start", icon: "❓" },
        { threshold: 100, name: "Curious Mind", icon: "🤔" },
        { threshold: 1000, name: "Question Hoarder", icon: "📝" },
        { threshold: 10000, name: "Quizzilla", icon: "📊" }
    ],
    perfection: [
        { threshold: 10, name: "Near Perfect", icon: "⚡" },
        { threshold: 100, name: "Excellence", icon: "🎪" },
        { threshold: 1000, name: "Perfectionist", icon: "💫" },
        { threshold: 10000, name: "Flawless Legend", icon: "🌟" }
    ]
};

const CATEGORY_NAMES = {
    points: "Points Milestones",
    streak: "Streak Achievements", 
    correct: "Accuracy Awards",
    questions: "Question Achievements",
    perfection: "Perfection Badges"
};

// ---------------- SERVER HASHING ---------------- //
async function saveStateServerSide() {
    if (typeof Storage === 'undefined') return;
    const stats = {
        points: getValue('points'),
        streak: getValue('streak'),
        correct: getValue('correct'),
        questions: getValue('questions'),
        perfection: getValue('perfection'),
        badges: getValue('badges')
    };
    try {
        const res = await fetch('/.netlify/functions/hash-stats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stats })
        });
        const data = await res.json();
        if (data.hash) {
            localStorage.setItem(STORAGE_KEYS.hash, data.hash);
        }
    } catch (err) {
        console.error('Error saving state:', err);
    }
}

function createParticles() {
    const particlesContainer = document.getElementById('particles');
    if (!particlesContainer) return;
    
    setInterval(() => {
        const currentCount = document.querySelectorAll('.particle').length;
        const maxCount = 1500;
        const particlesToAdd = Math.min(3, maxCount - currentCount);
        
        for (let i = 0; i < particlesToAdd; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + 'vw';
            particle.style.width = particle.style.height = Math.random() * 4 + 2 + 'px';
            
            const animationDuration = Math.random() * 3 + 6; // 6-9 seconds
            particle.style.animationDuration = animationDuration + 's';
            particle.style.animationDelay = Math.random() * 1 + 's';
            
            particlesContainer.appendChild(particle);
            
            // Remove particle only after animation actually ends
            particle.addEventListener('animationend', () => {
                if (particle.parentNode) {
                    particle.remove();
                }
            });
        }
    }, 50);
}

// Initialize particles
document.addEventListener('DOMContentLoaded', () => {
    createParticles();
});

async function verifyIntegrityServerSide() {
    if (typeof Storage === 'undefined') return true;
    const stats = {
        points: getValue('points'),
        streak: getValue('streak'),
        correct: getValue('correct'),
        questions: getValue('questions'),
        perfection: getValue('perfection'),
        badges: getValue('badges')
    };
    try {
        const res = await fetch('/.netlify/functions/hash-stats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stats })
        });
        const data = await res.json();
        return data.hash === localStorage.getItem(STORAGE_KEYS.hash);
    } catch (err) {
        console.error('Error verifying integrity:', err);
        return false;
    }
}

// ---------------- STATE GET/SET ---------------- //
function getValue(key) {
    if (typeof Storage === 'undefined') return 0;
    return parseInt(localStorage.getItem(STORAGE_KEYS[key])) || 0;
}

function setValue(key, val) {
    if (typeof Storage !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS[key], val);
        saveStateServerSide();
    }
}

// ---------------- ACHIEVEMENTS BITMAP ---------------- //
function updateAchievementsBitmap() {
    let bitmap = '';
    for (let category of ['points','streak','correct','questions','perfection']) {
        const value = getValue(category);
        const maxTier = ACHIEVEMENTS[category].length;
        let tierUnlocked = 0;
        for (let i = 0; i < maxTier; i++) {
            if (value >= ACHIEVEMENTS[category][i].threshold) tierUnlocked = i + 1;
        }
        bitmap += tierUnlocked;
    }
    setValue('achievementsBitmap', bitmap);
}

// ---------------- RENDER FUNCTIONS ---------------- //
function updateStats() {
    document.getElementById('points-display').textContent = getValue('points').toLocaleString();
    document.getElementById('streak-display').textContent = getValue('streak');
    document.getElementById('correct-display').textContent = getValue('correct').toLocaleString();
    document.getElementById('questions-display').textContent = getValue('questions').toLocaleString();
    updateAchievementsBitmap();
}

function renderAchievements() {
    const container = document.getElementById('achievements-container');
    container.innerHTML = '';

    for (const category in ACHIEVEMENTS) {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'category-section';
        const title = document.createElement('h2');
        title.className = 'category-title';
        title.textContent = CATEGORY_NAMES[category];
        categoryDiv.appendChild(title);

        const currentValue = getValue(category);

        ACHIEVEMENTS[category].forEach((achievement) => {
            const item = document.createElement('div');
            item.className = 'achievement-item';
            const unlocked = currentValue >= achievement.threshold;
            if (unlocked) item.classList.add('unlocked');

            const icon = document.createElement('div');
            icon.className = 'achievement-icon ' + (unlocked ? 'unlocked' : 'locked');
            icon.textContent = unlocked ? achievement.icon : '🔒';

            const content = document.createElement('div');
            content.className = 'achievement-content';
            
            const name = document.createElement('div');
            name.className = 'achievement-name ' + (unlocked ? 'unlocked' : 'locked');
            name.textContent = achievement.name;

            const threshold = document.createElement('div');
            threshold.className = 'achievement-threshold';
            threshold.textContent = `${achievement.threshold.toLocaleString()} ${category}`;

            const progressBar = document.createElement('div');
            progressBar.className = 'progress-bar';
            const progressFill = document.createElement('div');
            progressFill.className = 'progress-fill';
            const progress = Math.min(100, (currentValue / achievement.threshold) * 100);
            progressFill.style.width = `${progress}%`;
            progressBar.appendChild(progressFill);

            content.appendChild(name);
            content.appendChild(threshold);
            content.appendChild(progressBar);

            item.appendChild(icon);
            item.appendChild(content);
            categoryDiv.appendChild(item);
        });

        container.appendChild(categoryDiv);
    }
}

// ---------------- INIT ---------------- //
document.addEventListener('DOMContentLoaded', async () => {
    if (typeof Storage !== 'undefined' && !(await verifyIntegrityServerSide())) {
        console.warn('Data tampered or missing! Resetting...');
        for (let key in STORAGE_KEYS) {
            if (key !== 'hash') localStorage.setItem(STORAGE_KEYS[key], '0');
        }
        await saveStateServerSide();
    }

    updateStats();
    renderAchievements();
});