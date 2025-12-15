// ==========================================
// LUNA MINI COACH - SYSTEM HEALTH-TECH v3.0 (COMPLETE)
// (Rozszerzone Gry + Puls Dnia + Głos + PDF)
// ==========================================

// --- 1. LUNA AI SENSOR SYSTEM (IoT CORE) ---
class LunaSensorSystem {
    constructor() {
        this.shakeThreshold = 45;
        this.lastShake = 0;
        console.log('🧠 Luna AI: System sensorów gotowy');
    }

    initSensors() {
        if (window.DeviceMotionEvent) {
            window.addEventListener('devicemotion', (e) => {
                const acc = e.accelerationIncludingGravity;
                if (!acc) return;
                const intensity = Math.abs(acc.x) + Math.abs(acc.y) + Math.abs(acc.z);
                if (intensity > this.shakeThreshold) {
                    const now = Date.now();
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
        if (typeof playTone === 'function') playTone(300, 'sine', 0.5);
        speakLuna("Spokojnie. Jestem tutaj."); // Głos przy potrząśnięciu

        const effect = document.createElement('div');
        effect.style.cssText = `
            position: fixed; top: 20%; left: 50%; transform: translateX(-50%);
            background: rgba(76, 175, 80, 0.95); padding: 15px 25px; border-radius: 30px;
            display: flex; align-items: center; justify-content: center; gap: 10px;
            font-size: 1.1rem; color: white; font-weight: bold; 
            box-shadow: 0 8px 20px rgba(0,0,0,0.3); z-index: 9999; animation: fadeOut 4s forwards; 
            pointer-events: none;
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

// --- 3. GŁOS LUNY (TTS) ---
function speakLuna(text) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(v => v.lang.includes('pl') && (v.name.includes('Paulina') || v.name.includes('Zosia') || v.name.includes('Maja') || v.name.includes('Google')));
    if (femaleVoice) utterance.voice = femaleVoice;
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    window.speechSynthesis.speak(utterance);
}

// --- 4. STAN APLIKACJI ---
const appState = {
    user: null,
    currentScreen: 'welcome',
    exerciseData: {
        visual: { currentExercise: 0 },
        auditory: { currentExercise: 0, currentPattern: [], userPattern: [] },
        tactile: { currentExercise: 0 },
        memory: { pairsFound: 0, firstCard: null, lockBoard: false }
    }
};

const lunaAI = new LunaSensorSystem();

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    initPulseSystem(); // Inicjalizacja Pulsu
    lunaAI.initSensors();
    showScreen('welcome');
});

function setupEventListeners() {
    document.getElementById('loginButton').addEventListener('click', handleLogin);

    document.querySelectorAll('.exercise-card').forEach(card => {
        card.addEventListener('click', (e) => {
            const category = e.currentTarget.dataset.category;
            if (category !== 'pulse') startExercise(category);
        });
    });

    document.getElementById('parentDashboardBtn')?.addEventListener('click', loadDashboardData);
    document.getElementById('backToDashboardBtn')?.addEventListener('click', () => showScreen('exerciseSelection'));

    ['backToWelcomeBtn', 'backToSelectionBtn1', 'backToSelectionBtn2', 'backToSelectionBtn3', 'backToSelectionBtn4'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.addEventListener('click', () => showScreen('exerciseSelection'));
    });

    document.getElementById('nextVisualBtn')?.addEventListener('click', generateColorExercise);
    document.getElementById('playRhythmBtn')?.addEventListener('click', playRhythm);
    document.getElementById('drumPad')?.addEventListener('click', addBeat);
    document.getElementById('checkRhythmBtn')?.addEventListener('click', checkRhythm);
    document.getElementById('resetRhythmBtn')?.addEventListener('click', clearUserPattern);
    document.getElementById('submitDrawingBtn')?.addEventListener('click', submitDrawing);
    document.getElementById('clearCanvasBtn')?.addEventListener('click', clearCanvas);

    document.getElementById('continueBtn')?.addEventListener('click', () => {
        document.getElementById('successModal').classList.add('hidden');
        showScreen('exerciseSelection');
    });
}

// --- 5. LOGIKA LOGOWANIA ---
async function handleLogin() {
    const nameInput = document.getElementById('usernameInput');
    const name = nameInput && nameInput.value.trim() !== "" ? nameInput.value.trim() : "Gość";

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        const data = await response.json();
        appState.user = data.user;
        document.getElementById('starCount').textContent = appState.user.stars;

        speakLuna(`Witaj ${name}. Gotowy na zabawę?`);
        showScreen('exerciseSelection');
    } catch (e) {
        alert("Tryb Offline.");
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
    else if (screenName === 'pulseScreen') targetId = 'pulseScreen';
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
        speakLuna("Narysuj emocję.");
        generateEmotionExercise();
        setTimeout(initializeCanvas, 100);
    }
    else if (category === 'memory') {
        showScreen('memory');
        speakLuna("Znajdź pary dźwięków.");
        startMemoryGame();
    }
    else if (category === 'visual') {
        showScreen('visual');
        speakLuna("Znajdź pasujący kolor.");
        generateColorExercise();
    }
    else if (category === 'auditory') {
        showScreen('auditory');
        speakLuna("Powtórz rytm.");
        generateRhythmExercise();
    }
}

// --- 6. GRY (ROZSZERZONE - TWOJA WERSJA V2.2) ---

// Memory - 8 Dźwięków
function startMemoryGame() {
    const grid = document.getElementById('memoryGrid');
    if (!grid) return;
    grid.innerHTML = '';
    appState.exerciseData.memory.pairsFound = 0;
    appState.exerciseData.memory.firstCard = null;
    appState.exerciseData.memory.lockBoard = false;
    document.getElementById('memoryPairsFound').textContent = "0";

    const tones = [
        { f: 261, t: 'C' }, { f: 294, t: 'D' }, { f: 329, t: 'E' },
        { f: 349, t: 'F' }, { f: 392, t: 'G' }, { f: 440, t: 'A' },
        { f: 493, t: 'B' }, { f: 523, t: 'C2' }
    ];
    const selectedTones = tones.sort(() => 0.5 - Math.random()).slice(0, 4);
    let cards = [...selectedTones, ...selectedTones].sort(() => 0.5 - Math.random());

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

// Kolory - 12 Kolorów
const colors = [
    '#FF6B6B', '#FF8E8E', '#4ECDC4', '#81D8D0',
    '#45B7D1', '#6DD3DA', '#FFA07A', '#FFB59A',
    '#C9A0DC', '#D4B3E6', '#FFD166', '#FFDE8A'
];

function generateColorExercise() {
    const target = colors[Math.floor(Math.random() * colors.length)];
    document.getElementById('targetColor').style.backgroundColor = target;
    const container = document.getElementById('colorChoices');
    container.innerHTML = '';

    let choices = [target];
    while (choices.length < 4) {
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        if (!choices.includes(randomColor)) choices.push(randomColor);
    }

    choices.sort(() => Math.random() - 0.5).forEach(c => {
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

// Rytm - 3 do 6 uderzeń
function generateRhythmExercise() {
    appState.exerciseData.auditory.target = 3 + Math.floor(Math.random() * 4);
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

function checkRhythm() { completeExercise('auditory'); }

// Rysowanie - 10 Losowych Emocji
function generateEmotionExercise() {
    const emotions = ["Radość", "Smutek", "Złość", "Strach", "Spokój", "Zaskoczenie", "Dumę", "Zazdrość", "Ekscytację", "Zmęczenie"];
    const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
    document.getElementById('emotionPrompt').textContent = randomEmotion;
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

// --- 7. PULS DNIA (MODUŁ DODANY) ---
let pulseState = { mood: 0, tags: [] };

function initPulseSystem() {
    const pulseCard = document.querySelector('.exercise-card[data-category="pulse"]');
    if (pulseCard) {
        pulseCard.addEventListener('click', () => {
            const now = new Date();
            document.getElementById('currentDateDisplay').textContent = now.toLocaleDateString('pl-PL');
            showScreen('pulseScreen');
            speakLuna("Jak minął dzień? Opowiedz mi.");
            resetPulseForm();
        });
    }

    document.getElementById('backToSelectionBtnPulse')?.addEventListener('click', () => showScreen('exerciseSelection'));

    document.querySelectorAll('.btn-mood').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.btn-mood').forEach(b => b.style.transform = 'scale(1)');
            e.currentTarget.style.transform = 'scale(1.3)';
            pulseState.mood = parseInt(e.currentTarget.dataset.value);
            playTone(200 + (pulseState.mood * 100), 'sine', 0.1);
        });
    });

    document.getElementById('savePulseBtn')?.addEventListener('click', saveDailyLog);
    document.getElementById('generatePdfBtn')?.addEventListener('click', generatePDFReport);
}

function resetPulseForm() {
    pulseState = { mood: 0, tags: [] };
    document.getElementById('pulseNote').value = '';
    document.querySelectorAll('.btn-mood').forEach(b => b.style.transform = 'scale(1)');
    document.querySelectorAll('.btn-tag').forEach(b => {
        b.style.background = '#eef6fc';
        b.style.color = '#2c3e50';
    });
}

async function saveDailyLog() {
    if (!appState.user) { alert("Zaloguj się!"); return; }
    if (pulseState.mood === 0) { alert("Wybierz buźkę!"); return; }

    const note = document.getElementById('pulseNote').value;
    const date = new Date().toISOString();

    try {
        await fetch('/api/logs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: appState.user.id,
                date: date,
                mood: pulseState.mood,
                tags: pulseState.tags,
                note: note
            })
        });

        speakLuna("Dziękuję. Dane zostały zapisane.");
        completeExercise('pulse');
        setTimeout(() => showScreen('exerciseSelection'), 2000);

    } catch (e) {
        alert("Błąd zapisu (offline?)");
    }
}

async function generatePDFReport() {
    if (!appState.user) return;
    const { jsPDF } = window.jspdf;

    const res = await fetch(`/api/logs/${appState.user.id}`);
    const logs = await res.json();

    if (logs.length === 0) { alert("Brak danych."); return; }

    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text(`Raport Pacjenta: ${appState.user.name}`, 10, 20);
    doc.setFontSize(10);
    doc.text(`Data: ${new Date().toLocaleDateString()}`, 10, 30);

    let y = 40;
    logs.forEach((log) => {
        if (y > 270) { doc.addPage(); y = 20; }
        const date = new Date(log.date).toLocaleDateString();
        doc.text(`${date} - Nastrój: ${log.mood}/5`, 10, y);
        let tagsClean = "Brak";
        try { tagsClean = JSON.parse(log.tags).join(", "); } catch (e) { }
        doc.text(`Zdarzenia: ${tagsClean}`, 10, y + 6);
        if (log.note) doc.text(`Notatka: ${log.note}`, 10, y + 12);
        y += 20;
    });
    doc.save('Raport_Luna.pdf');
}

// --- 8. ZAPIS I SUKCES ---
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
        } catch (e) { console.log("Offline mode"); }
    }

    document.getElementById('successTitle').textContent = "Zadanie Zaliczone!";
    document.getElementById('successMessage').textContent = "+3 Punkty Rozwoju";
    document.getElementById('successModal').classList.remove('hidden');

    if (cat !== 'pulse') speakLuna("Brawo! Świetna robota.");
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