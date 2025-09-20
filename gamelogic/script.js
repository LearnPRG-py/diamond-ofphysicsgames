// // Don't redeclare STORAGE_KEYS - it's already defined in achievements/script.js

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
        
        // Handle streak logic
        // const now = new Date();
        // const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        
        // if (lastPlayed > 0) {
        //     const daysDiff = Math.floor((today - lastPlayed) / (1000 * 60 * 60 * 24));
            
        //     if (daysDiff === 1) {
        //         // Played yesterday, increment streak
        //         streak += 1;
        //         const streakPoints = Math.min(streak, 50); // Cap streak points at 50
        //         points += streakPoints;
        //     } else if (daysDiff >= 2) {
        //         // Gap of 2+ days, reset streak
        //         streak = 1;
        //         points += streak; // Add 1 point for streak reset
        //     }
        //     // If daysDiff === 0 (same day), don't change streak or add streak points
        // } else {
        //     // First time playing, set streak to 1
        //     streak = 1;
        //     points += streak; // Add 1 point for first streak
        // }
        
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
return 0;
}