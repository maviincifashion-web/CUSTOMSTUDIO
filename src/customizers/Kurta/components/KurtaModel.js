import React, { useState, useEffect, useRef } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { useResponsive } from '../../../../hooks/useResponsive';

// ENGINE & DATA IMPORTS
import { KURTA_RENDERS, EMBROIDERY_RENDERS, PAJAMA_RENDERS, SADRI_RENDERS, COAT_RENDERS } from '../../../Data/dummyData';
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
        if (!src) return;

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
    if (coatType === 'JH') return [];

    if (slideIndex === 0) {
        if (coatType === '1B' || coatType === '2B') return [`BC-${coatType}-F`];
        if (JODHPURI_TYPES.includes(coatType)) return ['BC-JH-F'];
    }

    if (slideIndex === 4) {
        const codes = [];
        if (coatType === '1B' || coatType === '2B') codes.push(`BC-${coatType}-S`);
        else if (JODHPURI_TYPES.includes(coatType)) codes.push('BC-JH-S');
        codes.push('BCS-S');
        return codes;
    }

    if (slideIndex === 5) {
        return ['BCS-B'];
    }

    return [];
};

export default function KurtaModel({ selections, selectedFabric, selectedButton, selectedSadriButton, selectedCoatButton, selectedPajamaFabric, selectedSadriFabric, hasCoat = false, hasSadri, sadriCode, slideIndex = 0 }) {
    const { isMobile, isTablet, isDesktop } = useResponsive();

    // SAFETY CHECK: Jab tak data ready na ho, model render mat karo
    if (!selections || !selectedFabric) return null;

    // Yahan aap apne screens ke hisab se width/height aur margins edit kar sakte hain
    const getDynamicModelStyle = () => {
        // # MOBILE SCREEN
        if (isMobile) {
            return {
                width: '105%',
                height: '95%',
                marginBottom: 15
            };
        }
        // # TABLET SCREEN
        if (isTablet) {
            return {
                width: '100%',
                height: '93%',
                marginBottom: 10
            };
        }
        // # TV SCREEN (Commercial Display)
        if (isDesktop) {
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

    const coatRenderSet = COAT_RENDERS['FAB_001'] || { display: {}, style: {} };
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
        sadriLayers = getSadriLayerCodes(sadriCode, selections, selectedSadriButton, 0, slideIndex) || [];
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
    const fabricRenders = KURTA_RENDERS[selectedFabric.fabricID]?.display || {};
    // Pajama renders by fabricID (same fabric can have a matching pajama render)
    const pajamaRenders = PAJAMA_RENDERS[selectedPajamaFabric?.fabricID]?.display || {};
    // Sadri renders by fabricID, fallback to FAB_001 until all fabrics are mapped
    const sadriRenders = SADRI_RENDERS[selectedSadriFabric?.fabricID]?.display || SADRI_RENDERS["FAB_001"]?.display || {};

    return (
        <View style={styles.container}>
            {/* 1. Nanga Ladka (Z-Index: 1) */}
            <Image source={kurta_body} style={[styles.modelLayer, dynamicStyle, { zIndex: 1 }]} resizeMode="contain" />

            {/* 2. Kapde ki Layers (Z-Index: 10 se 90) */}
            {layersToRender.map((layerObj) => {
                if (!layerObj || !layerObj.code) return null;

                // Resolve image based on type
                let imageSource = null;
                if (layerObj.type === 'button') {
                    imageSource = selectedButton?.renders?.[layerObj.code];
                } else if (layerObj.type === 'embroidery') {
                    imageSource = EMBROIDERY_RENDERS[layerObj.collectionID]?.display?.[layerObj.code];
                } else if (layerObj.type === 'sadri_embroidery_left') {
                    imageSource = EMBROIDERY_RENDERS[layerObj.collectionID]?.sadriChestLeft?.[layerObj.code];
                } else if (layerObj.type === 'sadri_embroidery_right') {
                    imageSource = EMBROIDERY_RENDERS[layerObj.collectionID]?.sadriChestRight?.[layerObj.code];
                } else if (layerObj.type === 'pajama') {
                    imageSource = pajamaRenders[layerObj.code];
                } else if (layerObj.type === 'sadri_button') {
                    imageSource = selectedSadriButton?.renders?.[layerObj.code];
                } else if (layerObj.type === 'sadri_fabric') {
                    imageSource = sadriRenders[layerObj.code];
                } else if (layerObj.type === 'coat_display') {
                    imageSource = coatDisplayRenders[layerObj.code];
                } else if (layerObj.type === 'coat_button') {
                    imageSource = selectedCoatButton?.renders?.[layerObj.code];
                } else {
                    imageSource = fabricRenders[layerObj.code];
                }

                return (
                    <SmartLayer
                        key={`layer-${layerObj.type}-${layerObj.zIndex}`}
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