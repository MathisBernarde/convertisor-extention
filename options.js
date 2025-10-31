/**
 * Traduit l'interface des options
 */
function translateUI() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const translation = chrome.i18n.getMessage(key);
        if (translation) {
            el.textContent = translation;
        }
    });
}

/**
 * Sauvegarde les options dans chrome.storage.sync
 */
function saveOptions() {
    const theme = document.querySelector('input[name="theme"]:checked').value;
    chrome.storage.sync.set({ theme });
}

/**
 * Restaure les options depuis chrome.storage.sync
 */
async function restoreOptions() {
    const { theme = 'system' } = await chrome.storage.sync.get('theme');
    document.getElementById(`theme-${theme}`).checked = true;
}

document.addEventListener('DOMContentLoaded', () => {
    translateUI();
    restoreOptions();
});

document.querySelectorAll('input[name="theme"]').forEach(radio => {
    radio.addEventListener('change', saveOptions);
});