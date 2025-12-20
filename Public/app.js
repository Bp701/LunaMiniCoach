// ==========================================
// LUNA JUNIOR - PILOT VERSION v1.0
// (Wersja Edukacyjna - Bezpieczna)
// ==========================================

// --- 1. LUNA SENSOR SYSTEM (Pilot) ---
class LunaSensorSystem {
    constructor() {
        this.shakeThreshold = 45;
        this.lastShake = 0;
        console.log('🧠 Luna Pilot: System sensorów gotowy');
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
        this.triggerCalmEffect();
    }

    triggerCalmEffect() {
        if (typeof playTone === 'function') playTone(300, 'sine', 0.5);
        speakLuna("Spokojnie. Jestem tutaj.");

        const effect = document.createElement('div');
        effect.style.cssText = `
            position: fixed; top: 20%; left: 50%; transform: translateX(-50%);
            background: rgba(76, 175, 80, 0.95); padding: 15px 25px; border-radius: 30px;
            display: flex; align-items: center; justify-content: center; gap: 10px;
            font-size: 1.1rem; color: white; font-weight: bold; 
            box-shadow: 0 8px 20px rgba(0,0,0,0.3); z-index: 9999; animation: fadeOut 4s forwards; 
            pointer-events: none;
        `;
        // ZMIANA: Mniej medyczny komunikat
        effect.innerHTML = "🧸 TRYB WSPARCIA AKTYWNY";
        document.body.appendChild(effect);
        setTimeout(() => effect.remove(), 4000);
    }
}

// --- 2. AUDIO & VOICE ---
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

function speakLuna(text) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();

    let selectedVoice = voices.find(v => v.name.includes('Paulina') && v.lang.includes('pl'));
    if (!selectedVoice) selectedVoice = voices.find(v => v.lang.includes('pl') && (v.name.includes('Zosia') || v.name.includes('Maja')));
    if (!selectedVoice) selectedVoice = voices.find(v => v.lang.includes('pl'));

    if (selectedVoice) utterance.voice = selectedVoice;

    utterance.rate = 0.85;
    utterance.pitch = 1.05;
    utterance.volume = 1.0;

    window.speechSynthesis.speak(utterance);
}

// --- 3. STAN APLIKACJI ---
const appState = {
    user: null,
    currentScreen: 'welcome',
    activeCategory: null,
    exerciseData: {
        memory: { pairsFound: 0, firstCard: null, lockBoard: false },
        auditory: { target: 0, user: 0 },
        syllables: { currentWord: null, taps: 0 }
    }
};

const lunaAI = new LunaSensorSystem();

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    initPulseSystem();
    lunaAI.initSensors();
    showScreen('welcome');
    window.speechSynthesis.getVoices();

    addCosmicButton();
});

