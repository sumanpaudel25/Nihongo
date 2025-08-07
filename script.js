document.addEventListener('DOMContentLoaded', () => {
    // Main App Elements
    const playBtn = document.getElementById('play-btn');
    const playBtnText = document.getElementById('play-btn-text');
    const inputDisplay = document.getElementById('input-display');
    const keypad = document.getElementById('keypad');
    const actionBtn = document.getElementById('action-btn');
    
    // Stats Elements
    const totalCountEl = document.getElementById('total-count'), correctCountEl = document.getElementById('correct-count'), incorrectCountEl = document.getElementById('incorrect-count');
    const streakCountEl = document.getElementById('streak-count'), fireIcon = document.querySelector('.fire-icon'), progressBar = document.getElementById('progress-bar'), percentageEl = document.getElementById('percentage');

    // Settings Modal Elements
    const settingsBtn = document.getElementById('settings-btn'), settingsModal = document.getElementById('settings-modal'), closeModalBtn = document.getElementById('close-modal-btn');
    const saveSettingsBtn = document.getElementById('save-settings-btn'), resetProgressBtn = document.getElementById('reset-progress');
    const speechRateInput = document.getElementById('speech-rate'), autoPlayInput = document.getElementById('auto-play'), difficultyInput = document.getElementById('difficulty'), darkModeInput = document.getElementById('dark-mode');

    // Feedback Modal Elements
    const feedbackModal = document.getElementById('feedback-modal'), nextQuestionBtn = document.getElementById('next-question-btn');
    const feedbackIconContainer = document.getElementById('feedback-icon-container'), feedbackTextContainer = document.getElementById('feedback-text-container'), correctAnswerContainer = document.getElementById('correct-answer-container');

    const toast = document.getElementById('toast');

    // App State
    let isGameStarted = false; // NEW: State to track if the game has started
    let currentNumber = 0, userInput = '', stats = { total: 0, correct: 0, incorrect: 0, streak: 0 };
    let settings = { rate: 1.0, autoPlay: true, difficulty: '1-1000', darkMode: false };

    // Japanese Number Conversion (Unchanged and compressed)
    function numberToJapanese(num) { if (num === 0) return 'zero'; const units = ['', 'ichi', 'ni', 'san', 'yon', 'go', 'roku', 'nana', 'hachi', 'kyuu']; const tens = ['', 'juu', 'nijuu', 'sanjuu', 'yonjuu', 'gojuu', 'rokujuu', 'nanajuu', 'hachijuu', 'kyuujuu']; const hyaku = 'hyaku', sen = 'sen', man = 'man'; let str = ''; if (num >= 10000) { const manPart = Math.floor(num / 10000); str += (manPart > 1 ? numberToJapanese(manPart) : '') + man; num %= 10000; } if (num >= 1000) { const senPart = Math.floor(num / 1000); if (senPart === 1) str += sen; else if (senPart === 3) str += 'sanzen'; else if (senPart === 8) str += 'hassen'; else str += units[senPart] + sen; num %= 1000; } if (num >= 100) { const hyakuPart = Math.floor(num / 100); if (hyakuPart === 1) str += hyaku; else if (hyakuPart === 3) str += 'sanbyaku'; else if (hyakuPart === 6) str += 'roppyaku'; else if (hyakuPart === 8) str += 'happyaku'; else str += units[hyakuPart] + hyaku; num %= 100; } if (num >= 10) { str += tens[Math.floor(num / 10)]; num %= 10; } if (num > 0) { str += units[num]; } return str; }

    // --- Core App Logic ---
    function generateNumber() { const [min, max] = settings.difficulty.split('-').map(Number); currentNumber = Math.floor(Math.random() * (max - min + 1)) + min; }
    function speak(text) { if (!window.speechSynthesis) { alert("Speech synthesis not supported."); return; } window.speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(text); utterance.lang = 'ja-JP'; utterance.rate = settings.rate; playBtnText.textContent = 'Playing...'; playBtn.disabled = true; utterance.onend = () => { playBtnText.textContent = 'Click to listen'; playBtn.disabled = false; }; window.speechSynthesis.speak(utterance); }
    function playCurrentNumber() { speak(numberToJapanese(currentNumber)); }
    
    function startGame() {
        isGameStarted = true;
        keypad.classList.remove('disabled');
        actionBtn.textContent = 'Check Answer';
        generateNumber();
        playCurrentNumber();
    }

    function startNewRound() {
        feedbackModal.classList.add('hidden');
        userInput = '';
        updateDisplay();
        generateNumber();
        actionBtn.disabled = false;
        if (settings.autoPlay) { setTimeout(playCurrentNumber, 300); }
    }

    function checkAnswer() {
        if (userInput === '') return;
        stats.total++;
        const userNum = parseInt(userInput, 10);
        
        if (userNum === currentNumber) {
            stats.correct++; stats.streak++;
            feedbackIconContainer.innerHTML = `<i class="fi fi-rr-check-circle correct-text"></i>`;
            feedbackTextContainer.textContent = 'Correct!';
            correctAnswerContainer.textContent = '';
        } else {
            stats.incorrect++; stats.streak = 0;
            feedbackIconContainer.innerHTML = `<i class="fi fi-rr-exclamation incorrect-text"></i>`;
            feedbackTextContainer.textContent = 'Incorrect';
            correctAnswerContainer.textContent = `Correct answer: ${currentNumber}`;
        }
        
        updateStatsUI();
        saveState();
        actionBtn.disabled = true;
        feedbackModal.classList.remove('hidden');
    }
    
    // --- UI & State Management ---
    function updateDisplay() { inputDisplay.textContent = userInput; }
    function updateStatsUI() { totalCountEl.textContent = `${stats.total} total`; correctCountEl.textContent = stats.correct; incorrectCountEl.textContent = stats.incorrect; streakCountEl.textContent = stats.streak; fireIcon.classList.toggle('active', stats.streak > 0); const percentage = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0; progressBar.style.width = `${percentage}%`; percentageEl.textContent = `${percentage}%`; }
    function applySettings() { document.body.classList.toggle('dark-mode', settings.darkMode); speechRateInput.value = settings.rate; autoPlayInput.checked = settings.autoPlay; difficultyInput.value = settings.difficulty; darkModeInput.checked = settings.darkMode; }
    function showToast(message) { toast.textContent = message; toast.classList.remove('hidden'); setTimeout(() => toast.classList.add('hidden'), 2500); }
    function saveState() { localStorage.setItem('nihongoNumbersStats', JSON.stringify(stats)); localStorage.setItem('nihongoNumbersSettings', JSON.stringify(settings)); }
    function loadState() { const savedStats = JSON.parse(localStorage.getItem('nihongoNumbersStats')); if (savedStats) stats = savedStats; const savedSettings = JSON.parse(localStorage.getItem('nihongoNumbersSettings')); if (savedSettings) settings = savedSettings; }
    
    function setupInitialState() {
        actionBtn.textContent = 'Start Listening';
        keypad.classList.add('disabled');
        inputDisplay.textContent = '';
        userInput = '';
    }

    // --- Event Handlers ---
    keypad.addEventListener('click', (e) => {
        if (!e.target.matches('button')) return;
        const key = e.target.dataset.key;
        if (key >= '0' && key <= '9' && userInput.length < 10) userInput += key;
        else if (key === 'clear') userInput = '';
        else if (key === 'backspace') userInput = userInput.slice(0, -1);
        updateDisplay();
    });

    actionBtn.addEventListener('click', () => {
        if (!isGameStarted) {
            startGame();
        } else {
            checkAnswer();
        }
    });
    
    nextQuestionBtn.addEventListener('click', startNewRound);
    playBtn.addEventListener('click', () => {
        if(isGameStarted) playCurrentNumber();
    });
    settingsBtn.addEventListener('click', () => settingsModal.classList.remove('hidden'));
    closeModalBtn.addEventListener('click', () => settingsModal.classList.add('hidden'));
    saveSettingsBtn.addEventListener('click', () => {
        const oldDifficulty = settings.difficulty;
        settings.rate = parseFloat(speechRateInput.value); settings.autoPlay = autoPlayInput.checked; settings.difficulty = difficultyInput.value; settings.darkMode = darkModeInput.checked;
        applySettings(); saveState(); showToast('Settings have been updated.');
        settingsModal.classList.add('hidden');
        if (isGameStarted && oldDifficulty !== settings.difficulty) {
            startNewRound();
        }
    });
    resetProgressBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset all your progress? This cannot be undone.')) {
            stats = { total: 0, correct: 0, incorrect: 0, streak: 0 };
            isGameStarted = false; // Reset game state as well
            updateStatsUI();
            saveState();
            setupInitialState(); // Go back to "Start Listening" screen
            showToast('Progress has been reset.');
            settingsModal.classList.add('hidden');
        }
    });
    
    // --- NEW: Keyboard Support ---
    document.addEventListener('keydown', (e) => {
        // Don't interfere if a modal is open
        if (!settingsModal.classList.contains('hidden') || !feedbackModal.classList.contains('hidden')) {
            return;
        }

        // Handle Enter key to start or check answer
        if (e.key === 'Enter') {
            e.preventDefault(); // prevent form submission
            actionBtn.click(); // Programmatically click the main button
        }
        
        // Only handle other keys if game has started
        if (!isGameStarted) return;
        
        // Handle number inputs
        if (e.key >= '0' && e.key <= '9' && userInput.length < 10) {
            userInput += e.key;
            updateDisplay();
        }
        // Handle Backspace key
        else if (e.key === 'Backspace') {
            userInput = userInput.slice(0, -1);
            updateDisplay();
        }
        // Handle Delete key (as clear)
        else if (e.key === 'Delete') {
            userInput = '';
            updateDisplay();
        }
    });
    
    // --- Initialization ---
    function init() {
        loadState();
        applySettings();
        updateStatsUI();
        setupInitialState(); // Set up the initial screen
    }

    init();
});
