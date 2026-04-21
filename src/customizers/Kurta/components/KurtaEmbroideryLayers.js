// src/customizers/Kurta/components/KurtaEmbroideryLayers.js

// Kurta embroidery rendering logic for both folded and model views, with parent-child propagation.

const normalizeEmbKey = (value) => (value == null ? '' : String(value).trim().toLowerCase());

const parseEmbroideryValuePlacement = (value) => {
    const targetType = normalizeEmbKey(value?.targetType);
    const targetPart = normalizeEmbKey(value?.targetPart);
    if (targetType || targetPart) {
        return { garment: targetType, part: targetPart };
    }

    const refPath = normalizeEmbKey(value?.refPath);
    if (refPath) {
        const pieces = refPath.split('/');
        const garment = pieces.length >= 4 ? pieces[3] : '';
        const part = pieces.length >= 6 ? pieces[5] : '';
        return { garment, part };
    }

    const typeKey = normalizeEmbKey(value?.type);
    if (!typeKey) return { garment: '', part: '' };

    const typePieces = typeKey.split('_');
    if (typePieces.length >= 2) {
        return {
            garment: typePieces[typePieces.length - 2] || '',
            part: typePieces[typePieces.length - 1] || '',
        };
    }

    return { garment: '', part: '' };
};

const BASE_FAMILY_CODES = ['BASE', 'BASE_M', 'BASE_C', 'BASE_R'];
const FRONT_TO_BASE_CODES = new Set(['R', 'S', 'K', 'L', 'D', 'T', 'P', 'O', 'D0', 'P0', 'T0', 'Q0']);
const EMBROIDERABLE_LAYER_PARTS = new Set(['Chest', 'Collar', 'Sleeve', 'Pocket', 'Flap', 'Cuff', 'Epaulette']);

const stripEmbroideryCode = (code) => {
    const rawCode = String(code || '').trim();
    if (!rawCode) return { prefix: '', core: '', suffix: '' };

    const prefix = rawCode.startsWith('E-') ? 'E-' : '';
    const withoutPrefix = prefix ? rawCode.slice(2) : rawCode;
    const suffixMatch = withoutPrefix.match(/-(F|S)$/i);
    const suffix = suffixMatch ? suffixMatch[0] : '';
    const core = suffix ? withoutPrefix.slice(0, -suffix.length) : withoutPrefix;

    return { prefix, core, suffix };
};

const buildBaseFamilyVariantsFromCode = (code) => {
    const { prefix, core, suffix } = stripEmbroideryCode(code);
    if (!FRONT_TO_BASE_CODES.has(core)) return [];
    return BASE_FAMILY_CODES.map((baseCode) => `${prefix}${baseCode}${suffix}`);
};

const normalizeEmbroideryRenderCode = (code, viewSuffix) => {
    const { core } = stripEmbroideryCode(code);
    if (!core) return '';
    return `E-${core}-${viewSuffix}`;
};

const pushUniqueValue = (list, value) => {
    const normalized = String(value || '').trim();
    if (!normalized || list.includes(normalized)) return;
    list.push(normalized);
};

const normalizeLayerPart = (part) => {
    const rawPart = String(part || '').trim();
    if (rawPart === 'Chest') return 'base';
    if (rawPart === 'Collar') return 'collar';
    if (rawPart === 'Sleeve') return 'sleeve';
    if (rawPart === 'Pocket') return 'pocket';
    if (rawPart === 'Flap') return 'flap';
    if (rawPart === 'Cuff') return 'cuff';
    if (rawPart === 'Epaulette') return 'epaulette';
    return normalizeEmbKey(rawPart);
};

const getSourcePartsForLayer = (part) => {
    const normalizedPart = normalizeLayerPart(part);
    if (normalizedPart === 'base') return ['base'];
    if (normalizedPart === 'collar') return ['collar', 'lapel'];
    if (normalizedPart === 'sleeve') return ['sleeve', 'base'];
    if (normalizedPart === 'cuff') return ['cuff', 'sleeve', 'base'];
    if (normalizedPart === 'pocket') return ['pocket', 'base'];
    if (normalizedPart === 'flap') return ['flap', 'pocket', 'base'];
    if (normalizedPart === 'epaulette') return ['epaulette'];
    return normalizedPart ? [normalizedPart] : [];
};

const buildEmbroideryCodeCandidates = (layerCode, layerPart, viewSuffix) => {
    const candidates = [];
    const exactCode = normalizeEmbroideryRenderCode(layerCode, viewSuffix);
    pushUniqueValue(candidates, exactCode);

    const { core } = stripEmbroideryCode(layerCode);
    const normalizedPart = normalizeLayerPart(layerPart);
    if (normalizedPart === 'base' || FRONT_TO_BASE_CODES.has(core) || core.startsWith('BASE')) {
        BASE_FAMILY_CODES.forEach((baseCode) => {
            pushUniqueValue(candidates, normalizeEmbroideryRenderCode(baseCode, viewSuffix));
        });
    }

    if (normalizedPart === 'cuff' && viewSuffix === 'F') {
        pushUniqueValue(candidates, 'E-CUF-S');
    }

    return candidates;
};

const buildKurtaEmbroideryLayers = (selections, garmentLayers, viewSuffix) => {
    const matchingValues = Array.isArray(selections?.embroideryCollection?.matchingValues)
        ? selections.embroideryCollection.matchingValues
        : [];

    if (!selections?.embroideryID || matchingValues.length === 0 || !Array.isArray(garmentLayers) || garmentLayers.length === 0) {
        return [];
    }

    const layersToRender = [];
    garmentLayers.forEach((layer) => {
        if (!layer || layer.type !== 'fabric' || !EMBROIDERABLE_LAYER_PARTS.has(layer.part)) return;

        const codeCandidates = buildEmbroideryCodeCandidates(layer.code, layer.part, viewSuffix);
        if (codeCandidates.length === 0) return;

        layersToRender.push({
            code: codeCandidates[0],
            codeCandidates,
            sourceParts: getSourcePartsForLayer(layer.part),
            zIndex: Number(layer.zIndex || 0) + 1,
            type: 'embroidery',
            collectionID: selections.embroideryID,
            part: layer.part,
        });
    });

    return layersToRender;
};

/**
 * Returns embroidery layers for Kurta folded view, using parent-child propagation logic.
 * @param {object} selections - User selections (must include embroideryID, embroideryCollection)
 * @returns {Array} Array of embroidery layer objects for Kurta folded view
 */
export function getKurtaFoldedEmbroideryLayers(selections, garmentLayers = []) {
    return buildKurtaEmbroideryLayers(selections, garmentLayers, 'S');
}

/**
 * Returns embroidery layers for Kurta model view, using parent-child propagation logic.
 * @param {object} selections - User selections (must include embroideryID, embroideryCollection)
 * @returns {Array} Array of embroidery layer objects for Kurta model view
 */
export function getKurtaModelEmbroideryLayers(selections, garmentLayers = []) {
    return buildKurtaEmbroideryLayers(selections, garmentLayers, 'F');
}
