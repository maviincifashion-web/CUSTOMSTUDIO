import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { useResponsive } from '../../../../hooks/useResponsive';

// ENGINE & DATA IMPORTS
import { useFirebaseCatalog } from '../../../context/FirebaseCatalogContext';
import { pickFabricRenderEntry } from '../../../firebase/catalogApi';
import { getKurtaLayerCodes, getSadriLayerCodes } from '../../../Functions/layerEngine';
import { getKurtaModelEmbroideryLayers } from './KurtaEmbroideryLayers';
import {
    getCoatBackEmbroideryLayers,
    getCoatDisplayEmbroideryLayers,
    getCoatStyleEmbroideryLayers,
} from './CoatEmbroideryLayers';
import {
    getKurtaCoatTuxBackLayers,
    getKurtaCoatTuxDisplayLayers,
    getKurtaCoatTuxStyleFrontLayers,
    isTuxedoCoatType,
    mapTuxedoSelectionsToBaseCoat,
} from './KurtaCoatTux';
import { useBufferedRenderScene } from './useBufferedRenderScene';
import { hasCoatRightBaseEmbroidery } from '../utils/coatUpperPocket';

// ASSETS IMPORTS
import kurta_body from '../../../../assets/images/body/kurta_body.webp';
import kurta_hand_n from '../../../../assets/images/body/kurta_hand_n.webp';
import kurta_hand_c from '../../../../assets/images/body/kurta_hand_c.webp';

const KURTA_BODY_BY_TONE = {
    1: require('../../../../assets/images/kurta_body/kurta_body_1.webp'),
    2: require('../../../../assets/images/kurta_body/kurta_body_2.webp'),
    3: require('../../../../assets/images/kurta_body/kurta_body_3.webp'),
    4: require('../../../../assets/images/kurta_body/kurta_body_4.webp'),
    5: require('../../../../assets/images/kurta_body/kurta_body_5.webp'),
    6: require('../../../../assets/images/kurta_body/kurta_body_6.webp'),
    7: require('../../../../assets/images/kurta_body/kurta_body_7.webp'),
};

const KURTA_HANDS_NONCUFF_BY_TONE = {
    1: require('../../../../assets/images/kurta_body/hand_for_noncuff-sleeve_1.webp'),
    2: require('../../../../assets/images/kurta_body/hand_for_noncuff-sleeve_2.webp'),
    3: require('../../../../assets/images/kurta_body/hand_for_noncuff-sleeve_3.webp'),
    4: require('../../../../assets/images/kurta_body/hand_for_noncuff-sleeve_4.webp'),
    5: require('../../../../assets/images/kurta_body/hand_for_noncuff-sleeve_5.webp'),
    6: require('../../../../assets/images/kurta_body/hand_for_noncuff-sleeve_6.webp'),
    7: require('../../../../assets/images/kurta_body/hand_for_noncuff-sleeve_7.webp'),
};

const KURTA_HANDS_CUFF_BY_TONE = {
    1: require('../../../../assets/images/kurta_body/hand_for_cuff-sleeve_1.webp'),
    2: require('../../../../assets/images/kurta_body/hand_for_cuff-sleeve_2.webp'),
    3: require('../../../../assets/images/kurta_body/hand_for_cuff-sleeve_3.webp'),
    4: require('../../../../assets/images/kurta_body/hand_for_cuff-sleeve_4.webp'),
    5: require('../../../../assets/images/kurta_body/hand_for_cuff-sleeve_5.webp'),
    6: require('../../../../assets/images/kurta_body/hand_for_cuff-sleeve_6.webp'),
    7: require('../../../../assets/images/kurta_body/hand_for_cuff-sleeve_7.webp'),
};

const getSrcKey = (s) => {
    if (typeof s === 'number') return `r:${s}`;
    if (s?.uri) return `u:${s.uri}`;
    return '';
};

const getLayerStackStyle = (zIndex) => ({
    zIndex,
    elevation: Math.ceil(Number(zIndex) || 0),
});

const CRITICAL_FABRIC_PARTS = new Set([
    'Chest',
    'Placket',
    'Sleeve',
    'Collar',
    'Cuff',
]);

const isCriticalLayer = (layerObj) => {
    if (!layerObj?.type) return false;
    if (layerObj.type === 'fabric') return CRITICAL_FABRIC_PARTS.has(layerObj.part);
    if (layerObj.type === 'pajama') return true;
    if (layerObj.type === 'sadri_fabric') return !String(layerObj.code || '').startsWith('VPOCKET');
    if (layerObj.type === 'coat_display' || layerObj.type === 'coat_tuxedo') return true;
    return false;
};

