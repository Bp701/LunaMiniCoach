// === LUNA HEALTH SYSTEM v2.1 (FIXED) ===

document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 System Luna HealthTech: GOTOWY");
    setupUI();
    // === LUNA AI SENSOR SYSTEM (IoT CORE) - WERSJA SKALIBROWANA === //
    class LunaSensorSystem {
        constructor() {
            // ZWIĘKSZONO PRÓG Z 15 NA 45 (Żeby nie włączało się samo)
            this.shakeThreshold = 45;
            this.lastShake = 0;
            console.log('🧠 Luna AI Sensor System: SKALIBROWANY');
        }

        initSensors() {
            if (window.DeviceMotionEvent) {
                window.addEventListener('devicemotion', (e) => {
                    const acc = e.accelerationIncludingGravity;
                    if (!acc) return;

                    const intensity = Math.abs(acc.x) + Math.abs(acc.y) + Math.abs(acc.z);

                    // Wykrycie interakcji (teraz wymaga silniejszego ruchu)
                    if (intensity > this.shakeThreshold) {
                        const now = Date.now();
                        // Blokada czasowa (nie częściej niż raz na 5 sekund)
                        if (now - this.lastShake > 5000) {
                            this.lastShake = now;
                            this.onSensorTrigger('shake');
                        }
                    }
                });
            }
        }

        onSensorTrigger(type) {
            if (type === 'shake') {
                console.log('🎯 Luna AI: Wykryto interwencję ruchową');
                this.triggerCalmEffect();
            }
        }

        triggerCalmEffect() {
            // 1. Dźwięk (opcjonalnie, cichy)
            if (typeof playTone === 'function') playTone(300, 'sine', 0.5);

            // 2. Efekt wizualny (NIEINWAZYJNY)
            const effect = document.createElement('div');
            // Zmiana: pointer-events: none sprawia, że można klikać PRZEZ ten napis
            effect.style.cssText = `
            position: fixed; top: 20%; left: 50%; transform: translateX(-50%);
            background: rgba(76, 175, 80, 0.9); 
            padding: 15px 25px; border-radius: 30px;
            display: flex; align-items: center; justify-content: center; gap: 10px;
            font-size: 1.2rem; color: white; font-weight: bold; 
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 9999; animation: fadeOut 3s forwards; 
            pointer-events: none; /* KLUCZOWE: POZWALA KLIKAĆ POD SPODEM */
        `;
            effect.innerHTML = "🧸 WSPARCIE EMOCJONALNE";
            document.body.appendChild(effect);

            setTimeout(() => effect.remove(), 3000);
        }
    }

    // Start systemu AI
    const lunaAI = new LunaSensorSystem();
    document.addEventListener('DOMContentLoaded', () => {
        lunaAI.initSensors();
    });

    console.log(`Logowanie jako: ${name}...`);

    // Zmieniamy tekst na przycisku, żeby widać było, że coś się dzieje
    const originalText = loginBtn.textContent;
    loginBtn.textContent = "Łączenie z bazą...";
    loginBtn.disabled = true;

    try {
        // Próba logowania do serwera
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });

        if (response.ok) {
            const data = await response.json();
            console.log("✅ Zalogowano:", data);
            // Zapisujemy usera w pamięci
            appState.user = data.user;
        } else {
            console.warn("⚠️ Serwer zwrócił błąd, uruchamiam tryb offline.");
        }
    } catch (error) {
        console.error("⚠️ Brak połączenia z serwerem. Tryb DEMO.", error);
    }

    // NIEZALEŻNIE OD WYNIKU -> PRZECHODZIMY DALEJ (Żebyś nie utknął!)
    setTimeout(() => {
        showScreen('exerciseSelection');
    }, 500);
});
    } else {
    console.error("❌ BŁĄD KRYTYCZNY: Nie znaleziono przycisku loginButton w HTML!");
}

// 2. Obsługa Nawigacji
document.querySelectorAll('.exercise-card').forEach(card => {
    card.addEventListener('click', () => {
        const cat = card.dataset.category;
        console.log("Wybrano moduł:", cat);
        startModule(cat);
    });
});

document.getElementById('parentDashboardBtn')?.addEventListener('click', loadClinicalDashboard);

// Przyciski powrotu (szukamy wszystkich guzików z 'Powrót' w nazwie lub ID)
document.querySelectorAll('button').forEach(btn => {
    if (btn.id.includes('backTo')) {
        btn.addEventListener('click', () => showScreen('exerciseSelection'));
    }
});
}

