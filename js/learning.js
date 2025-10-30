// learning.js - Логика обучения и вопросов

const czechLetters = 'aábcčdďeéěfghiíjklmnňoópqrřsštťuúůvwxyýzž'.split('');

let sessionWords = [];
let sessionStats = { correct: 0, incorrect: 0 };
let currentQuestion = null;
let returnScreenFromParams = 'setSelectorScreen';

function startSessionFromPreview() {
    if (!window.currentPreviewSet) return;
    
    window.sessionParams = {
        setName: window.currentPreviewSet,
        isRandom: false
    };
    window.returnScreenFromParams = 'setPreviewScreen';
    showScreen('sessionParamsScreen');
}

function returnFromSessionParams() {
    showScreen(window.returnScreenFromParams || 'setSelectorScreen');
}

function startSessionWithParams() {
    const size = document.getElementById('sessionSize').value;
    const mode = document.getElementById('selectionMode').value;
    
    const words = loadWords();
    let availableWords = [];
    
    if (window.sessionParams.isRandom) {
        availableWords = [...words];
    } else {
        availableWords = words.filter(w => w.setName === window.sessionParams.setName);
    }
    
    if (availableWords.length === 0) {
        alert('Нет доступных слов для обучения!');
        return;
    }
    
    let filteredWords = selectWordsByMode(availableWords, mode);
    
    if (filteredWords.length === 0) {
        alert('Нет слов, соответствующих выбранному режиму!');
        return;
    }
    
    const sessionSize = size === 'all' ? filteredWords.length : Math.min(parseInt(size), filteredWords.length);
    
    sessionWords = filteredWords
        .sort(() => Math.random() - 0.5)
        .slice(0, sessionSize)
        .map(w => ({ ...w, answered: false, attempts: 0 }));
    
    sessionStats = { correct: 0, incorrect: 0 };

    showScreen('learningScreen');
    showNextQuestion();
}

function selectWordsByMode(availableWords, mode) {
    switch(mode) {
        case 'smart':
            return availableWords.sort((a, b) => {
                const totalA = a.correct + a.incorrect;
                const totalB = b.correct + b.incorrect;
                
                if (totalA === 0 && totalB > 0) return -1;
                if (totalB === 0 && totalA > 0) return 1;
                if (totalA === 0 && totalB === 0) return 0;
                
                const successRateA = a.correct / totalA;
                const successRateB = b.correct / totalB;
                
                if (Math.abs(successRateA - successRateB) > 0.1) {
                    return successRateA - successRateB;
                }
                
                const dateA = a.lastReview ? new Date(a.lastReview).getTime() : 0;
                const dateB = b.lastReview ? new Date(b.lastReview).getTime() : 0;
                return dateA - dateB;
            });
            
        case 'random':
            return availableWords.sort(() => Math.random() - 0.5);
            
        case 'problematic':
            return availableWords.filter(w => {
                const total = w.correct + w.incorrect;
                if (total === 0) return false;
                return (w.correct / total) < 0.5;
            }).sort((a, b) => {
                const totalA = a.correct + a.incorrect;
                const totalB = b.correct + b.incorrect;
                const successRateA = a.correct / totalA;
                const successRateB = b.correct / totalB;
                return successRateA - successRateB;
            });
            
        case 'new':
            return availableWords.filter(w => w.correct === 0 && w.incorrect === 0);
            
        default:
            return availableWords;
    }
}

function showNextQuestion() {
    const unanswered = sessionWords.filter(w => !w.answered);
    
    if (unanswered.length === 0) {
        showResults();
        return;
    }

    currentQuestion = unanswered[0];
    const questionType = Math.random() < 0.5 ? 'csToRu' : 'ruToCs';
    
    updateSessionStats();
    
    if (questionType === 'csToRu') {
        showMultipleChoice();
    } else {
        showLetterConstruction();
    }
}

function showMultipleChoice() {
    const words = loadWords();
    const correctAnswer = currentQuestion.ru;
    const wrongAnswers = words
        .filter(w => w.ru !== correctAnswer)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(w => w.ru);
    
    const allAnswers = [correctAnswer, ...wrongAnswers].sort(() => Math.random() - 0.5);

    const container = document.getElementById('questionContainer');
    container.innerHTML = `
        <div class="question-card">
            <div class="question-type">Переведи с чешского</div>
            <div class="question-text">${currentQuestion.cs}</div>
            ${currentQuestion.tr ? `<div class="question-transcription">${currentQuestion.tr}</div>` : ''}
        </div>
        <div class="options" id="options"></div>
    `;

    const optionsDiv = document.getElementById('options');
    allAnswers.forEach(answer => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = answer;
        btn.onclick = () => checkMultipleChoice(answer, correctAnswer, btn);
        optionsDiv.appendChild(btn);
    });
}