const SmartLayer = ({ src, zIndex, dynamicStyle, onLoadSettled }) => {
    const [displaySrc, setDisplaySrc] = useState(src || null);
    const [pendingSrc, setPendingSrc] = useState(null);
    const srcKey = getSrcKey(src);
    const displayKey = getSrcKey(displaySrc);
    const pendingKey = getSrcKey(pendingSrc);

    useEffect(() => {
        if (!src) {
            setDisplaySrc(null);
            setPendingSrc(null);
            return undefined;
        }

        if (!displaySrc) {
            setDisplaySrc(src);
            setPendingSrc(null);
            return undefined;
        }

        if (srcKey === displayKey) {
            if (pendingSrc) setPendingSrc(null);
            return undefined;
        }

        if (srcKey === pendingKey) return undefined;

        setPendingSrc(src);
        return undefined;
    }, [src, srcKey, displayKey, displaySrc, pendingKey, pendingSrc]);

    const handleDisplayLoadEnd = useCallback(() => {
        if (typeof onLoadSettled === 'function') onLoadSettled();
    }, [onLoadSettled]);

    const handlePendingLoadEnd = useCallback(() => {
        if (!pendingSrc) return;
        const loadedPendingSrc = pendingSrc;
        const loadedPendingKey = getSrcKey(loadedPendingSrc);
        setDisplaySrc(loadedPendingSrc);
        setPendingSrc((currentPending) => (
            getSrcKey(currentPending) === loadedPendingKey ? null : currentPending
        ));
        if (typeof onLoadSettled === 'function') onLoadSettled();
    }, [onLoadSettled, pendingSrc]);

    return (
        <>
            {displaySrc ? (
                <Image
                    source={displaySrc}
                    style={[styles.modelLayer, dynamicStyle, getLayerStackStyle(zIndex)]}
                    resizeMode="contain"
                    fadeDuration={0}
                    onLoadEnd={handleDisplayLoadEnd}
                />
            ) : null}
            {pendingSrc ? (
                <Image
                    key={`pending-${pendingKey}`}
                    source={pendingSrc}
                    style={[styles.modelLayer, dynamicStyle, getLayerStackStyle(zIndex), styles.hiddenPreloadLayer]}
                    resizeMode="contain"
                    fadeDuration={0}
                    onLoadEnd={handlePendingLoadEnd}
                />
            ) : null}
        </>
    );
};


const SHIRT_COLLARS = ['CR', 'CB', 'CT', 'CS', 'CE'];
const JODHPURI_TYPES = ['JH', 'JR', 'JS', 'JO'];

const getCoatCollarGroup = (kurtaCollar = 'CM') => {
    if (kurtaCollar === 'CN') return 'R';
    if (kurtaCollar === 'CM' || kurtaCollar === 'CC') return 'C';
    if (SHIRT_COLLARS.includes(kurtaCollar)) return 'S';
    return 'C';
};

const shouldShowCoatUpperPocket = (selections = {}, coatEmbRenders = null) => {
    const enabled = String(
        selections?.coatUpperPocket == null ? '1' : selections.coatUpperPocket,
    ).trim() !== '0';
    if (!enabled) return false;

    if (coatEmbRenders && hasCoatRightBaseEmbroidery(coatEmbRenders, selections?.coatEmbroideryCollection)) {
        return false;
    }
    return true;
};

const getDisplayCoatCodes = (selections = {}, coatEmbRenders = null) => {
    const coatType = selections?.coatType || '1B';
    const showUpperPocket = shouldShowCoatUpperPocket(selections, coatEmbRenders);
    if (coatType === 'JH' || coatType === 'JR' || coatType === 'JS') {
        return showUpperPocket ? [coatType, 'UP1'] : [coatType];
    }
    if (coatType === 'JO') {
        return [coatType];
    }

    const lapelCode = selections?.coatLapel || 'N';
    const collarGroup = getCoatCollarGroup(selections?.collar);
    const collarCode = `${coatType === '2B' ? 'C2' : 'C1'}-${collarGroup}`;
    const lapelLayerCode = `${coatType === '2B' ? 'L2' : 'L1'}-${lapelCode}`;

    return [
        `${coatType}-${lapelCode}-${collarGroup}`,
        collarCode,
        ...(showUpperPocket ? ['UP1'] : []),
        lapelLayerCode,
    ];
};

const getStyleFrontCoatCodes = (selections = {}, coatEmbRenders = null) => {
    const coatType = selections?.coatType || '1B';
    const showUpperPocket = shouldShowCoatUpperPocket(selections, coatEmbRenders);
    if (coatType === 'JH' || coatType === 'JR' || coatType === 'JS') {
        return showUpperPocket ? [coatType, 'UP1'] : [coatType];
    }
    if (coatType === 'JO') {
        return [coatType];
    }

    const lapelCode = selections?.coatLapel || 'N';
    const collarCode = coatType === '2B' ? 'C2' : 'C1';
    const lapelLayerCode = `${coatType === '2B' ? 'L2' : 'L1'}-${lapelCode}`;

    return [
        `${coatType}-${lapelCode}`,
        collarCode,
        ...(showUpperPocket ? ['UP1'] : []),
        lapelLayerCode,
    ];
};

