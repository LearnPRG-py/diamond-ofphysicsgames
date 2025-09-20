// Don't redeclare STORAGE_KEYS - it's already defined in achievements/script.js

function reportNuggetCompletion(jsonData) {
    try {
        const data = JSON.parse(jsonData);
        const { score, tries } = data;
        
        // Calculate percentage
        const percentage = (score / tries) * 100;
        
        // Get current values using getValue function
        let points = getValue('points');
        let perfection = getValue('perfection');
        let streak = getValue('streak');
        let correct = getValue('correct');
        let questions = getValue('questions');
        const lastPlayed = getValue('lastPlayed');
        
        // Handle points based on accuracy
        if (percentage > 95) {
            points += 50;
            perfection += 3;
        } else if (percentage > 75) {
            points += 30;
            perfection += 1;
        } else {
            points += 20; // Just completed
        }
        
        // Handle streak logic (guarded)
        // Compute today's midnight timestamp once and validate lastPlayed
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

        // Coerce lastPlayed to a number and validate
        let lastPlayedNum = Number(lastPlayed);
        if (!Number.isFinite(lastPlayedNum) || lastPlayedNum <= 0) {
            // Treat as first-time play or invalid stored value
            streak = 1;
            points += streak; // Add 1 point for first streak
        } else {
            const MS_PER_DAY = 1000 * 60 * 60 * 24;
            let daysDiff = Math.floor((today - lastPlayedNum) / MS_PER_DAY);

            // Guard against unexpected huge / NaN values
            if (!Number.isFinite(daysDiff) || Math.abs(daysDiff) > 10000) {
                // suspicious value, ignore and don't modify streak
                daysDiff = 0;
            }

            if (daysDiff === 1) {
                // Played yesterday, increment streak
                streak = (Number.isFinite(streak) ? streak : 0) + 1;
                const streakPoints = Math.min(streak, 50); // Cap streak points at 50
                points += streakPoints;
            } else if (daysDiff >= 2) {
                // Gap of 2+ days, reset streak
                streak = 1;
                points += streak; // Add 1 point for streak reset
            }
            // If daysDiff === 0 (same day), don't change streak or add streak points
        }
        
        // Update correct and questions
        correct += score;
        questions += tries;
        
        // Use setValue function to save all updated values (pass numbers, not strings)
        setValue('points', points);
        setValue('perfection', perfection);
        setValue('streak', streak);
        setValue('correct', correct);
        setValue('questions', questions);
        setValue('lastPlayed', today);
        
        console.log(`Game completed: Score ${score}/${tries} (${percentage.toFixed(1)}%)`);
        console.log(`Updated stats - Points: ${points}, Perfection: ${perfection}, Streak: ${streak}, Correct: ${correct}, Questions: ${questions}`);
        
    } catch (error) {
        console.error('Error processing game completion:', error);
    }
}