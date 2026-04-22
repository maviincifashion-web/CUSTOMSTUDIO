// src/customizers/Kurta/components/CoatEmbroideryLayers.js

// Coat embroidery scaffold for the Kurta customizer.
// Keep this file separate so coat render rules can evolve without touching
// Kurta/Sadri embroidery logic.

const normalizeEmbKey = (value) => (value == null ? '' : String(value).trim().toLowerCase());
const COAT_EMBROIDERY_BASE_CODES = new Set(['1B', '2B', 'JH', 'JR', 'JS', 'JO']);
const COAT_COLLAR_BASE_CODES = new Set(['C1', 'C2']);
const COAT_JODHPURI_COLLAR_BASE_CODES = new Set(['JDC', 'JDO']);
const COAT_BACK_COLLAR_BASE_CODES = new Set(['CDC', 'JDC']);
const COAT_LAPEL_BASE_CODES = new Set(['L1-N', 'L1-P', 'L2-N', 'L2-P']);
const COAT_FIXED_PART_BASE_CODES = {
    Sleeve: 'SL',
};
const COAT_COLLAR_TYPE_BASE_CODES = {
    '1B': 'C1',
    '2B': 'C2',
    JH: 'JDC',
    JR: 'JDC',
    JS: 'JDC',
    JO: 'JDO',
};
const COAT_BACK_COLLAR_TYPE_BASE_CODES = {
    '1B': 'CDC',
    '2B': 'CDC',
    JH: 'JDC',
    JR: 'JDC',
    JS: 'JDC',
    JO: 'JDC',
};

