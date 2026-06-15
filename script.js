const USERS = [
    "ROSARIO", "JONNY", "GIANCA", "ARNONE", "ROBI GATTO", "PERINO", "ITALO", "BALDO", 
    "CORONA", "BRAGHIN", "NICOLAS", "LEOTTA", "BITTO", "CLAUDIO", "EMBRICE", "MATTEO", 
    "CAMPA", "CECCO", "NICOLA", "MARTINA", "ROBERTA", "SANOGO", "FLAVIO", "GUELI", "MORANDINI"
];

// Helper to determine match outcome
function getOutcome(h, a) {
    if (h === null || a === null) return null;
    if (h > a) return '1';
    if (h < a) return '2';
    return 'X';
}

// Scoring Logic
function calculatePoints(userPredictions, actualResults) {
    let totalPoints = 0;
    let exactScores = 0;
    let correctOutcomes = 0;

    for (const group in actualResults.groups) {
        const resultMatches = actualResults.groups[group];
        const userMatches = userPredictions.groups[group];

        resultMatches.forEach((res, index) => {
            const usr = userMatches[index];
            
            // Only calculate if the result is actually entered in RISULTATI.json
            if (res.homeScore !== null && res.awayScore !== null) {
                const resH = parseInt(res.homeScore);
                const resA = parseInt(res.awayScore);
                const usrH = usr.homeScore !== null ? parseInt(usr.homeScore) : null;
                const usrA = usr.awayScore !== null ? parseInt(usr.awayScore) : null;

                if (usrH !== null && usrA !== null) {
                    if (resH === usrH && resA === usrA) {
                        totalPoints += 3;
                        exactScores++;
                    } else if (getOutcome(resH, resA) === getOutcome(usrH, usrA)) {
                        totalPoints += 1;
                        correctOutcomes++;
                    }
                }
            }
        });
    }

    return { totalPoints, exactScores, correctOutcomes };
}

