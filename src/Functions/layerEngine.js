const SHIRT_COLLARS = ['CR', 'CB', 'CT', 'CS', 'CE'];
const MANDARIN_COLLARS = ['CM', 'CC', 'CN'];
const CATEGORY_A_SADRI = ['SR', 'RR', 'SS', 'AA', 'BB', 'CC', 'DD', 'EE', 'FF', 'GG', 'HH', 'KK'];
const CATEGORY_B_BASE_TYPES = ['L', 'M', 'N'];
const JODHPURI_COAT_TYPES = ['JH', 'JR', 'JS'];

const isShirtCollar = (collar) => SHIRT_COLLARS.includes(collar);
const isMandarinCollar = (collar) => MANDARIN_COLLARS.includes(collar);
const getSadriCollarSuffix = (collar) => {
    if (collar === 'CN') return 'R';
    if (isMandarinCollar(collar)) return 'C';
    if (isShirtCollar(collar)) return 'S';
    return 'R';
};

const getKurtaBaseCode = (collar, lengthStr, bottomCut, hasOuterwear, forceMandarin) => {
    const longLength = lengthStr === 'K';
    const roundCut = bottomCut === 'R';
    const useMandarin = forceMandarin || isMandarinCollar(collar);
    const useShirt = !useMandarin && isShirtCollar(collar);

    if (useShirt) {
        if (longLength) {
            return `${roundCut ? 'D' : 'T'}${hasOuterwear ? '0' : ''}`;
        }
        return `${roundCut ? 'P' : 'Q'}${hasOuterwear ? '0' : ''}`;
    }

    if (longLength) {
        return roundCut ? 'R' : 'S';
    }
    return roundCut ? 'K' : 'L';
};

export const getSadriLayerCodes = (
  sadriCode,
  selections = {},
  selectedSadriButton,
  viewMode = 0,
  slideIndex = 0,
  embroideryRenders = {}
) => {
    if (!sadriCode) return [];

    const bSuffix = viewMode === 0 ? '-F' : '-S';
    const collar = selections.collar || 'CM';
    const isCategoryA = CATEGORY_A_SADRI.includes(sadriCode);
    const categoryPrefix = sadriCode?.charAt(0);

    let finalSadriCode = sadriCode;
    if (!isCategoryA) {
        if (CATEGORY_B_BASE_TYPES.includes(sadriCode)) {
            finalSadriCode = `${sadriCode}${getSadriCollarSuffix(collar)}`;
        } else if (CATEGORY_B_BASE_TYPES.includes(categoryPrefix)) {
            finalSadriCode = `${categoryPrefix}${getSadriCollarSuffix(collar)}`;
        }
    }

    const layersToRender = [];
    const addGarmentPart = (partName, fabricCode, baseZIndex, type = 'sadri_fabric') => {
        layersToRender.push({ code: fabricCode, zIndex: baseZIndex, type });

        if (selections.sadriEmbroideryID && ['SadriBase'].includes(partName)) {
            const coll = embroideryRenders[selections.sadriEmbroideryID];
            const embCodeCandidates = [`E${finalSadriCode}`, `E-${finalSadriCode}`];
            const embCode = embCodeCandidates.find((code) =>
                coll?.sadriChestLeft?.[code] || coll?.sadriChestRight?.[code]
            ) || `E${finalSadriCode}`;
            const leftAsset = coll?.sadriChestLeft?.[embCode] || coll?.sadriChestRight?.[embCode];
            const rightAsset = coll?.sadriChestRight?.[embCode] || coll?.sadriChestLeft?.[embCode];
            if (leftAsset) {
                layersToRender.push({
                    code: embCode,
                    zIndex: baseZIndex + 1,
                    type: 'sadri_embroidery_left',
                    collectionID: selections.sadriEmbroideryID,
                    part: partName
                });
            }
            if (rightAsset) {
                layersToRender.push({
                    code: embCode,
                    zIndex: baseZIndex + 2,
                    type: 'sadri_embroidery_right',
                    collectionID: selections.sadriEmbroideryID,
                    part: partName
                });
            }
        }
    };

    addGarmentPart('SadriBase', `${finalSadriCode}${bSuffix}`, 75, 'sadri_fabric');

    const hideSadriButtons = finalSadriCode === 'KK';
    if (!hideSadriButtons && selectedSadriButton?.material !== 'Ring') {
        layersToRender.push({ code: `B${finalSadriCode}`, zIndex: 80, type: 'sadri_button' });
    }

    return layersToRender;
};

