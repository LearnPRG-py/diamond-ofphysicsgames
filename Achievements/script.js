// ---------------- LOCAL STORAGE KEYS ---------------- //
const STORAGE_KEYS = {
    points: 'ach_points',
    streak: 'ach_streak',
    correct: 'ach_correct',
    questions: 'ach_questions',
    perfection: 'ach_perfection',
    badges: 'ach_badges',
    hash: 'ach_hash',
    achievementsBitmap: 'ach_achievements',
    lastPlayed: 'ach_last_played' // Added for tracking last play date
};
// Debug short-circuit for writes
const DEBUG_SHORT_CIRCUIT_SET = false; // set to true to make setValue a no-op during debugging - can be false
// Debug short-circuit for reads
const DEBUG_SHORT_CIRCUIT_GET = false; // set to true to force getValue to return 0 during debugging - can be false
// Debug short-circuit for server save
const DEBUG_SHORT_CIRCUIT_SAVE = false; // set to true to skip server-side saveState during debugging - can be false

// Feature flags: set false to disable individual features while debugging
const FEATURE_FLAGS = {
    createParticles: true, 
    saveStateServerSide: true,
    verifyIntegrityServerSide: true,
    updateStats: true, //found the culprit here
    renderAchievements: true,
    updateAchievementsBitmap: true,
    checkAchievementsAndUpdate: true,
    periodicCheck: true,
    postSetCheck: true
};

// ---------------- ACHIEVEMENTS DATA ---------------- //
const ACHIEVEMENTS = {
    points: [
        { threshold: 50, name: "Getting Started", icon: "🌟" },
        { threshold: 200, name: "Point Collector", icon: "💎" },
        { threshold: 500, name: "Rising Scholar", icon: "📚" },
        { threshold: 1000, name: "Point Hoarder", icon: "💰" },
        { threshold: 5000, name: "Master", icon: "👑" },
        { threshold: 10000, name: "Legendary", icon: "🏆" },
        { threshold: 50000, name: "HOW DID WE GET HERE?!", icon: "🚀" }
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
let isSavingState = false;

async function saveStateServerSide() {
    // Respect feature flag for server saves
    if (!FEATURE_FLAGS.saveStateServerSide) {
        console.info('FEATURE_FLAGS.saveStateServerSide disabled: skipping saveStateServerSide');
        return;
    }
    // If debugging, skip server-side saves to isolate performance issues
    if (typeof DEBUG_SHORT_CIRCUIT_SAVE !== 'undefined' && DEBUG_SHORT_CIRCUIT_SAVE) {
        console.info('DEBUG_SHORT_CIRCUIT_SAVE enabled: skipping saveStateServerSide');
        return;
    }
    if (typeof Storage === 'undefined') return;
    if (isSavingState) return; // Prevent overlapping requests
    isSavingState = true;

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
    } finally {
        isSavingState = false;
    }
}

// ---------------- PARTICLES ---------------- //
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
            
            const animationDuration = Math.random() * 3 + 6;
            particle.style.animationDuration = animationDuration + 's';
            particle.style.animationDelay = Math.random() * 1 + 's';
            
            particlesContainer.appendChild(particle);
            
            particle.addEventListener('animationend', () => {
                if (particle.parentNode) {
                    particle.remove();
                }
            });
        }
    }, 50);
}

// ---------------- VERIFY INTEGRITY ---------------- //
async function verifyIntegrityServerSide() {
    if (!FEATURE_FLAGS.verifyIntegrityServerSide) return true;
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
    return true;
}

// ---------------- STATE GET/SET ---------------- //

function getValue(key) {
    // If debug short-circuit for reads is enabled, force a fast default value
    if (typeof DEBUG_SHORT_CIRCUIT_GET !== 'undefined' && DEBUG_SHORT_CIRCUIT_GET) {
        return 0;
    }

    if (typeof Storage === 'undefined') return 0;
    return parseInt(localStorage.getItem(STORAGE_KEYS[key])) || 0;
}

function setValue(key, val) {
    // If debug short-circuit is enabled, make setValue a no-op to isolate write-related lag
    if (typeof DEBUG_SHORT_CIRCUIT_SET !== 'undefined' && DEBUG_SHORT_CIRCUIT_SET) {
        return;
    }

    if (typeof Storage !== 'undefined') {
        if (val - getValue(key) <= 50) { 
            localStorage.setItem(STORAGE_KEYS[key], val);
            saveStateServerSide();
        } else {
            console.warn('Attempted to set ' + key + ' to ' + val + ', which is an increase of ' + (val - getValue(key)) + '. Change exceeds limit, saving limit value.');
            localStorage.setItem(STORAGE_KEYS[key], getValue(key) + 50);
            saveStateServerSide();
        }
    }
}

// ---------------- ACHIEVEMENTS BITMAP ---------------- //
let isUpdatingAchievements = false;