// --- LOGIKA EKRANÓW ---
function showScreen(id) {
    console.log("Przełączanie ekranu na:", id);
    // Ukryj wszystkie sekcje
    document.querySelectorAll('section').forEach(s => {
        s.classList.add('hidden');
        s.classList.remove('active');
    });

    // Pokaż docelową
    let targetId = id;
    if (id === 'welcome') targetId = 'welcomeScreen';
    else if (id === 'exerciseSelection') targetId = 'exerciseSelection';
    else if (id === 'parentDashboard') targetId = 'parentDashboard';
    else if (!id.includes('Exercise')) targetId = id + 'Exercise'; // np. 'visual' -> 'visualExercise'

    const target = document.getElementById(targetId);
    if (target) {
        target.classList.remove('hidden');
        target.classList.add('active');
    } else {
        console.error("❌ Nie znaleziono sekcji o ID:", targetId);
    }
}

function startModule(category) {
    if (category === 'memory') {
        showScreen('memoryExercise');
        startMemoryGame();
    } else if (category === 'tactile') {
        showScreen('tactileExercise');
        // Reset canvasu
        setTimeout(initCanvas, 100);
    } else {
        showScreen(category); // visual, auditory
        // Tu można dodać funkcje generujące zadania (generateColorExercise itp.)
        // Dla MVP wystarczy przełączenie ekranu
    }
}

// --- MODUŁY HEALTH-TECH ---

// 1. DASHBOARD
function loadClinicalDashboard() {
    showScreen('parentDashboard');
    const ctx = document.getElementById('progressChart');
    if (window.myChart) window.myChart.destroy();

    if (typeof Chart !== 'undefined' && ctx) {
        window.myChart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Koncentracja', 'Słuch', 'Motoryka', 'Pamięć', 'Emocje'],
                datasets: [{
                    label: 'Profil Pacjenta',
                    data: [80, 65, 90, 70, 85],
                    backgroundColor: 'rgba(74, 144, 226, 0.2)',
                    borderColor: '#4a90e2',
                    pointBackgroundColor: '#50e3c2'
                }]
            },
            options: { scales: { r: { suggestMin: 0, suggestMax: 100 } } }
        });
    }
}

// 2. SENSORYKA (IoT)
class LunaSensorSystem {
    constructor() { this.lastShake = 0; }
    init() {
        if (window.DeviceMotionEvent) {
            window.addEventListener('devicemotion', (e) => {
                const acc = e.accelerationIncludingGravity;
                if (!acc) return;
                const force = Math.abs(acc.x) + Math.abs(acc.y) + Math.abs(acc.z);
                if (force > 15 && Date.now() - this.lastShake > 2000) {
                    this.lastShake = Date.now();
                    this.calmIntervention();
                }
            });
        }
    }
    calmIntervention() {
        // Efekt
        const div = document.createElement('div');
        div.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(80,227,194,0.5);z-index:9999;display:flex;justify-content:center;align-items:center;color:white;font-size:2rem;font-weight:bold;";
        div.innerHTML = "🧸 WSPARCIE EMOCJONALNE";
        document.body.appendChild(div);
        setTimeout(() => div.remove(), 2000);

        // Dźwięk
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = 200;
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2);
        osc.stop(ctx.currentTime + 2);
    }
}

// 3. MEMORY (Szybka implementacja kart)
function startMemoryGame() {
    const grid = document.getElementById('memoryGrid');
    if (!grid) return;
    grid.innerHTML = '';
    [1, 2, 3, 4].forEach(i => {
        grid.innerHTML += `<div class="memory-card" onclick="this.classList.toggle('flipped');" style="height:80px;background:white;border:1px solid #ddd;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:2rem;cursor:pointer;">🎵</div>`;
    });
}

// 4. CANVAS
function initCanvas() {
    const c = document.getElementById('drawingCanvas');
    if (!c) return;
    c.width = c.offsetWidth; c.height = 300;
    const ctx = c.getContext('2d');
    ctx.lineWidth = 4; ctx.strokeStyle = '#4a90e2'; ctx.lineCap = 'round';
    let p = false;
    c.onmousedown = (e) => { p = true; ctx.beginPath(); ctx.moveTo(e.offsetX, e.offsetY); };
    c.onmousemove = (e) => { if (p) { ctx.lineTo(e.offsetX, e.offsetY); ctx.stroke(); } };
    c.onmouseup = () => p = false;
    // Touch support
    c.ontouchstart = (e) => { e.preventDefault(); p = true; ctx.beginPath(); const r = c.getBoundingClientRect(); ctx.moveTo(e.touches[0].clientX - r.left, e.touches[0].clientY - r.top); };
    c.ontouchmove = (e) => { e.preventDefault(); if (p) { const r = c.getBoundingClientRect(); ctx.lineTo(e.touches[0].clientX - r.left, e.touches[0].clientY - r.top); ctx.stroke(); } };
    c.ontouchend = () => p = false;
}

const appState = {};