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
        { threshold: 50000, name: "PHYSICS GOD?!", icon: "👽" }
    ],
    streak: [
        { threshold: 7, name: "Week One Wonder", icon: "📅" },
        { threshold: 10, name: "Double Digits", icon: "🔟" },
        { threshold: 30, name: "Month Maven", icon: "📆" },
        { threshold: 50, name: "Half-Century Hero", icon: "⭐" },
        { threshold: 100, name: "Century Streak", icon: "💯" },
    ],
    correct: [
        { threshold: 1, name: "A Start", icon: "✅" },
        { threshold: 10, name: "Getting It", icon: "✅" },
        { threshold: 100, name: "Brainiac", icon: "🧠" },
        { threshold: 1000, name: "Quiz Master", icon: "🏅" }
    ],
    questions: [
        { threshold: 1, name: "Questionable Start", icon: "❓" },
        { threshold: 10, name: "Curious Mind", icon: "🤔" },
        { threshold: 100, name: "Question Hoarder", icon: "📝" },
        { threshold: 1000, name: "Quizzilla", icon: "📊" }
    ],
    perfection: [
        { threshold: 1, name: "Near Perfect", icon: "⚡" },
        { threshold: 10, name: "Excellence", icon: "🎪" },
        { threshold: 100, name: "Perfectionist", icon: "💫" },
        { threshold: 500, name: "Flawless Legend", icon: "🌟" }
    ]
};

const CATEGORY_NAMES = {
    points: "Points Milestones",
    streak: "Streak Achievements", 
    correct: "Accuracy Awards",
    questions: "Question Achievements",
    perfection: "Perfection Badges"
};

// ---------------- LOCAL ENCRYPTION ---------------- //
let localSecret = null;

// Initialize local secret on first load
function initializeLocalSecret() {
    if (localSecret === null) {
        // Try to get existing secret from storage
        const existingSecret = getCookie('ach_local_secret');
        if (existingSecret) {
            localSecret = parseInt(existingSecret, 10);
        } else {
            // Generate new random secret (0-9999)
            localSecret = Math.floor(Math.random() * 10000);
            setCookie('ach_local_secret', String(localSecret), 2147483647);
        }
    }
    return localSecret;
}

// Encrypt a value using local secret
function encryptValue(value) {
    const secret = initializeLocalSecret();
    return (secret * secret) + (44 * secret) + value;
}

// Decrypt a value using local secret
function decryptValue(encryptedValue) {
    const secret = initializeLocalSecret();
    return encryptedValue - (secret * secret) - (44 * secret);
}

// ---------------- COOKIE HELPERS ---------------- //
function setCookie(name, value, days = 2147483647) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    const cookie = `${encodeURIComponent(name)}=${encodeURIComponent(String(value))}; Expires=${expires}; Path=/; Domain=.quarklearning.online; Secure; SameSite=None`;
    document.cookie = cookie;
}

function getCookie(name) {
    const cookies = document.cookie ? document.cookie.split('; ') : [];
    for (let i = 0; i < cookies.length; i++) {
        const parts = cookies[i].split('=');
        const key = decodeURIComponent(parts.shift());
        const val = parts.join('=');
        if (key === name) return decodeURIComponent(val);
    }
    return null;
}

function deleteCookie(name) {
    // Set expiry in the past to delete. Include domain/path to ensure deletion on same scope.
    document.cookie = `${encodeURIComponent(name)}=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; Domain=.quarklearning.online; Secure; SameSite=None`;
}

// Server-side functions removed - using local encryption instead

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

// Server-side verification removed - using local encryption instead

// ---------------- STATE GET/SET ---------------- //

function getValue(key) {
    // If debug short-circuit for reads is enabled, force a fast default value
    if (typeof DEBUG_SHORT_CIRCUIT_GET !== 'undefined' && DEBUG_SHORT_CIRCUIT_GET) {
        return 0;
    }

    if (typeof document === 'undefined' || typeof document.cookie === 'undefined') return 0;
    const raw = getCookie(STORAGE_KEYS[key]);
    
    if (!raw) return 0;
    
    // Keys that should NOT be decrypted (bitmap, badges, etc.)
    const EXEMPT_FROM_DECRYPTION = ['achievementsBitmap', 'badges', 'hash'];
    
    if (EXEMPT_FROM_DECRYPTION.includes(key)) {
        return parseInt(raw, 10) || 0;
    }
    
    const rawValue = parseInt(raw, 10);
    if (!Number.isFinite(rawValue)) return 0;
    
    // Check if this looks like encrypted data (much larger than reasonable values)
    // If the value is suspiciously large, try to decrypt it
    if (rawValue > 1000000) { // Reasonable threshold for unencrypted values
        try {
            const decrypted = decryptValue(rawValue);
            // If decryption gives us a reasonable value, use it
            if (decrypted >= 0 && decrypted < 1000000) {
                return decrypted;
            }
        } catch (error) {
            console.warn(`Failed to decrypt ${key}:`, error);
        }
    }
    
    // Return the raw value (either it's unencrypted or decryption failed)
    return rawValue;
}