function addCosmicButton() {
    // Dodajemy dynamicznie przycisk do menu, jeśli go nie ma
    // UWAGA: Dostosowano selektor do nowej struktury HTML (exercise-categories)
    const grid = document.querySelector('.exercise-categories');
    if (grid && !document.getElementById('btnCosmos')) {
        const btn = document.createElement('div');
        btn.id = 'btnCosmos';
        btn.className = 'exercise-card';
        btn.dataset.category = 'cosmos';
        btn.style.borderLeft = '5px solid #9b59b6';
        btn.innerHTML = `
            <div class="card-icon">🚀</div>
            <h3>Kosmiczne Sylaby</h3>
            <p>Zgadnij i wyklaszcz</p>
        `;
        btn.addEventListener('click', () => startExercise('cosmos'));
        grid.appendChild(btn);
    }
}

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

    const backButtons = document.querySelectorAll('[id^="backToSelectionBtn"]');
    backButtons.forEach(btn => {
        btn.addEventListener('click', () => showScreen('exerciseSelection'));
    });

    document.getElementById('backToWelcomeBtn')?.addEventListener('click', () => showScreen('welcome'));

    // Kontrolki gier
    document.getElementById('nextVisualBtn')?.addEventListener('click', generateColorExercise);

    document.getElementById('playRhythmBtn')?.addEventListener('click', playRhythm);
    document.getElementById('drumPad')?.addEventListener('click', addBeat);
    document.getElementById('checkRhythmBtn')?.addEventListener('click', checkRhythm);
    document.getElementById('resetRhythmBtn')?.addEventListener('click', clearUserPattern);

    document.getElementById('submitDrawingBtn')?.addEventListener('click', submitDrawing);
    document.getElementById('clearCanvasBtn')?.addEventListener('click', clearCanvas);

    document.getElementById('continueBtn')?.addEventListener('click', () => {
        document.getElementById('successModal').classList.add('hidden');

        if (appState.activeCategory === 'visual') {
            generateColorExercise();
            speakLuna("Kolejny kolor.");
        }
        else if (appState.activeCategory === 'auditory') {
            generateRhythmExercise();
            speakLuna("Spróbuj kolejny rytm.");
        }
        else if (appState.activeCategory === 'tactile') {
            generateEmotionExercise();
            clearCanvas();
            speakLuna("Narysuj kolejną emocję.");
        }
        else if (appState.activeCategory === 'memory') {
            startMemoryGame();
            speakLuna("Znajdź pary.");
        }
        else if (appState.activeCategory === 'cosmos') {
            generateSyllableGame();
        }
        else {
            showScreen('exerciseSelection');
        }
    });
}

// --- 4. LOGOWANIE I EKRANY ---
async function handleLogin() {
    const nameInput = document.getElementById('usernameInput');
    const name = nameInput && nameInput.value.trim() !== "" ? nameInput.value.trim() : "Gość";
    appState.user = { name: name, stars: 0 };
    document.getElementById('starCount').textContent = appState.user.stars;
    // ZMIANA: Bardziej zabawowy komunikat
    speakLuna(`Cześć ${name}. Zaczynamy zabawę!`);
    showScreen('exerciseSelection');
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
    else if (screenName === 'cosmos') {
        if (!document.getElementById('cosmosExercise')) {
            const div = document.createElement('section');
            div.id = 'cosmosExercise';
            div.className = 'exercise-screen hidden';
            div.innerHTML = `
                <div class="container">
                    <div class="exercise-header">
                        <h2>Kosmiczne Sylaby</h2>
                        <button id="backToSelectionBtnCosmos" class="btn btn--secondary">Powrót</button>
                    </div>
                    <div class="game-area" style="text-align:center;">
                        <div id="cosmosPrompt" style="font-size: 4rem; margin: 20px;">🌍</div>
                        <p id="cosmosText" style="font-size: 1.5rem; margin-bottom: 20px;">Posłuchaj i wyklaszcz!</p>
                        <button id="playSyllableBtn" class="btn btn--primary" style="background:#9b59b6;">🔊 Posłuchaj Luny</button>
                        <div style="margin-top: 30px;">
                            <button id="tapSyllableBtn" style="width: 100px; height: 100px; border-radius: 50%; font-size: 2rem; background:white; border:2px solid #ddd; cursor:pointer;">👏</button>
                        </div>
                        <p>Twoje klaśnięcia: <span id="syllableCount" style="font-weight:bold; font-size: 1.5rem;">0</span></p>
                    </div>
                </div>
            `;
            // ZMIANA: Dodajemy do body, bezpieczniej przy prostej strukturze
            document.body.appendChild(div);

            div.querySelector('#backToSelectionBtnCosmos').addEventListener('click', () => showScreen('exerciseSelection'));
            div.querySelector('#playSyllableBtn').addEventListener('click', playSyllableWord);
            div.querySelector('#tapSyllableBtn').addEventListener('click', tapSyllable);
        }
        targetId = 'cosmosExercise';
    }
    else if (!screenName.includes('Exercise') && !screenName.includes('Screen')) targetId = screenName + 'Exercise';

    const target = document.getElementById(targetId);
    if (target) {
        target.classList.remove('hidden');
        target.classList.add('active');
    }
    appState.currentScreen = screenName;
}

