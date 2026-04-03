// src/customizers/Kurta/components/KurtaFolded.js

import React, { useState, useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';

// ENGINE & DATA IMPORTS
import { KURTA_RENDERS } from '../../../Data/dummyData';

// --- FLICKER-FREE LAYER COMPONENT ---
const SmartLayer = ({ src, zIndex }) => {
    const [displaySrc, setDisplaySrc] = useState(src);

    useEffect(() => {
        let isMounted = true;
        if (src && src !== displaySrc) {
            Image.prefetch(Image.resolveAssetSource(src).uri)
                .then(() => { if (isMounted) setDisplaySrc(src); })
                .catch(() => { if (isMounted) setDisplaySrc(src); }); // Fallback
        } else if (!src) {
            setDisplaySrc(null);
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

export default function KurtaFolded({ selections, selectedFabric }) {

    // --- ENGINE: Folded View (Style Images) Logic ---
    const getFoldedLayerCodes = () => {
        const shirtCollars = ["CR", "CB", "CT", "CS", "CE"];
        const mandarinCollars = ["CM", "CC"];

        const getFoldedBase = (collar) => {
            if (shirtCollars.includes(collar)) return "BASE";        // Shirt Collar -> Pathani folded base
            if (collar === "CC") return "BASE_C";                  // Chinese Collar
            if (mandarinCollars.includes(collar)) return "BASE_M";   // Mandarin Collar
            return "BASE_R";                                        // Round neck default
        };

        const getFoldedPlacket = (foldedBase, placketStyle) => {
            if (foldedBase === "BASE_R") return `${placketStyle}R`; // Round neck matching placket (NSR/QSR)
            if (foldedBase === "BASE_C") return `${placketStyle}C`; // Chinese collar matching placket (NSC/QSC)
            return `${placketStyle}0`;                                // Pathani/Mandarin style placket (NS0/QS0)
        };

        let layersToRender = [];

        // 1. FOLDED BASE
        const foldedBase = getFoldedBase(selections.collar);
        layersToRender.push({ code: foldedBase, zIndex: 10 });

        // 2. FOLDED PLACKET
        const foldedPlacket = getFoldedPlacket(foldedBase, selections.placketStyle);
        layersToRender.push({ code: foldedPlacket, zIndex: 20 });

        // 3. FOLDED COLLAR
        layersToRender.push({ code: selections.collar, zIndex: 50 });

        // 4. FOLDED SLEEVES & CUFFS
        if (selections.sleeve === "SN") {
            layersToRender.push({ code: "SN", zIndex: 40 });
        } else if (selections.sleeve === "SC") {
            layersToRender.push({ code: "SC", zIndex: 40 });
            if (selections.cuffStyle) {
                layersToRender.push({ code: selections.cuffStyle, zIndex: 41 }); // UN1, UR1, US1 etc.
            }
        }

        // 5. FOLDED POCKET & FLAP LAYERS (same mapping as full body)
        if (selections.pocketQty !== "00") {
            layersToRender.push({ code: `R${selections.pocketShape}`, zIndex: 30 });
            if (selections.flapYes === "1") {
                layersToRender.push({ code: `FR${selections.flapShape}`, zIndex: 31 });
            }
            if (selections.pocketQty === "11") {
                layersToRender.push({ code: `L${selections.pocketShape}`, zIndex: 32 });
                if (selections.flapYes === "1") {
                    layersToRender.push({ code: `FL${selections.flapShape}`, zIndex: 33 });
                }
            }
        }

        // 6. FOLDED EPAULETTE
        if (selections.epaulette === "SE") {
            layersToRender.push({ code: "SE", zIndex: 35 });
        }

        return layersToRender;
    };

    // 3. Selected Fabric ke 'style' (Folded) folder dhoondho
    const fabricStyleRenders = KURTA_RENDERS[selectedFabric.fabricID]?.style || {};

    return (
        <View style={styles.container}>
            {/* Dynamic Folded Garment Layers (Z-Index 10 se 90 tak) */}
            {getFoldedLayerCodes().map((layerObj, index) => {
                const imageSource = fabricStyleRenders[layerObj.code];

                if (!imageSource) return null; // Agar image folder mein nahi hai, toh chhod do

                return (
                    <SmartLayer
                        key={`folded-${layerObj.code}-${index}`}
                        src={imageSource}
                        zIndex={layerObj.zIndex}
                    />
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#EAEAEA', // Same as background so it blends
    },
    modelLayer: {
        position: 'absolute',
        width: '100%',
        height: '90%', // Thoda chhota taaki details saaf dikhein
    }
});