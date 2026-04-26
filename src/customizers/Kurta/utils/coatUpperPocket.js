const normalizeEmbValue = (value) => (value == null ? '' : String(value).trim().toLowerCase());

const parseEmbroideryValuePlacement = (value) => {
    const targetType = normalizeEmbValue(value?.targetType);
    const targetPart = normalizeEmbValue(value?.targetPart);
    if (targetType || targetPart) {
        return { garment: targetType, part: targetPart };
    }

    const refPath = normalizeEmbValue(value?.refPath);
    if (refPath) {
        const pieces = refPath.split('/');
        const garment = pieces.length >= 4 ? pieces[3] : '';
        const part = pieces.length >= 6 ? pieces[5] : '';
        return { garment, part };
    }

    const typeKey = normalizeEmbValue(value?.type);
    if (!typeKey) return { garment: '', part: '' };
    const pieces = typeKey.split('_');
    if (pieces.length >= 2) {
        return {
            garment: pieces[pieces.length - 2] || '',
            part: pieces[pieces.length - 1] || '',
        };
    }

    return { garment: '', part: '' };
};

const makeCoatEmbroiderySelectionKey = (value) => {
    const placement = parseEmbroideryValuePlacement(value);
    const typeKey = placement.garment && placement.part
        ? `${placement.garment}_${placement.part}`
        : normalizeEmbValue(value?.type);
    const docId = normalizeEmbValue(value?.id);
    return typeKey && docId ? `${typeKey}::${docId}` : '';
};

export const getCoatUploadBundleForValue = (bundle, value) => {
    if (!bundle || !value) return null;
    const selectionKey = makeCoatEmbroiderySelectionKey(value);
    if (!selectionKey) return null;
    return bundle.uploadsBySelectionKey?.[selectionKey] || null;
};

const isCoatBaseEmbroideryValue = (value) => {
    const placement = parseEmbroideryValuePlacement(value);
    if (placement.garment !== 'coat') return false;

    const targetPartRaw = normalizeEmbValue(value?.targetPart);
    const parsedPartRaw = normalizeEmbValue(placement.part);
    return targetPartRaw.includes('base') || parsedPartRaw.includes('base') || targetPartRaw.includes('chest') || parsedPartRaw.includes('chest');
};

export const isCoatRightBaseEmbroideryValue = (bundle, value) => {
    if (!isCoatBaseEmbroideryValue(value)) return false;
    const uploadBundle = getCoatUploadBundleForValue(bundle, value);
    const uploadName = normalizeEmbValue(uploadBundle?.name);
    return uploadName.includes('right');
};

export const hasCoatRightBaseEmbroidery = (bundle, collection) => {
    const values = Array.isArray(collection?.matchingValues) ? collection.matchingValues : [];
    if (!bundle || values.length === 0) return false;
    return values.some((value) => isCoatRightBaseEmbroideryValue(bundle, value));
};