function setValue(key, val) {
    // If debug short-circuit is enabled, make setValue a no-op to isolate write-related lag
    if (typeof DEBUG_SHORT_CIRCUIT_SET !== 'undefined' && DEBUG_SHORT_CIRCUIT_SET) {
        return;
    }

    if (typeof document !== 'undefined' && typeof document.cookie !== 'undefined') {
        // Keys that should NOT be subject to encryption or "+50 cap" (bitmap, hashes, badges etc.)
        const EXEMPT_FROM_CAP = ['achievementsBitmap', 'badges', 'hash'];

        // If the key is exempt, write the value as-is (string) and skip numeric checks.
        if (EXEMPT_FROM_CAP.includes(key)) {
            setCookie(STORAGE_KEYS[key], String(val), 2147483647);
            return;
        }

        // Coerce to number and validate for numeric stats
        const numericVal = Number(val);
        if (!Number.isFinite(numericVal)) {
            console.warn(`Attempted to set ${key} to ${val}, which is not a finite number. Ignoring write.`);
            return;
        }

        const current = getValue(key);
        const delta = numericVal - current;

        let valueToSave = numericVal;
        if (Math.abs(delta) > 50) {
            console.warn(`Attempted to set ${key} to ${numericVal}, which is an increase of ${delta}. Change exceeds limit, saving limit value.`);
            valueToSave = current + 50;
        }

        // Encrypt the value before saving
        try {
            const encryptedValue = encryptValue(valueToSave);
            setCookie(STORAGE_KEYS[key], String(encryptedValue), 2147483647);
        } catch (error) {
            console.error(`Failed to encrypt ${key}, saving unencrypted:`, error);
            setCookie(STORAGE_KEYS[key], String(valueToSave), 2147483647);
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
    // Normalize the stored bitmap as a zero-padded 5-character string for comparison
    const stored = getValue('achievementsBitmap');
    const oldBitmapNum = Number.isFinite(Number(stored)) ? Number(stored) : 0;
    const oldBitmap = String(oldBitmapNum).padStart(5, '0');
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
    // Compare numeric values to avoid writing the same numeric bitmap with differing string representations
    const newBitmapNum = Number.isFinite(Number(newBitmap)) ? Number(newBitmap) : 0;
    if (newBitmapNum !== oldBitmapNum) {
        // Write bitmap directly (bitmap should not be subject to the +50 cap in setValue)
        setCookie(STORAGE_KEYS.achievementsBitmap, String(newBitmapNum), 2147483647);
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
    // Initialize local encryption secret
    initializeLocalSecret();
    
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

// ---------------- RESET FUNCTION ---------------- //
function resetAllData() {
    console.log('Resetting all achievement data...');
    for (let key in STORAGE_KEYS) {
        if (key !== 'hash') {
            setCookie(STORAGE_KEYS[key], '0', 2147483647);
        }
    }
    // Also clear the local secret to force regeneration
    deleteCookie('ach_local_secret');
    localSecret = null;
    console.log('Data reset complete. Refreshing page...');
    setTimeout(() => {
        window.location.reload();
    }, 1000);
}

// ---------------- DOM READY ---------------- //
document.addEventListener('DOMContentLoaded', async () => {
    if (FEATURE_FLAGS.createParticles) createParticles();

    // Initialize local encryption secret
    initializeLocalSecret();
    
    // Check for corrupted data and reset if needed
    const points = getValue('points');
    const streak = getValue('streak');
    const correct = getValue('correct');
    const questions = getValue('questions');
    
    // If any value is negative or suspiciously large, reset everything
    if (points < 0 || streak < 0 || correct < 0 || questions < 0 || 
        points > 1000000 || streak > 1000000 || correct > 1000000 || questions > 1000000) {
        console.warn('Detected corrupted data, resetting...');
        resetAllData();
        return;
    }
    
    updateStats();
    renderAchievements();
    updateAchievementsBitmap();
});
// Keyboard sequence detector for "Reset!!!"
let keySequence = '';
let sequenceTimeout;

function isInTextInput() {
    const activeElement = document.activeElement;
    const inputTypes = ['INPUT', 'TEXTAREA', 'SELECT'];
    const contentEditable = activeElement.contentEditable === 'true';
    
    return inputTypes.includes(activeElement.tagName) || contentEditable;
}

function resetAllData() {
    console.log('Resetting all achievement data...');
    
    // List of cookies to clear (matching your achievement system)
    const cookiesToClear = [
        'ach_points',
        'ach_streak', 
        'ach_correct',
        'ach_questions',
        'ach_perfection',
        'ach_badges',
        'ach_achievements',
        'ach_local_secret',
        'pending_achievements'
    ];
    
    // Clear each cookie
    cookiesToClear.forEach(cookieName => {
        document.cookie = `${encodeURIComponent(cookieName)}=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; Domain=.quarklearning.online; Secure; SameSite=None`;
    });
    
    console.log('All achievement data cleared. Reloading page...');
    
    // Show confirmation
    alert('Achievement data has been reset!');
    
    // Reload page to reflect changes
    window.location.reload();
}

document.addEventListener('keydown', function(event) {
    // Ignore if user is typing in a text field
    if (isInTextInput()) {
        return;
    }
    
    // Clear any existing timeout
    clearTimeout(sequenceTimeout);
    
    // Add the pressed key to sequence
    keySequence += event.key;
    
    // Keep only the last 8 characters (length of "Reset!!!")
    if (keySequence.length > 8) {
        keySequence = keySequence.slice(-8);
    }
    
    // Check if sequence matches "Reset!!!"
    if (keySequence === 'Reset!!!') {
        console.log('Reset sequence detected!');
        keySequence = ''; // Clear sequence
        
        // Confirm before reset
        if (confirm('Are you sure you want to reset ALL achievement data? This cannot be undone!')) {
            resetAllData();
        }
        return;
    }
    
    // Clear sequence after 2 seconds of no typing
    sequenceTimeout = setTimeout(() => {
        keySequence = '';
    }, 2000);
});

console.log('Reset keyboard listener initialized. Type "Reset!!!" to clear achievement data.');

// ✅ Expose functions globally
window.addNewAchievement = addNewAchievement;
window.getValue = getValue;
window.setValue = setValue;
window.updateStatsDisplay = updateStatsDisplay;
window.resetAllData = resetAllData;