// Load Leaderboard (index.html)
async function loadLeaderboard() {
    const tbody = document.getElementById('leaderboard-body');
    if (!tbody) return;

    try {
        const resultsResponse = await fetch(`data/RISULTATI.json?t=${Date.now()}`, { cache: 'no-store' });
        const results = await resultsResponse.json();

        const userData = await Promise.all(USERS.map(async (user) => {
            try {
                const userResponse = await fetch(`data/${user}.json?t=${Date.now()}`, { cache: 'no-store' });
                const predictions = await userResponse.json();
                const stats = calculatePoints(predictions, results);
                return { name: user, ...stats };
            } catch (e) {
                console.error(`Error loading ${user}:`, e);
                return { name: user, totalPoints: 0, exactScores: 0, correctOutcomes: 0 };
            }
        }));

        // Sort by points desc, then exact scores desc
        userData.sort((a, b) => b.totalPoints - a.totalPoints || b.exactScores - a.exactScores);

        tbody.innerHTML = '';
        userData.forEach((user, index) => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-slate-800/50 transition-colors cursor-pointer group';
            tr.onclick = () => window.location.href = `user.html?name=${encodeURIComponent(user.name)}`;
            
            const medalClass = index === 0 ? 'medal-1' : (index === 1 ? 'medal-2' : (index === 2 ? 'medal-3' : 'bg-slate-800 text-slate-500'));
            const rank = index + 1;

            tr.innerHTML = `
                <td class="px-4 py-4 whitespace-nowrap">
                    <span class="flex items-center justify-center w-8 h-8 rounded-full font-bold ${medalClass}">
                        ${rank}
                    </span>
                </td>
                <td class="px-4 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="text-sm font-semibold group-hover:text-emerald-400 transition-colors">${user.name}</div>
                    </div>
                </td>
                <td class="px-4 py-4 whitespace-nowrap text-right">
                    <span class="text-lg font-bold text-emerald-400">${user.totalPoints}</span>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="3" class="px-6 py-10 text-center text-red-400">Errore nel caricamento dei dati.</td></tr>';
    }
}

// Load User Data (user.html)
async function loadUserData(userName) {
    const container = document.getElementById('groups-container');
    const nameEl = document.getElementById('user-name');
    const pointsEl = document.getElementById('total-points');
    const exactScoresEl = document.getElementById('exact-scores');
    const correctOutcomesEl = document.getElementById('correct-outcomes');

    if (!container) return;

    try {
        const [resultsRes, userRes] = await Promise.all([
            fetch(`data/RISULTATI.json?t=${Date.now()}`, { cache: 'no-store' }),
            fetch(`data/${userName}.json?t=${Date.now()}`, { cache: 'no-store' })
        ]);

        const results = await resultsRes.json();
        const predictions = await userRes.json();
        const stats = calculatePoints(predictions, results);

        nameEl.textContent = userName;
        if (pointsEl) pointsEl.textContent = stats.totalPoints;
        if (exactScoresEl) exactScoresEl.textContent = stats.exactScores;
        if (correctOutcomesEl) correctOutcomesEl.textContent = stats.correctOutcomes;

        container.innerHTML = '';

        for (const group in predictions.groups) {
            const groupCard = document.createElement('div');
            groupCard.className = 'group-card flex rounded-xl overflow-hidden animate__animated animate__fadeInUp';
            
            let matchesHtml = '';
            predictions.groups[group].forEach((match, idx) => {
                const actualMatch = results.groups[group][idx];
                const isFinished = actualMatch.homeScore !== null;
                
                let scoreClass = 'text-slate-300';
                if (isFinished) {
                    const usrH = match.homeScore;
                    const usrA = match.awayScore;
                    const resH = actualMatch.homeScore;
                    const resA = actualMatch.awayScore;
                    
                    if (usrH === resH && usrA === resA) scoreClass = 'text-emerald-400';
                    else if (getOutcome(usrH, usrA) === getOutcome(resH, resA)) scoreClass = 'text-cyan-400';
                    else scoreClass = 'text-red-400 opacity-60';
                }

                matchesHtml += `
                    <div class="match-row flex items-center justify-between p-3">
                        <div class="flex flex-col flex-1">
                            <span class="text-xs font-bold ${scoreClass}">${match.home} v ${match.away}</span>
                            <span class="text-[10px] text-slate-400 opacity-60">21.00, 11.06.2026, CITTÀ DEL MESSICO</span>
                        </div>
                        <div class="flex items-center space-x-2">
                            <div class="score-box font-black">${match.homeScore !== null ? match.homeScore : ''}</div>
                            <div class="score-box font-black">${match.awayScore !== null ? match.awayScore : ''}</div>
                        </div>
                    </div>
                `;
            });

            groupCard.innerHTML = `
                <div class="group-header flex items-center justify-center bg-black/20 px-2 py-4 border-r border-white/10">
                    GRUPPO ${group}
                </div>
                <div class="flex-1 flex flex-col justify-center py-2">
                    ${matchesHtml}
                </div>
            `;
            container.appendChild(groupCard);
        }
    } catch (e) {
        console.error(e);
        container.innerHTML = '<p class="col-span-full text-center text-red-400">Errore nel caricamento dei dati utente.</p>';
    }
}

// Load Results (results.html)
async function loadResults() {
    const container = document.getElementById('results-container');
    if (!container) return;

    try {
        const response = await fetch(`data/RISULTATI.json?t=${Date.now()}`, { cache: 'no-store' });
        const data = await response.json();

        container.innerHTML = '';

        for (const group in data.groups) {
            const groupCard = document.createElement('div');
            groupCard.className = 'group-card flex rounded-xl overflow-hidden animate__animated animate__fadeInUp';
            
            let matchesHtml = '';
            data.groups[group].forEach((match) => {
                const isFinished = match.homeScore !== null && match.awayScore !== null;
                
                matchesHtml += `
                    <div class="match-row flex items-center justify-between p-3 border-b border-white/5 last:border-0">
                        <div class="flex flex-col flex-1">
                            <span class="text-xs font-bold text-slate-300">${match.home} v ${match.away}</span>
                            <span class="text-[10px] text-slate-400 opacity-60 uppercase">Fase a Gironi</span>
                        </div>
                        <div class="flex items-center space-x-2">
                            <div class="score-box font-black">${isFinished ? match.homeScore : ''}</div>
                            <div class="score-box font-black">${isFinished ? match.awayScore : ''}</div>
                        </div>
                    </div>
                `;
            });

            groupCard.innerHTML = `
                <div class="group-header flex items-center justify-center bg-black/20 px-2 py-4 border-r border-white/10 text-xs font-bold">
                    GRUPPO ${group}
                </div>
                <div class="flex-1 flex flex-col justify-center py-2">
                    ${matchesHtml}
                </div>
            `;
            container.appendChild(groupCard);
        }
    } catch (e) {
        console.error(e);
        container.innerHTML = '<p class="col-span-full text-center text-red-400">Errore nel caricamento dei risultati.</p>';
    }
}

// Initialize based on page
if (document.getElementById('leaderboard-body')) {
    loadLeaderboard();
}