function checkMultipleChoice(selected, correct, selectedBtn) {
    const buttons = document.querySelectorAll('.option-btn');
    let correctBtn = null;
    
    buttons.forEach(btn => {
        btn.disabled = true;
        if (btn.textContent === correct) {
            btn.classList.add('correct');
            correctBtn = btn;
        }
        if (btn.textContent === selected && selected !== correct) {
            btn.classList.add('incorrect');
        }
    });

    const isCorrect = selected === correct;
    
    if (window.innerWidth <= 600) {
        buttons.forEach(btn => {
            if (btn !== correctBtn && btn !== selectedBtn) {
                btn.classList.add('hidden');
            }
        });
    }
    
    const feedback = document.createElement('div');
    feedback.className = `feedback ${isCorrect ? 'correct' : 'incorrect'}`;
    feedback.innerHTML = isCorrect 
        ? '✓ Правильно!' 
        : `✗ Неправильно. Правильный ответ: <strong>${correct}</strong>`;
    
    const container = document.getElementById('questionContainer');
    container.insertBefore(feedback, container.firstChild);

    const nextBtn = document.createElement('button');
    nextBtn.className = 'button';
    nextBtn.textContent = 'Далее →';
    nextBtn.onclick = () => handleAnswer(isCorrect);
    nextBtn.style.marginTop = '20px';
    container.appendChild(nextBtn);
}

function showLetterConstruction() {
    const correctWord = currentQuestion.cs;
    const correctLower = correctWord.toLowerCase();
    
    const letters = correctLower.replace(/ /g, '').split('');
    
    const wordLength = letters.length;
    const extraCount = Math.min(3, Math.ceil(wordLength * 0.2));
    
    const extraLetters = czechLetters
        .filter(l => !letters.includes(l))
        .sort(() => Math.random() - 0.5)
        .slice(0, extraCount);
    
    const allLetters = [...letters, ...extraLetters].sort(() => Math.random() - 0.5);

    const template = correctWord.split('').map(char => char === ' ' ? ' ' : '_').join('');

    const container = document.getElementById('questionContainer');
    container.innerHTML = `
        <div class="question-card">
            <div class="question-type">Составь слово на чешском</div>
            <div class="question-text">${currentQuestion.ru}</div>
        </div>
        <div class="constructed-word ${wordLength > 15 ? 'long' : ''} ${wordLength > 25 ? 'very-long' : ''}" id="constructedWord">${template}</div>
        <div class="letter-buttons" id="letterButtons"></div>
        <button class="button secondary" onclick="deleteLastLetter()" style="width: auto; display: inline-block; margin-right: 10px;">⌫ Стереть букву</button>
        <button class="button" onclick="checkConstruction()">Проверить</button>
    `;

    const letterButtons = document.getElementById('letterButtons');
    
    const firstLetterOriginal = correctWord[0];
    const firstLetterLower = firstLetterOriginal.toLowerCase();
    
    let capitalizedAdded = false;
    
    allLetters.forEach((letter, index) => {
        const btn = document.createElement('button');
        btn.className = 'letter-btn';
        const shouldCapitalize = !capitalizedAdded && letter === firstLetterLower && firstLetterOriginal === firstLetterOriginal.toUpperCase();
        const displayLetter = shouldCapitalize ? letter.toUpperCase() : letter;
        
        if (shouldCapitalize) {
            capitalizedAdded = true;
        }
        
        btn.textContent = displayLetter;
        btn.dataset.index = index;
        btn.dataset.letter = letter;
        btn.onclick = () => addLetter(letter, index);
        letterButtons.appendChild(btn);
    });

    window.constructedLetters = [];
    window.correctWordTemplate = correctWord;
}

function addLetter(letter, index) {
    const correctWord = window.correctWordTemplate;
    const withoutSpaces = correctWord.replace(/ /g, '');
    
    if (window.constructedLetters.length >= withoutSpaces.length) {
        return;
    }

    window.constructedLetters.push({ letter, index });
    updateConstructedWord();
    
    const btn = document.querySelector(`[data-index="${index}"]`);
    btn.disabled = true;
}

function updateConstructedWord() {
    const correctWord = window.correctWordTemplate;
    const result = [];
    let letterIndex = 0;

    for (let i = 0; i < correctWord.length; i++) {
        if (correctWord[i] === ' ') {
            result.push(' ');
        } else {
            if (letterIndex < window.constructedLetters.length) {
                const letter = window.constructedLetters[letterIndex].letter;
                result.push(correctWord[i] === correctWord[i].toUpperCase() ? letter.toUpperCase() : letter);
                letterIndex++;
            } else {
                result.push('_');
            }
        }
    }

    document.getElementById('constructedWord').textContent = result.join('');
}

