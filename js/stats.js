// stats.js - Статистика и управление словами

let sortAscending = false;

function updateMainStats() {
    const words = loadWords();
    const total = words.length;
    const learned = words.filter(w => w.correct > 0).length;
    
    document.getElementById('mainStats').innerHTML = `
        <div class="stats">
            <div class="stat-item">
                <div class="stat-value">${total}</div>
                <div class="stat-label">Слов в базе</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${learned}</div>
                <div class="stat-label">Изучено</div>
            </div>
        </div>
    `;
}

function updateStatsScreen() {
    const words = loadWords();
    const setFilter = document.getElementById('setFilter');
    const currentFilterValue = setFilter.value;
    const setNames = [...new Set(words.map(w => w.setName).filter(n => n))];
    
    setFilter.innerHTML = '<option value="">Все наборы</option>';
    setNames.forEach(setName => {
        const option = document.createElement('option');
        option.value = setName;
        option.textContent = setName;
        if (setName === currentFilterValue) {
            option.selected = true;
        }
        setFilter.appendChild(option);
    });

    let filteredWords = [...words];
    
    const selectedSet = setFilter.value;
    if (selectedSet) {
        filteredWords = filteredWords.filter(w => w.setName === selectedSet);
    }

    const searchQuery = document.getElementById('wordSearch').value.toLowerCase();
    if (searchQuery) {
        filteredWords = filteredWords.filter(w => 
            w.cs.toLowerCase().includes(searchQuery) || 
            w.ru.toLowerCase().includes(searchQuery) ||
            (w.tr && w.tr.toLowerCase().includes(searchQuery))
        );
    }

    filteredWords.sort((a, b) => {
        const totalA = a.correct + a.incorrect;
        const totalB = b.correct + b.incorrect;
        const successRateA = totalA > 0 ? a.correct / totalA : 0;
        const successRateB = totalB > 0 ? b.correct / totalB : 0;
        
        return sortAscending ? successRateA - successRateB : successRateB - successRateA;
    });

    document.getElementById('totalWords').textContent = words.length;
    document.getElementById('learnedWords').textContent = words.filter(w => w.correct > 0).length;

    const container = document.getElementById('wordListContainer');
    container.innerHTML = '<h3>Список слов</h3>';
    
    if (filteredWords.length === 0) {
        container.innerHTML += '<p style="color: #999; text-align: center; padding: 20px;">Слова не найдены</p>';
        return;
    }

    filteredWords.forEach((word) => {
        const wordIndex = words.indexOf(word);
        const total = word.correct + word.incorrect;
        const successRate = total > 0 ? Math.round((word.correct / total) * 100) : 0;
        
        const div = document.createElement('div');
        div.className = 'word-item';
        div.innerHTML = `
            <div class="word-item-text">
                <strong>${word.cs}</strong> — ${word.ru}
                ${word.setName ? `<br><small style="color: #999;">${word.setName}</small>` : ''}
            </div>
            <div class="word-item-stats">
                ✓${word.correct} ✗${word.incorrect} (${successRate}%)
            </div>
            <button class="delete-btn" onclick="deleteWord(${wordIndex})">Удалить</button>
        `;
        container.appendChild(div);
    });
}

function deleteWord(index) {
    if (!confirm('Удалить это слово?')) return;
    
    const words = loadWords();
    words.splice(index, 1);
    saveWords(words);
    updateStatsScreen();
}

function exportWords() {
    const words = loadWords();
    const exportData = words.map(w => ({ cs: w.cs, tr: w.tr || '', ru: w.ru }));
    const json = JSON.stringify(exportData, null, 2);
    
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'czech-words.json';
    a.click();
}

function resetStats() {
    if (!confirm('Сбросить всю статистику обучения?')) return;
    
    const words = loadWords();
    words.forEach(w => {
        w.correct = 0;
        w.incorrect = 0;
        w.lastReview = null;
    });
    
    saveWords(words);
    updateStatsScreen();
    alert('Статистика сброшена');
}

function toggleSort() {
    sortAscending = !sortAscending;
    document.getElementById('sortLabel').textContent = sortAscending ? 'Сначала изученные' : 'Сначала проблемные';
    document.getElementById('sortIcon').textContent = sortAscending ? '↑' : '↓';
    updateStatsScreen();
}
