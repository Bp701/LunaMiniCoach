// ==========================================
// PEŁNY KOD APLIKACJI LUNA'S MINICOACH
// (Zawiera: Login, Bazę, Memory, Rysowanie, Rytm)
// ==========================================

// --- 1. SYNTEZATOR DŹWIĘKU ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playTone(freq, type = 'sine', duration = 0.5) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
}

// --- 2. STAN APLIKACJI ---
const appState = {
    user: null,
    currentScreen: 'welcome',
    currentDrawingColor: '#FF6B6B',
    exerciseData: {
        visual: { currentExercise: 0 },
        auditory: { currentExercise: 0, currentPattern: [], userPattern: [] },
        tactile: { currentExercise: 0 },
        memory: { pairsFound: 0, firstCard: null, lockBoard: false }
    }
};

// --- 3. START APLIKACJI ---
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    // Ukrywamy inne ekrany na start
    showScreen('welcome');
});

function setupEventListeners() {
    // 1. Logowanie
    const loginBtn = document.getElementById('loginButton');
    if (loginBtn) loginBtn.addEventListener('click', handleLogin);

    // 2. Wybór ćwiczeń (karty)
    document.querySelectorAll('.exercise-card').forEach(card => {
        card.addEventListener('click', (e) => {
            const category = e.currentTarget.dataset.category;
            startExercise(category);
        });
    });

    // 3. Nawigacja i Dashboard
    document.getElementById('parentDashboardBtn')?.addEventListener('click', loadDashboardData);
    document.getElementById('backToDashboardBtn')?.addEventListener('click', () => showScreen('exerciseSelection'));

    // Obsługa wszystkich przycisków "Powrót"
    ['backToWelcomeBtn', 'backToSelectionBtn1', 'backToSelectionBtn2', 'backToSelectionBtn3', 'backToSelectionBtn4'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.addEventListener('click', () => showScreen('exerciseSelection'));
    });

    // 4. Gry - Przyciski

    // VISUAL
    document.getElementById('nextVisualBtn')?.addEventListener('click', generateColorExercise);

    // AUDITORY (Słuch)
    document.getElementById('playRhythmBtn')?.addEventListener('click', playRhythm);
    document.getElementById('drumPad')?.addEventListener('click', addBeat);
    document.getElementById('checkRhythmBtn')?.addEventListener('click', checkRhythm);
    document.getElementById('resetRhythmBtn')?.addEventListener('click', clearUserPattern);

    // TACTILE (Dotyk/Rysowanie)
    document.getElementById('submitDrawingBtn')?.addEventListener('click', submitDrawing);
    document.getElementById('clearCanvasBtn')?.addEventListener('click', clearCanvas);

    // Modal Sukcesu
    document.getElementById('continueBtn')?.addEventListener('click', () => {
        document.getElementById('successModal').classList.add('hidden');
        showScreen('exerciseSelection');
    });
}

// --- 4. FUNKCJE LOGOWANIA I NAWIGACJI ---

async function handleLogin() {
    const nameInput = document.getElementById('usernameInput');
    const name = nameInput ? nameInput.value.trim() : "";

    if (!name) return alert("Proszę wpisać imię!");

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        const data = await response.json();

        appState.user = data.user;
        document.getElementById('starCount').textContent = appState.user.stars;

        // Pokaż ekran wyboru
        showScreen('exerciseSelection');
    } catch (e) {
        console.error(e);
        alert("Błąd połączenia z serwerem. Upewnij się, że 'npm start' działa.");
    }
}

function showScreen(screenName) {
    // Ukryj wszystko
    document.querySelectorAll('.exercise-screen, .welcome-screen, .exercise-selection, .parent-dashboard').forEach(s => {
        s.classList.add('hidden');
        s.classList.remove('active');
    });

    // Znajdź odpowiedni ekran
    let targetId = '';
    if (screenName === 'welcome') targetId = 'welcomeScreen';
    else if (screenName === 'exerciseSelection') targetId = 'exerciseSelection';
    else if (screenName === 'parentDashboard') targetId = 'parentDashboard';
    else if (screenName === 'memory') targetId = 'memoryExercise';
    else if (screenName.includes('Exercise')) targetId = screenName; // np. memoryExercise bezpośrednio
    else targetId = screenName + 'Exercise'; // np. visual -> visualExercise

    const target = document.getElementById(targetId);
    if (target) {
        target.classList.remove('hidden');
        target.classList.add('active');
    } else {
        console.error("Nie znaleziono ekranu:", targetId);
    }

    appState.currentScreen = screenName;
}

function startExercise(category) {
    // Reset Canvasu przy wejściu (Naprawa błędu rozmiaru 0x0)
    if (category === 'tactile') {
        showScreen('tactile');
        generateEmotionExercise();
        setTimeout(initializeCanvas, 100);
    }
    else if (category === 'memory') {
        showScreen('memory');
        startMemoryGame();
    }
    else if (category === 'visual') {
        showScreen('visual');
        generateColorExercise();
    }
    else if (category === 'auditory') {
        showScreen('auditory');
        generateRhythmExercise();
    }
}

