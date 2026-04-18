import React, { useState, useEffect, useRef } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { useResponsive } from '../../../../hooks/useResponsive';

// ENGINE & DATA IMPORTS
import { useFirebaseCatalog } from '../../../context/FirebaseCatalogContext';
import { pickFabricRenderEntry } from '../../../firebase/catalogApi';
import { getKurtaLayerCodes, getSadriLayerCodes } from '../../../Functions/layerEngine';

// ASSETS IMPORTS
import kurta_body from '../../../../assets/images/body/kurta_body.webp';
import kurta_hand_n from '../../../../assets/images/body/kurta_hand_n.webp';
import kurta_hand_c from '../../../../assets/images/body/kurta_hand_c.webp';


const SmartLayer = ({ src, zIndex, dynamicStyle }) => {
    const [displaySrc, setDisplaySrc] = useState(src || null);
    const [pendingSrc, setPendingSrc] = useState(null);
    const [pendingToken, setPendingToken] = useState(0);
    const tokenRef = useRef(0);

    useEffect(() => {
        if (!src) {
            setDisplaySrc(null);
            setPendingSrc(null);
            return;
        }

        if (!displaySrc) {
            setDisplaySrc(src);
            return;
        }

        if (src !== displaySrc && src !== pendingSrc) {
            tokenRef.current += 1;
            setPendingSrc(src);
            setPendingToken(tokenRef.current);
        }
    }, [src, displaySrc, pendingSrc]);

    if (!displaySrc) return null;

    return (
        <>
            <Image
                source={displaySrc}
                style={[styles.modelLayer, dynamicStyle, { zIndex: zIndex }]}
                resizeMode="contain"
            />
            {pendingSrc ? (
                <Image
                    key={`pending-${pendingToken}`}
                    source={pendingSrc}
                    style={[styles.modelLayer, dynamicStyle, { zIndex: zIndex, opacity: 0 }]}
                    resizeMode="contain"
                    onLoad={() => {
                        if (pendingToken === tokenRef.current) {
                            setDisplaySrc(pendingSrc);
                            setPendingSrc(null);
                        }
                    }}
                    onError={() => {
                        if (pendingToken === tokenRef.current) {
                            setDisplaySrc(pendingSrc);
                            setPendingSrc(null);
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

const makeEmbSelectionKey = (value) => {
    const typeKey = normalizeEmbKey(value?.type);
    const docId = normalizeEmbKey(value?.id);
    return typeKey && docId ? `${typeKey}::${docId}` : '';
};

const collectionValueMatchesLayer = (value, layerObj) => {
    const typeKey = normalizeEmbKey(value?.type);
    if (!typeKey) return false;
    const isSadri = String(layerObj?.type || '').startsWith('sadri_embroidery_');

    if (isSadri) {
        return typeKey.endsWith('_sadri_base');
    }

    if (layerObj?.part === 'Collar') return typeKey.endsWith('_collar') || typeKey.endsWith('_lapel');
    if (layerObj?.part === 'Sleeve') return typeKey.endsWith('_sleeve');
    if (layerObj?.part === 'Chest') return typeKey.endsWith('_base');
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
    const hasCollection = Array.isArray(collection?.matchingValues) && collection.matchingValues.length > 0;
    if (!hasCollection) {
        const single =
            layerObj.type === 'embroidery'
                ? bundle.display?.[layerObj.code]
                : layerObj.type === 'sadri_embroidery_left'
                    ? bundle.sadriChestLeft?.[layerObj.code]
                    : layerObj.type === 'sadri_embroidery_right'
                        ? bundle.sadriChestRight?.[layerObj.code]
                        : null;
        return single ? [single] : [];
    }

    const values = collection.matchingValues.filter((value) => collectionValueMatchesLayer(value, layerObj));
    const bySelectionKey = bundle.uploadsBySelectionKey || {};
    const sources = [];
    for (const value of values) {
        const uploadBundle = bySelectionKey[makeEmbSelectionKey(value)];
        if (!uploadBundle) continue;
        if (layerObj.type === 'embroidery' && uploadBundle.display?.[layerObj.code]) {
            appendUniqueSource(sources, uploadBundle.display[layerObj.code]);
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
                width: '120%', // Portrait screen ke liye thoda chauda dikhane ke liye
                height: '120%',
                marginBottom: 0
            };
        }
        return {};
    };

    const dynamicStyle = getDynamicModelStyle();

    const handsImage = selections.sleeve === "SC" ? kurta_hand_c : kurta_hand_n;

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

    // ENGINE KO BULAO: Sadri Arrays
    let sadriLayers = [];
    if (hasSadri && (slideIndex === 0 || slideIndex === 4 || slideIndex === 5)) {
        sadriLayers = getSadriLayerCodes(sadriCode, selections, selectedSadriButton, 0, slideIndex, EMBROIDERY_RENDERS) || [];
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

    const layersToRender = [...kurtaLayers, ...sadriLayers, ...coatDisplayLayers, ...coatDisplayButtonLayers].sort((a, b) => a.zIndex - b.zIndex);

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
            <Image source={kurta_body} style={[styles.modelLayer, dynamicStyle, { zIndex: 1 }]} resizeMode="contain" />

            {/* 2. Kapde ki Layers (Z-Index: 10 se 90) */}
            {layersToRender.map((layerObj, index) => {
                if (!layerObj || !layerObj.code) return null;

                // Resolve image based on type
                let imageSource = null;
                let imageSources = null;
                if (layerObj.type === 'button') {
                    imageSource = selectedButton?.renders?.[layerObj.code];
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
                    imageSource = selectedCoatButton?.renders?.[layerObj.code];
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
