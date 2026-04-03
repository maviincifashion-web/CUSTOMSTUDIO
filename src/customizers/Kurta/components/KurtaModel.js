import React, { useState, useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';

// ENGINE & DATA IMPORTS
import { KURTA_RENDERS } from '../../../Data/dummyData';
import { getKurtaLayerCodes } from '../../../Functions/layerEngine';

// ASSETS IMPORTS
import kurta_body from '../../../../assets/images/body/kurta_body.webp';
import kurta_hand_n from '../../../../assets/images/body/kurta_hand_n.webp';
import kurta_hand_c from '../../../../assets/images/body/kurta_hand_c.webp';
import pajama_body from '../../../../assets/images/body/pajama_body.webp';


const SmartLayer = ({ src, zIndex }) => {
    const [displaySrc, setDisplaySrc] = useState(src);

    useEffect(() => {
        let isMounted = true;
        if (src && src !== displaySrc) {
            // FIX: typeof string matab network url hai, number matlab local require hai
            if (typeof src === 'number') {
                setDisplaySrc(src);
            } else {
                Image.prefetch(Image.resolveAssetSource(src).uri)
                    .then(() => { if (isMounted) setDisplaySrc(src); })
                    .catch(() => { if (isMounted) setDisplaySrc(src); });
            }
        } else if (!src) {
            if (isMounted) setDisplaySrc(null);
        }
        return () => { isMounted = false; };
    }, [src, displaySrc]);

    if (!displaySrc) return null;

    return (
        <Image
            source={displaySrc}
            style={[styles.modelLayer, { zIndex: zIndex }]}
            resizeMode="contain"
        />
    );
};

export default function KurtaModel({ selections, selectedFabric }) {

    // SAFETY CHECK: Jab tak data ready na ho, model render mat karo
    if (!selections || !selectedFabric) return null;

    const handsImage = selections.sleeve === "SC" ? kurta_hand_c : kurta_hand_n;

    // ENGINE KO BULAO: Ye function wo list (array) dega jo kapde pehnne hain
    const layersToRender = getKurtaLayerCodes(selections) || [];

    // DATABASE: Us kapde ki saari images yahan se nikalo
    const fabricRenders = KURTA_RENDERS[selectedFabric.fabricID]?.display || {};

    return (
        <View style={styles.container}>
            {/* 1. Nanga Ladka (Z-Index: 1) */}
            <Image source={kurta_body} style={[styles.modelLayer, { zIndex: 1 }]} resizeMode="contain" />

            <Image source={pajama_body} style={[styles.modelLayer, { zIndex: 1 }]} resizeMode="contain" />

            {/* 2. Kapde ki Layers (Z-Index: 10 se 90) */}
            {layersToRender.map((layerObj, index) => {
                if (!layerObj || !layerObj.code) return null;

                const imageSource = fabricRenders[layerObj.code];
                if (!imageSource) return null;

                return (
                    <SmartLayer
                        key={`layer-${layerObj.code}-${index}`}
                        src={imageSource}
                        zIndex={layerObj.zIndex}
                    />
                );
            })}

            {/* 3. Hands Overlay (Z-Index: 100) */}
            <Image source={handsImage} style={[styles.modelLayer, { zIndex: 100 }]} resizeMode="contain" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modelLayer: {
        position: 'absolute',
        width: '100%',
        height: '115%',
        marginTop: 60
    }
});