export const parseEmbroideryValuePlacement = (value) => {
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

const COAT_EMBROIDERABLE_LAYER_PARTS = new Set(['Chest', 'Lapel', 'Collar', 'Sleeve', 'Pocket']);
const isCoatGarmentLayer = (layer) => layer?.type === 'coat_display' || layer?.type === 'coat_tuxedo';

const stripEmbroideryCode = (code) => {
    const rawCode = String(code || '').trim();
    if (!rawCode) return { prefix: '', core: '', suffix: '' };

    const prefix = rawCode.startsWith('E-') ? 'E-' : '';
    const withoutPrefix = prefix ? rawCode.slice(2) : rawCode;
    const suffixMatch = withoutPrefix.match(/-(F|S|B)$/i);
    const suffix = suffixMatch ? suffixMatch[0] : '';
    const core = suffix ? withoutPrefix.slice(0, -suffix.length) : withoutPrefix;

    return { prefix, core, suffix };
};

const normalizeCoatCollarCode = (layer, viewSuffix) => {
    const { core } = stripEmbroideryCode(layer?.code);
    const normalizedCore = String(core || '').trim().toUpperCase();
    const coatType = String(layer?.coatType || '').trim().toUpperCase();
    if (!normalizedCore) {
        return viewSuffix === 'B'
            ? (COAT_BACK_COLLAR_TYPE_BASE_CODES[coatType] || '')
            : (COAT_COLLAR_TYPE_BASE_CODES[coatType] || '');
    }

    if (viewSuffix === 'B') {
        if (normalizedCore === 'BC') {
            return COAT_BACK_COLLAR_TYPE_BASE_CODES[coatType] || '';
        }

        if (COAT_BACK_COLLAR_BASE_CODES.has(normalizedCore)) {
            return normalizedCore;
        }

        if (COAT_COLLAR_BASE_CODES.has(normalizedCore) || COAT_JODHPURI_COLLAR_BASE_CODES.has(normalizedCore)) {
            return COAT_BACK_COLLAR_TYPE_BASE_CODES[coatType] || '';
        }
    }

    if (viewSuffix === 'F') {
        const familyMatch = normalizedCore.match(/^(C1|C2)(?:-[A-Z]+)?$/i);
        return familyMatch ? familyMatch[1].toUpperCase() : '';
    }

    if (viewSuffix === 'S' && COAT_COLLAR_BASE_CODES.has(normalizedCore)) {
        return normalizedCore;
    }

    if ((viewSuffix === 'F' || viewSuffix === 'S') && COAT_JODHPURI_COLLAR_BASE_CODES.has(normalizedCore)) {
        return normalizedCore;
    }

    return COAT_COLLAR_TYPE_BASE_CODES[coatType] || '';
};

const getSyntheticCollarSourceParts = (layer) => {
    const coatType = String(layer?.coatType || '').trim().toUpperCase();
    if (COAT_JODHPURI_COLLAR_BASE_CODES.has(COAT_COLLAR_TYPE_BASE_CODES[coatType] || '')) {
        return ['collar'];
    }

    return getSourcePartsForLayer('Collar');
};

const normalizeCoatLapelCode = (code) => {
    const { core } = stripEmbroideryCode(code);
    const normalizedCore = String(core || '').trim().toUpperCase();
    if (!normalizedCore) return '';
    return COAT_LAPEL_BASE_CODES.has(normalizedCore) ? normalizedCore : '';
};

const getCoatEmbroideryBaseCode = (layer, viewSuffix) => {
    const part = String(layer?.part || '').trim();
    if (COAT_FIXED_PART_BASE_CODES[part]) {
        return COAT_FIXED_PART_BASE_CODES[part];
    }

    if (part === 'Collar') {
        return normalizeCoatCollarCode(layer, viewSuffix);
    }

    if (part === 'Lapel') {
        return normalizeCoatLapelCode(layer?.code);
    }

    const explicitBaseCode = String(layer?.embroideryBaseCode || '').trim().toUpperCase();
    if (COAT_EMBROIDERY_BASE_CODES.has(explicitBaseCode)) {
        return explicitBaseCode;
    }

    const coatType = String(layer?.coatType || '').trim().toUpperCase();
    if (viewSuffix === 'B' && COAT_EMBROIDERY_BASE_CODES.has(coatType)) {
        return coatType;
    }

    const { core } = stripEmbroideryCode(layer?.code);
    const normalizedCore = String(core || '').trim().toUpperCase();
    if (!normalizedCore) return '';
    if (COAT_EMBROIDERY_BASE_CODES.has(normalizedCore)) {
        return normalizedCore;
    }

    const familyMatch = normalizedCore.match(/^(1B|2B|JH|JR|JS|JO)(?:-|$)/i);
    if (familyMatch) {
        return familyMatch[1].toUpperCase();
    }

    if (viewSuffix === 'B' && /^(NV|SV|DV)$/i.test(normalizedCore) && COAT_EMBROIDERY_BASE_CODES.has(coatType)) {
        return coatType;
    }

    return '';
};

const normalizeEmbroideryRenderCode = (layer, viewSuffix) => {
    const baseCode = getCoatEmbroideryBaseCode(layer, viewSuffix);
    if (!baseCode) return '';
    return `E-${baseCode}-${viewSuffix}`;
};

const normalizeLayerPart = (part) => {
    const rawPart = String(part || '').trim();
    if (rawPart === 'Chest') return 'base';
    if (rawPart === 'Lapel') return 'lapel';
    if (rawPart === 'Collar') return 'collar';
    if (rawPart === 'Sleeve') return 'sleeve';
    if (rawPart === 'Pocket') return 'pocket';
    return normalizeEmbKey(rawPart);
};

const getSourcePartsForLayer = (part) => {
    const normalizedPart = normalizeLayerPart(part);
    if (normalizedPart === 'base') return ['base'];
    if (normalizedPart === 'lapel') return ['lapel', 'collar'];
    if (normalizedPart === 'collar') return ['collar', 'lapel'];
    if (normalizedPart === 'sleeve') return ['sleeve'];
    if (normalizedPart === 'pocket') return ['pocket'];
    return normalizedPart ? [normalizedPart] : [];
};

const collectionHasPlacementPart = (matchingValues, garment, part) => {
    const normalizedGarment = normalizeEmbKey(garment);
    const normalizedPart = normalizeEmbKey(part);

    return matchingValues.some((value) => {
        const placement = parseEmbroideryValuePlacement(value);
        return normalizeEmbKey(placement.garment) === normalizedGarment
            && normalizeEmbKey(placement.part) === normalizedPart;
    });
};

const getCoatEmbroideryAnchorLayer = (garmentLayers, part) => {
    const normalizedPart = String(part || '').trim();
    if (normalizedPart === 'Sleeve') {
        return garmentLayers.find((layer) => isCoatGarmentLayer(layer) && layer.part === 'Chest')
            || garmentLayers.find((layer) => isCoatGarmentLayer(layer));
    }

    return garmentLayers.find((layer) => isCoatGarmentLayer(layer) && layer.part === normalizedPart)
        || garmentLayers.find((layer) => isCoatGarmentLayer(layer));
};

const buildSyntheticCoatEmbroideryLayer = (part, garmentLayers, viewSuffix, embroideryId) => {
    const anchorLayer = getCoatEmbroideryAnchorLayer(garmentLayers, part);
    if (!anchorLayer) return null;

    const sourceParts = part === 'Collar'
        ? getSyntheticCollarSourceParts(anchorLayer)
        : getSourcePartsForLayer(part);

    const syntheticLayer = {
        type: 'coat_display',
        part,
        zIndex: Number(anchorLayer.zIndex || 0),
        sourceParts,
        coatType: anchorLayer.coatType,
    };

    const code = normalizeEmbroideryRenderCode(syntheticLayer, viewSuffix);
    if (!code) return null;

    return {
        code,
        codeCandidates: [code],
        sourceParts: syntheticLayer.sourceParts,
        zIndex: getCoatEmbroideryZIndex(syntheticLayer),
        type: 'coat_embroidery',
        collectionID: embroideryId,
        part,
    };
};

const getCoatEmbroideryZIndex = (layer) => {
    const baseZIndex = Number(layer?.zIndex || 0);
    const part = String(layer?.part || '').trim();

    if (part === 'Chest' || part === 'Sleeve') {
        return baseZIndex + 0.25;
    }

    return baseZIndex + 1;
};

const buildCoatEmbroideryLayers = (embroideryId, collection, garmentLayers, viewSuffix) => {
    const matchingValues = Array.isArray(collection?.matchingValues)
        ? collection.matchingValues
        : [];

    if (!embroideryId || matchingValues.length === 0 || !Array.isArray(garmentLayers) || garmentLayers.length === 0) {
        return [];
    }

    const layersToRender = [];
    const renderedParts = new Set();
    garmentLayers.forEach((layer) => {
        if (!layer || !isCoatGarmentLayer(layer) || !COAT_EMBROIDERABLE_LAYER_PARTS.has(layer.part)) return;

        const code = normalizeEmbroideryRenderCode(layer, viewSuffix);
        if (!code) return;

        const sourceParts = Array.isArray(layer.sourceParts) && layer.sourceParts.length > 0
            ? layer.sourceParts
            : getSourcePartsForLayer(layer.part);

        layersToRender.push({
            code,
            codeCandidates: [code],
            sourceParts,
            zIndex: getCoatEmbroideryZIndex(layer),
            type: 'coat_embroidery',
            collectionID: embroideryId,
            part: layer.part,
        });
        renderedParts.add(String(layer.part || '').trim());
    });

    if (!renderedParts.has('Sleeve') && collectionHasPlacementPart(matchingValues, 'coat', 'sleeve')) {
        const sleeveLayer = buildSyntheticCoatEmbroideryLayer('Sleeve', garmentLayers, viewSuffix, embroideryId);
        if (sleeveLayer) {
            layersToRender.push(sleeveLayer);
        }
    }

    if (!renderedParts.has('Collar') && collectionHasPlacementPart(matchingValues, 'coat', 'collar')) {
        const collarLayer = buildSyntheticCoatEmbroideryLayer('Collar', garmentLayers, viewSuffix, embroideryId);
        if (collarLayer) {
            layersToRender.push(collarLayer);
        }
    }

    return layersToRender;
};

export function getCoatDisplayEmbroideryLayers(selections, garmentLayers = []) {
    return buildCoatEmbroideryLayers(
        selections?.coatEmbroideryID,
        selections?.coatEmbroideryCollection,
        garmentLayers,
        'F'
    );
}

export function getCoatStyleEmbroideryLayers(selections, garmentLayers = []) {
    return buildCoatEmbroideryLayers(
        selections?.coatEmbroideryID,
        selections?.coatEmbroideryCollection,
        garmentLayers,
        'S'
    );
}

export function getCoatBackEmbroideryLayers(selections, garmentLayers = []) {
    return buildCoatEmbroideryLayers(
        selections?.coatEmbroideryID,
        selections?.coatEmbroideryCollection,
        garmentLayers,
        'B'
    );
}