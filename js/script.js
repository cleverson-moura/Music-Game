/**
 * MUSIC TRAINER - MOTOR DE AUDIO NATIVO
 */
class AudioManager {
    constructor() {
        this.ctx = null;
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    playTone(freq, type = 'sine', duration = 0.4, startTime = 0) {
        this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + startTime);
        
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime + startTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + startTime + duration);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start(this.ctx.currentTime + startTime);
        osc.stop(this.ctx.currentTime + startTime + duration);
    }

    playFeedback(isCorrect) {
        this.init();
        if (isCorrect) {
            this.playTone(523.25, 'triangle', 0.15, 0); // C5
            this.playTone(659.25, 'triangle', 0.25, 0.1); // E5
        } else {
            this.playTone(220.00, 'sawtooth', 0.3, 0); // A3
        }
    }

    playChord(notes) {
        this.init();
        const freqs = {
            'C': 261.63, 'C#': 277.18, 'D': 293.66, 'D#': 311.13,
            'E': 329.63, 'F': 349.23, 'F#': 369.99, 'G': 392.00,
            'G#': 415.30, 'A': 440.00, 'A#': 466.16, 'B': 493.88
        };
        notes.forEach((note, index) => {
            let baseFreq = freqs[note];
            if (baseFreq) {
                // Abre o acorde abrindo vozes em oitavas superiores se necessário
                if (index > 0 && baseFreq < freqs[notes[0]]) baseFreq *= 2;
                this.playTone(baseFreq, 'sine', 0.8, index * 0.05);
            }
        });
    }
}

/**
 * MOTOR DE TEORIA MUSICAL NATIVO E DINÂMICO
 */
class MusicTheory {
    static get CHROMATIC_SCALE() {
        return ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    }

    static get ROMAN_DEGREES() {
        return ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];
    }

    static get ROMAN_DEGREES_TETRADS() {
        return ['I7M', 'ii7', 'iii7', 'IV7M', 'V7', 'vi7', 'vii7(b5)'];
    }

    static generateMajorScale(tonic) {
        const chromatic = this.CHROMATIC_SCALE;
        let index = chromatic.indexOf(tonic);
        // Intervalos da Escala Maior: T-T-ST-T-T-T-ST
        const intervals = [2, 2, 1, 2, 2, 2, 1];
        const scale = [tonic];

        for (let i = 0; i < intervals.length - 1; i++) {
            index = (index + intervals[i]) % 12;
            scale.push(chromatic[index]);
        }
        return scale;
    }

    static generateHarmonicField(tonic, useTetrads = false) {
        const scale = this.generateMajorScale(tonic);
        const field = [];

        for (let i = 0; i < 7; i++) {
            const root = scale[i];
            const third = scale[(i + 2) % 7];
            const fifth = scale[(i + 4) % 7];
            const seventh = scale[(i + 6) % 7];

            let chordName = root;
            let notes = [root, third, fifth];

            if (!useTetrads) {
                // Classificação de Tríades baseada nos graus maiores
                if (i === 1 || i === 2 || i === 5) chordName += 'm';
                if (i === 6) chordName += 'dim';
            } else {
                notes.push(seventh);
                if (i === 0 || i === 4) chordName += '7M';
                else if (i === 1 || i === 2 || i === 5) chordName += '7'; // Nota: Ajuste harmônico comum simplificado para visualização
                else if (i === 3) chordName += '7M';
                else if (i === 4) chordName += '7';
                else if (i === 6) chordName += 'm7(b5)';
                
                // Correções nominais estritas para exibição de tétrades padrão:
                if (i === 0) chordName = root + '7M';
                if (i === 1) chordName = root + 'm7';
                if (i === 2) chordName = root + 'm7';
                if (i === 3) chordName = root + '7M';
                if (i === 4) chordName = root + '7';
                if (i === 5) chordName = root + 'm7';
            }

            field.push({
                degree: i,
                roman: useTetrads ? this.ROMAN_DEGREES_TETRADS[i] : this.ROMAN_DEGREES[i],
                name: chordName,
                notes: notes
            });
        }
        return field;
    }
}

/**
 * GERADOR DINÂMICO DE QUESTÕES
 */
class QuestionGenerator {
    static generate(mode, difficulty) {
        const chromatic = MusicTheory.CHROMATIC_SCALE;
        const randomTonic = chromatic[Math.floor(Math.random() * chromatic.length)];
        const useTetrads = difficulty === 'tetrads';
        const field = MusicTheory.generateHarmonicField(randomTonic, useTetrads);

        switch (mode) {
            case 'notes':
                return this.makeNotesQuestion(randomTonic, field);
            case 'degrees':
                return this.makeDegreesQuestion(randomTonic, field);
            case 'transposition':
                return this.makeTranspositionQuestion(randomTonic, useTetrads);
        }
    }

