// app.js - Главный файл приложения

// Глобальные переменные
window.sessionParams = null;
window.returnScreenFromParams = 'setSelectorScreen';

function init() {
    updateMainStats();
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');

    if (screenId === 'statsScreen') {
        updateStatsScreen();
    }
    if (screenId === 'mainScreen') {
        updateMainStats();
    }
    if (screenId === 'setsScreen') {
        loadSetsFromRepo();
    }
}

function showSetSelector() {
    const words = loadWords();
    
    if (words.length === 0) {
        alert('Сначала добавь слова в базу!');
        showScreen('setsScreen');
        return;
    }

    showScreen('setSelectorScreen');
    displaySetSelector();
}

function displaySetSelector() {
    const words = loadWords();
    const container = document.getElementById('setSelector');
    const setNames = [...new Set(words.map(w => w.setName).filter(n => n))];
    
    container.innerHTML = '';

    const randomOption = document.createElement('div');
    randomOption.className = 'set-option';
    randomOption.innerHTML = `
        <div class="set-option-title">🎲 Случайные слова</div>
        <div class="set-option-info">Слова из всех наборов с умным подбором</div>
        <div style="margin-top: 10px;">
            <button class="button small secondary" onclick="event.stopPropagation(); startRandomSession()">Начать сессию</button>
        </div>
    `;
    container.appendChild(randomOption);

    setNames.forEach(setName => {
        const setWords = words.filter(w => w.setName === setName);
        const option = document.createElement('div');
        option.className = 'set-option';
        option.innerHTML = `
            <div class="set-option-title">${setName}</div>
            <div class="set-option-info">📚 ${setWords.length} слов</div>
            <div style="margin-top: 10px;">
                <button class="button small" onclick="event.stopPropagation(); showSetPreview('${setName}')">Просмотр слов</button>
                <button class="button small secondary" onclick="event.stopPropagation(); startSessionWithSet('${setName}')" style="margin-left: 10px;">Начать сессию</button>
            </div>
        `;
        container.appendChild(option);
    });
}

function startSessionWithSet(setName) {
    window.sessionParams = {
        setName: setName,
        isRandom: false
    };
    window.returnScreenFromParams = 'setSelectorScreen';
    showScreen('sessionParamsScreen');
}

function startRandomSession() {
    window.sessionParams = {
        setName: null,
        isRandom: true
    };
    window.returnScreenFromParams = 'setSelectorScreen';
    showScreen('sessionParamsScreen');
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', init);