function startExercise(category) {
    appState.activeCategory = category;

    if (category === 'tactile') {
        showScreen('tactile');
        speakLuna("Poczuj i narysuj emocję.");
        generateEmotionExercise();
        setTimeout(initializeCanvas, 100);
    }
    else if (category === 'memory') {
        showScreen('memory');
        speakLuna("Znajdź pary.");
        startMemoryGame();
    }
    else if (category === 'visual') {
        showScreen('visual');
        speakLuna("Znajdź taki sam kolor.");
        generateColorExercise();
    }
    else if (category === 'auditory') {
        showScreen('auditory');
        speakLuna("Posłuchaj bębenka i powtórz liczbę uderzeń.");
        generateRhythmExercise();
    }
    else if (category === 'cosmos') {
        showScreen('cosmos');
        speakLuna("Kosmiczne sylaby. Posłuchaj Luny, a potem wystukaj tyle razy, ile słyszysz kawałków słowa.");
        generateSyllableGame();
    }
}

// --- 5. LOGIKA GIER ---

const cosmicWords = [
    { word: "Ra-kie-ta", syl: 3, icon: "🚀" },
    { word: "Kos-mos", syl: 2, icon: "🌌" },
    { word: "U-fo", syl: 2, icon: "👽" },
    { word: "Pla-ne-ta", syl: 3, icon: "🪐" },
    { word: "Gwiaz-da", syl: 2, icon: "⭐" },
    { word: "As-tro-nau-ta", syl: 4, icon: "👨‍🚀" },
    { word: "Księ-życ", syl: 2, icon: "🌙" },
    { word: "Słoń-ce", syl: 2, icon: "☀️" }
];

function generateSyllableGame() {
    const puzzle = cosmicWords[Math.floor(Math.random() * cosmicWords.length)];
    appState.exerciseData.syllables = { currentWord: puzzle, taps: 0 };

    document.getElementById('cosmosPrompt').textContent = puzzle.icon;
    document.getElementById('cosmosText').textContent = "???";
    document.getElementById('syllableCount').textContent = "0";
}

function playSyllableWord() {
    const puzzle = appState.exerciseData.syllables.currentWord;
    const text = puzzle.word.replace(/-/g, ". ");
    speakLuna(text);
}

function tapSyllable() {
    appState.exerciseData.syllables.taps++;
    document.getElementById('syllableCount').textContent = appState.exerciseData.syllables.taps;
    playTone(400 + (appState.exerciseData.syllables.taps * 50), 'triangle', 0.1);

    const btn = document.getElementById('tapSyllableBtn');
    btn.style.transform = 'scale(0.9)';
    setTimeout(() => btn.style.transform = 'scale(1)', 100);

    const target = appState.exerciseData.syllables.currentWord.syl;

    if (appState.exerciseData.syllables.taps === target) {
        setTimeout(() => {
            speakLuna(`Brawo! To było słowo ${appState.exerciseData.syllables.currentWord.word.replace(/-/g, "")}`);
            completeExercise('cosmos');
        }, 1000);
    } else if (appState.exerciseData.syllables.taps > target) {
        playTone(150, 'sawtooth', 0.3);
        speakLuna("Za dużo. Spróbuj jeszcze raz.");
        appState.exerciseData.syllables.taps = 0;
        document.getElementById('syllableCount').textContent = "0";
    }
}