const getStyleBackCoatCodes = (selections = {}) => {
    const coatType = String(selections?.coatType || 'JO').trim().toUpperCase();
    const ventCode = selections?.coatBackStyle || 'NV';

    if (JODHPURI_TYPES.includes(coatType)) return [`JH-${ventCode}`];
    return [ventCode];
};

const getCoatButtonCodes = (selections = {}, slideIndex = 0) => {
    const baseSelections = isTuxedoCoatType(selections?.coatType)
        ? mapTuxedoSelectionsToBaseCoat(selections)
        : selections;
    const coatType = baseSelections.coatType || '1B';
    const hideFrontMainButtons = coatType === 'JH' || coatType === 'JO';

    if (slideIndex === 0) {
        // Seamless/Open Jodhpuri: hide front/main coat buttons on composite front.
        if (hideFrontMainButtons) return [];
        if (coatType === '1B' || coatType === '2B') return [`BC-${coatType}-F`];
        if (JODHPURI_TYPES.includes(coatType)) return ['BC-JH-F'];
    }

    if (slideIndex === 4) {
        const codes = [];
        // Seamless/Open Jodhpuri: no front/main button, only sleeve button.
        if (!hideFrontMainButtons) {
            if (coatType === '1B' || coatType === '2B') codes.push(`BC-${coatType}-S`);
            else if (JODHPURI_TYPES.includes(coatType)) codes.push('BC-JH-S');
        }
        codes.push('BCS-S');
        return codes;
    }

    if (slideIndex === 5) {
        return ['BCS-B'];
    }

    return [];
};

const isCoatCollarCode = (code, sourceSet = 'display') => {
    const normalized = String(code || '').trim().toUpperCase();
    if (!normalized) return false;
    return sourceSet === 'style'
        ? /^(C1|C2)$/.test(normalized)
        : /^(C1|C2)-/.test(normalized);
};

const isCoatLapelCode = (code) => /^(L1|L2)-/.test(String(code || '').trim().toUpperCase());

const createCoatLayer = (code, zIndex, selections = {}, sourceSet = 'display') => {
    let part = 'Chest';
    let sourceParts = ['base'];

    if (String(code || '').trim().toUpperCase() === 'UP1') {
        part = 'Pocket';
        sourceParts = ['pocket'];
    } else if (isCoatCollarCode(code, sourceSet)) {
        part = 'Collar';
        sourceParts = ['collar'];
    } else if (isCoatLapelCode(code)) {
        part = 'Lapel';
        sourceParts = ['lapel'];
    }

    return {
        code,
        zIndex,
        type: 'coat_display',
        sourceSet,
        part,
        sourceParts,
        coatType: selections?.coatType,
        embroideryBaseCode: part === 'Chest' ? selections?.coatType : undefined,
    };
};

const getDisplayCoatLayers = (selections = {}, options = {}, coatEmbRenders = null) => {
    const includeTrimLayers = options.includeTrimLayers !== false;
    return getDisplayCoatCodes(selections, coatEmbRenders).flatMap((code, idx) => {
        if (!includeTrimLayers && (isCoatCollarCode(code, 'display') || isCoatLapelCode(code))) {
            return [];
        }
        return [createCoatLayer(code, 85 + idx, selections, 'display')];
    });
};

const getStyleFrontCoatLayers = (selections = {}, options = {}, coatEmbRenders = null) => {
    const includeTrimLayers = options.includeTrimLayers !== false;
    return getStyleFrontCoatCodes(selections, coatEmbRenders).flatMap((code, idx) => {
        if (!includeTrimLayers && (isCoatCollarCode(code, 'style') || isCoatLapelCode(code))) {
            return [];
        }
        return [createCoatLayer(code, 20 + idx, selections, 'style')];
    });
};

const getStyleBackCoatLayers = (selections = {}) => getStyleBackCoatCodes(selections).map((code, idx) => (
    createCoatLayer(code, 20 + idx, selections, 'style')
));

const pickFirstCoatSource = (primaryMap, fallbackMap, codeCandidates) => {
    const candidates = Array.isArray(codeCandidates) ? codeCandidates : [codeCandidates];
    for (const candidate of candidates) {
        const normalized = String(candidate || '').trim();
        if (!normalized) continue;
        if (primaryMap?.[normalized]) return primaryMap[normalized];
        if (fallbackMap?.[normalized]) return fallbackMap[normalized];
    }
    return null;
};

