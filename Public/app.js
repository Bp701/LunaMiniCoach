// ==========================================
// LUNA MINI COACH - SYSTEM HEALTH-TECH v2.1
// ==========================================

// --- 1. LUNA AI SENSOR SYSTEM (IoT CORE) ---
class LunaSensorSystem {
    constructor() {
        this.shakeThreshold = 45; // Wysoki próg - wymaga mocnego potrząśnięcia
        this.lastShake = 0;
        console.log('🧠 Luna AI: System sensorów gotowy (Czułość: 45)');
    }

    initSensors() {
        if (window.DeviceMotionEvent) {
            window.addEventListener('devicemotion', (e) => {
                const acc = e.accelerationIncludingGravity;
                if (!acc) return;

                const intensity = Math.abs(acc.x) + Math.abs(acc.y) + Math.abs(acc.z);

                if (intensity > this.shakeThreshold) {
                    const now = Date.now();
                    // Blokada czasowa (max raz na 5 sekund)
                    if (now - this.lastShake > 5000) {
                        this.lastShake = now;
                        this.onSensorTrigger();
                    }
                }
            });
        }
    }

    onSensorTrigger() {
        console.log('🎯 Luna AI: Wykryto interwencję ruchową');
        this.triggerCalmEffect();
    }

    triggerCalmEffect() {
        // Dźwięk
        if (typeof playTone === 'function') playTone(300, 'sine', 0.5);

        // Efekt wizualny (Nie blokuje klikania!)
        const effect = document.createElement('div');
        effect.style.cssText = `
            position: fixed; top: 20%; left: 50%; transform: translateX(-50%);
            background: rgba(76, 175, 80, 0.95); 
            padding: 15px 25px; border-radius: 30px;
            display: flex; align-items: center; justify-content: center; gap: 10px;
            font-size: 1.1rem; color: white; font-weight: bold; 
            box-shadow: 0 8px 20px rgba(0,0,0,0.3);
            z-index: 9999; animation: fadeOut 4s forwards; 
            pointer-events: none; /* KLUCZOWE: Pozwala klikać przez komunikat */
        `;
        effect.innerHTML = "🧸 WSPARCIE EMOCJONALNE AKTYWNE";
        document.body.appendChild(effect);

        setTimeout(() => effect.remove(), 4000);
    }
}

// --- 2. SYNTEZATOR DŹWIĘKU ---
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

// --- 3. STAN APLIKACJI ---
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

// --- 4. START APLIKACJI ---
const lunaAI = new LunaSensorSystem();

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    lunaAI.initSensors();
    showScreen('welcome');
});

function setupEventListeners() {
    // Logowanie
    const loginBtn = document.getElementById('loginButton');
    if (loginBtn) loginBtn.addEventListener('click', handleLogin);

    // Karty ćwiczeń
    document.querySelectorAll('.exercise-card').forEach(card => {
        card.addEventListener('click', (e) => {
            const category = e.currentTarget.dataset.category;
            startExercise(category);
        });
    });

    // Nawigacja
    document.getElementById('parentDashboardBtn')?.addEventListener('click', loadDashboardData);
    document.getElementById('backToDashboardBtn')?.addEventListener('click', () => showScreen('exerciseSelection'));

    ['backToWelcomeBtn', 'backToSelectionBtn1', 'backToSelectionBtn2', 'backToSelectionBtn3', 'backToSelectionBtn4'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.addEventListener('click', () => showScreen('exerciseSelection'));
    });

    // Gry
    document.getElementById('nextVisualBtn')?.addEventListener('click', generateColorExercise);
    document.getElementById('playRhythmBtn')?.addEventListener('click', playRhythm);
    document.getElementById('drumPad')?.addEventListener('click', addBeat);
    document.getElementById('checkRhythmBtn')?.addEventListener('click', checkRhythm);
    document.getElementById('resetRhythmBtn')?.addEventListener('click', clearUserPattern);
    document.getElementById('submitDrawingBtn')?.addEventListener('click', submitDrawing);
    document.getElementById('clearCanvasBtn')?.addEventListener('click', clearCanvas);

    // Modal
    document.getElementById('continueBtn')?.addEventListener('click', () => {
        document.getElementById('successModal').classList.add('hidden');
        showScreen('exerciseSelection');
    });
}

// --- 5. LOGIKA LOGOWANIA ---
async function handleLogin() {
    const nameInput = document.getElementById('usernameInput');
    // Domyślne imię jeśli puste (dla testów)
    const name = nameInput && nameInput.value.trim() !== "" ? nameInput.value.trim() : "Gość";

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        const data = await response.json();

        appState.user = data.user;
        const starCount = document.getElementById('starCount');
        if (starCount) starCount.textContent = appState.user.stars;

        showScreen('exerciseSelection');
    } catch (e) {
        console.error(e);
        // Fallback offline (żeby działało nawet jak serwer padnie)
        alert("Tryb Offline (Demo). Twoje postępy nie zostaną zapisane w chmurze.");
        showScreen('exerciseSelection');
    }
}

