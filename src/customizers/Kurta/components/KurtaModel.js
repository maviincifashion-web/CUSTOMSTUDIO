import React from 'react';
import { View, Image as RNImage, StyleSheet, ActivityIndicator } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
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

// ASSETS IMPORTS
import kurta_body from '../../../../assets/images/body/kurta_body.webp';
import kurta_hand_n from '../../../../assets/images/body/kurta_hand_n.webp';
import kurta_hand_c from '../../../../assets/images/body/kurta_hand_c.webp';


const SmartLayer = ({ src, zIndex, dynamicStyle }) => {
    if (!src) return null;

    return (
        <ExpoImage
            source={src}
            style={[styles.modelLayer, dynamicStyle, { zIndex }]}
            contentFit="contain"
            cachePolicy="memory-disk"
            transition={0}
        />
    );
};

const BufferedLayerScene = ({ entries, dynamicStyle, bodySource = null, handsSource = null }) => {
    const { displayEntries, isLoading, hasCommittedScene } = useBufferedRenderScene(entries);

    return (
        <View style={styles.container}>
            {bodySource ? (
                <RNImage source={bodySource} style={[styles.modelLayer, dynamicStyle, { zIndex: 1 }]} resizeMode="contain" />
            ) : null}

            {displayEntries.map((entry) => (
                <SmartLayer
                    key={entry.key}
                    src={entry.src}
                    zIndex={entry.zIndex}
                    dynamicStyle={dynamicStyle}
                />
            ))}

            {handsSource ? (
                <RNImage source={handsSource} style={[styles.modelLayer, dynamicStyle, { zIndex: 100 }]} resizeMode="contain" />
            ) : null}

            {isLoading ? (
                <View style={[styles.loadingOverlay, !hasCommittedScene && styles.loadingOverlayOpaque]}>
                    <ActivityIndicator size="large" color="#1f2937" />
                </View>
            ) : null}
        </View>
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

const shouldShowCoatUpperPocket = (selections = {}) => String(selections.coatUpperPocket ?? '1') !== '0';

const getDisplayCoatCodes = (selections = {}) => {
    const coatType = selections.coatType || '1B';
    if (coatType === 'JH' || coatType === 'JR' || coatType === 'JS') {
        return shouldShowCoatUpperPocket(selections) ? [coatType, 'UP1'] : [coatType];
    }
    if (coatType === 'JO') {
        return shouldShowCoatUpperPocket(selections) ? [coatType, 'UP1'] : [coatType];
    }

    const lapelCode = selections.coatLapel || 'N';
    const collarGroup = getCoatCollarGroup(selections.collar);
    const collarCode = `${coatType === '2B' ? 'C2' : 'C1'}-${collarGroup}`;
    const lapelLayerCode = `${coatType === '2B' ? 'L2' : 'L1'}-${lapelCode}`;

    const codes = [
        `${coatType}-${lapelCode}-${collarGroup}`,
        collarCode,
    ];

    if (shouldShowCoatUpperPocket(selections)) {
        codes.push('UP1');
    }

    codes.push(lapelLayerCode);
    return codes;
};

const getStyleFrontCoatCodes = (selections = {}) => {
    const coatType = selections.coatType || '1B';
    if (coatType === 'JH' || coatType === 'JR' || coatType === 'JS') {
        return shouldShowCoatUpperPocket(selections) ? [coatType, 'UP1'] : [coatType];
    }
    if (coatType === 'JO') {
        return shouldShowCoatUpperPocket(selections) ? [coatType, 'UP1'] : [coatType];
    }

    const lapelCode = selections.coatLapel || 'N';
    const collarCode = coatType === '2B' ? 'C2' : 'C1';
    const lapelLayerCode = `${coatType === '2B' ? 'L2' : 'L1'}-${lapelCode}`;

    const codes = [
        `${coatType}-${lapelCode}`,
        collarCode,
    ];

    if (shouldShowCoatUpperPocket(selections)) {
        codes.push('UP1');
    }

    codes.push(lapelLayerCode);
    return codes;
};

const getStyleBackCoatCodes = (selections = {}) => {
    const coatType = selections.coatType || 'JO';
    const ventCode = selections.coatBackStyle || 'NV';

    if (JODHPURI_TYPES.includes(coatType)) return [`${coatType}-${ventCode}`];
    return [ventCode];
};

const pickFirstCoatSource = (renderMap, fallbackMap, codeCandidates) => {
    const candidates = Array.isArray(codeCandidates) ? codeCandidates : [codeCandidates];
    for (const code of candidates) {
        if (renderMap?.[code]) return renderMap[code];
        if (fallbackMap?.[code]) return fallbackMap[code];
    }
    return null;
};

const getStyleBackCoatCodeCandidates = (selections = {}) => {
    const coatType = selections.coatType || 'JO';
    const ventCode = selections.coatBackStyle || 'NV';

    if (!JODHPURI_TYPES.includes(coatType)) {
        return [ventCode];
    }

    const candidates = [`${coatType}-${ventCode}`];
    if (coatType !== 'JH') {
        candidates.push(`JH-${ventCode}`);
    }
    return candidates;
};

const getCoatButtonCodes = (selections = {}, slideIndex = 0) => {
    const coatType = selections.coatType || '1B';
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

const getDisplayCoatLayers = (selections = {}) => {
    const coatType = selections.coatType || '1B';
    const coatCodes = getDisplayCoatCodes(selections);

    if (JODHPURI_TYPES.includes(coatType)) {
        return [
            {
                code: coatCodes[0],
                zIndex: 85,
                type: 'coat_display',
                part: 'Chest',
                sourceParts: ['base', 'collar', 'lapel'],
                coatType,
            },
            ...(coatCodes[1] === 'UP1' ? [{
                code: coatCodes[1],
                zIndex: 86,
                type: 'coat_display',
                part: 'Pocket',
                coatType,
            }] : []),
        ];
    }

    return [
        ...(coatCodes[0] ? [{
            code: coatCodes[0],
            zIndex: 85,
            type: 'coat_display',
            part: 'Chest',
            coatType,
        }] : []),
        ...(coatCodes[1] ? [{
            code: coatCodes[1],
            zIndex: 86,
            type: 'coat_display',
            part: 'Collar',
            coatType,
        }] : []),
        ...(coatCodes.includes('UP1') ? [{
            code: 'UP1',
            zIndex: 87,
            type: 'coat_display',
            part: 'Pocket',
            coatType,
        }] : []),
        ...((coatCodes[coatCodes.length - 1] && coatCodes[coatCodes.length - 1] !== 'UP1') ? [{
            code: coatCodes[coatCodes.length - 1],
            zIndex: 88,
            type: 'coat_display',
            part: 'Lapel',
            coatType,
        }] : []),
    ];
};

const getStyleFrontCoatLayers = (selections = {}) => {
    const coatType = selections.coatType || '1B';
    const coatCodes = getStyleFrontCoatCodes(selections);

    if (JODHPURI_TYPES.includes(coatType)) {
        return [
            {
                code: coatCodes[0],
                zIndex: 20,
                type: 'coat_display',
                part: 'Chest',
                sourceParts: ['base', 'collar', 'lapel'],
                coatType,
            },
            ...(coatCodes[1] === 'UP1' ? [{
                code: coatCodes[1],
                zIndex: 21,
                type: 'coat_display',
                part: 'Pocket',
                coatType,
            }] : []),
        ];
    }

    return [
        ...(coatCodes[0] ? [{
            code: coatCodes[0],
            zIndex: 20,
            type: 'coat_display',
            part: 'Chest',
            coatType,
        }] : []),
        ...(coatCodes[1] ? [{
            code: coatCodes[1],
            zIndex: 21,
            type: 'coat_display',
            part: 'Collar',
            coatType,
        }] : []),
        ...(coatCodes.includes('UP1') ? [{
            code: 'UP1',
            zIndex: 22,
            type: 'coat_display',
            part: 'Pocket',
            coatType,
        }] : []),
        ...((coatCodes[coatCodes.length - 1] && coatCodes[coatCodes.length - 1] !== 'UP1') ? [{
            code: coatCodes[coatCodes.length - 1],
            zIndex: 23,
            type: 'coat_display',
            part: 'Lapel',
            coatType,
        }] : []),
    ];
};

const getStyleBackCoatLayers = (selections = {}) => {
    const coatType = selections.coatType || 'JO';
    const coatCodes = getStyleBackCoatCodes(selections);
    const codeCandidates = getStyleBackCoatCodeCandidates(selections);

    if (codeCandidates.length === 0) {
        return [];
    }

    return [{
        code: coatCodes[0] || codeCandidates[0],
        codeCandidates,
        zIndex: 20,
        type: 'coat_display',
        part: 'Chest',
        coatType,
    }];
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
        return placement.garment === 'sadri' && ['base', 'collar', 'lapel'].includes(placement.part);
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
        if (layerObj.type === 'sadri_embroidery_left' && uploadBundle.sadriChestLeft?.[layerObj.code]) {
            appendUniqueSource(sources, uploadBundle.sadriChestLeft[layerObj.code]);
        }
        if (layerObj.type === 'sadri_embroidery_right' && uploadBundle.sadriChestRight?.[layerObj.code]) {
            appendUniqueSource(sources, uploadBundle.sadriChestRight[layerObj.code]);
        }
    }
    return sources;
};

export default function KurtaModel({ selections, selectedFabric, selectedButton, selectedSadriButton, selectedCoatButton, selectedPajamaFabric, selectedSadriFabric, selectedCoatFabric, hasCoat = false, hasSadri, sadriCode, slideIndex = 0 }) {
    const { isMobile, isTablet, isDesktop } = useResponsive();
    const {
        kurtaRenders: KURTA_RENDERS,
        pajamaRenders: PAJAMA_RENDERS,
        sadriRenders: SADRI_RENDERS,
        coatRenders: COAT_RENDERS,
        kurtaCoatTux: KURTA_COAT_TUX_RENDERS,
        embroideryRenders: EMBROIDERY_RENDERS,
    } = useFirebaseCatalog();

    // SAFETY CHECK: Jab tak data ready na ho, model render mat karo
    if (!selections || !selectedFabric) return null;

    // Yahan aap apne screens ke hisab se width/height aur margins edit kar sakte hain
    const getDynamicModelStyle = () => {
        const isSadriLastSlide = hasSadri && !hasCoat && slideIndex === 4;
        const isCoatZoomSlide = hasCoat && (slideIndex === 4 || slideIndex === 5);

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
            if (isCoatZoomSlide) {
                return {
                    width: '115%',
                    height: '105%',
                    marginTop: -30,
                    marginBottom: 0
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
                    width: '122%',
                    height: '114%',
                    marginTop: -54,
                    marginBottom: 0
                };
            }
            if (isCoatZoomSlide) {
                return {
                    width: '110%',
                    height: '102%',
                    marginTop: -40,
                    marginBottom: 0
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
            if (isCoatZoomSlide) {
                return {
                    width: '125%',
                    height: '125%',
                    marginTop: -90,
                    marginBottom: 0
                };
            }
            return {
                width: '115%', // Increased from 120%
                height: '115%', // Increased from 120%
                marginBottom: 60
            };
        }
        return {};
    };

    const dynamicStyle = getDynamicModelStyle();

    const handsImage = selections.sleeve === "SC" ? kurta_hand_c : kurta_hand_n;
    const isTuxedoCoat = isTuxedoCoatType(selections?.coatType);
    const baseCoatSelections = isTuxedoCoat ? mapTuxedoSelectionsToBaseCoat(selections) : selections;

    const coatFabricId = selectedCoatFabric?.fabricID || 'FAB_001';
    const coatRenderSet =
        pickFabricRenderEntry(COAT_RENDERS, selectedCoatFabric) ||
        COAT_RENDERS[coatFabricId] ||
        COAT_RENDERS['FAB_001'] ||
        { display: {}, style: {} };
    const coatDisplayRenders = coatRenderSet.display || {};
    const coatStyleRenders = coatRenderSet.style || {};
    const coatDisplayFallbackRenders = COAT_RENDERS['FAB_001']?.display || {};
    const coatStyleFallbackRenders = COAT_RENDERS['FAB_001']?.style || {};
    const coatTuxedoRenders = KURTA_COAT_TUX_RENDERS || {};

    if (hasCoat && (slideIndex === 4 || slideIndex === 5)) {
        const coatGarmentLayers = slideIndex === 4
            ? (isTuxedoCoat
                ? [
                    ...getStyleFrontCoatLayers(baseCoatSelections).filter((layer) => layer?.part !== 'Collar' && layer?.part !== 'Lapel'),
                    ...getKurtaCoatTuxStyleFrontLayers(selections),
                ]
                : getStyleFrontCoatLayers(selections))
            : (isTuxedoCoat
                ? [
                    ...getStyleBackCoatLayers(baseCoatSelections),
                    ...getKurtaCoatTuxBackLayers(selections),
                ]
                : getStyleBackCoatLayers(selections));
        const coatEmbroideryLayers = slideIndex === 4
            ? getCoatStyleEmbroideryLayers(selections, coatGarmentLayers)
            : getCoatBackEmbroideryLayers(selections, coatGarmentLayers);
        const coatButtonCodes = isTuxedoCoat
            ? getCoatButtonCodes(baseCoatSelections, slideIndex)
            : getCoatButtonCodes(selections, slideIndex);
        const coatSceneEntries = [];

        [...coatGarmentLayers, ...coatEmbroideryLayers]
            .sort((a, b) => a.zIndex - b.zIndex)
            .forEach((layerObj, index) => {
                if (!layerObj?.code) return;

                if (layerObj.type === 'coat_display') {
                    const src = pickFirstCoatSource(
                        coatStyleRenders,
                        coatStyleFallbackRenders,
                        Array.isArray(layerObj.codeCandidates) && layerObj.codeCandidates.length > 0
                            ? layerObj.codeCandidates
                            : [layerObj.code]
                    );
                    if (!src) return;
                    coatSceneEntries.push({
                        key: `coat-style-${layerObj.code}-${layerObj.part || 'base'}-${index}`,
                        src,
                        zIndex: layerObj.zIndex,
                    });
                    return;
                }

                if (layerObj.type === 'coat_tuxedo') {
                    const src = pickFirstCoatSource(
                        coatTuxedoRenders,
                        null,
                        Array.isArray(layerObj.codeCandidates) && layerObj.codeCandidates.length > 0
                            ? layerObj.codeCandidates
                            : [layerObj.code]
                    );
                    if (!src) return;
                    coatSceneEntries.push({
                        key: `coat-style-tuxedo-${layerObj.code}-${layerObj.part || 'base'}-${index}`,
                        src,
                        zIndex: layerObj.zIndex,
                    });
                    return;
                }

                if (layerObj.type === 'coat_embroidery') {
                    const imageSources = pickEmbroiderySourcesForLayer(
                        EMBROIDERY_RENDERS[layerObj.collectionID],
                        selections.coatEmbroideryCollection,
                        layerObj
                    );
                    imageSources.forEach((src, sourceIndex) => {
                        if (!src) return;
                        coatSceneEntries.push({
                            key: `coat-style-embroidery-${layerObj.code}-${layerObj.part}-${index}-${sourceIndex}`,
                            src,
                            zIndex: layerObj.zIndex + sourceIndex * 0.01,
                        });
                    });
                }
            });

        coatSceneEntries.push(
            ...coatButtonCodes.map((code, idx) => ({
                key: `coat-style-button-${code}-${idx}`,
                src: selectedCoatButton?.renders?.[code],
                zIndex: 40 + idx,
            })),
        );

        return (
            <BufferedLayerScene
                entries={coatSceneEntries.filter((entry) => entry.src)}
                dynamicStyle={dynamicStyle}
            />
        );
    }

    // ENGINE KO BULAO: Kurta Arrays
    const kurtaLayers = getKurtaLayerCodes(selections, selectedButton, 0, slideIndex, hasCoat, hasSadri, sadriCode) || [];
    const kurtaBaseLayers = kurtaLayers.filter((layer) => layer?.type !== 'embroidery');
    const kurtaEmbroideryLayers = getKurtaModelEmbroideryLayers(selections, kurtaBaseLayers);

    // ENGINE KO BULAO: Sadri Arrays
    let sadriLayers = [];
    if (hasSadri && (slideIndex === 0 || slideIndex === 4 || slideIndex === 5)) {
        sadriLayers = getSadriLayerCodes(sadriCode, selections, selectedSadriButton, 0, slideIndex, EMBROIDERY_RENDERS) || [];
    }

    const coatDisplayLayers = hasCoat && slideIndex === 0
        ? (isTuxedoCoat
            ? [
                ...getDisplayCoatLayers(baseCoatSelections).filter((layer) => layer?.part !== 'Collar' && layer?.part !== 'Lapel'),
                ...getKurtaCoatTuxDisplayLayers(selections),
            ]
            : getDisplayCoatLayers(selections))
        : [];
    const coatDisplayEmbroideryLayers = hasCoat && slideIndex === 0
        ? getCoatDisplayEmbroideryLayers(selections, coatDisplayLayers)
        : [];
    const coatDisplayButtonLayers = hasCoat && slideIndex === 0
        ? getCoatButtonCodes(isTuxedoCoat ? baseCoatSelections : selections, 0).map((code, idx) => ({
            code,
            zIndex: 92 + idx,
            type: 'coat_button'
        }))
        : [];

    const layersToRender = [...kurtaBaseLayers, ...kurtaEmbroideryLayers, ...sadriLayers, ...coatDisplayLayers, ...coatDisplayEmbroideryLayers, ...coatDisplayButtonLayers].sort((a, b) => a.zIndex - b.zIndex);

    // DATABASE: Us kapde ki saari images yahan se nikalo
    const fabricRenders = pickFabricRenderEntry(KURTA_RENDERS, selectedFabric)?.display || {};
    // Pajama renders by fabricID (same fabric can have a matching pajama render)
    const pajamaRenders = pickFabricRenderEntry(PAJAMA_RENDERS, selectedPajamaFabric)?.display || {};
    // Sadri renders by fabricID, fallback to FAB_001 until all fabrics are mapped
    const sadriRenders =
        pickFabricRenderEntry(SADRI_RENDERS, selectedSadriFabric)?.display ||
        SADRI_RENDERS['FAB_001']?.display ||
        {};

    const resolvedSceneEntries = [];
    layersToRender.forEach((layerObj, index) => {
        if (!layerObj || !layerObj.code) return;

        let imageSource = null;
        let imageSources = null;
        if (layerObj.type === 'button') {
            imageSource = selectedButton?.renders?.[layerObj.code]
                || selectedButton?.renders?.[layerObj.code.replace(/-[FS]$/, '')];
        } else if (layerObj.type === 'embroidery') {
            imageSources = pickEmbroiderySourcesForLayer(
                EMBROIDERY_RENDERS[layerObj.collectionID],
                selections.embroideryCollection,
                layerObj
            );
        } else if (layerObj.type === 'sadri_embroidery_left') {
            imageSources = pickEmbroiderySourcesForLayer(
                EMBROIDERY_RENDERS[layerObj.collectionID],
                selections.sadriEmbroideryCollection,
                layerObj
            );
        } else if (layerObj.type === 'sadri_embroidery_right') {
            imageSources = pickEmbroiderySourcesForLayer(
                EMBROIDERY_RENDERS[layerObj.collectionID],
                selections.sadriEmbroideryCollection,
                layerObj
            );
        } else if (layerObj.type === 'coat_embroidery') {
            imageSources = pickEmbroiderySourcesForLayer(
                EMBROIDERY_RENDERS[layerObj.collectionID],
                selections.coatEmbroideryCollection,
                layerObj
            );
        } else if (layerObj.type === 'pajama') {
            imageSource = pajamaRenders[layerObj.code];
        } else if (layerObj.type === 'sadri_button') {
            imageSource = selectedSadriButton?.renders?.[layerObj.code];
        } else if (layerObj.type === 'sadri_fabric') {
            imageSource = pickWithSadriSuffixFallback(sadriRenders, layerObj.code);
        } else if (layerObj.type === 'coat_display') {
            imageSource = pickFirstCoatSource(
                coatDisplayRenders,
                coatDisplayFallbackRenders,
                Array.isArray(layerObj.codeCandidates) && layerObj.codeCandidates.length > 0
                    ? layerObj.codeCandidates
                    : [layerObj.code]
            );
        } else if (layerObj.type === 'coat_tuxedo') {
            imageSource = pickFirstCoatSource(
                coatTuxedoRenders,
                null,
                Array.isArray(layerObj.codeCandidates) && layerObj.codeCandidates.length > 0
                    ? layerObj.codeCandidates
                    : [layerObj.code]
            );
        } else if (layerObj.type === 'coat_button') {
            imageSource = selectedCoatButton?.renders?.[layerObj.code]
                || selectedCoatButton?.renders?.[layerObj.code.replace(/-[FS]$/, '')];
        } else {
            imageSource = fabricRenders[layerObj.code];
        }

        if (Array.isArray(imageSources) && imageSources.length > 0) {
            imageSources.forEach((src, sourceIndex) => {
                if (!src) return;
                resolvedSceneEntries.push({
                    key: `layer-${layerObj.type}-${layerObj.code}-${layerObj.zIndex}-${index}-${sourceIndex}`,
                    src,
                    zIndex: layerObj.zIndex + sourceIndex * 0.01,
                });
            });
            return;
        }

        if (imageSource) {
            resolvedSceneEntries.push({
                key: `layer-${layerObj.type}-${layerObj.code}-${layerObj.zIndex}-${index}`,
                src: imageSource,
                zIndex: layerObj.zIndex,
            });
        }
    });

    return (
        <BufferedLayerScene
            entries={resolvedSceneEntries}
            dynamicStyle={dynamicStyle}
            bodySource={kurta_body}
            handsSource={handsImage}
        />
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
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 150,
        backgroundColor: 'rgba(255,255,255,0.28)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingOverlayOpaque: {
        backgroundColor: 'rgba(255,255,255,0.92)',
    }
});