function pickWithSadriSuffixFallback(map, code) {
    if (!map || !code) return null;
    if (map[code]) return map[code];
    if (code.endsWith('-F') || code.endsWith('-S')) {
        const base = code.slice(0, -2);
        if (map[base]) return map[base];
    }
    return null;
}

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

const makeEmbSelectionKey = (value) => {
    const placement = parseEmbroideryValuePlacement(value);
    const typeKey = placement.garment && placement.part
        ? `${placement.garment}_${placement.part}`
        : normalizeEmbKey(value?.type);
    const docId = normalizeEmbKey(value?.id);
    return typeKey && docId ? `${typeKey}::${docId}` : '';
};

const collectionValueMatchesLayer = (value, layerObj) => {
    const placement = parseEmbroideryValuePlacement(value);
    if (!placement.garment && !placement.part) return false;
    const isSadri = String(layerObj?.type || '').startsWith('sadri_embroidery_');

    if (isSadri) {
        if (placement.garment !== 'sadri') return false;
        if (layerObj?.sadriAllowCollarEmbroidery === false) {
            return placement.part === 'base';
        }
        return ['base', 'collar', 'lapel'].includes(placement.part);
    }

    const sourceParts = Array.isArray(layerObj?.sourceParts) ? layerObj.sourceParts.map(normalizeEmbKey) : [];
    if (sourceParts.length > 0) {
        const normalizedPart = placement.part === 'lapel' ? 'collar' : placement.part;
        return sourceParts.includes(normalizedPart) || (placement.part === 'lapel' && sourceParts.includes('lapel'));
    }

    if (layerObj?.part === 'Collar') return placement.part === 'collar' || placement.part === 'lapel';
    if (layerObj?.part === 'Sleeve') return placement.part === 'sleeve';
    if (layerObj?.part === 'Pocket') return placement.part === 'pocket';
    if (layerObj?.part === 'Chest') return placement.part === 'base';
    return false;
};

const appendUniqueSource = (list, source) => {
    if (!source) return;
    const key = typeof source === 'number' ? `asset:${source}` : `uri:${source?.uri || JSON.stringify(source)}`;
    if (list.some((item) => {
        const itemKey = typeof item === 'number' ? `asset:${item}` : `uri:${item?.uri || JSON.stringify(item)}`;
        return itemKey === key;
    })) return;
    list.push(source);
};

const getSadriCodeCandidatesForValue = (layerObj, value) => {
    const candidates = [];
    const push = (code) => {
        const normalized = String(code || '').trim();
        if (!normalized || candidates.includes(normalized)) return;
        candidates.push(normalized);
    };

    push(layerObj?.code);

    const placement = parseEmbroideryValuePlacement(value);
    if (placement.part === 'collar' || placement.part === 'lapel') {
        push('E-COLLAR');
        push('ECOLLAR');
    }

    return candidates;
};

const pickEmbroiderySourcesForLayer = (bundle, collection, layerObj) => {
    if (!bundle || !layerObj?.code) return [];
    const codeCandidates = Array.isArray(layerObj.codeCandidates) && layerObj.codeCandidates.length > 0
        ? layerObj.codeCandidates
        : [layerObj.code];
    const hasCollection = Array.isArray(collection?.matchingValues) && collection.matchingValues.length > 0;
    if (!hasCollection) {
        return [];
    }

    const values = collection.matchingValues.filter((value) => collectionValueMatchesLayer(value, layerObj));
    const bySelectionKey = bundle.uploadsBySelectionKey || {};
    const sources = [];
    for (const value of values) {
        const uploadBundle = bySelectionKey[makeEmbSelectionKey(value)];
        if (!uploadBundle) continue;
        if (layerObj.type === 'embroidery') {
            for (const code of codeCandidates) {
                if (uploadBundle.display?.[code]) {
                    appendUniqueSource(sources, uploadBundle.display[code]);
                } else if (layerObj.part === 'Cuff' && uploadBundle.folded?.[code]) {
                    appendUniqueSource(sources, uploadBundle.folded[code]);
                }
            }
        }
        if (layerObj.type === 'sadri_embroidery_left') {
            for (const code of getSadriCodeCandidatesForValue(layerObj, value)) {
                if (uploadBundle.sadriChestLeft?.[code]) {
                    appendUniqueSource(sources, uploadBundle.sadriChestLeft[code]);
                }
            }
        }
        if (layerObj.type === 'sadri_embroidery_right') {
            for (const code of getSadriCodeCandidatesForValue(layerObj, value)) {
                if (uploadBundle.sadriChestRight?.[code]) {
                    appendUniqueSource(sources, uploadBundle.sadriChestRight[code]);
                }
            }
        }
        if (layerObj.type === 'coat_embroidery') {
            for (const code of codeCandidates) {
                if (uploadBundle.coatChestLeft?.[code]) {
                    appendUniqueSource(sources, uploadBundle.coatChestLeft[code]);
                }
                if (uploadBundle.coatChestRight?.[code]) {
                    appendUniqueSource(sources, uploadBundle.coatChestRight[code]);
                }
            }
        }
    }
    return sources;
};