// --- 5. LOGIKA GIER ---

// GRA 1: MEMORY
function startMemoryGame() {
    const grid = document.getElementById('memoryGrid');
    grid.innerHTML = '';
    appState.exerciseData.memory.pairsFound = 0;
    appState.exerciseData.memory.firstCard = null;
    appState.exerciseData.memory.lockBoard = false;
    document.getElementById('memoryPairsFound').textContent = "0";

    const tones = [
        { note: 'C', freq: 261.63 }, { note: 'E', freq: 329.63 },
        { note: 'G', freq: 392.00 }, { note: 'B', freq: 493.88 }
    ];
    let cards = [...tones, ...tones];
    cards.sort(() => 0.5 - Math.random());

    cards.forEach(tone => {
        const card = document.createElement('div');
        card.className = 'memory-card';
        card.dataset.freq = tone.freq;
        card.innerHTML = `<div class="front">🎵</div>`;
        card.addEventListener('click', () => flipCard(card));
        grid.appendChild(card);
    });
}

function flipCard(card) {
    if (appState.exerciseData.memory.lockBoard) return;
    if (card === appState.exerciseData.memory.firstCard) return;
    if (card.classList.contains('matched')) return;

    // Odkrycie
    card.classList.add('flipped');
    card.style.background = '#ffeaa7';
    playTone(parseFloat(card.dataset.freq), 'sine', 0.4);

    if (!appState.exerciseData.memory.firstCard) {
        appState.exerciseData.memory.firstCard = card;
        return;
    }

    checkForMatch(card);
}

function checkForMatch(secondCard) {
    let firstCard = appState.exerciseData.memory.firstCard;
    let isMatch = firstCard.dataset.freq === secondCard.dataset.freq;

    if (isMatch) {
        disableCards(firstCard, secondCard);
    } else {
        unflipCards(firstCard, secondCard);
    }
}

function disableCards(c1, c2) {
    c1.classList.add('matched'); c1.style.background = '#55efc4';
    c2.classList.add('matched'); c2.style.background = '#55efc4';

    appState.exerciseData.memory.firstCard = null;
    appState.exerciseData.memory.pairsFound++;
    document.getElementById('memoryPairsFound').textContent = appState.exerciseData.memory.pairsFound;

    if (appState.exerciseData.memory.pairsFound === 4) {
        completeExercise('memory');
    }
}

function unflipCards(c1, c2) {
    appState.exerciseData.memory.lockBoard = true;
    setTimeout(() => {
        c1.classList.remove('flipped'); c1.style.background = 'white';
        c2.classList.remove('flipped'); c2.style.background = 'white';
        appState.exerciseData.memory.firstCard = null;
        appState.exerciseData.memory.lockBoard = false;
    }, 1000);
}

// GRA 2: KOLORY
const colorPalettes = [['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A']];
function generateColorExercise() {
    const target = colorPalettes[0][Math.floor(Math.random() * 4)];
    document.getElementById('targetColor').style.backgroundColor = target;
    const choices = document.getElementById('colorChoices');
    choices.innerHTML = '';

    [...colorPalettes[0]].sort(() => Math.random() - 0.5).forEach(color => {
        const div = document.createElement('div');
        div.className = 'color-choice';
        div.style.backgroundColor = color;
        // Style inline dla pewności
        div.style.width = '80px'; div.style.height = '80px'; div.style.borderRadius = '10px'; div.style.cursor = 'pointer'; div.style.border = '2px solid #ddd';

        div.addEventListener('click', () => {
            if (color === target) {
                completeExercise('visual');
            } else {
                playTone(150, 'sawtooth', 0.2);
            }
        });
        choices.appendChild(div);
    });
}

// GRA 3: RYTM (Poprawiona logika bębnów)
function generateRhythmExercise() {
    const len = 3 + Math.floor(Math.random() * 3);
    appState.exerciseData.auditory.currentPattern = Array(len).fill(1);
    appState.exerciseData.auditory.userPattern = [];

    const container = document.getElementById('rhythmPattern');
    container.innerHTML = '';
    appState.exerciseData.auditory.currentPattern.forEach((_, i) => {
        container.innerHTML += `<div class="rhythm-beat" style="width:30px;height:30px;background:#0984e3;border-radius:50%;display:inline-block;margin:5px;line-height:30px;color:white;">${i + 1}</div>`;
    });

    clearUserPattern();
}

function playRhythm() {
    const beats = document.querySelectorAll('#rhythmPattern .rhythm-beat');
    let i = 0;
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const next = () => {
        if (i < beats.length) {
            beats[i].style.transform = 'scale(1.5)';
            beats[i].style.background = '#00b894';
            playTone(600, 'sine', 0.2);
            setTimeout(() => {
                beats[i].style.transform = 'scale(1)';
                beats[i].style.background = '#0984e3';
            }, 300);
            i++;
            setTimeout(next, 600);
        }
    };
    next();
}

