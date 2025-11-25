function reportNuggetCompletion(jsonData) {
    try {
        console.log('reportNuggetCompletion called with data:', jsonData);
        const data = JSON.parse(jsonData);
        console.log('Nugget completed:', data);
        let { score, tries } = data;

        score = Number(score) || 0;
        tries = Number(tries) || 1;
        
        const percentage = (score / tries) * 100;

        let points = getValue('points');
        let perfection = getValue('perfection');
        let streak = getValue('streak');
        let correct = getValue('correct');
        let questions = getValue('questions');
        let lastPlayedRaw = Number(getValue('lastPlayed')) || 0;

        const now = Date.now();
        const todayNormalized = new Date(
            new Date(now).getFullYear(),
            new Date(now).getMonth(),
            new Date(now).getDate()
        ).getTime();

        const lastPlayedNormalized = new Date(
            new Date(lastPlayedRaw).getFullYear(),
            new Date(lastPlayedRaw).getMonth(),
            new Date(lastPlayedRaw).getDate()
        ).getTime();

        // Debug Logs
        console.log('=== STREAK DEBUG ===');
        console.log('lastPlayedRaw:', lastPlayedRaw, '(', new Date(lastPlayedRaw), ')');
        console.log('lastPlayedNormalized:', lastPlayedNormalized, '(', new Date(lastPlayedNormalized), ')');
        console.log('todayNormalized:', todayNormalized, '(', new Date(todayNormalized), ')');
        console.log('Current streak BEFORE update:', streak);

        // POINTS FOR PERFORMANCE
        if (percentage > 95) {
            points += 50;
            perfection += 3;
        } else if (percentage > 75) {
            points += 30;
            perfection += 1;
        } else {
            points += 20;
        }

        const ONE_DAY_MS = 1000 * 60 * 60 * 24;

        if (lastPlayedNormalized < todayNormalized) {
            console.log('→ BRANCH: first play today');

            const yesterdayNormalized = todayNormalized - ONE_DAY_MS;
            console.log('  yesterdayNormalized:', yesterdayNormalized, '(', new Date(yesterdayNormalized), ')');

            if (lastPlayedNormalized === yesterdayNormalized) {
                console.log('  → played yesterday → streak++');
                streak += 1;
            } else {
                console.log('  → did NOT play yesterday → reset streak');
                streak = 1;
            }

            const streakPoints = Math.min(streak, 50);
            points += streakPoints;
            console.log('  Awarding', streakPoints, 'streak points');

            // Save LAST PLAYED as today midnight
            setValue('lastPlayed', todayNormalized);
            console.log('  Updated lastPlayed to', todayNormalized);

        } else {
            console.log('→ BRANCH: already played today → no streak update');
        }

        console.log('Streak AFTER update:', streak);
        console.log('=== END STREAK DEBUG ===');

        // Update totals
        correct += score;
        questions += tries;

        // Save stats
        setValue('points', points);
        setValue('perfection', perfection);
        setValue('streak', streak);
        setValue('correct', correct);
        setValue('questions', questions);

        console.log(`Game completed: Score ${score}/${tries} (${percentage.toFixed(1)}%)`);
        console.log(`Updated stats - Points: ${points}, Perfection: ${perfection}, Streak: ${streak}, Correct: ${correct}, Questions: ${questions}`);
        
    } catch (error) {
        console.error('Error processing game completion:', error);
    }
    return 0;
}