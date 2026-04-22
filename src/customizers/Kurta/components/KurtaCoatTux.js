const SHIRT_COLLARS = new Set(['CR', 'CB', 'CT', 'CS', 'CE']);
const TUXEDO_BASE_COAT_TYPES = {
    T1: '1B',
    T2: '2B',
};

const normalizeCode = (value) => String(value || '').trim().toUpperCase();

const getCoatCollarGroup = (kurtaCollar = 'CM') => {
    const normalizedCollar = normalizeCode(kurtaCollar);
    if (normalizedCollar === 'CN') return 'R';
    if (normalizedCollar === 'CM' || normalizedCollar === 'CC') return 'C';
    if (SHIRT_COLLARS.has(normalizedCollar)) return 'S';
    return 'C';
};

const getTuxedoCollarFamily = (selections = {}) => (
    getTuxedoBaseCoatType(selections?.coatType) === '2B' ? 'C2' : 'C1'
);

const getTuxedoLapelFamily = (selections = {}) => (
    getTuxedoBaseCoatType(selections?.coatType) === '2B' ? 'L2' : 'L1'
);

const getTuxedoButtonFamily = (selections = {}) => (
    getTuxedoBaseCoatType(selections?.coatType) === '2B' ? 'BP2' : 'BP1'
);

const getDisplayCollarCode = (selections = {}) => {
    const collarFamily = getTuxedoCollarFamily(selections);
    const collarGroup = getCoatCollarGroup(selections?.collar);
    return `${collarFamily}-${collarGroup}-F`;
};

const getStyleCollarCode = (selections = {}) => `${getTuxedoCollarFamily(selections)}-S`;

const getLapelCode = (selections = {}, viewSuffix = 'F') => {
    const lapelFamily = getTuxedoLapelFamily(selections);
    const lapelCode = normalizeCode(selections?.coatLapel || 'N') || 'N';
    return `${lapelFamily}-${lapelCode}-${viewSuffix}`;
};

export const KURTA_COAT_TUX_KEY = 'kurtacoattux';

export const isTuxedoCoatType = (coatType = '') => Object.prototype.hasOwnProperty.call(
    TUXEDO_BASE_COAT_TYPES,
    normalizeCode(coatType),
);

export const getTuxedoBaseCoatType = (coatType = '') => TUXEDO_BASE_COAT_TYPES[normalizeCode(coatType)] || '';

export const mapTuxedoSelectionsToBaseCoat = (selections = {}) => {
    const baseCoatType = getTuxedoBaseCoatType(selections?.coatType);
    if (!baseCoatType) return selections;
    return {
        ...selections,
        coatType: baseCoatType,
    };
};

export const getKurtaCoatTuxDisplayLayers = (selections = {}) => {
    if (!isTuxedoCoatType(selections?.coatType)) return [];
    const coatType = getTuxedoBaseCoatType(selections?.coatType);
    return [
        {
            code: getDisplayCollarCode(selections),
            zIndex: 86,
            type: 'coat_tuxedo',
            part: 'Collar',
            coatType,
        },
        {
            code: getLapelCode(selections, 'F'),
            zIndex: 88,
            type: 'coat_tuxedo',
            part: 'Lapel',
            coatType,
        },
    ];
};

export const getKurtaCoatTuxStyleFrontLayers = (selections = {}) => {
    if (!isTuxedoCoatType(selections?.coatType)) return [];
    const coatType = getTuxedoBaseCoatType(selections?.coatType);
    return [
        {
            code: getStyleCollarCode(selections),
            zIndex: 21,
            type: 'coat_tuxedo',
            part: 'Collar',
            coatType,
        },
        {
            code: getLapelCode(selections, 'S'),
            zIndex: 23,
            type: 'coat_tuxedo',
            part: 'Lapel',
            coatType,
        },
    ];
};

export const getKurtaCoatTuxBackLayers = (selections = {}) => {
    if (!isTuxedoCoatType(selections?.coatType)) return [];
    const coatType = getTuxedoBaseCoatType(selections?.coatType);
    return [{
        code: 'BC',
        zIndex: 21,
        type: 'coat_tuxedo',
        part: 'Collar',
        coatType,
    }];
};

export const getKurtaCoatTuxButtonLayers = (selections = {}, slideIndex = 0) => {
    if (!isTuxedoCoatType(selections?.coatType)) return [];

    const buttonFamily = getTuxedoButtonFamily(selections);
    if (slideIndex === 0) {
        return [{
            code: `${buttonFamily}-F`,
            codeCandidates: [`${buttonFamily}-F`, buttonFamily],
            zIndex: 92,
            type: 'coat_tuxedo_button',
        }];
    }

    if (slideIndex === 4) {
        return [{
            code: `${buttonFamily}-S`,
            codeCandidates: [`${buttonFamily}-S`, `${buttonFamily}-S-S`, buttonFamily],
            zIndex: 40,
            type: 'coat_tuxedo_button',
        }];
    }

    if (slideIndex === 5) {
        return [{
            code: `${buttonFamily}-B`,
            codeCandidates: [`${buttonFamily}-B`, 'BP1-B', buttonFamily],
            zIndex: 41,
            type: 'coat_tuxedo_button',
        }];
    }

    return [];
};