export default function KurtaModel({ selections, selectedFabric, selectedButton, selectedSadriButton, selectedCoatButton, selectedPajamaFabric, selectedSadriFabric, selectedCoatFabric, hasCoat = false, hasSadri, sadriCode, slideIndex = 0, selectedSkinTone = 1, onSceneReadyChange, bufferInitialScene = false }) {
    const { isMobile, isTablet, isDesktop } = useResponsive();
    const {
        kurtaRenders: KURTA_RENDERS,
        pajamaRenders: PAJAMA_RENDERS,
        sadriRenders: SADRI_RENDERS,
        coatRenders: COAT_RENDERS,
        kurtaCoatTux: KURTA_COAT_TUX,
        embroideryRenders: EMBROIDERY_RENDERS,
    } = useFirebaseCatalog();
    const hasRequiredSceneInputs = Boolean(selections && selectedFabric);
    const baseSelections = selections || {};

    // Yahan aap apne screens ke hisab se width/height aur margins edit kar sakte hain
    const dynamicStyle = useMemo(() => {
        const isSadriLastSlide = hasSadri && !hasCoat && slideIndex === 4;
        const isCoatLastSlides = hasCoat && (slideIndex === 4 || slideIndex === 5);
        const isInitialSlides = slideIndex === 0 || slideIndex === 1;

        // # MOBILE SCREEN
        if (isMobile) {
            if (isSadriLastSlide) {
                return {
                    width: '160%',
                    height: '160%',
                    marginTop: 250,
                    marginBottom: 0
                };
            }
            if (isCoatLastSlides) {
                return {
                    width: '116%',
                    height: '116%',
                    marginTop: 0,
                };
            }
            if (isInitialSlides) {
                return {
                    width: '110%',
                    height: '105%',
                    marginBottom: 33
                };
            }
            return {
                width: '105%',
                height: '95%',
                marginBottom: 15
            };
        }
        // # TABLET SCREEN
        if (isTablet) {
            if (isSadriLastSlide) {
                return {
                    width: '145%',
                    height: '145%',
                    marginTop: 600,
                    marginBottom: 0
                };
            }
            if (isCoatLastSlides) {
                return {
                    width: '100%',
                    height: '100%',
                    marginTop: -30,
                    marginBottom: 0
                };
            }
            if (isInitialSlides) {
                return {
                    width: '96%',
                    height: '96%',
                    marginBottom: 45
                };
            }
            return {
                width: '100%',
                height: '93%',
                marginBottom: 10
            };
        }
        // # TV SCREEN (Commercial Display)
        if (isDesktop) {
            if (isSadriLastSlide) {
                return {
                    width: '132%',
                    height: '130%',
                    marginTop: -70,
                    marginBottom: 0
                };
            }
            if (isCoatLastSlides) {
                return {
                    width: '125%',
                    height: '125%',
                    marginTop: -40,
                    marginBottom: 0
                };
            }
            if (isInitialSlides) {
                return {
                    width: '125%',
                    height: '125%',
                    marginBottom: 80
                };
            }
            return {
                width: '115%', // Increased from 120%
                height: '115%', // Increased from 120%
                marginBottom: 60
            };
        }
        return {};
    }, [isMobile, isTablet, isDesktop, hasSadri, hasCoat, slideIndex]);

    const bodyImage = KURTA_BODY_BY_TONE[selectedSkinTone] || kurta_body;
    const handsImage = baseSelections?.sleeve === "SC"
        ? (KURTA_HANDS_CUFF_BY_TONE[selectedSkinTone] || kurta_hand_c)
        : (KURTA_HANDS_NONCUFF_BY_TONE[selectedSkinTone] || kurta_hand_n);
    const bodyImageKey = getSrcKey(bodyImage);
    const handsImageKey = getSrcKey(handsImage);
    const [baseImageLoadState, setBaseImageLoadState] = useState({ body: '', hands: '' });

    useEffect(() => {
        setBaseImageLoadState({ body: '', hands: '' });
    }, [bodyImageKey, handsImageKey]);

    const markBaseImageLoaded = useCallback((slot, key) => {
        setBaseImageLoadState((current) => {
            if (current[slot] === key) return current;
            return {
                ...current,
                [slot]: key,
            };
        });
    }, []);

    // DATABASE: Us kapde ki saari images yahan se nikalo (MOVED UP — resolveLayerSources needs these)
    const fabricRenders = useMemo(
        () => pickFabricRenderEntry(KURTA_RENDERS, selectedFabric)?.display || KURTA_RENDERS['FAB_001']?.display || {},
        [KURTA_RENDERS, selectedFabric]
    );
    const fabricFallbackRenders = KURTA_RENDERS['FAB_001']?.display || {};
    const pajamaRenders = useMemo(
        () => pickFabricRenderEntry(PAJAMA_RENDERS, selectedPajamaFabric)?.display || PAJAMA_RENDERS['FAB_001']?.display || {},
        [PAJAMA_RENDERS, selectedPajamaFabric]
    );
    const pajamaFallbackRenders = PAJAMA_RENDERS['FAB_001']?.display || {};
    const sadriRenders = useMemo(
        () => pickFabricRenderEntry(SADRI_RENDERS, selectedSadriFabric)?.display || SADRI_RENDERS['FAB_001']?.display || {},
        [SADRI_RENDERS, selectedSadriFabric]
    );

    const coatFabricId = selectedCoatFabric?.fabricID || 'FAB_001';
    const coatRenderSet =
        pickFabricRenderEntry(COAT_RENDERS, selectedCoatFabric) ||
        COAT_RENDERS[coatFabricId] ||
        COAT_RENDERS['FAB_001'] ||
        { display: {}, style: {} };
    const coatDisplayRenders = coatRenderSet.display || {};
    const coatStyleRenders = coatRenderSet.style || {};
    const coatFallbackDisplayRenders = COAT_RENDERS['FAB_001']?.display || {};
    const coatFallbackStyleRenders = COAT_RENDERS['FAB_001']?.style || {};
    const baseCoatSelections = isTuxedoCoatType(baseSelections?.coatType)
        ? mapTuxedoSelectionsToBaseCoat(baseSelections)
        : baseSelections;

    const resolveLayerSources = (layerObj) => {
        let imageSource = null;
        let imageSources = null;

        if (layerObj.type === 'button') {
            imageSource = selectedButton?.renders?.[layerObj.code]
                || selectedButton?.renders?.[layerObj.code.replace(/-[FS]$/, '')];
        } else if (layerObj.type === 'embroidery') {
            imageSources = pickEmbroiderySourcesForLayer(
                EMBROIDERY_RENDERS[layerObj.collectionID],
                baseSelections?.embroideryCollection,
                layerObj
            );
        } else if (layerObj.type === 'sadri_embroidery_left') {
            imageSources = pickEmbroiderySourcesForLayer(
                EMBROIDERY_RENDERS[layerObj.collectionID],
                baseSelections?.sadriEmbroideryCollection,
                layerObj
            );
        } else if (layerObj.type === 'sadri_embroidery_right') {
            imageSources = pickEmbroiderySourcesForLayer(
                EMBROIDERY_RENDERS[layerObj.collectionID],
                baseSelections?.sadriEmbroideryCollection,
                layerObj
            );
        } else if (layerObj.type === 'coat_embroidery') {
            imageSources = pickEmbroiderySourcesForLayer(
                EMBROIDERY_RENDERS[layerObj.collectionID],
                baseSelections?.coatEmbroideryCollection,
                layerObj
            );
        } else if (layerObj.type === 'pajama') {
            imageSource = pajamaRenders[layerObj.code] || pajamaFallbackRenders[layerObj.code];
        } else if (layerObj.type === 'sadri_button') {
            imageSource = selectedSadriButton?.renders?.[layerObj.code];
        } else if (layerObj.type === 'sadri_fabric') {
            imageSource = pickWithSadriSuffixFallback(sadriRenders, layerObj.code);
        } else if (layerObj.type === 'coat_display') {
            const primaryMap = layerObj.sourceSet === 'style' ? coatStyleRenders : coatDisplayRenders;
            const fallbackMap = layerObj.sourceSet === 'style' ? coatFallbackStyleRenders : coatFallbackDisplayRenders;
            imageSource = pickFirstCoatSource(primaryMap, fallbackMap, layerObj.codeCandidates || layerObj.code);
        } else if (layerObj.type === 'coat_tuxedo') {
            imageSource = pickFirstCoatSource(KURTA_COAT_TUX, null, layerObj.codeCandidates || layerObj.code);
        } else if (layerObj.type === 'coat_button') {
            imageSource = selectedCoatButton?.renders?.[layerObj.code]
                || selectedCoatButton?.renders?.[layerObj.code.replace(/-[FS]$/, '')];
        } else {
            imageSource = fabricRenders[layerObj.code] || fabricFallbackRenders[layerObj.code];
        }

        return { imageSource, imageSources };
    };

    // ENGINE KO BULAO: Kurta Arrays
    const kurtaLayers = getKurtaLayerCodes(baseSelections, selectedButton, 0, slideIndex, hasCoat, hasSadri, sadriCode) || [];
    const kurtaBaseLayers = kurtaLayers.filter((layer) => layer?.type !== 'embroidery');
    const kurtaEmbroideryLayers = getKurtaModelEmbroideryLayers(baseSelections, kurtaBaseLayers);

    // ENGINE KO BULAO: Sadri Arrays
    let sadriLayers = [];
    if (hasSadri && (slideIndex === 0 || slideIndex === 4 || slideIndex === 5)) {
        const sadriViewMode = slideIndex === 4 ? 1 : 0;
        sadriLayers = getSadriLayerCodes(sadriCode, baseSelections, selectedSadriButton, sadriViewMode, slideIndex, EMBROIDERY_RENDERS) || [];
    }

    const coatDisplayGarmentLayers = hasCoat && slideIndex === 0
        ? [
            ...getDisplayCoatLayers(baseCoatSelections, { includeTrimLayers: !isTuxedoCoatType(baseSelections?.coatType) }, EMBROIDERY_RENDERS[baseSelections?.coatEmbroideryID]),
            ...getKurtaCoatTuxDisplayLayers(baseSelections),
        ]
        : [];
    const coatDisplayEmbroideryLayers = hasCoat && slideIndex === 0
        ? getCoatDisplayEmbroideryLayers(baseSelections, coatDisplayGarmentLayers)
        : [];
    const coatDisplayButtonLayers = hasCoat && slideIndex === 0
        ? getCoatButtonCodes(baseSelections, 0).map((code, idx) => ({
            code,
            zIndex: 92 + idx,
            type: 'coat_button'
        }))
        : [];

    const layersToRender = [
        ...kurtaBaseLayers,
        ...kurtaEmbroideryLayers,
        ...sadriLayers,
        ...coatDisplayGarmentLayers,
        ...coatDisplayEmbroideryLayers,
        ...coatDisplayButtonLayers,
    ].sort((a, b) => a.zIndex - b.zIndex);

    const buildSceneEntriesFromLayers = (layerList, keyPrefix = 'layer') => {
        const entries = [];
        const missingCriticalCodes = [];
        layerList.forEach((layerObj, index) => {
            if (!layerObj?.code) return;
            const { imageSource, imageSources } = resolveLayerSources(layerObj);
            if (Array.isArray(imageSources) && imageSources.length > 0) {
                imageSources.forEach((src, sourceIndex) => {
                    if (!src) return;
                    entries.push({
                        key: `${keyPrefix}-${layerObj.type}-${layerObj.zIndex}-${index}-${sourceIndex}`,
                        src,
                        zIndex: layerObj.zIndex + sourceIndex * 0.01,
                    });
                });
                return;
            }
            if (!imageSource) {
                if (isCriticalLayer(layerObj)) {
                    missingCriticalCodes.push(`${layerObj.type}:${layerObj.code}`);
                }
                return;
            }
            entries.push({
                key: `${keyPrefix}-${layerObj.type}-${layerObj.zIndex}-${index}`,
                src: imageSource,
                zIndex: layerObj.zIndex,
            });
        });
        return {
            entries,
            isComplete: missingCriticalCodes.length === 0,
            missingCriticalCodes,
        };
    };

    // Build scene entries — computed fresh every render to ensure reactivity with context data
    const sceneBuild = buildSceneEntriesFromLayers(layersToRender, 'layer');

    const coatGarmentLayers = hasCoat && (slideIndex === 4 || slideIndex === 5)
        ? (slideIndex === 4
            ? [
                ...getStyleFrontCoatLayers(baseCoatSelections, { includeTrimLayers: !isTuxedoCoatType(baseSelections?.coatType) }, EMBROIDERY_RENDERS[baseSelections?.coatEmbroideryID]),
                ...getKurtaCoatTuxStyleFrontLayers(baseSelections).map((layer) => ({ ...layer, sourceSet: 'style' })),
            ]
            : [
                ...getStyleBackCoatLayers(baseCoatSelections),
                ...getKurtaCoatTuxBackLayers(baseSelections).map((layer) => ({ ...layer, sourceSet: 'style' })),
            ])
        : [];
    const coatEmbroideryLayers = hasCoat && (slideIndex === 4 || slideIndex === 5)
        ? (slideIndex === 4
            ? getCoatStyleEmbroideryLayers(baseSelections, coatGarmentLayers)
            : getCoatBackEmbroideryLayers(baseSelections, coatGarmentLayers))
        : [];
    const coatButtonLayers = hasCoat && (slideIndex === 4 || slideIndex === 5)
        ? getCoatButtonCodes(baseSelections, slideIndex).map((code, idx) => ({
            code,
            zIndex: (slideIndex === 4 ? 40 : 41) + idx,
            type: 'coat_button',
        }))
        : [];
    const coatSceneBuild = buildSceneEntriesFromLayers(
        [...coatGarmentLayers, ...coatEmbroideryLayers, ...coatButtonLayers].sort((a, b) => a.zIndex - b.zIndex),
        'coat-layer'
    );
    const isCoatOnlySlide = hasCoat && (slideIndex === 4 || slideIndex === 5);
    const activeSceneBuild = isCoatOnlySlide ? coatSceneBuild : sceneBuild;
    const shouldBufferScene = slideIndex === 0
        ? (bufferInitialScene || !activeSceneBuild.isComplete)
        : !activeSceneBuild.isComplete;
    const {
        displayEntries: visibleSceneEntries,
        hasCommittedScene,
        isLoading: isBufferingScene,
    } = useBufferedRenderScene(activeSceneBuild.entries, {
        canCommit: activeSceneBuild.isComplete,
    });
    const visibleSceneLoadKeys = useMemo(
        () => visibleSceneEntries.map((entry) => `${entry?.key || ''}:${getSrcKey(entry?.src)}`),
        [visibleSceneEntries]
    );
    const visibleSceneLoadSignature = visibleSceneLoadKeys.join('|');
    const [loadedSceneKeys, setLoadedSceneKeys] = useState(() => new Set());

    useEffect(() => {
        const validKeys = new Set(visibleSceneLoadKeys);
        setLoadedSceneKeys((current) => {
            let changed = false;
            const next = new Set();
            current.forEach((key) => {
                if (validKeys.has(key)) {
                    next.add(key);
                } else {
                    changed = true;
                }
            });
            return changed ? next : current;
        });
    }, [visibleSceneLoadKeys, visibleSceneLoadSignature]);

    const markSceneEntryLoaded = useCallback((loadKey) => {
        setLoadedSceneKeys((current) => {
            if (current.has(loadKey)) return current;
            const next = new Set(current);
            next.add(loadKey);
            return next;
        });
    }, []);

    const areVisibleSceneImagesLoaded = visibleSceneLoadKeys.every((loadKey) => loadedSceneKeys.has(loadKey));
    const areBaseImagesLoaded = isCoatOnlySlide
        || (baseImageLoadState.body === bodyImageKey && baseImageLoadState.hands === handsImageKey);
    const canRenderInitialScene = activeSceneBuild.isComplete
        && hasCommittedScene
        && areVisibleSceneImagesLoaded
        && areBaseImagesLoaded
        && (!shouldBufferScene || !isBufferingScene);

    useEffect(() => {
        if (typeof onSceneReadyChange !== 'function') return;
        onSceneReadyChange(canRenderInitialScene);
    }, [onSceneReadyChange, canRenderInitialScene]);

    if (!hasRequiredSceneInputs || !hasCommittedScene) return null;

    if (isCoatOnlySlide) {
        return (
            <View collapsable={false} style={styles.container}>
                {visibleSceneEntries.map((entry) => {
                    if (!entry?.src) return null;
                    return (
                        <SmartLayer
                            key={entry.key}
                            src={entry.src}
                            zIndex={entry.zIndex}
                            dynamicStyle={dynamicStyle}
                            onLoadSettled={() => markSceneEntryLoaded(`${entry.key}:${getSrcKey(entry.src)}`)}
                        />
                    );
                })}
            </View>
        );
    }

    return (
        <View collapsable={false} style={styles.container}>
            {/* 1. Nanga Ladka (Z-Index: 1) */}
            <SmartLayer
                src={bodyImage}
                zIndex={1}
                dynamicStyle={dynamicStyle}
                onLoadSettled={() => markBaseImageLoaded('body', bodyImageKey)}
            />

            {/* 2. Kapde ki Layers (Z-Index: 10 se 90) */}
            {visibleSceneEntries.map((entry) => {
                if (!entry?.src) return null;

                return (
                    <SmartLayer
                        key={entry.key}
                        src={entry.src}
                        zIndex={entry.zIndex}
                        dynamicStyle={dynamicStyle}
                        onLoadSettled={() => markSceneEntryLoaded(`${entry.key}:${getSrcKey(entry.src)}`)}
                    />
                );
            })}

            {/* 3. Hands Overlay (Z-Index: 100) */}
            <SmartLayer
                src={handsImage}
                zIndex={100}
                dynamicStyle={dynamicStyle}
                onLoadSettled={() => markBaseImageLoaded('hands', handsImageKey)}
            />

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Yeh default style hai, dynamicStyle isko overwrite karega upar se
    modelLayer: {
        position: 'absolute',
        width: '105%',
        height: '95%',
        marginBottom: 15
    },
    hiddenPreloadLayer: {
        opacity: 0,
    },
});
