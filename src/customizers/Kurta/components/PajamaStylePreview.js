import React from 'react';
import { View, Image as RNImage, StyleSheet, ActivityIndicator } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useFirebaseCatalog } from '../../../context/FirebaseCatalogContext';
import { pickFabricRenderEntry } from '../../../firebase/catalogApi';
import { useResponsive } from '../../../../hooks/useResponsive';
import pajama_body from '../../../../assets/images/pajama_body/pajama_body.webp';
import { useBufferedRenderScene } from './useBufferedRenderScene';

export default function PajamaStylePreview({ selections, selectedPajamaFabric }) {
    const { pajamaRenders: PAJAMA_RENDERS } = useFirebaseCatalog();
    const { isMobile, isTablet, isDesktop, width } = useResponsive();

    const pajamaType = selections?.pajamaType || "PJ";
    const beltType = selections?.beltType || "R";


    // Yahan aap apne screens ke hisab se width/height 
    // manually edit kar sakte hain taaki testing aasan ho.
    const getDynamicPajamaStyle = () => {
        // # MOBILE SCREEN
        if (isMobile) {
            return {
                width: width * 2.0,
                height: width * 2.0,
                marginBottom: 25,
            };
        }
        // # TABLET SCREEN
        if (isTablet) {
            return {
                width: width * 1.52,
                height: width * 1.52,
                marginBottom: 25,
            };
        }
        // # TV SCREEN (Commercial Display)
        if (isDesktop) {
            return {
                width: width * 1.2, // Portrait screen ke liye ise change karein
                height: width * 1.2,
            };
        }
        return {};
    };

    const dynamicStyle = getDynamicPajamaStyle();

    // Same logic as KurtaFolded to get the unified style image code
    const pajamaStyleCode = (pajamaType === 'PP' || pajamaType === 'PB')
        ? pajamaType                         // e.g. "PB"
        : `${pajamaType}-${beltType}`;       // e.g. "PA-E"

    const pajamaEntry = pickFabricRenderEntry(PAJAMA_RENDERS, selectedPajamaFabric);
    const selectedPajamaRenderMap = pajamaEntry?.style && Object.keys(pajamaEntry.style).length > 0 ? pajamaEntry.style : null;
    const defaultPajamaRenderMap = PAJAMA_RENDERS['FAB_001']?.style || {};
    const pajamaStyleRenders =
        selectedPajamaRenderMap && Object.keys(selectedPajamaRenderMap).length > 0
            ? selectedPajamaRenderMap
            : defaultPajamaRenderMap;
    const imageSource = selectedPajamaFabric
        ? pajamaStyleRenders[pajamaStyleCode] || defaultPajamaRenderMap[pajamaStyleCode] || null
        : null;
    const nextSceneEntries = imageSource ? [{ key: `pajama-${pajamaStyleCode}`, src: imageSource, zIndex: 2 }] : [];
    const { displayEntries, isLoading, hasCommittedScene } = useBufferedRenderScene(nextSceneEntries);
    const displaySource = displayEntries[0]?.src || null;

    if (!selectedPajamaFabric) return null;

    return (
        <View style={styles.container}>
            <RNImage
                source={pajama_body}
                style={[styles.image, styles.bodyImage, dynamicStyle]}
                resizeMode="contain"
            />
            {displaySource ? (
                <ExpoImage
                    source={displaySource}
                    style={[styles.image, dynamicStyle]}
                    contentFit="contain"
                    cachePolicy="memory-disk"
                    transition={0}
                />
            ) : (
                <View style={[styles.image, dynamicStyle, { backgroundColor: 'transparent' }]} />
            )}
            {isLoading ? (
                <View style={[styles.loadingOverlay, !hasCommittedScene && styles.loadingOverlayOpaque]}>
                    <ActivityIndicator size="large" color="#1f2937" />
                </View>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        transform: [{ translateY: -18 }],
    },
    // Default image style. dynamicStyle ise overwrite karega.
    image: {
        width: 300,
        height: 300,
        zIndex: 2,
    },
    bodyImage: {
        position: 'absolute',
        zIndex: 1,
    },
    imageOverlay: {
        position: 'absolute',
        opacity: 0,
        zIndex: 3,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 4,
        backgroundColor: 'rgba(255,255,255,0.28)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingOverlayOpaque: {
        backgroundColor: 'rgba(255,255,255,0.92)',
    },
});
