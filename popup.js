// --- STRUCTURE DES DONNÉES ---
// Unité de base pour chaque catégorie
const BASE_UNITS = {
    length: 'm',
    mass: 'g',
    volume: 'l',
    cooking_volume: 'ml',
    speed: 'ms',
};

// Facteurs de conversion vers l'unité de base
const CONVERSION_FACTORS = {
    length: { cm: 0.01, m: 1, km: 1000 },
    mass: { g: 1, kg: 1000, t: 1000000 },
    volume: { ml: 0.001, cl: 0.01, dl: 0.1, l: 1 },
    cooking_volume: { ml: 1, tsp: 4.92892, tbsp: 14.7868 }, // US Standard
    speed: { ms: 1, kmh: 0.277778, mph: 0.44704 }
};

// Cas spécial pour la température (fonctions de conversion)
const TEMPERATURE_CONVERSIONS = {
    c: {
        toBase: (val) => val, // Base = Celsius
        fromBase: (val) => val
    },
    f: {
        toBase: (val) => (val - 32) * 5 / 9,
        fromBase: (val) => (val * 9 / 5) + 32
    },
    k: {
        toBase: (val) => val - 273.15,
        fromBase: (val) => val + 273.15
    }
};

// --- SÉLECTION DES ÉLÉMENTS DOM ---
const categorySelect = document.getElementById('category');
const inputValue = document.getElementById('inputValue');
const fromUnitSelect = document.getElementById('fromUnit');
const toUnitSelect = document.getElementById('toUnit');
const resultInput = document.getElementById('result');
const swapButton = document.getElementById('swap');

// --- FONCTIONS ---

/**
 * Traduit l'interface en utilisant les `data-i18n`
 */
function translateUI() {
    document.querySelectorAll('[data-i18n], [data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const titleKey = el.getAttribute('data-i18n-title');

        if (key) {
            const translation = chrome.i18n.getMessage(key);
            if (translation) {
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    el.placeholder = translation;
                } else {
                    el.textContent = translation;
                }
            }
        }
        
        if (titleKey) {
            const translation = chrome.i18n.getMessage(titleKey);
            if (translation) {
                el.title = translation;
            }
        }
    });
}

/**
 * Charge les préférences (thème) et applique
 */
async function loadPreferences() {
    const { theme = 'system' } = await chrome.storage.sync.get('theme');
    
    if (theme === 'system') {
        document.documentElement.removeAttribute('data-theme');
    } else {
        document.documentElement.setAttribute('data-theme', theme);
    }
}

/**
 * Remplit le sélecteur de catégories
 */
function populateCategories() {
    const categories = Object.keys(BASE_UNITS).concat('temperature');
    categorySelect.innerHTML = ''; // Vider
    
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        // Traduire le nom de la catégorie
        option.textContent = chrome.i18n.getMessage(`category_${category}`);
        categorySelect.appendChild(option);
    });
}

/**
 * Met à jour les sélecteurs d'unités en fonction de la catégorie
 */
function populateUnits() {
    const category = categorySelect.value;
    let units;

    if (category === 'temperature') {
        units = Object.keys(TEMPERATURE_CONVERSIONS);
    } else {
        units = Object.keys(CONVERSION_FACTORS[category]);
    }

    fromUnitSelect.innerHTML = '';
    toUnitSelect.innerHTML = '';

    units.forEach(unit => {
        // Traduire le nom de l'unité
        const unitName = chrome.i18n.getMessage(`unit_${unit}`);
        
        const fromOption = document.createElement('option');
        fromOption.value = unit;
        fromOption.textContent = unitName;
        fromUnitSelect.appendChild(fromOption);

        const toOption = document.createElement('option');
        toOption.value = unit;
        toOption.textContent = unitName;
        toUnitSelect.appendChild(toOption);
    });

    // Définir des valeurs par défaut (ex: 2ème élément)
    if (units.length > 1) {
        toUnitSelect.value = units[1];
    }
    
    convert(); // Recalculer
}

/**
 * Effectue la conversion
 */
function convert() {
    const value = parseFloat(inputValue.value);
    if (isNaN(value)) {
        resultInput.value = '';
        return;
    }

    const category = categorySelect.value;
    const fromUnit = fromUnitSelect.value;
    const toUnit = toUnitSelect.value;

    let result;

    if (category === 'temperature') {
        const toBase = TEMPERATURE_CONVERSIONS[fromUnit].toBase;
        const fromBase = TEMPERATURE_CONVERSIONS[toUnit].fromBase;
        result = fromBase(toBase(value));
    } else {
        const baseUnit = BASE_UNITS[category];
        const fromFactor = CONVERSION_FACTORS[category][fromUnit];
        const toFactor = CONVERSION_FACTORS[category][toUnit];
        
        // 1. Convertir la valeur d'entrée en unité de base
        const valueInBase = value * fromFactor;
        
        // 2. Convertir de l'unité de base à l'unité de sortie
        result = valueInBase / toFactor;
    }

    // Arrondir à 2 décimales si ce n'est pas un entier
    resultInput.value = parseFloat(result.toFixed(2));
}

/**
 * Inverse les unités et la valeur
 */
function swapUnits() {
    const from = fromUnitSelect.value;
    const to = toUnitSelect.value;
    const inputVal = inputValue.value;
    const resultVal = resultInput.value;

    fromUnitSelect.value = to;
    toUnitSelect.value = from;
    
    if (resultVal) {
        inputValue.value = resultVal;
        convert(); // Recalculer dans le nouveau sens
    }
}


// --- INITIALISATION ET ÉCOUTEURS D'ÉVÉNEMENTS ---
document.addEventListener('DOMContentLoaded', async () => {
    await loadPreferences();
    translateUI();
    populateCategories();
    populateUnits(); // Popule pour la première catégorie

    document.getElementById('openOptions').addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
    });
});

// Écouteurs pour la conversion instantanée
categorySelect.addEventListener('change', populateUnits);
inputValue.addEventListener('input', convert);
fromUnitSelect.addEventListener('change', convert);
toUnitSelect.addEventListener('change', convert);
swapButton.addEventListener('click', swapUnits);
document.getElementById('openOptions').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
});