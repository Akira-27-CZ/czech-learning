// storage.js - Управление локальным хранилищем

function getFromStorage(key) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : null;
    } catch (e) {
        console.error('Ошибка чтения из localStorage:', e);
        return null;
    }
}

function saveToStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.error('Ошибка сохранения:', e);
    }
}

function loadWords() {
    return getFromStorage('words') || [];
}

function saveWords(words) {
    saveToStorage('words', words);
}

function loadLoadedSets() {
    return getFromStorage('loadedSets') || [];
}

function saveLoadedSets(loadedSets) {
    saveToStorage('loadedSets', loadedSets);
}