    static makeNotesQuestion(tonic, field) {
        const randomChord = field[Math.floor(Math.random() * field.length)];
        return {
            type: 'notes',
            context: `Tom: ${tonic} Maior`,
            question: `Quais notas compõem o acorde de ${randomChord.name}?`,
            correctAnswer: randomChord.notes,
            audioNotes: randomChord.notes
        };
    }

    static makeDegreesQuestion(tonic, field) {
        const indexes = [0, 5, 1, 4].map(i => Math.floor(Math.random() * 7)); // Mistura de graus aleatórios
        const sequenceChords = indexes.map(i => field[i].name);
        const sequenceCorrect = indexes.map(i => field[i].roman);

        // Gerar alternativas falsas embaralhando graus
        const choices = [sequenceCorrect.join(' - ')];
        while (choices.length < 4) {
            const fakeIndexes = indexes.map(() => Math.floor(Math.random() * 7));
            const fakeString = fakeIndexes.map(i => field[i].roman).join(' - ');
            if (!choices.includes(fakeString)) choices.push(fakeString);
        }
        this.shuffleArray(choices);

        return {
            type: 'choices',
            context: `Tom: ${tonic} Maior`,
            question: `A progressão [ ${sequenceChords.join(' - ')} ] equivale a quais graus?`,
            correctAnswer: sequenceCorrect.join(' - '),
            choices: choices
        };
    }

    static makeTranspositionQuestion(srcTonic, useTetrads) {
        const chromatic = MusicTheory.CHROMATIC_SCALE;
        let destTonic = chromatic[Math.floor(Math.random() * chromatic.length)];
        while (destTonic === srcTonic) {
            destTonic = chromatic[Math.floor(Math.random() * chromatic.length)];
        }

        const srcField = MusicTheory.generateHarmonicField(srcTonic, useTetrads);
        const destField = MusicTheory.generateHarmonicField(destTonic, useTetrads);

        const seqIndexes = [0, 3, 4, 0].map(() => Math.floor(Math.random() * 7));
        const srcSequence = seqIndexes.map(i => srcField[i].name).join(' - ');
        const destSequenceCorrect = seqIndexes.map(i => destField[i].name).join(' - ');

        const choices = [destSequenceCorrect];
        while (choices.length < 4) {
            const fakeTargetField = MusicTheory.generateHarmonicField(chromatic[Math.floor(Math.random() * 12)], useTetrads);
            const fakeString = seqIndexes.map(i => fakeTargetField[i].name).join(' - ');
            if (!choices.includes(fakeString)) choices.push(fakeString);
        }
        this.shuffleArray(choices);

        return {
            type: 'choices',
            context: `De: ${srcTonic} Maior ➔ Para: ${destTonic} Maior`,
            question: `Transponha a sequência [ ${srcSequence} ] para o tom de ${destTonic}:`,
            correctAnswer: destSequenceCorrect,
            choices: choices
        };
    }

    static shuffleArray(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }
}

/**
 * GERENCIADOR DE ESTADO E SCORE
 */
class ScoreManager {
    constructor() {
        this.score = 0;
        this.combo = 1;
        this.correctCount = 0;
        this.wrongCount = 0;
        this.xpGained = 0;
        this.history = [];
    }

    addHit() {
        this.correctCount++;
        const points = 10 * this.combo;
        this.score += points;
        this.xpGained += points * 2;
        this.combo++;
    }

    addMiss() {
        this.wrongCount++;
        this.combo = 1;
    }

    logHistory(question, isCorrect, correctAns) {
        this.history.push({ question, isCorrect, correctAns });
    }
}

/**
 * CLASSE CONTROLADORA DA INTERFACE (UI)
 */
class UI {
    constructor(gameEngine) {
        this.game = gameEngine;
        this.selectedNotes = [];
        this.selectedChoice = null;
    }

    bindEvents() {
        document.querySelectorAll('.mode-card').forEach(card => {
            card.addEventListener('click', () => this.game.start(card.dataset.mode));
        });

        document.getElementById('btn-submit').addEventListener('click', () => this.game.checkAnswer());
        document.getElementById('btn-next').addEventListener('click', () => this.game.nextQuestion());
        document.getElementById('btn-restart').addEventListener('click', () => this.game.showHome());
        
        document.getElementById('theme-toggle').addEventListener('click', () => {
            document.body.classList.toggle('light-theme');
        });

        const modal = document.getElementById('settings-modal');
        document.getElementById('settings-toggle').addEventListener('click', () => {
            modal.classList.remove('hidden');
            modal.setAttribute('aria-hidden', 'false');
        });
        document.getElementById('btn-close-settings').addEventListener('click', () => {
            modal.classList.add('hidden');
            modal.setAttribute('aria-hidden', 'true');
            this.game.updateConfig();
        });
    }

    switchScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
    }

    renderHUD(current, total, score, combo, timeStr) {
        document.getElementById('hud-question-num').innerText = `${current}/${total}`;
        document.getElementById('hud-score').innerText = score;
        document.getElementById('hud-combo').innerText = `x${combo}`;
        document.getElementById('hud-timer').innerText = timeStr;
        document.getElementById('game-progress').style.width = `${(current / total) * 100}%`;
    }

    renderQuestion(qData) {
        document.getElementById('question-context').innerText = qData.context;
        document.getElementById('question-text').innerText = qData.question;
        
        const area = document.getElementById('answers-area');
        area.innerHTML = '';
        this.selectedNotes = [];
        this.selectedChoice = null;

        document.getElementById('btn-submit').classList.remove('hidden');
        document.getElementById('btn-next').classList.add('hidden');
        const feedback = document.getElementById('feedback-message');
        feedback.classList.add('hidden');
        feedback.className = 'feedback-toast';

        if (qData.type === 'notes') {
            const grid = document.createElement('div');
            grid.className = 'chromatic-grid';
            MusicTheory.CHROMATIC_SCALE.forEach(note => {
                const btn = document.createElement('button');
                btn.className = 'btn-choice';
                btn.innerText = note;
                btn.setAttribute('aria-label', `Nota ${note}`);
                btn.addEventListener('click', () => this.toggleNoteSelection(btn, note));
                grid.appendChild(btn);
            });
            area.appendChild(grid);
        } else {
            const container = document.createElement('div');
            container.className = 'linear-choices';
            qData.choices.forEach(choice => {
                const btn = document.createElement('button');
                btn.className = 'btn-choice';
                btn.innerText = choice;
                btn.addEventListener('click', () => this.selectSingleChoice(container, btn, choice));
                container.appendChild(btn);
            });
            area.appendChild(container);
        }
    }

    toggleNoteSelection(btn, note) {
        this.game.audio.playTone(440, 'sine', 0.05); // Clique sutil
        if (this.selectedNotes.includes(note)) {
            this.selectedNotes = this.selectedNotes.filter(n => n !== note);
            btn.classList.remove('selected');
        } else {
            this.selectedNotes.push(note);
            btn.classList.add('selected');
        }
    }

    selectSingleChoice(container, btn, choice) {
        this.game.audio.playTone(440, 'sine', 0.05);
        container.querySelectorAll('.btn-choice').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.selectedChoice = choice;
    }

    showFeedback(isCorrect, msg) {
        const feedback = document.getElementById('feedback-message');
        feedback.innerText = msg;
        feedback.classList.remove('hidden');
        feedback.classList.add(isCorrect ? 'correct' : 'wrong');
        
        document.getElementById('btn-submit').classList.add('hidden');
        document.getElementById('btn-next').classList.remove('hidden');
    }

    renderResults(sm, totalQuestions, timeFormatted) {
        document.getElementById('res-xp').innerText = `+${sm.xpGained}`;
        const pct = totalQuestions > 0 ? Math.round((sm.correctCount / totalQuestions) * 100) : 0;
        document.getElementById('res-accuracy').innerText = `${pct}%`;
        document.getElementById('res-correct').innerText = sm.correctCount;
        document.getElementById('res-wrong').innerText = sm.wrongCount;
        document.getElementById('res-time').innerText = timeFormatted;

        const logBox = document.getElementById('history-log');
        logBox.innerHTML = sm.history.map(item => `
            <div class="history-item">
                <span>${item.question}</span>
                <strong style="color: var(--${item.isCorrect ? 'success' : 'danger'})">
                    ${item.isCorrect ? 'Acertou' : 'Errou (Resp: ' + item.correctAns + ')'}
                </strong>
            </div>
        `).join('');
    }

    renderRanking(records) {
        const list = document.getElementById('ranking-list');
        if (records.length === 0) {
            list.innerHTML = `<li class="empty-ranking">Nenhuma partida registrada ainda.</li>`;
            return;
        }
        list.innerHTML = records.map((r, i) => `
            <li>
                <span>${i + 1}º [${r.mode.toUpperCase()}]</span>
                <span>${r.score} pts (${r.pct}%) - ${r.date}</span>
            </li>
        `).join('');
    }
}

/**
 * MOTOR CORE GLOBAL (GAME ENGINE)
 */
class Game {
    constructor() {
        this.audio = new AudioManager();
        this.ui = new UI(this);
        this.sm = null;
        
        this.currentMode = 'notes';
        this.maxQuestions = 10;
        this.difficulty = 'triads';
        
        this.currentQuestionIndex = 0;
        this.currentQuestionData = null;
        
        this.timerInterval = null;
        this.startTime = 0;
        this.elapsedSeconds = 0;

        this.ui.bindEvents();
        this.loadRanking();
    }