export const getKurtaLayerCodes = (
    selections,
    selectedButton,
    selectedEmbCol,
    viewMode = 0,
    hasCoat = false,
    hasSadri = false,
    currentSadriCode = null
) => {
    if (!selections) return [];

    // ─────────────────────────────────────────────────────────────────────
    // PHASE 1: Build effectiveSelections with under-layer overrides.
    // Overrides ONLY apply when outerwear is visible in front view.
    // ─────────────────────────────────────────────────────────────────────
    const effectiveSelections = { ...selections };
    const outerwearVisible = (viewMode === 0 || viewMode === 4) && (hasCoat || hasSadri);

    if (outerwearVisible) {
        // ── RULE 1: UNIVERSAL (Coat & Sadri) ─────────────────────────────
        // Epaulette: Half-hide when any outerwear is worn.
        if (effectiveSelections.epaulette === 'SE') {
            effectiveSelections.epaulette = 'SE0';
        }

        // Coat main-composite view: force inner kurta sleeve to SS.
        if (hasCoat && viewMode === 0) {
            effectiveSelections.sleeve = 'SS';
        }

        // Jodhpuri coat: image-1 inner kurta should use Chinese/Mandarin collar.
        if (hasCoat && viewMode === 0 && JODHPURI_COAT_TYPES.includes(effectiveSelections.coatType)) {
            effectiveSelections.collar = 'CM';
        }

        // ── RULE 2: SADRI (JACKET) SPECIFIC ─────────────────────────────
        if (hasSadri && !hasCoat) {
            const isCatA = CATEGORY_A_SADRI.includes(currentSadriCode);

            if (isCatA) {
                // Category A – Closed Neck Sadri
                // Force Mandarin collar to prevent shirt collar clipping.
                effectiveSelections.collar = 'CM';
                // Pockets hidden behind the closed jacket.
                effectiveSelections.pocketQty = '00';
                // Placket: standard 4-button for Mandarin (NS4 / QS4).
                const ps = effectiveSelections.placketStyle || 'NS';
                effectiveSelections.placketStyle = `${ps.charAt(0)}S4`;
            } else {
                // Category B – Open Neck Sadri (Deep V / Lapel)
                // User's selected collar remains visible – do NOT override.
                const activeCollar = effectiveSelections.collar || 'CM';

                // Base Transformation: shirt collars get "0" suffix bases.
                // (Applied later in getKurtaBaseCode via `isCatBShirt` flag.)
                // We signal this by leaving the collar as-is; the base helper
                // already appends '0' when hasOuterwear=true & !forceMandarin.

                // Placket: shirt collar → "3" suffix; mandarin → "4" suffix.
                if (isShirtCollar(activeCollar)) {
                    const ps = effectiveSelections.placketStyle || 'NS';
                    effectiveSelections.placketStyle = `${ps.charAt(0)}T3`;
                } else {
                    const ps = effectiveSelections.placketStyle || 'NS';
                    effectiveSelections.placketStyle = `${ps.charAt(0)}S4`;
                }
                // Pockets remain visible for open-neck sadri - no override.
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // PHASE 2: Resolve all effective values from the (possibly overridden)
    //          effectiveSelections object.
    // ─────────────────────────────────────────────────────────────────────
    const collar       = effectiveSelections.collar       || 'CM';
    const bottomCut    = effectiveSelections.bottomCut    || 'R';
    const lengthStr    = effectiveSelections.length       || 'K';
    const placketStyle = effectiveSelections.placketStyle || 'NS';
    const pocketQty    = effectiveSelections.pocketQty    || '00';
    const pocketShape  = effectiveSelections.pocketShape  || 'R';
    const flapYes      = effectiveSelections.flapYes      || '0';
    const flapShape    = effectiveSelections.flapShape    || 'R';
    const epaulette    = effectiveSelections.epaulette    || '0';
    const sleeve       = effectiveSelections.sleeve       || 'SN';
    const cuffStyle    = effectiveSelections.cuffStyle    || 'US1';
    const pajamaType   = effectiveSelections.pajamaType   || 'PJ';

    // Determine whether the collar is now effectively mandarin (Cat A forces it).
    const isCatASadri     = outerwearVisible && hasSadri && !hasCoat && CATEGORY_A_SADRI.includes(currentSadriCode);
    const forceMandarin   = isCatASadri; // Cat A always resolves to mandarin base.

    // For the base code: outerwear '0' suffix applies for Category B shirt-collar
    // sadris and for any coat scenario.  Cat A uses mandarin bases (no '0' suffix).
    const needsOuterwearBase = outerwearVisible && !forceMandarin && (hasCoat || hasSadri);
    const baseCode = getKurtaBaseCode(collar, lengthStr, bottomCut, needsOuterwearBase, forceMandarin);

    const bSuffix = '-F';
    const isRing  = selectedButton?.material === 'Ring';

    const layersToRender = [];

    // ─────────────────────────────────────────────────────────────────────
    // PHASE 3: Build layer list in strict Z-Index push order.
    //   Base(10) → Placket(20) → Pockets/Flaps(30-36) → Epaulette(45)
    //   → Sleeves(55) → [Sadri at 60 rendered outside] → Collar(65)
    //   → Button Holes(70-74) → Buttons(75-79)
    // ─────────────────────────────────────────────────────────────────────

    /** Pushes the fabric layer + optional embroidery sandwich. */
    const addGarmentPart = (partName, fabricCode, baseZIndex, type = 'fabric') => {
        layersToRender.push({ code: fabricCode, zIndex: baseZIndex, type });

        if (selections.embroideryID && ['Chest', 'Collar', 'Sleeve', 'Pocket'].includes(partName)) {
            layersToRender.push({
                code: `E-${fabricCode}-F`,
                zIndex: baseZIndex + 1,
                type: 'embroidery',
                collectionID: selections.embroideryID,
                part: partName,
            });
        }
    };

    // ── Pajama (Z: 5) ────────────────────────────────────────────────────
    addGarmentPart('Pajama', `${pajamaType}-${baseCode}`, 5, 'pajama');

    // ── Base / Chest (Z: 10) ─────────────────────────────────────────────
    addGarmentPart('Chest', baseCode, 10);

    // ── Placket (Z: 20) ──────────────────────────────────────────────────
    // For sadri we may receive an already-resolved placket override (NS4 / NT3 etc).
    // For coat (and normal flow), compute from selected placket base + collar family.
    let placketCode;
    const hasResolvedPlacketSuffix = /[34]$/.test(placketStyle);
    if (outerwearVisible && hasResolvedPlacketSuffix) {
        placketCode = placketStyle;
    } else {
        placketCode = `${placketStyle}${isShirtCollar(collar) ? '3' : '4'}`;
    }
    addGarmentPart('Placket', placketCode, 20);

    // Placket centre buttons/holes (Z: 24-25)
    if (placketCode === 'NS4' || placketCode === 'QS4') {
        if (!isRing) layersToRender.push({ code: 'BHC', zIndex: 24, type: 'fabric' });
        layersToRender.push({ code: `BKC${bSuffix}`, zIndex: 25, type: 'button' });
    } else if (placketCode === 'NS3' || placketCode === 'QS3') {
        if (!isRing) layersToRender.push({ code: 'BHN', zIndex: 24, type: 'fabric' });
        layersToRender.push({ code: `BKN${bSuffix}`, zIndex: 25, type: 'button' });
    } else if (placketCode === 'NT3' || placketCode === 'QT3') {
        if (!isRing) layersToRender.push({ code: 'BHT', zIndex: 24, type: 'fabric' });
        layersToRender.push({ code: `BKT${bSuffix}`, zIndex: 25, type: 'button' });
    }

    // ── Pockets & Flaps (Z: 30-41) ───────────────────────────────────────
    if (pocketQty !== '00') {
        addGarmentPart('Pocket', `R${pocketShape}`, 30);
        if (flapYes === '1') {
            addGarmentPart('Flap', `FR${flapShape}`, 32);
            if (!isRing) layersToRender.push({ code: 'BHR', zIndex: 36, type: 'fabric' });
            layersToRender.push({ code: `BPR${bSuffix}`, zIndex: 37, type: 'button' });
        }
        if (pocketQty === '11') {
            addGarmentPart('Pocket', `L${pocketShape}`, 34);
            if (flapYes === '1') {
                addGarmentPart('Flap', `FL${flapShape}`, 36);
                if (!isRing) layersToRender.push({ code: 'BHL', zIndex: 40, type: 'fabric' });
                layersToRender.push({ code: `BPL${bSuffix}`, zIndex: 41, type: 'button' });
            }
        }
    }

    // ── Epaulette (Z: 45) ────────────────────────────────────────────────
    // epaulette value is already 'SE0' if the universal override fired.
    if (epaulette === 'SE' || epaulette === 'SE0') {
        // SE0 should stay above sadri layers.
        const epauletteZ = epaulette === 'SE0' ? 90 : 45;
        addGarmentPart('Epaulette', epaulette, epauletteZ);
        // For SE0, epaulette button should be hidden.
        if (epaulette === 'SE') {
            if (!isRing) layersToRender.push({ code: 'HE', zIndex: 49, type: 'fabric' });
            layersToRender.push({ code: `BE${bSuffix}`, zIndex: 50, type: 'button' });
        }
    }

    // ── Sleeves (Z: 55) ──────────────────────────────────────────────────
    // Coat keeps sleeve selection; only specific sadri rules can alter it.
    addGarmentPart('Sleeve', sleeve, 55);

    if (sleeve === 'SC') {
        addGarmentPart('Cuff', cuffStyle, 57);
        if (cuffStyle.endsWith('1')) {
            if (!isRing) layersToRender.push({ code: 'BH2', zIndex: 61, type: 'fabric' });
            layersToRender.push({ code: `BC2${bSuffix}`, zIndex: 62, type: 'button' });
        } else if (cuffStyle.endsWith('2')) {
            if (!isRing) layersToRender.push({ code: 'BH4', zIndex: 61, type: 'fabric' });
            layersToRender.push({ code: `BC4${bSuffix}`, zIndex: 62, type: 'button' });
        }
    }

    // [Sadri renders at Z:60 OUTSIDE this function]

    // ── Kurta Collar (Z: 65) ─────────────────────────────────────────────
    // When the base is D0/T0/P0/Q0 (shirt collar under outerwear) the collar
    // shape is already baked into that base asset — skip the separate collar
    // layer to avoid a double-render.
    const collarBakedIntoBase = needsOuterwearBase && isShirtCollar(collar);

    if (!collarBakedIntoBase) {
        addGarmentPart('Collar', collar, 65);

        if (collar === 'CB') {
            if (!isRing) layersToRender.push({ code: 'CBH', zIndex: 70, type: 'fabric' });
            layersToRender.push({ code: `CBB${bSuffix}`, zIndex: 71, type: 'button' });
        }
    }

    return layersToRender;
};
