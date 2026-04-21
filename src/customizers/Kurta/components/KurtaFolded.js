// src/customizers/Kurta/components/KurtaFolded.js

import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Image as ExpoImage } from 'expo-image';

// ENGINE & DATA IMPORTS
import { useFirebaseCatalog } from '../../../context/FirebaseCatalogContext';
import { pickFabricRenderEntry } from '../../../firebase/catalogApi';
import { getKurtaFoldedEmbroideryLayers } from './KurtaEmbroideryLayers';
import { useBufferedRenderScene } from './useBufferedRenderScene';

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

const collectionValueMatchesFoldedPart = (value, layerObj) => {
    const placement = parseEmbroideryValuePlacement(value);
    if (!placement.garment && !placement.part) return false;
    const sourceParts = Array.isArray(layerObj?.sourceParts) ? layerObj.sourceParts.map(normalizeEmbKey) : [];
    if (sourceParts.length > 0) {
        const normalizedPart = placement.part === 'lapel' ? 'collar' : placement.part;
        return sourceParts.includes(normalizedPart) || (placement.part === 'lapel' && sourceParts.includes('lapel'));
    }

    if (layerObj?.part === 'Collar') return placement.part === 'collar' || placement.part === 'lapel';
    if (layerObj?.part === 'Sleeve') return placement.part === 'sleeve';
    if (layerObj?.part === 'Cuff') return placement.part === 'cuff' || placement.part === 'sleeve';
    if (layerObj?.part === 'Pocket') return placement.part === 'pocket';
    if (layerObj?.part === 'Flap') return placement.part === 'flap' || placement.part === 'pocket';
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

const getFoldedEmbroideryCodeCandidates = (layerObj) => {
    const rawCode = String(layerObj?.code || '').trim();
    if (!rawCode) return [];

    // Only allow E-UN1-S, E-UR1-S, E-US1-S, E-UN2-S, E-UR2-S, E-US2-S for Cuff (folded view)
    if (layerObj?.part === 'Cuff') {
        // If collection value is US1, return [E-US1-S], etc.
        const match = rawCode.match(/^US[12]$|^UN[12]$|^UR[12]$/);
        if (match) {
            return [`E-${rawCode}-S`];
        }
        // If already in E-UN1-S etc. format, allow as is
        if (/^E-U[NR][12]-S$/.test(rawCode)) {
            return [rawCode];
        }
        // Otherwise, return empty (no fallback)
        return [];
    }

    // Chest fallback (BASE family)
    const candidates = [rawCode];
    if (layerObj?.part === 'Chest' && rawCode.startsWith('E-BASE')) {
        ['E-BASE-S', 'E-BASE_M-S', 'E-BASE_C-S', 'E-BASE_R-S'].forEach((code) => {
            if (!candidates.includes(code)) candidates.push(code);
        });
    }

    // Flap fallback (FLN, FRN, FRR, etc.)
    if (layerObj?.part === 'Flap') {
        ['E-FLN-S', 'E-FRN-S', 'E-FRR-S', 'E-FLL-S', 'E-FLR-S'].forEach((code) => {
            if (!candidates.includes(code)) candidates.push(code);
        });
    }

    // Pocket fallback (R1/L1)
    if (layerObj?.part === 'Pocket' && /^E-U[NR][0-9]-S$/.test(rawCode)) {
        ['E-R1-S', 'E-L1-S'].forEach((code) => {
            if (!candidates.includes(code)) candidates.push(code);
        });
    }

    return candidates;
};

const pickFoldedEmbroiderySources = (bundle, collection, layerObj) => {
    if (!bundle || !layerObj?.code) return [];
    const codeCandidates = Array.isArray(layerObj.codeCandidates) && layerObj.codeCandidates.length > 0
        ? layerObj.codeCandidates
        : getFoldedEmbroideryCodeCandidates(layerObj);
    const hasCollection = Array.isArray(collection?.matchingValues) && collection.matchingValues.length > 0;
    if (!hasCollection) {
        return [];
    }

    const values = collection.matchingValues.filter((value) => collectionValueMatchesFoldedPart(value, layerObj));
    const bySelectionKey = bundle.uploadsBySelectionKey || {};
    const sources = [];

    for (const value of values) {
        const uploadBundle = bySelectionKey[makeEmbSelectionKey(value)];
        if (!uploadBundle) continue;
        for (const code of codeCandidates) {
            if (uploadBundle?.folded?.[code]) appendUniqueSource(sources, uploadBundle.folded[code]);
        }
    }

    return sources;
};

// --- FLICKER-FREE LAYER COMPONENT ---
const SmartLayer = ({ src, zIndex }) => {
    if (!src) return null;

    return (
        <ExpoImage
            source={src}
            style={[styles.modelLayer, { zIndex }]}
            contentFit="contain"
            cachePolicy="memory-disk"
            transition={0}
        />
    );
};

export default function KurtaFolded({ selections, selectedFabric, selectedButton, selectedPajamaFabric }) {
    const {
        kurtaRenders: KURTA_RENDERS,
        pajamaRenders: PAJAMA_RENDERS,
        embroideryRenders: EMBROIDERY_RENDERS,
    } = useFirebaseCatalog();

    // --- ENGINE: Folded View (Style Images) Logic ---
    const getFoldedLayerCodes = () => {
        const shirtCollars = ["CR", "CB", "CT", "CS", "CE"];
        const mandarinCollars = ["CM", "CC"];

        const getFoldedBase = (collar) => {
            if (shirtCollars.includes(collar)) return "BASE";
            if (collar === "CC") return "BASE_C";
            if (mandarinCollars.includes(collar)) return "BASE_M";
            return "BASE_R";
        };

        const getFoldedPlacket = (foldedBase, placketStyle) => {
            if (foldedBase === "BASE_R") return `${placketStyle}R`;
            if (foldedBase === "BASE_C") return `${placketStyle}C`;
            return `${placketStyle}0`;
        };

        let layersToRender = [];
        const isRing = selectedButton?.material === "Ring";
        const bSuffix = "-S";

        // Helper function to enforce the Z-Index Sandwich
        const addGarmentPart = (partName, fabricCode, baseZIndex, type = 'fabric') => {
            // 1. BOTTOM LAYER: The Fabric itself
            layersToRender.push({ code: fabricCode, zIndex: baseZIndex, type: type, part: partName });
            // No embroidery logic here. Embroidery layers will be added separately, only for codes present in the embroidery collection.
        };

        // 1. FOLDED BASE
        const foldedBase = getFoldedBase(selections.collar);
        addGarmentPart('Chest', foldedBase, 10);

        // 2. FOLDED PLACKET
        const foldedPlacket = getFoldedPlacket(foldedBase, selections.placketStyle);
        addGarmentPart('Placket', foldedPlacket, 20);

        // Override button logic for folded view setup based on collar
        const isShirtCollar = shirtCollars.includes(selections.collar);
        if (isShirtCollar) {
            if (!isRing) layersToRender.push({ code: "BHN", zIndex: 20 + 5 - 1, type: 'fabric' });
            layersToRender.push({ code: `BKN${bSuffix}`, zIndex: 20 + 5, type: 'button' });
        } else {
            if (!isRing) layersToRender.push({ code: "BHC", zIndex: 20 + 5 - 1, type: 'fabric' });
            layersToRender.push({ code: `BKC${bSuffix}`, zIndex: 20 + 5, type: 'button' });
        }

        // 3. FOLDED POCKET & FLAP LAYERS
        if (selections.pocketQty !== "00") {
            addGarmentPart('Pocket', `R${selections.pocketShape}`, 30);
            if (selections.flapYes === "1") {
                addGarmentPart('Flap', `FR${selections.flapShape}`, 32);
                if (!isRing) layersToRender.push({ code: "BHR", zIndex: 32 + 5 - 1, type: 'fabric' });
                layersToRender.push({ code: `BPR${bSuffix}`, zIndex: 32 + 5, type: 'button' });
            }

            if (selections.pocketQty === "11") {
                addGarmentPart('Pocket', `L${selections.pocketShape}`, 34);
                if (selections.flapYes === "1") {
                    addGarmentPart('Flap', `FL${selections.flapShape}`, 36);
                    if (!isRing) layersToRender.push({ code: "BHL", zIndex: 36 + 5 - 1, type: 'fabric' });
                    layersToRender.push({ code: `BPL${bSuffix}`, zIndex: 36 + 5, type: 'button' });
                }
            }
        }

        // 4. FOLDED SLEEVES & CUFFS
        if (selections.sleeve === "SN") {
            addGarmentPart('Sleeve', "SN", 55);
        } else if (selections.sleeve === "SC") {
            addGarmentPart('Sleeve', "SC", 55);
            if (selections.cuffStyle) {
                let cuffCode = selections.cuffStyle;
                if (/^(US[12]|UR[12]|UN[12])$/.test(cuffCode)) {
                    addGarmentPart('Cuff', cuffCode, 57);
                } else if (/^E-U[NR][12]-S$/.test(cuffCode)) {
                    addGarmentPart('Cuff', cuffCode, 57);
                }
                if (selections.cuffStyle.endsWith("1")) {
                    if (!isRing) layersToRender.push({ code: "BH2", zIndex: 57 + 5 - 1, type: 'fabric' });
                    layersToRender.push({ code: `BC2${bSuffix}`, zIndex: 57 + 5, type: 'button' });
                } else if (selections.cuffStyle.endsWith("2")) {
                    if (!isRing) layersToRender.push({ code: "BH4", zIndex: 57 + 5 - 1, type: 'fabric' });
                    layersToRender.push({ code: `BC4${bSuffix}`, zIndex: 57 + 5, type: 'button' });
                }
            }
        }

        // 5. FOLDED COLLAR
        if (selections.collar !== "CN") {
            addGarmentPart('Collar', selections.collar, 65);
        }

        if (selections.collar === "CB") {
            if (!isRing) layersToRender.push({ code: "CBH", zIndex: 65 + 5 - 1, type: 'fabric' });
            layersToRender.push({ code: `CBB${bSuffix}`, zIndex: 65 + 5, type: 'button' });
        }

        // 6. FOLDED EPAULETTE
        if (selections.epaulette === "SE") {
            addGarmentPart('Epaulette', "SE", 45);
            if (!isRing) layersToRender.push({ code: "HE", zIndex: 45 + 5 - 1, type: 'fabric' });
            layersToRender.push({ code: `BE${bSuffix}`, zIndex: 45 + 5, type: 'button' });
        }

        layersToRender.push(...getKurtaFoldedEmbroideryLayers(selections, layersToRender));

        return layersToRender;
    };

    // 3. Selected Fabric ke 'style' (Folded) folder dhoondho
    const fabricStyleRenders = pickFabricRenderEntry(KURTA_RENDERS, selectedFabric)?.style || {};
    // Pajama style renders by fabricID
    const pajamaStyleRenders = pickFabricRenderEntry(PAJAMA_RENDERS, selectedPajamaFabric)?.style || {};

    const resolvedSceneEntries = [];
    getFoldedLayerCodes().forEach((layerObj, index) => {
        let imageSource = null;
        let imageSources = null;
        if (layerObj.type === 'button') {
            imageSource = selectedButton?.renders?.[layerObj.code];
        } else if (layerObj.type === 'embroidery') {
            imageSources = pickFoldedEmbroiderySources(
                EMBROIDERY_RENDERS[layerObj.collectionID],
                selections.embroideryCollection,
                layerObj
            );
        } else if (layerObj.type === 'pajama') {
            imageSource = pajamaStyleRenders[layerObj.code];
        } else {
            imageSource = fabricStyleRenders[layerObj.code];
        }

        if (Array.isArray(imageSources) && imageSources.length > 0) {
            imageSources.forEach((src, sourceIndex) => {
                if (!src) return;
                resolvedSceneEntries.push({
                    key: `folded-${layerObj.type}-${layerObj.code}-${layerObj.zIndex}-${index}-${sourceIndex}`,
                    src,
                    zIndex: layerObj.zIndex + sourceIndex * 0.01,
                });
            });
            return;
        }

        if (imageSource) {
            resolvedSceneEntries.push({
                key: `folded-${layerObj.type}-${layerObj.code}-${layerObj.zIndex}-${index}`,
                src: imageSource,
                zIndex: layerObj.zIndex,
            });
        }
    });

    const { displayEntries, isLoading, hasCommittedScene } = useBufferedRenderScene(resolvedSceneEntries);

    return (
        <View style={styles.container}>
            {/* Dynamic Folded Garment Layers (Z-Index 10 se 90 tak) */}
            {displayEntries.map((entry) => (
                <SmartLayer
                    key={entry.key}
                    src={entry.src}
                    zIndex={entry.zIndex}
                />
            ))}
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
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    modelLayer: {
        position: 'absolute',
        width: '100%',
        height: '105%',
        marginTop: -30
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 120,
        backgroundColor: 'rgba(255,255,255,0.28)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingOverlayOpaque: {
        backgroundColor: 'rgba(255,255,255,0.92)',
    }
});