function showScreen(screenName) {
    document.querySelectorAll('section, .welcome-screen, .exercise-selection, .parent-dashboard').forEach(s => {
        s.classList.add('hidden');
        s.classList.remove('active');
    });

    let targetId = screenName;
    if (screenName === 'welcome') targetId = 'welcomeScreen';
    else if (screenName === 'exerciseSelection') targetId = 'exerciseSelection';
    else if (screenName === 'parentDashboard') targetId = 'parentDashboard';
    else if (screenName === 'memory') targetId = 'memoryExercise';
    else if (!screenName.includes('Exercise') && !screenName.includes('Screen')) targetId = screenName + 'Exercise';

    const target = document.getElementById(targetId);
    if (target) {
        target.classList.remove('hidden');
        target.classList.add('active');
    }
    appState.currentScreen = screenName;
}

function startExercise(category) {
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

// --- 6. GRY (MINIMALNE WERSJE) ---

// Memory
function startMemoryGame() {
    const grid = document.getElementById('memoryGrid');
    if (!grid) return;
    grid.innerHTML = '';
    appState.exerciseData.memory.pairsFound = 0;
    appState.exerciseData.memory.firstCard = null;
    appState.exerciseData.memory.lockBoard = false;
    document.getElementById('memoryPairsFound').textContent = "0";

    const tones = [{ f: 261, t: 'C' }, { f: 329, t: 'E' }, { f: 392, t: 'G' }, { f: 493, t: 'B' }];
    let cards = [...tones, ...tones].sort(() => 0.5 - Math.random());

    cards.forEach(item => {
        const card = document.createElement('div');
        card.className = 'memory-card';
        card.innerHTML = '🎵';
        card.onclick = () => {
            if (appState.exerciseData.memory.lockBoard) return;
            card.style.background = '#ffeaa7';
            playTone(item.f, 'sine', 0.3);

            if (!appState.exerciseData.memory.firstCard) {
                appState.exerciseData.memory.firstCard = { el: card, val: item.f };
            } else {
                if (appState.exerciseData.memory.firstCard.el === card) return;
                if (appState.exerciseData.memory.firstCard.val === item.f) {
                    card.style.background = '#55efc4';
                    appState.exerciseData.memory.firstCard.el.style.background = '#55efc4';
                    appState.exerciseData.memory.firstCard = null;
                    appState.exerciseData.memory.pairsFound++;
                    document.getElementById('memoryPairsFound').textContent = appState.exerciseData.memory.pairsFound;
                    if (appState.exerciseData.memory.pairsFound === 4) completeExercise('memory');
                } else {
                    appState.exerciseData.memory.lockBoard = true;
                    setTimeout(() => {
                        card.style.background = 'white';
                        appState.exerciseData.memory.firstCard.el.style.background = 'white';
                        appState.exerciseData.memory.firstCard = null;
                        appState.exerciseData.memory.lockBoard = false;
                    }, 1000);
                }
            }
        };
        grid.appendChild(card);
    });
}

// Kolory
const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'];
function generateColorExercise() {
    const target = colors[Math.floor(Math.random() * 4)];
    document.getElementById('targetColor').style.backgroundColor = target;
    const container = document.getElementById('colorChoices');
    container.innerHTML = '';
    [...colors].sort(() => Math.random() - 0.5).forEach(c => {
        const d = document.createElement('div');
        d.className = 'color-choice';
        d.style.backgroundColor = c;
        d.style.width = '80px'; d.style.height = '80px'; d.style.borderRadius = '10px'; d.style.margin = '5px';
        d.onclick = () => {
            if (c === target) completeExercise('visual');
            else playTone(150, 'sawtooth', 0.2);
        };
        container.appendChild(d);
    });
}

// Rytm
function generateRhythmExercise() {
    appState.exerciseData.auditory.target = 3 + Math.floor(Math.random() * 3);
    appState.exerciseData.auditory.user = 0;
    const pat = document.getElementById('rhythmPattern');
    pat.innerHTML = '';
    for (let i = 0; i < appState.exerciseData.auditory.target; i++) {
        pat.innerHTML += `<div class="rhythm-beat" style="width:30px;height:30px;background:#0984e3;border-radius:50%;display:inline-block;margin:5px;color:white;line-height:30px;">${i + 1}</div>`;
    }
    clearUserPattern();
}
function playRhythm() {
    let i = 0;
    const beats = document.querySelectorAll('#rhythmPattern .rhythm-beat');
    const play = () => {
        if (i < beats.length) {
            beats[i].style.transform = 'scale(1.3)';
            playTone(600, 'sine', 0.2);
            setTimeout(() => beats[i].style.transform = 'scale(1)', 200);
            i++; setTimeout(play, 500);
        }
    };
    play();
}
function addBeat() {
    appState.exerciseData.auditory.user++;
    const uPat = document.getElementById('userPattern');
    uPat.innerHTML += '🥁 ';
    playTone(300, 'triangle', 0.1);

    // Auto-check
    if (appState.exerciseData.auditory.user === appState.exerciseData.auditory.target) {
        setTimeout(() => checkRhythm(), 500);
    } else if (appState.exerciseData.auditory.user > appState.exerciseData.auditory.target) {
        playTone(100, 'sawtooth', 0.5);
        uPat.innerHTML += ' ❌';
        setTimeout(clearUserPattern, 1000);
    }
}
function clearUserPattern() {
    appState.exerciseData.auditory.user = 0;
    document.getElementById('userPattern').innerHTML = '';
}
function checkRhythm() {
    completeExercise('auditory');
}

// Rysowanie
function generateEmotionExercise() {
    document.getElementById('emotionPrompt').textContent = "Radość";
    clearCanvas();
}
function initializeCanvas() {
    const c = document.getElementById('drawingCanvas');
    if (!c) return;
    c.width = c.parentElement.offsetWidth || 300;
    c.height = 300;
    const ctx = c.getContext('2d');
    ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.strokeStyle = '#FF6B6B';

    let paint = false;
    const start = (e) => { paint = true; ctx.beginPath(); draw(e); };
    const end = () => { paint = false; };
    const draw = (e) => {
        if (!paint) return;
        const rect = c.getBoundingClientRect();
        const x = (e.clientX || e.touches[0].clientX) - rect.left;
        const y = (e.clientY || e.touches[0].clientY) - rect.top;
        ctx.lineTo(x, y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x, y);
    };
    c.onmousedown = start; c.onmousemove = draw; c.onmouseup = end;
    c.ontouchstart = (e) => { e.preventDefault(); start(e) };
    c.ontouchmove = (e) => { e.preventDefault(); draw(e) };
    c.ontouchend = (e) => { e.preventDefault(); end() };
}
function clearCanvas() {
    const c = document.getElementById('drawingCanvas');
    c.getContext('2d').clearRect(0, 0, c.width, c.height);
}
function submitDrawing() { completeExercise('tactile'); }

// --- 7. ZAPIS I SUKCES ---
async function completeExercise(cat) {
    playTone(500, 'sine', 0.1);
    setTimeout(() => playTone(800, 'sine', 0.3), 150);

    if (appState.user) {
        try {
            const payload = {
                userId: appState.user.id,
                stars: (appState.user.stars || 0) + 3,
                visual: (appState.user.visual_score || 0) + (cat === 'visual' ? 1 : 0),
                auditory: (appState.user.auditory_score || 0) + (cat === 'auditory' ? 1 : 0),
                tactile: (appState.user.tactile_score || 0) + (cat === 'tactile' ? 1 : 0),
                memory: (appState.user.memory_score || 0) + (cat === 'memory' ? 1 : 0)
            };
            appState.user = { ...appState.user, ...payload };
            document.getElementById('starCount').textContent = appState.user.stars;

            await fetch('/api/save-progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } catch (e) { console.log("Offline mode - brak zapisu"); }
    }

    document.getElementById('successTitle').textContent = "Zadanie Zaliczone!";
    document.getElementById('successMessage').textContent = "+3 Punkty Rozwoju";
    document.getElementById('successModal').classList.remove('hidden');
}

async function loadDashboardData() {
    showScreen('parentDashboard');
    if (!appState.user) return;
    try {
        const res = await fetch(`/api/user/${appState.user.id}`);
        const data = await res.json();

        if (typeof Chart !== 'undefined') {
            const ctx = document.getElementById('progressChart');
            if (window.myChart) window.myChart.destroy();
            window.myChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Koncentracja', 'Słuch', 'Motoryka', 'Pamięć'],
                    datasets: [{
                        label: 'Postęp Pacjenta',
                        data: [data.visual_score, data.auditory_score, data.tactile_score, data.memory_score],
                        backgroundColor: ['#ff7675', '#74b9ff', '#55efc4', '#ffeaa7']
                    }]
                },
                options: { scales: { y: { beginAtZero: true } } }
            });
        }
    } catch (e) { }
}