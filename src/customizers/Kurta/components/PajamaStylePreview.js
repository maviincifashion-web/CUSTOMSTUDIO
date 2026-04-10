import React, { useEffect, useRef, useState } from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';
import { PAJAMA_RENDERS } from '../../../Data/dummyData';

const { width } = Dimensions.get('window');

export default function PajamaStylePreview({ selections, selectedPajamaFabric }) {
    if (!selectedPajamaFabric) return null;

    const pajamaType = selections.pajamaType || "PJ";
    const beltType = selections.beltType || "R";

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
                    style={styles.image}
                    resizeMode="contain"
                />
            ) : (
                <View style={[styles.image, { backgroundColor: 'transparent' }]} />
            )}
            {pendingSource ? (
                <Image
                    key={`pending-${pendingToken}`}
                    source={pendingSource}
                    style={[styles.image, styles.imageOverlay]}
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
    image: {
        width: width * 1.9,
        height: width * 1.9,
    },
    imageOverlay: {
        position: 'absolute',
        opacity: 0,
    },
});