function deleteLastLetter() {
    if (window.constructedLetters.length === 0) return;
    
    const lastLetter = window.constructedLetters.pop();
    updateConstructedWord();
    
    const btn = document.querySelector(`[data-index="${lastLetter.index}"]`);
    if (btn) btn.disabled = false;
}

function checkConstruction() {
    const correctWord = window.correctWordTemplate;
    let constructed = '';
    let letterIndex = 0;
    
    for (let i = 0; i < correctWord.length; i++) {
        if (correctWord[i] === ' ') {
            constructed += ' ';
        } else {
            if (letterIndex < window.constructedLetters.length) {
                constructed += window.constructedLetters[letterIndex].letter;
                letterIndex++;
            }
        }
    }
    
    const isCorrect = constructed.toLowerCase() === correctWord.toLowerCase();

    const feedback = document.createElement('div');
    feedback.className = `feedback ${isCorrect ? 'correct' : 'incorrect'}`;
    feedback.innerHTML = isCorrect 
        ? '✓ Правильно!' 
        : `✗ Неправильно. Правильный ответ: <strong>${currentQuestion.cs}</strong>`;
    
    document.getElementById('questionContainer').insertBefore(
        feedback, 
        document.getElementById('questionContainer').firstChild
    );

    if (!isCorrect) {
        document.getElementById('constructedWord').textContent = currentQuestion.cs;
    }

    document.querySelectorAll('.letter-btn').forEach(btn => btn.disabled = true);
    
    const container = document.getElementById('questionContainer');
    const buttons = container.querySelectorAll('button.button, button.button.secondary');
    buttons.forEach(btn => btn.remove());
    
    const nextBtn = document.createElement('button');
    nextBtn.className = 'button';
    nextBtn.textContent = 'Далее →';
    nextBtn.onclick = () => handleAnswer(isCorrect);
    container.appendChild(nextBtn);
}

function handleAnswer(isCorrect) {
    currentQuestion.attempts++;
    
    if (isCorrect) {
        sessionStats.correct++;
        currentQuestion.answered = true;
        currentQuestion.correct++;
    } else {
        sessionStats.incorrect++;
        currentQuestion.incorrect++;
        
        const currentIndex = sessionWords.findIndex(w => 
            w.cs === currentQuestion.cs && w.ru === currentQuestion.ru
        );
        
        if (currentIndex !== -1) {
            const word = sessionWords.splice(currentIndex, 1)[0];
            const offset = Math.floor(Math.random() * 3) + 3;
            const insertPosition = Math.min(currentIndex + offset, sessionWords.length);
            sessionWords.splice(insertPosition, 0, word);
        }
    }

    const words = loadWords();
    const wordInBase = words.find(w => w.cs === currentQuestion.cs && w.ru === currentQuestion.ru);
    if (wordInBase) {
        if (isCorrect) {
            wordInBase.correct++;
        } else {
            wordInBase.incorrect++;
        }
        wordInBase.lastReview = new Date().toISOString();
    }

    saveWords(words);
    showNextQuestion();
}

function updateSessionStats() {
    const answered = sessionWords.filter(w => w.answered).length;
    const total = sessionWords.length;
    const remaining = sessionWords.filter(w => !w.answered).length;

    document.getElementById('sessionCorrect').textContent = sessionStats.correct;
    document.getElementById('sessionIncorrect').textContent = sessionStats.incorrect;
    document.getElementById('sessionRemaining').textContent = remaining;

    const progress = (answered / total) * 100;
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    
    progressBar.style.width = progress + '%';
    progressText.textContent = Math.round(progress) + '%';
    
    if (progress > 0) {
        progressText.classList.remove('dark');
        progressText.classList.add('light');
    } else {
        progressText.classList.remove('light');
        progressText.classList.add('dark');
    }
}

function showResults() {
    const total = sessionStats.correct + sessionStats.incorrect;
    const accuracy = total > 0 ? Math.round((sessionStats.correct / total) * 100) : 0;

    document.getElementById('finalCorrect').textContent = sessionStats.correct;
    document.getElementById('finalIncorrect').textContent = sessionStats.incorrect;
    document.getElementById('finalAccuracy').textContent = accuracy + '%';

    showScreen('resultsScreen');
}

function endSession() {
    if (confirm('Завершить сессию? Прогресс будет сохранен.')) {
        showScreen('mainScreen');
        updateMainStats();
    }
}