    updateConfig() {
        this.maxQuestions = parseInt(document.getElementById('cfg-questions').value) || 10;
        this.difficulty = document.getElementById('cfg-difficulty').value || 'triads';
    }

    start(mode) {
        this.audio.init();
        this.currentMode = mode;
        this.currentQuestionIndex = 0;
        this.sm = new ScoreManager();
        this.elapsedSeconds = 0;
        this.startTime = Date.now();
        
        this.ui.switchScreen('screen-game');
        this.startTimer();
        this.nextQuestion();
    }

    startTimer() {
        clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            this.elapsedSeconds = Math.floor((Date.now() - this.startTime) / 1000);
            this.ui.renderHUD(
                this.currentQuestionIndex, 
                this.maxQuestions, 
                this.sm.score, 
                this.sm.combo, 
                this.formatTime(this.elapsedSeconds)
            );
        }, 1000);
    }

    formatTime(sec) {
        const m = String(Math.floor(sec / 60)).padStart(2, '0');
        const s = String(sec % 60).padStart(2, '0');
        return `${m}:${s}`;
    }

    nextQuestion() {
        this.currentQuestionIndex++;
        if (this.currentQuestionIndex > this.maxQuestions) {
            this.endGame();
            return;
        }

        this.currentQuestionData = QuestionGenerator.generate(this.currentMode, this.difficulty);
        this.ui.renderHUD(this.currentQuestionIndex, this.maxQuestions, this.sm.score, this.sm.combo, this.formatTime(this.elapsedSeconds));
        this.ui.renderQuestion(this.currentQuestionData);
    }

    checkAnswer() {
        let isCorrect = false;
        let answerUserStr = "";
        let correctStr = "";

        if (this.currentQuestionData.type === 'notes') {
            const userArr = [...this.ui.selectedNotes].sort();
            const correctArr = [...this.currentQuestionData.correctAnswer].sort();
            isCorrect = JSON.stringify(userArr) === JSON.stringify(correctArr);
            answerUserStr = userArr.join(',');
            correctStr = correctArr.join(',');

            // Pinta os botões cromáticos com gabarito visual imediato
            document.querySelectorAll('.chromatic-grid .btn-choice').forEach(btn => {
                const note = btn.innerText;
                if (correctArr.includes(note)) {
                    btn.classList.add('correct');
                } else if (userArr.includes(note)) {
                    btn.classList.add('wrong');
                }
                btn.disabled = true;
            });
            // Toca o acorde gerado dinamicamente para fixação auditiva
            this.audio.playChord(this.currentQuestionData.correctAnswer);

        } else {
            isCorrect = this.ui.selectedChoice === this.currentQuestionData.correctAnswer;
            answerUserStr = this.ui.selectedChoice || "Nenhuma";
            correctStr = this.currentQuestionData.correctAnswer;

            document.querySelectorAll('.linear-choices .btn-choice').forEach(btn => {
                if (btn.innerText === correctStr) btn.classList.add('correct');
                else if (btn.innerText === answerUserStr) btn.classList.add('wrong');
                btn.disabled = true;
            });
        }

        this.audio.playFeedback(isCorrect);

        if (isCorrect) {
            this.sm.addHit();
            this.ui.showFeedback(true, `Correto! Muito bem! 🔥`);
        } else {
            this.sm.addMiss();
            this.ui.showFeedback(false, `Incorreto. Resposta certa: ${correctStr}`);
        }

        this.sm.logHistory(this.currentQuestionData.question, isCorrect, correctStr);
        this.ui.renderHUD(this.currentQuestionIndex, this.maxQuestions, this.sm.score, this.sm.combo, this.formatTime(this.elapsedSeconds));
    }

    endGame() {
        clearInterval(this.timerInterval);
        this.ui.switchScreen('screen-result');
        this.ui.renderResults(this.sm, this.maxQuestions, this.formatTime(this.elapsedSeconds));
        this.saveRanking();
    }

    showHome() {
        this.loadRanking();
        this.ui.switchScreen('screen-home');
    }

    saveRanking() {
        const records = JSON.parse(localStorage.getItem('music_trainer_ranking')) || [];
        const pct = Math.round((this.sm.correctCount / this.maxQuestions) * 100);
        records.push({
            mode: this.currentMode,
            score: this.sm.score,
            pct: pct,
            date: new Date().toLocaleDateString('pt-BR')
        });
        records.sort((a, b) => b.score - a.score);
        localStorage.setItem('music_trainer_ranking', JSON.stringify(records.slice(0, 5)));
    }

    loadRanking() {
        const records = JSON.parse(localStorage.getItem('music_trainer_ranking')) || [];
        this.ui.renderRanking(records);
    }
}

// Inicializa a aplicação assim que o DOM carregar completamente
window.addEventListener('DOMContentLoaded', () => {
    window.appMusicTrainer = new Game();
});