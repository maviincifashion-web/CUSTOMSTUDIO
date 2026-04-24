import React, { useState, useEffect, useRef } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { useResponsive } from '../../../../hooks/useResponsive';

// ENGINE & DATA IMPORTS
import { useFirebaseCatalog } from '../../../context/FirebaseCatalogContext';
import { pickFabricRenderEntry } from '../../../firebase/catalogApi';
import { getKurtaLayerCodes, getSadriLayerCodes } from '../../../Functions/layerEngine';
import { getKurtaModelEmbroideryLayers } from './KurtaEmbroideryLayers';

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


const SmartLayer = ({ src, zIndex, dynamicStyle }) => {
    const sourceKey = typeof src === 'number'
        ? `r:${src}`
        : (src?.uri ? `u:${src.uri}` : '');
    const [displaySrc, setDisplaySrc] = useState(src || null);
    const [pendingSrc, setPendingSrc] = useState(null);
    const [pendingToken, setPendingToken] = useState(0);
    const tokenRef = useRef(0);
    const pendingSrcRef = useRef(null);

    useEffect(() => {
        if (!src || !sourceKey) {
            setPendingSrc(null);
            pendingSrcRef.current = null;
            return;
        }

        const displayKey = typeof displaySrc === 'number'
            ? `r:${displaySrc}`
            : (displaySrc?.uri ? `u:${displaySrc.uri}` : '');
        const pendingKey = typeof pendingSrc === 'number'
            ? `r:${pendingSrc}`
            : (pendingSrc?.uri ? `u:${pendingSrc.uri}` : '');

        if (src?.uri) {
            Image.prefetch(src.uri).catch(() => { });
        }

        if (!displaySrc) {
            setDisplaySrc(src);
            return;
        }

        if (sourceKey !== displayKey && sourceKey !== pendingKey) {
            tokenRef.current += 1;
            setPendingSrc(src);
            pendingSrcRef.current = src;
            setPendingToken(tokenRef.current);
        }
    }, [src, sourceKey, displaySrc, pendingSrc]);

    if (!displaySrc) return null;

    return (
        <>
            <Image
                source={displaySrc}
                style={[styles.modelLayer, dynamicStyle, { zIndex: zIndex }]}
                resizeMode="contain"
                fadeDuration={0}
            />
            {pendingSrc ? (
                <Image
                    key={`pending-${pendingToken}`}
                    source={pendingSrc}
                    style={[styles.modelLayer, dynamicStyle, { zIndex: zIndex, opacity: 0 }]}
                    resizeMode="contain"
                    fadeDuration={0}
                    onLoad={() => {
                        if (pendingToken === tokenRef.current) {
                            setDisplaySrc(pendingSrcRef.current || pendingSrc);
                            setPendingSrc(null);
                            pendingSrcRef.current = null;
                        }
                    }}
                    onError={() => {
                        if (pendingToken === tokenRef.current) {
                            setPendingSrc(null);
                            pendingSrcRef.current = null;
                        }
                    }}
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

const getDisplayCoatCodes = (selections = {}) => {
    const coatType = selections.coatType || '1B';
    if (coatType === 'JH' || coatType === 'JR' || coatType === 'JS') {
        return [coatType, 'UP1'];
    }
    if (coatType === 'JO') {
        return [coatType];
    }

    const lapelCode = selections.coatLapel || 'N';
    const collarGroup = getCoatCollarGroup(selections.collar);
    const collarCode = `${coatType === '2B' ? 'C2' : 'C1'}-${collarGroup}`;
    const lapelLayerCode = `${coatType === '2B' ? 'L2' : 'L1'}-${lapelCode}`;

    return [
        `${coatType}-${lapelCode}-${collarGroup}`,
        collarCode,
        'UP1',
        lapelLayerCode,
    ];
};

const getStyleFrontCoatCodes = (selections = {}) => {
    const coatType = selections.coatType || '1B';
    if (coatType === 'JH' || coatType === 'JR' || coatType === 'JS') {
        return [coatType, 'UP1'];
    }
    if (coatType === 'JO') {
        return [coatType];
    }

    const lapelCode = selections.coatLapel || 'N';
    const collarCode = coatType === '2B' ? 'C2' : 'C1';
    const lapelLayerCode = `${coatType === '2B' ? 'L2' : 'L1'}-${lapelCode}`;

    return [
        `${coatType}-${lapelCode}`,
        collarCode,
        'UP1',
        lapelLayerCode,
    ];
};

const getStyleBackCoatCodes = (selections = {}) => {
    const coatType = selections.coatType || 'JO';
    const ventCode = selections.coatBackStyle || 'NV';

    if (coatType === 'JH') return [`JH-${ventCode}`];
    return [ventCode];
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
    }
    return sources;
};

export default function KurtaModel({ selections, selectedFabric, selectedButton, selectedSadriButton, selectedCoatButton, selectedPajamaFabric, selectedSadriFabric, selectedCoatFabric, hasCoat = false, hasSadri, sadriCode, slideIndex = 0, selectedSkinTone = 1 }) {
    const { isMobile, isTablet, isDesktop } = useResponsive();
    const {
        kurtaRenders: KURTA_RENDERS,
        pajamaRenders: PAJAMA_RENDERS,
        sadriRenders: SADRI_RENDERS,
        coatRenders: COAT_RENDERS,
        embroideryRenders: EMBROIDERY_RENDERS,
    } = useFirebaseCatalog();

    // SAFETY CHECK: Jab tak data ready na ho, model render mat karo
    if (!selections || !selectedFabric) return null;

    // Yahan aap apne screens ke hisab se width/height aur margins edit kar sakte hain
    const getDynamicModelStyle = () => {
        const isSadriLastSlide = hasSadri && !hasCoat && slideIndex === 4;

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
            return {
                width: '115%', // Increased from 120%
                height: '115%', // Increased from 120%
                marginBottom: 60
            };
        }
        return {};
    };

    const dynamicStyle = getDynamicModelStyle();

    const bodyImage = KURTA_BODY_BY_TONE[selectedSkinTone] || kurta_body;
    const handsImage = selections.sleeve === "SC"
        ? (KURTA_HANDS_CUFF_BY_TONE[selectedSkinTone] || kurta_hand_c)
        : (KURTA_HANDS_NONCUFF_BY_TONE[selectedSkinTone] || kurta_hand_n);

    const coatFabricId = selectedCoatFabric?.fabricID || 'FAB_001';
    const coatRenderSet =
        pickFabricRenderEntry(COAT_RENDERS, selectedCoatFabric) ||
        COAT_RENDERS[coatFabricId] ||
        COAT_RENDERS['FAB_001'] ||
        { display: {}, style: {} };
    const coatDisplayRenders = coatRenderSet.display || {};
    const coatStyleRenders = coatRenderSet.style || {};

    if (hasCoat && (slideIndex === 4 || slideIndex === 5)) {
        const coatCodes = slideIndex === 4 ? getStyleFrontCoatCodes(selections) : getStyleBackCoatCodes(selections);
        const coatButtonCodes = getCoatButtonCodes(selections, slideIndex);
        return (
            <View style={styles.container}>
                {coatCodes.map((code, idx) => (
                    <SmartLayer
                        key={`coat-style-${code}-${idx}`}
                        src={coatStyleRenders[code]}
                        zIndex={20 + idx}
                        dynamicStyle={dynamicStyle}
                    />
                ))}
                {coatButtonCodes.map((code, idx) => (
                    <SmartLayer
                        key={`coat-style-button-${code}-${idx}`}
                        src={selectedCoatButton?.renders?.[code]}
                        zIndex={40 + idx}
                        dynamicStyle={dynamicStyle}
                    />
                ))}
            </View>
        );
    }

    // ENGINE KO BULAO: Kurta Arrays
    const kurtaLayers = getKurtaLayerCodes(selections, selectedButton, 0, slideIndex, hasCoat, hasSadri, sadriCode) || [];
    const kurtaBaseLayers = kurtaLayers.filter((layer) => layer?.type !== 'embroidery');
    const kurtaEmbroideryLayers = getKurtaModelEmbroideryLayers(selections, kurtaBaseLayers);

    // ENGINE KO BULAO: Sadri Arrays
    let sadriLayers = [];
    if (hasSadri && (slideIndex === 0 || slideIndex === 4 || slideIndex === 5)) {
        const sadriViewMode = slideIndex === 4 ? 1 : 0;
        sadriLayers = getSadriLayerCodes(sadriCode, selections, selectedSadriButton, sadriViewMode, slideIndex, EMBROIDERY_RENDERS) || [];
    }

    const coatDisplayLayers = hasCoat && slideIndex === 0
        ? getDisplayCoatCodes(selections).map((code, idx) => ({
            code,
            zIndex: 85 + idx,
            type: 'coat_display'
        }))
        : [];
    const coatDisplayButtonLayers = hasCoat && slideIndex === 0
        ? getCoatButtonCodes(selections, 0).map((code, idx) => ({
            code,
            zIndex: 92 + idx,
            type: 'coat_button'
        }))
        : [];

    const layersToRender = [...kurtaBaseLayers, ...kurtaEmbroideryLayers, ...sadriLayers, ...coatDisplayLayers, ...coatDisplayButtonLayers].sort((a, b) => a.zIndex - b.zIndex);

    // DATABASE: Us kapde ki saari images yahan se nikalo
    const fabricRenders = pickFabricRenderEntry(KURTA_RENDERS, selectedFabric)?.display || {};
    // Pajama renders by fabricID (same fabric can have a matching pajama render)
    const pajamaRenders = pickFabricRenderEntry(PAJAMA_RENDERS, selectedPajamaFabric)?.display || {};
    // Sadri renders by fabricID, fallback to FAB_001 until all fabrics are mapped
    const sadriRenders =
        pickFabricRenderEntry(SADRI_RENDERS, selectedSadriFabric)?.display ||
        SADRI_RENDERS['FAB_001']?.display ||
        {};

    return (
        <View style={styles.container}>
            {/* 1. Nanga Ladka (Z-Index: 1) */}
            <Image source={bodyImage} style={[styles.modelLayer, dynamicStyle, { zIndex: 1 }]} resizeMode="contain" />

            {/* 2. Kapde ki Layers (Z-Index: 10 se 90) */}
            {layersToRender.map((layerObj, index) => {
                if (!layerObj || !layerObj.code) return null;

                // Resolve image based on type
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
                } else if (layerObj.type === 'pajama') {
                    imageSource = pajamaRenders[layerObj.code];
                } else if (layerObj.type === 'sadri_button') {
                    imageSource = selectedSadriButton?.renders?.[layerObj.code];
                } else if (layerObj.type === 'sadri_fabric') {
                    imageSource = pickWithSadriSuffixFallback(sadriRenders, layerObj.code);
                } else if (layerObj.type === 'coat_display') {
                    imageSource = coatDisplayRenders[layerObj.code];
                } else if (layerObj.type === 'coat_button') {
                    imageSource = selectedCoatButton?.renders?.[layerObj.code]
                        || selectedCoatButton?.renders?.[layerObj.code.replace(/-[FS]$/, '')];
                } else {
                    imageSource = fabricRenders[layerObj.code];
                }

                if (Array.isArray(imageSources) && imageSources.length > 0) {
                    return imageSources.map((src, sourceIndex) => (
                        <SmartLayer
                            key={`layer-${layerObj.type}-${layerObj.code}-${layerObj.zIndex}-${index}-${sourceIndex}`}
                            src={src}
                            zIndex={layerObj.zIndex + sourceIndex * 0.01}
                            dynamicStyle={dynamicStyle}
                        />
                    ));
                }

                return (
                    <SmartLayer
                        key={`layer-${layerObj.type}-${layerObj.code}-${layerObj.zIndex}-${index}`}
                        src={imageSource}
                        zIndex={layerObj.zIndex}
                        dynamicStyle={dynamicStyle}
                    />
                );
            })}

            {/* 3. Hands Overlay (Z-Index: 100) */}
            <Image source={handsImage} style={[styles.modelLayer, dynamicStyle, { zIndex: 100 }]} resizeMode="contain" />

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
    }
});