function addBeat() {
    appState.exerciseData.auditory.userPattern.push(1);
    updateUserPattern();
    playTone(300, 'triangle', 0.1);

    // Animacja
    const pad = document.getElementById('drumPad');
    pad.style.transform = 'scale(0.9)';
    setTimeout(() => pad.style.transform = 'scale(1)', 100);
}

function updateUserPattern() {
    const container = document.getElementById('userPattern');
    container.innerHTML = '';
    appState.exerciseData.auditory.userPattern.forEach(() => {
        container.innerHTML += `<span style="font-size:2rem;">🥁</span>`;
    });
}

function clearUserPattern() {
    appState.exerciseData.auditory.userPattern = [];
    updateUserPattern();
}

function checkRhythm() {
    const target = appState.exerciseData.auditory.currentPattern.length;
    const user = appState.exerciseData.auditory.userPattern.length;

    const feedback = document.getElementById('auditoryFeedback');
    if (target === user) {
        feedback.innerHTML = '<span style="color:green; font-weight:bold;">Brawo!</span>';
        completeExercise('auditory');
    } else {
        feedback.innerHTML = `<span style="color:red;">Oczekiwano ${target}, wystukano ${user}.</span>`;
        playTone(150, 'sawtooth', 0.5);
    }
}

// GRA 4: RYSOWANIE
function generateEmotionExercise() {
    document.getElementById('emotionPrompt').textContent = "Radość";
    clearCanvas();
}

function initializeCanvas() {
    const canvas = document.getElementById('drawingCanvas');
    if (!canvas) return;

    // Naprawa rozmiaru
    canvas.width = canvas.offsetWidth || 300;
    canvas.height = canvas.offsetHeight || 300;

    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#FF6B6B';

    let isDrawing = false;

    const start = (e) => { isDrawing = true; ctx.beginPath(); draw(e); };
    const end = () => { isDrawing = false; ctx.beginPath(); };
    const draw = (e) => {
        if (!isDrawing) return;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || e.touches[0].clientX) - rect.left;
        const y = (e.clientY || e.touches[0].clientY) - rect.top;
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    canvas.onmousedown = start; canvas.onmousemove = draw; canvas.onmouseup = end;
    canvas.ontouchstart = (e) => { e.preventDefault(); start(e) };
    canvas.ontouchmove = (e) => { e.preventDefault(); draw(e) };
    canvas.ontouchend = (e) => { e.preventDefault(); end() };
}

function clearCanvas() {
    const canvas = document.getElementById('drawingCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function submitDrawing() {
    completeExercise('tactile');
}

// --- 6. ZAPIS I DASHBOARD ---

async function completeExercise(category) {
    playTone(500, 'sine', 0.1);
    setTimeout(() => playTone(800, 'sine', 0.2), 150);

    // Zapisz w bazie
    await saveProgress(category);

    // Pokaż sukces
    document.getElementById('successTitle').textContent = "Świetnie!";
    document.getElementById('successMessage').textContent = "Zadanie zaliczone!";
    document.getElementById('successModal').classList.remove('hidden');
}

async function saveProgress(category) {
    if (!appState.user) return;

    const payload = {
        userId: appState.user.id,
        stars: appState.user.stars + 3,
        visual: appState.user.visual_score + (category === 'visual' ? 1 : 0),
        auditory: appState.user.auditory_score + (category === 'auditory' ? 1 : 0),
        tactile: appState.user.tactile_score + (category === 'tactile' ? 1 : 0),
        memory: appState.user.memory_score + (category === 'memory' ? 1 : 0)
    };

    // Aktualizuj lokalnie
    appState.user.stars = payload.stars;
    appState.user.visual_score = payload.visual;
    // ... itd ...
    document.getElementById('starCount').textContent = payload.stars;

    try {
        await fetch('/api/save-progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    } catch (e) { console.error(e); }
}

async function loadDashboardData() {
    showScreen('parentDashboard');
    if (!appState.user) return;

    try {
        const res = await fetch(`/api/user/${appState.user.id}`);
        const data = await res.json();

        // Prosty wykres jeśli jest biblioteka, jak nie to nic
        if (typeof Chart !== 'undefined') {
            const ctx = document.getElementById('progressChart');
            if (window.myChart) window.myChart.destroy();
            window.myChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Wzrok', 'Słuch', 'Dotyk', 'Pamięć'],
                    datasets: [{
                        label: 'Postęp ' + data.name,
                        data: [data.visual_score, data.auditory_score, data.tactile_score, data.memory_score],
                        backgroundColor: ['#ff7675', '#74b9ff', '#55efc4', '#ffeaa7']
                    }]
                },
                options: { scales: { y: { beginAtZero: true } } }
            });
        }
    } catch (e) { console.error(e); }
}