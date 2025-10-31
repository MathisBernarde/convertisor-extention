// --- STRUCTURE DES DONNÉES ---
const BASE_UNITS = {
    length: 'm',
    mass: 'g',
    volume: 'l',
    cooking_volume: 'ml',
    speed: 'ms',
};

const CONVERSION_FACTORS = {
    length: { cm: 0.01, m: 1, km: 1000 },
    mass: { g: 1, kg: 1000, t: 1000000 },
    volume: { ml: 0.001, cl: 0.01, dl: 0.1, l: 1 },
    cooking_volume: { ml: 1, tsp: 4.92892, tbsp: 14.7868 }, // US Standard
    speed: { ms: 1, kmh: 0.277778, mph: 0.44704 }
};

const TEMPERATURE_CONVERSIONS = {
    c: { toBase: (val) => val, fromBase: (val) => val },
    f: { toBase: (val) => (val - 32) * 5 / 9, fromBase: (val) => (val * 9 / 5) + 32 },
    k: { toBase: (val) => val - 273.15, fromBase: (val) => val + 273.15 }
};

// --- SÉLECTION DES ÉLÉMENTS DOM ---
const categorySelect = document.getElementById('category');
const inputValue = document.getElementById('inputValue');
const fromUnitSelect = document.getElementById('fromUnit');
const toUnitSelect = document.getElementById('toUnit');
const resultInput = document.getElementById('result');
const swapButton = document.getElementById('swap');

// --- FONCTIONS ---

function translateUI() {
    document.querySelectorAll('[data-i18n], [data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const titleKey = el.getAttribute('data-i18n-title');
        if (key) {
            const translation = getMessage(key);
            if (translation) {
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    el.placeholder = translation;
                } else {
                    el.textContent = translation;
                }
            }
        }
        if (titleKey) {
            const translation = getMessage(titleKey);
            if (translation) {
                el.title = translation;
            }
        }
    });
}

async function loadPreferences() {
    const { theme = 'system' } = await chrome.storage.sync.get('theme');
    if (theme === 'system') {
        document.documentElement.removeAttribute('data-theme');
    } else {
        document.documentElement.setAttribute('data-theme', theme);
    }
}

function populateCategories() {
    const categories = Object.keys(BASE_UNITS).concat('temperature');
    categorySelect.innerHTML = '';
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = getMessage(`category_${category}`);
        categorySelect.appendChild(option);
    });
}

function populateUnits() {
    const category = categorySelect.value;
    let units = (category === 'temperature')
        ? Object.keys(TEMPERATURE_CONVERSIONS)
        : Object.keys(CONVERSION_FACTORS[category]);

    fromUnitSelect.innerHTML = '';
    toUnitSelect.innerHTML = '';

    units.forEach(unit => {
        const unitName = getMessage(`unit_${unit}`);
        // Utiliser new Option() est plus propre que de créer des éléments
        fromUnitSelect.add(new Option(unitName, unit));
        toUnitSelect.add(new Option(unitName, unit));
    });

    if (units.length > 1) {
        toUnitSelect.value = units[1];
    }
    convert();
}

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
        const fromFactor = CONVERSION_FACTORS[category][fromUnit];
        const toFactor = CONVERSION_FACTORS[category][toUnit];
        const valueInBase = value * fromFactor;
        result = valueInBase / toFactor;
    }
    // .toFixed(3) pour un peu plus de précision (ex: cuillères)
    resultInput.value = parseFloat(result.toFixed(3));
}

function swapUnits() {
    const from = fromUnitSelect.value;
    fromUnitSelect.value = toUnitSelect.value;
    toUnitSelect.value = from;
    
    if (resultInput.value) {
        inputValue.value = resultInput.value;
        convert();
    }
}

// --- INITIALISATION ET ÉCOUTEURS D'ÉVÉNEMENTS ---
// Tout doit être DANS le DOMContentLoaded pour s'assurer que les éléments existent
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Charger le thème
    await loadPreferences();
    // 2. Charger les traductions
    await loadTranslations();
    // 3. Traduire l'UI
    translateUI();
    // 4. Remplir les données
    populateCategories();
    populateUnits();

    // 5. Brancher les écouteurs
    categorySelect.addEventListener('change', populateUnits);
    inputValue.addEventListener('input', convert);
    fromUnitSelect.addEventListener('change', convert);
    toUnitSelect.addEventListener('change', convert);
    swapButton.addEventListener('click', swapUnits);
    document.getElementById('openOptions').addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
    });
});