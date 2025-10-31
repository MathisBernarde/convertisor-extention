/**
 * Traduit l'interface des options en utilisant notre getMessage()
 */
function translateUI() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        // Utilise notre fonction personnalisée
        el.textContent = getMessage(key);
    });
}

/**
 * Applique le thème au document
 */
function applyTheme(theme) {
     if (theme === 'system') {
        document.documentElement.removeAttribute('data-theme');
    } else {
        document.documentElement.setAttribute('data-theme', theme);
    }
}

/**
 * Sauvegarde les options et rafraîchit l'interface
 */
async function saveOptions() {
    // 1. Récupérer les valeurs
    const theme = document.querySelector('input[name="theme"]:checked').value;
    const language = document.querySelector('input[name="language"]:checked').value;

    // 2. Sauvegarder
    await chrome.storage.sync.set({ theme, language });
    
    // 3. Appliquer les changements instantanément
    applyTheme(theme);
    
    // 4. Recharger les traductions et retraduire la page
    await loadTranslations();
    translateUI();
    
    // 5. Afficher un message de confirmation
    const status = document.getElementById('status');
    status.textContent = getMessage('optionsSaved'); // Ajoutons cette clé
    status.classList.add('visible');
    setTimeout(() => {
        status.classList.remove('visible');
    }, 1500);
}

/**
 * Restaure les options sauvegardées
 */
async function restoreOptions() {
    const { theme = 'system', language = 'system' } = await chrome.storage.sync.get(['theme', 'language']);
    
    // Restaurer les coches
    document.getElementById(`theme-${theme}`).checked = true;
    document.getElementById(`lang-${language}`).checked = true;

    // Appliquer le thème au chargement
    applyTheme(theme);
}

// Initialisation de la page
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Charger les traductions d'abord (essentiel)
    await loadTranslations();
    
    // 2. Traduire l'interface
    translateUI();
    
    // 3. Restaurer les états des boutons
    restoreOptions();

    // 4. Ajouter les écouteurs pour la sauvegarde
    document.querySelectorAll('input[name="theme"], input[name="language"]').forEach(radio => {
        radio.addEventListener('change', saveOptions);
    });
    
    // 5. Gérer le clic sur le label pour cocher la radio
    document.querySelectorAll('.radio-group label').forEach(label => {
        label.addEventListener('click', () => {
            document.getElementById(label.getAttribute('for')).click();
        });
    });
});