import React, { useEffect, useRef, useState } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { PAJAMA_RENDERS } from '../../../Data/dummyData';
import { useResponsive } from '../../../../hooks/useResponsive';

export default function PajamaStylePreview({ selections, selectedPajamaFabric }) {
    const { isMobile, isTablet, isDesktop, width } = useResponsive();

    if (!selectedPajamaFabric) return null;

    const pajamaType = selections.pajamaType || "PJ";
    const beltType = selections.beltType || "R";

    // Yahan aap apne screens ke hisab se width/height 
    // manually edit kar sakte hain taaki testing aasan ho.
    const getDynamicPajamaStyle = () => {
        // # MOBILE SCREEN
        if (isMobile) {
            return {
                width: width * 1.9,
                height: width * 1.9,
            };
        }
        // # TABLET SCREEN
        if (isTablet) {
            return {
                width: width * 1.5,
                height: width * 1.5,
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

    const pajamaStyleRenders = PAJAMA_RENDERS[selectedPajamaFabric.fabricID]?.style || {};
    const imageSource = pajamaStyleRenders[pajamaStyleCode];
    const [displaySource, setDisplaySource] = useState(imageSource || null);
    const [pendingSource, setPendingSource] = useState(null);
    const [pendingToken, setPendingToken] = useState(0);
    const tokenRef = useRef(0);

    useEffect(() => {
        if (!imageSource) return;

        if (!displaySource) {
            setDisplaySource(imageSource);
            return;
        }

        if (imageSource !== displaySource && imageSource !== pendingSource) {
            tokenRef.current += 1;
            setPendingSource(imageSource);
            setPendingToken(tokenRef.current);
        }
    }, [imageSource, displaySource, pendingSource]);

    return (
        <View style={styles.container}>
            {displaySource ? (
                <Image
                    source={displaySource}
                    style={[styles.image, dynamicStyle]}
                    resizeMode="contain"
                />
            ) : (
                <View style={[styles.image, dynamicStyle, { backgroundColor: 'transparent' }]} />
            )}
            {pendingSource ? (
                <Image
                    key={`pending-${pendingToken}`}
                    source={pendingSource}
                    style={[styles.image, dynamicStyle, styles.imageOverlay]}
                    resizeMode="contain"
                    onLoad={() => {
                        if (pendingToken === tokenRef.current) {
                            setDisplaySource(pendingSource);
                            setPendingSource(null);
                        }
                    }}
                    onError={() => {
                        if (pendingToken === tokenRef.current) {
                            setDisplaySource(pendingSource);
                            setPendingSource(null);
                        }
                    }}
                />
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
    },
    // Default image style. dynamicStyle ise overwrite karega.
    image: {
        width: 300,
        height: 300,
    },
    imageOverlay: {
        position: 'absolute',
        opacity: 0,
    },
});