// === MEMORY ===
function startMemoryGame() {
    const grid = document.getElementById('memoryGrid');
    if (!grid) return;
    grid.innerHTML = '';
    appState.exerciseData.memory = { pairsFound: 0, firstCard: null, lockBoard: false };
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

// === KOLORY ===
const colors = [
    '#FF6B6B', '#FF8E8E', '#4ECDC4', '#81D8D0', '#45B7D1', '#6DD3DA',
    '#FFA07A', '#FFB59A', '#C9A0DC', '#D4B3E6', '#FFD166', '#FFDE8A'
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

// === RYTM ===
function generateRhythmExercise() {
    appState.exerciseData.auditory.target = 3 + Math.floor(Math.random() * 4); // 3 do 6
    appState.exerciseData.auditory.user = 0;
    const pat = document.getElementById('rhythmPattern');
    pat.innerHTML = '<div style="font-size:3rem">👂</div>';
    clearUserPattern();
}

function playRhythm() {
    let i = 0;
    const targetCount = appState.exerciseData.auditory.target;

    const play = () => {
        if (i < targetCount) {
            playTone(600, 'sine', 0.2);
            document.getElementById('rhythmPattern').style.transform = 'scale(1.2)';
            setTimeout(() => document.getElementById('rhythmPattern').style.transform = 'scale(1)', 100);

            i++;
            setTimeout(play, 600);
        }
    };
    play();
}

function addBeat() {
    appState.exerciseData.auditory.user++;
    const uPat = document.getElementById('userPattern');
    uPat.innerHTML += '🥁 ';
    playTone(300, 'triangle', 0.1);
}

function clearUserPattern() {
    appState.exerciseData.auditory.user = 0;
    document.getElementById('userPattern').innerHTML = '';
}

function checkRhythm() {
    if (appState.exerciseData.auditory.user === appState.exerciseData.auditory.target) {
        completeExercise('auditory');
    } else {
        playTone(150, 'sawtooth', 0.4);
        speakLuna("Nie do końca. Posłuchaj jeszcze raz.");
        clearUserPattern();
    }
}

// === EMOCJE ===
function generateEmotionExercise() {
    const emotions = ["Radość", "Smutek", "Złość", "Strach", "Spokój"];
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

// --- 6. PULS DNIA ---
let pulseState = { mood: 0, tags: [] };

function initPulseSystem() {
    const pulseCard = document.querySelector('.exercise-card[data-category="pulse"]');
    if (pulseCard) {
        pulseCard.addEventListener('click', () => {
            appState.activeCategory = 'pulse';
            const now = new Date();
            document.getElementById('currentDateDisplay').textContent = now.toLocaleDateString('pl-PL');
            showScreen('pulseScreen');
            speakLuna("Jak minął dzień?");
            resetPulseForm();
        });
    }

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
}

async function saveDailyLog() {
    speakLuna("Zapisano. Dziękuję.");
    completeExercise('pulse');
    setTimeout(() => showScreen('exerciseSelection'), 2000);
}

async function generatePDFReport() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    // ZMIANA: Z "Raport Pacjenta" na "Raport Dziecka" - BEZPIECZNE DLA MDR
    doc.text(`Raport Dziecka: ${appState.user.name || 'Gosc'}`, 10, 20);
    doc.text(`Data: ${new Date().toLocaleDateString()}`, 10, 30);
    // ZMIANA: Z "Raport Kliniczny" na "Wersja Demonstracyjna"
    doc.text("Pobrano wersję demonstracyjną (Pilot).", 10, 50);
    doc.save('Raport_Luna_Pilot.pdf');
}

// --- 7. SUKCES ---
function completeExercise(cat) {
    playTone(500, 'sine', 0.1);
    setTimeout(() => playTone(800, 'sine', 0.3), 150);

    const stars = parseInt(document.getElementById('starCount').textContent) + 3;
    document.getElementById('starCount').textContent = stars;

    document.getElementById('successTitle').textContent = "Super!";
    document.getElementById('successMessage').textContent = "+3 Punkty";
    document.getElementById('successModal').classList.remove('hidden');

    if (cat !== 'pulse') speakLuna("Brawo! Świetna robota.");
}

function loadDashboardData() {
    showScreen('parentDashboard');
    if (typeof Chart !== 'undefined') {
        const ctx = document.getElementById('progressChart');
        if (window.myChart) window.myChart.destroy();
        window.myChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Koncentracja', 'Słuch', 'Emocje', 'Pamięć'],
                datasets: [{
                    label: 'Postęp',
                    data: [12, 19, 8, 15],
                    backgroundColor: ['#ff7675', '#74b9ff', '#55efc4', '#ffeaa7']
                }]
            },
            options: { scales: { y: { beginAtZero: true } } }
        });
    }
}