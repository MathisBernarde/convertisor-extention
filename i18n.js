// Fichier : i18n.js

/**
 * Charge les traductions personnalisées si une langue est forcée.
 * Sinon, se prépare à utiliser l'API par défaut.
 */
async function loadTranslations() {
  try {
    const { language = 'system' } = await chrome.storage.sync.get('language');

    if (language === 'system') {
      window.i18nMessages = null; // Utiliser l'API par défaut
      return;
    }

    // Tenter de charger le fichier de langue personnalisé
    const response = await fetch(`/_locales/${language}/messages.json`);
    if (!response.ok) {
      throw new Error(`Could not load ${language} messages.`);
    }
    window.i18nMessages = await response.json();
    
    // Appliquer la direction de la langue au HTML (pour Arabe, Hébreu, etc. à l'avenir)
    // document.documentElement.dir = window.i18nMessages.@@ui_direction?.message || 'ltr';
    document.documentElement.lang = language;

  } catch (error) {
    console.error("Failed to load custom translations:", error);
    window.i18nMessages = null; // Revenir au défaut en cas d'erreur
  }
}

/**
 * Récupère un message traduit.
 * Utilise les messages chargés en mémoire si disponibles,
 * sinon, utilise l'API chrome.i18n par défaut.
 * @param {string} key - La clé de traduction (ex: "extName")
 * @returns {string} - Le message traduit
 */
function getMessage(key) {
  // Cas 1: Langue forcée (chargée dans window)
  if (window.i18nMessages) {
    if (window.i18nMessages[key]) {
      return window.i18nMessages[key].message;
    }
    // Clé non trouvée dans le fichier personnalisé, renvoyer la clé pour débogage
    console.warn(`Missing translation for key "${key}" in custom file.`);
    return `!!${key}!!`;
  }

  // Cas 2: Langue système (API par défaut)
  const message = chrome.i18n.getMessage(key);
  if (!message) {
    console.warn(`Missing translation for key "${key}" in default locale.`);
    return `!!${key}!!`;
  }
  return message;
}