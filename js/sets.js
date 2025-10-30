// sets.js - Управление наборами слов

const REPO_PATH = 'Akira-27-CZ/czech-learning';

// availableSets уже объявлен глобально в app.js, не нужно дублировать
// let availableSets = [];  <-- удали эту строку

// Эту функцию больше не нужно вызывать - данные загружаются в app.js
async function loadSetsFromRepo() {
    displaySets();
}

function displaySets() {
    const container = document.getElementById('setsContainer');
    const loadedSets = loadLoadedSets();
    
    if (!availableSets || availableSets.length === 0) {
        container.innerHTML = '<div class="error-box">Наборы не найдены. Проверьте подключение к интернету.</div>';
        return;
    }
    
    container.innerHTML = '<h3>Доступные наборы</h3>';

    availableSets.forEach(set => {
        const isLoaded = loadedSets.includes(set.file);
        
        const setCard = document.createElement('div');
        setCard.className = `set-card ${isLoaded ? 'set-card-loaded' : ''}`;
        setCard.innerHTML = `
            <div class="set-card-header">
                <div class="set-card-title">${set.name}</div>
                <div class="set-card-badge">${set.level || 'beginner'}</div>
            </div>
            <div class="set-card-info">
                📚 ${set.words || '?'} слов
                ${isLoaded ? '<br>✅ Загружено' : ''}
            </div>
            <div class="set-card-actions">
                ${!isLoaded ? 
                    `<button class="button small" onclick="loadSet('${set.file}', '${set.name}')">Загрузить набор</button>` :
                    `<button class="button small secondary" onclick="reloadSet('${set.file}', '${set.name}')">Обновить</button>
                     <button class="button small" onclick="viewSetWordsFromSets('${set.name}')">Просмотр слов</button>
                     <button class="button small danger" onclick="deleteSet('${set.file}', '${set.name}')">Удалить набор</button>`
                }
            </div>
        `;
        container.appendChild(setCard);
    });
}


async function loadSet(filename, setName) {
    try {
        const url = `https://raw.githubusercontent.com/${REPO_PATH}/main/word-sets/${filename}`;
        const response = await fetch(url);
        
        if (!response.ok) throw new Error('Не удалось загрузить набор');
        
        const newWords = await response.json();

        if (!Array.isArray(newWords)) {
            throw new Error('Неверный формат файла');
        }

        const words = loadWords();
        let addedCount = 0;
        
        newWords.forEach(word => {
            if (!words.find(w => w.cs === word.cs && w.ru === word.ru)) {
                words.push({
                    cs: word.cs,
                    tr: word.tr || '',
                    ru: word.ru,
                    correct: 0,
                    incorrect: 0,
                    lastReview: null,
                    setName: setName
                });
                addedCount++;
            }
        });

        saveWords(words);
        
        const loadedSets = loadLoadedSets();
        if (!loadedSets.includes(filename)) {
            loadedSets.push(filename);
            saveLoadedSets(loadedSets);
        }

        displaySets();
        updateMainStats();
        alert(`Добавлено слов: ${addedCount}`);
    } catch (e) {
        alert('Ошибка загрузки набора: ' + e.message);
    }
}

async function reloadSet(filename, setName) {
    if (!confirm(`Обновить набор "${setName}"?\n\nБудут добавлены новые слова и удалены отсутствующие.\nСтатистика существующих слов будет сохранена.`)) {
        return;
    }

    try {
        const url = `https://raw.githubusercontent.com/${REPO_PATH}/main/word-sets/${filename}`;
        const response = await fetch(url);
        
        if (!response.ok) throw new Error('Не удалось загрузить набор');
        
        const newWords = await response.json();

        if (!Array.isArray(newWords)) {
            throw new Error('Неверный формат файла');
        }

        let words = loadWords();
        
        // Находим все слова из этого набора
        const oldSetWords = words.filter(w => w.setName === setName);
        
        // Слова из других наборов остаются нетронутыми
        const otherWords = words.filter(w => w.setName !== setName);
        
        let addedCount = 0;
        let updatedCount = 0;
        let removedCount = 0;
        
        // Обрабатываем каждое слово из нового набора
        const updatedSetWords = newWords.map(newWord => {
            // Ищем это слово в старой версии набора
            const existingWord = oldSetWords.find(w => 
                w.cs === newWord.cs && w.ru === newWord.ru
            );
            
            if (existingWord) {
                // Слово существовало - сохраняем статистику, обновляем транскрипцию
                updatedCount++;
                return {
                    ...existingWord,
                    tr: newWord.tr || existingWord.tr || '' // обновляем транскрипцию если есть
                };
            } else {
                // Новое слово - добавляем с нулевой статистикой
                addedCount++;
                return {
                    cs: newWord.cs,
                    tr: newWord.tr || '',
                    ru: newWord.ru,
                    correct: 0,
                    incorrect: 0,
                    lastReview: null,
                    setName: setName
                };
            }
        });
        
        // Подсчитываем удалённые слова
        removedCount = oldSetWords.length - updatedCount;

        // Объединяем: слова из других наборов + обновлённые слова этого набора
        words = [...otherWords, ...updatedSetWords];

        saveWords(words);
        displaySets();
        updateMainStats();
        
        // Подробный отчёт об обновлении
        let message = `Набор "${setName}" обновлён!\n\n`;
        if (addedCount > 0) message += `✅ Добавлено новых слов: ${addedCount}\n`;
        if (updatedCount > 0) message += `♻️ Сохранена статистика: ${updatedCount} слов\n`;
        if (removedCount > 0) message += `🗑️ Удалено слов: ${removedCount}\n`;
        
        alert(message);
    } catch (e) {
        alert('Ошибка обновления набора: ' + e.message);
    }
}
function deleteSet(filename, setName) {
    if (!confirm(`Удалить набор "${setName}"?\n\nВсе слова из этого набора будут удалены.\nСтатистика обучения будет потеряна.\nЭто действие необратимо!`)) {
        return;
    }

    let words = loadWords();
    words = words.filter(w => w.setName !== setName);
    
    let loadedSets = loadLoadedSets();
    loadedSets = loadedSets.filter(f => f !== filename);

    saveWords(words);
    saveLoadedSets(loadedSets);

    displaySets();
    updateMainStats();
    alert(`Набор "${setName}" удален`);
}

function viewSetWordsFromSets(setName) {
    showSetPreview(setName, 'setsScreen');
}

function showSetPreview(setName, returnScreen = 'setSelectorScreen') {
    window.currentPreviewSet = setName;
    window.previewReturnScreen = returnScreen;
    
    const words = loadWords();
    const setWords = words.filter(w => w.setName === setName);
    
    document.getElementById('previewSetTitle').textContent = setName;
    document.getElementById('previewSetInfo').innerHTML = `📚 Всего слов: ${setWords.length}`;
    
    const wordsList = document.getElementById('previewWordsList');
    wordsList.innerHTML = '';
    
    setWords.forEach(word => {
        const card = document.createElement('div');
        card.className = 'word-card';
        card.innerHTML = `
            <div class="word-card-cs">${word.cs}</div>
            <div class="word-card-transcription">${word.tr || ''}</div>
            <div class="word-card-ru">${word.ru}</div>
            <div class="word-card-stats">
                ✓ Правильно: ${word.correct} | ✗ Ошибок: ${word.incorrect}
            </div>
        `;
        wordsList.appendChild(card);
    });
    
    showScreen('setPreviewScreen');
}

function closeSetPreview() {
    showScreen(window.previewReturnScreen || 'setSelectorScreen');
}