function updateAchievementsBitmap() {
    if (!FEATURE_FLAGS.updateAchievementsBitmap) return false;

    if (isUpdatingAchievements) {
        console.warn('Skipping achievement update to avoid recursion.');
        return false;
    }

    isUpdatingAchievements = true;
    console.log('Updating achievements bitmap...');
    const oldBitmap = getValue('achievementsBitmap').toString() || '00000';
    let newBitmap = '';
    const newAchievements = [];
    
    for (let i = 0; i < ['points','streak','correct','questions','perfection'].length; i++) {
        const category = ['points','streak','correct','questions','perfection'][i];
        const value = getValue(category);
        const maxTier = ACHIEVEMENTS[category].length;
        let tierUnlocked = 0;
        
        for (let j = 0; j < maxTier; j++) {
            if (value >= ACHIEVEMENTS[category][j].threshold) tierUnlocked = j + 1;
        }
        
        const oldTier = parseInt(oldBitmap[i]) || 0;
        if (tierUnlocked > oldTier) {
            const achievement = ACHIEVEMENTS[category][tierUnlocked - 1];
            newAchievements.push({
                id: `${category}_${tierUnlocked}`,
                icon: achievement.icon || '🏆',
                title: achievement.name,
                description: achievement.description
            });
        }
        
        newBitmap += tierUnlocked;
    }
    console.log('Old Bitmap:', oldBitmap, 'New Bitmap:', newBitmap);
    
    if (newBitmap !== oldBitmap) {
        setValue('achievementsBitmap', parseInt(newBitmap));
    }
    console.log('Finished updating achievements bitmap.');
    isUpdatingAchievements = false;

    if (typeof addNewAchievement === 'function') {
        newAchievements.forEach(ach => {
            addNewAchievement(ach.id, ach.icon, ach.title, ach.description);
        });
    }
    console.log('New Achievements:', newAchievements);
    
    return newAchievements.length > 0;
}

// ---------------- INITIALIZATION ---------------- //
function initializeAchievementSystem() {
    if (typeof Storage !== 'undefined' && !(verifyIntegrityServerSide ? verifyIntegrityServerSide() : true)) {
        console.warn('Data tampered or missing! Resetting...');
        for (let key in STORAGE_KEYS) {
            if (key !== 'hash') localStorage.setItem(STORAGE_KEYS[key], '0');
        }
        if (typeof saveStateServerSide === 'function') {
            saveStateServerSide();
        }
    }

    updateStats();
    if (typeof renderAchievements === 'function') {
        renderAchievements();
    }
    updateAchievementsBitmap();
}

// ---------------- RENDER FUNCTIONS ---------------- //
function updateStats() {
    if (!FEATURE_FLAGS.updateStats) return;

    const pointsElement = document.getElementById('points-display');
    const streakElement = document.getElementById('streak-display');
    const correctElement = document.getElementById('correct-display');
    const questionsElement = document.getElementById('questions-display');
    console.log('Updating stats display:')
    if (pointsElement) pointsElement.textContent = getValue('points').toLocaleString();
    if (streakElement) streakElement.textContent = getValue('streak');
    if (correctElement) correctElement.textContent = getValue('correct').toLocaleString();
    if (questionsElement) questionsElement.textContent = getValue('questions').toLocaleString();
    console.log('updated')
    updateAchievementsBitmap();
}

function renderAchievements() {
    if (!FEATURE_FLAGS.renderAchievements) return;
    const container = document.getElementById('achievements-container');
    if (!container) return;
    
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

// ---------------- ACHIEVEMENT CHECK ---------------- //
function checkAchievementsAndUpdate() {
    if (!FEATURE_FLAGS.checkAchievementsAndUpdate) return false;
    updateStats();
    const hasNewAchievements = updateAchievementsBitmap();
    
    if (typeof renderAchievements === 'function') {
        renderAchievements();
    }
    
    return hasNewAchievements;
}

// ---------------- OVERRIDE setValue ---------------- //
const originalSetValue = setValue;
setValue = function(key, val) {
    originalSetValue(key, val);

    // Delay achievement checking slightly, but skip if flagged off
    if (FEATURE_FLAGS.postSetCheck) {
        setTimeout(() => {
            checkAchievementsAndUpdate();
        }, 50);
    }
};

// ---------------- PERIODIC CHECK ---------------- //
if (FEATURE_FLAGS.periodicCheck) {
    setInterval(() => {
        checkAchievementsAndUpdate();
    }, 15000); // every 15 seconds
}

// ---------------- DOM READY ---------------- //
document.addEventListener('DOMContentLoaded', async () => {
    if (FEATURE_FLAGS.createParticles) createParticles();

    if (typeof Storage !== 'undefined' && FEATURE_FLAGS.verifyIntegrityServerSide && !(await verifyIntegrityServerSide())) {
        console.warn('Data tampered or missing! Resetting...');
        for (let key in STORAGE_KEYS) {
            if (key !== 'hash') localStorage.setItem(STORAGE_KEYS[key], '0');
        }
        await saveStateServerSide();
    }
    updateStats();
    renderAchievements();
    updateAchievementsBitmap();
});